import { NextResponse } from "next/server"

export const runtime = "edge"

// Load from environment variables
const API_BASE = process.env.API_BASE || "https://api.example.com"
const API_KEY = process.env.API_KEY
const BOT_ID = process.env.BOT_ID

// Helper function to transform messages
const transformMessages = (messages: any[]) => {
  return messages
    .map((msg: any) => {
      if (!msg.payload) return null
      
      const isAssistant = msg.userId === BOT_ID
      
      if (msg.payload.type === 'carousel') {
        return {
          role: isAssistant ? "assistant" : "user",
          type: "carousel",
          content: msg.payload.items,
          timestamp: msg.createdAt
        }
      }
      
      return {
        role: isAssistant ? "assistant" : "user",
        type: msg.payload.type,
        content: msg.payload.text || msg.payload.image || "Received non-text response",
        timestamp: msg.createdAt
      }
    })
    .filter(Boolean)
}

// Get conversation history
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const conversationId = searchParams.get('conversationId')
    const userId = searchParams.get('userId')

    if (!conversationId || !userId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      )
    }

    const listMessagesResponse = await fetch(
      `${API_BASE}/conversations/${conversationId}/messages?limit=50`,
      {
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "x-user-id": userId,
        },
      }
    )

    if (!listMessagesResponse.ok) {
      throw new Error(`Failed to get conversation history: ${listMessagesResponse.status}`)
    }

    const data = await listMessagesResponse.json()
    const messages = transformMessages(data.messages).reverse()

    return NextResponse.json({ messages })
  } catch (error) {
    console.error("Error in chat history API:", error)
    return NextResponse.json(
      { error: "Failed to fetch chat history" },
      { status: 500 }
    )
  }
}

// Send message and get response
export async function POST(req: Request) {
  try {
    const { messages, userId: existingUserId, conversationId: existingConversationId } = await req.json()
    const lastMessage = messages[messages.length - 1]
    let userKey: string
    let userId: string
    let conversationId: string

    if (!existingUserId) {
      const userResponse = await fetch(`${API_BASE}/users`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      })

      if (!userResponse.ok) {
        throw new Error("Failed to initialize chat session")
      }

      const userData = await userResponse.json()
      userKey = userData.key
      userId = userData.user.id
    } else {
      userKey = existingUserId
      userId = existingUserId
    }

    if (!existingConversationId) {
      const conversationResponse = await fetch(`${API_BASE}/conversations`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
          "x-user-id": userKey,
        },
        body: JSON.stringify({}),
      })

      if (!conversationResponse.ok) {
        throw new Error("Failed to create conversation")
      }

      const conversationData = await conversationResponse.json()
      conversationId = conversationData.conversation.id
    } else {
      conversationId = existingConversationId
    }

    const messagePayload = {
      conversationId,
      payload: {
        type: "text",
        text: lastMessage.content
      }
    }

    const messageResponse = await fetch(`${API_BASE}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        "x-user-id": userKey,
      },
      body: JSON.stringify(messagePayload),
    })

    if (!messageResponse.ok) {
      throw new Error("Failed to send message")
    }

    const messageData = await messageResponse.json()
    const userMessageId = messageData.message.id

    let attempts = 0;
    let botMessage = null;
    let lastSeenMessageId = userMessageId;
    let noNewMessagesCount = 0;
    const MAX_ATTEMPTS = 15;
    const WAIT_TIME = 1000;
    const MAX_NO_NEW_MESSAGES = 3;
    
    while (attempts < MAX_ATTEMPTS) {
      await new Promise(resolve => setTimeout(resolve, WAIT_TIME));
      
      const listMessagesResponse = await fetch(
        `${API_BASE}/conversations/${conversationId}/messages?limit=10`,
        {
          headers: {
            "Authorization": `Bearer ${API_KEY}`,
            "x-user-id": userKey,
          },
        }
      )

      if (!listMessagesResponse.ok) {
        throw new Error("Failed to get response")
      }

      const responseMessages = await listMessagesResponse.json()
      
      const newMessages = responseMessages.messages
        .filter(msg => {
          const isAssistant = msg.userId === BOT_ID
          const isNew = msg.id !== lastSeenMessageId && 
                       new Date(msg.createdAt) > new Date(messageData.message.createdAt)
          return isAssistant && isNew
        })
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

      if (newMessages.length > 0) {
        lastSeenMessageId = newMessages[newMessages.length - 1].id
        
        const validMessages = newMessages.filter(msg => 
          msg.payload?.text || msg.payload?.image || (msg.payload?.type === 'carousel' && msg.payload?.items?.length > 0)
        )

        if (validMessages.length > 0) {
          noNewMessagesCount = 0
          botMessage = validMessages

          const hasTextAndMedia = validMessages.some(msg => msg.payload.type === 'text') &&
                                validMessages.some(msg => msg.payload.type === 'carousel' || msg.payload.type === 'image')
          const isSimpleText = validMessages.length === 1 && validMessages[0].payload.type === 'text'
          
          if (hasTextAndMedia || isSimpleText) {
            break
          }
        }
      } else {
        noNewMessagesCount++
        
        if (botMessage && noNewMessagesCount >= MAX_NO_NEW_MESSAGES) {
          break
        }
      }
      
      attempts++
    }
    
    if (!botMessage || botMessage.length === 0) {
      throw new Error("No response received")
    }

    return NextResponse.json({
      role: "assistant",
      userId: userKey,
      conversationId: conversationId,
      messages: botMessage.map(msg => {
        if (msg.payload.type === 'carousel') {
          return {
            role: "assistant",
            type: "carousel",
            content: msg.payload.items,
            timestamp: msg.createdAt
          };
        }
        return {
          role: "assistant",
          type: msg.payload.type,
          content: msg.payload.text || msg.payload.image || "Received non-text response",
          timestamp: msg.createdAt
        };
      })
    })
  } catch (error) {
    console.error("Error in chat API:", error)
    return NextResponse.json(
      {
        role: "assistant",
        content: "An unexpected error occurred. Please try again.",
      },
      { status: 500 }
    )
  }
}

