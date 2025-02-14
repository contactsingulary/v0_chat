import { NextResponse } from "next/server"

export const runtime = "edge"

const WEBHOOK_ID = "a1074f64-b6b4-4902-a956-edede409a503"
const BOTPRESS_URL = `https://webhook.botpress.cloud/${WEBHOOK_ID}`

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()
    const lastMessage = messages[messages.length - 1]

    // First, let's create or get a user if we don't have one
    const userResponse = await fetch(`${BOTPRESS_URL}/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!userResponse.ok) {
      throw new Error("Failed to create user")
    }

    const userData = await userResponse.json()
    const userKey = userData.key

    // Create or get a conversation
    const conversationResponse = await fetch(`${BOTPRESS_URL}/conversations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-key": userKey,
      },
    })

    if (!conversationResponse.ok) {
      throw new Error("Failed to create conversation")
    }

    const conversationData = await conversationResponse.json()
    const conversationId = conversationData.id

    // Send the message
    const messageResponse = await fetch(`${BOTPRESS_URL}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-key": userKey,
      },
      body: JSON.stringify({
        conversationId,
        type: "text",
        text: lastMessage.content,
        payload: {
          text: lastMessage.content,
        },
      }),
    })

    if (!messageResponse.ok) {
      throw new Error("Failed to send message")
    }

    // Get bot's response
    const listMessagesResponse = await fetch(
      `${BOTPRESS_URL}/conversations/${conversationId}/messages?limit=1`,
      {
        headers: {
          "x-user-key": userKey,
        },
      }
    )

    if (!listMessagesResponse.ok) {
      throw new Error("Failed to get bot response")
    }

    const messages = await listMessagesResponse.json()
    const botMessage = messages[0]

    return NextResponse.json({
      role: "assistant",
      content: botMessage.payload.text,
    })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json(
      {
        role: "assistant",
        content: "I apologize, but I encountered an error while processing your request. Please try again.",
      },
      { status: 500 }
    )
  }
}

