import { NextResponse } from "next/server"

export const runtime = "edge"

if (!process.env.LANGFLOW_URL || !process.env.AUTH_TOKEN) {
  throw new Error("Missing required environment variables LANGFLOW_URL and AUTH_TOKEN")
}

const LANGFLOW_URL = process.env.LANGFLOW_URL
const AUTH_TOKEN = process.env.AUTH_TOKEN

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()
    const lastMessage = messages[messages.length - 1]

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 25000) // 25 second timeout

    const response = await fetch(`${LANGFLOW_URL}?stream=false`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AUTH_TOKEN}`,
      },
      body: JSON.stringify({
        input_value: lastMessage.content,
        output_type: "chat",
        input_type: "chat",
        tweaks: {
          "ChatInput-q3Yrv": {},
          "Prompt-sxzW8": {},
          "OpenAIModel-YoUEL": {},
          "ChatOutput-7zVGj": {},
          "URL-PwYpt": {},
          "CombineText-J7dmy": {},
          "OpenAIModel-Y1zac": {},
        },
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      if (response.status === 504) {
        return NextResponse.json(
          {
            role: "assistant",
            content: "I'm sorry, but I'm having trouble responding right now. Please try again in a moment.",
          },
          { status: 200 },
        )
      }
      throw new Error(`Langflow API error: ${response.status}`)
    }

    const data = await response.json()
    const messageText = data.outputs?.[0]?.outputs?.[0]?.messages?.[0]?.message

    if (!messageText) {
      throw new Error("Invalid response format from Langflow")
    }

    return NextResponse.json({ role: "assistant", content: messageText })
  } catch (error) {
    console.error("Error:", error)
    if (error.name === "AbortError") {
      return NextResponse.json(
        {
          role: "assistant",
          content: "I'm sorry, but my response is taking longer than expected. Please try asking your question again.",
        },
        { status: 200 },
      )
    }
    return NextResponse.json(
      {
        role: "assistant",
        content: "I apologize, but I encountered an error while processing your request. Please try again.",
      },
      { status: 200 },
    )
  }
}

