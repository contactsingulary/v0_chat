import { NextResponse } from "next/server"

export const runtime = "edge"

// Internal helper to make Botpress API calls
async function makeAPICall(endpoint: string, options: RequestInit = {}) {
  const base = process.env.API_BASE
  const apiKey = process.env.API_KEY
  const url = `${base}${endpoint}`
  
  const headers = {
    ...options.headers,
    "Authorization": `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  }

  try {
    const response = await fetch(url, { ...options, headers })
    if (!response.ok) throw new Error(`API call failed`)
    return await response.json()
  } catch (error) {
    console.error(`API call failed: ${endpoint}`, error)
    throw new Error("Service temporarily unavailable")
  }
}

// Transform internal message format to public format
function transformMessage(msg: any, isAssistant: boolean) {
  if (!msg.payload) return null
  
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
    content: msg.payload.text || msg.payload.image || "Message content unavailable",
    timestamp: msg.createdAt
  }
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

    const data = await makeAPICall(`/conversations/${conversationId}/messages?limit=50`, {
      headers: { "x-user-id": userId }
    })

    const messages = data.messages
      .map(msg => transformMessage(msg, msg.userId === process.env.BOT_ID))
      .filter(Boolean)
      .reverse()

    return NextResponse.json({ messages })
  } catch (error) {
    console.error("Chat history error:", error)
    return NextResponse.json(
      { error: "Unable to load chat history" },
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
    let conversationId: string

    // Initialize or retrieve user session
    if (!existingUserId) {
      const userData = await makeAPICall('/users', {
        method: "POST",
        body: JSON.stringify({})
      })
      userKey = userData.key
    } else {
      userKey = existingUserId
    }

    // Create or retrieve conversation
    if (!existingConversationId) {
      const conversationData = await makeAPICall('/conversations', {
        method: "POST",
        headers: { "x-user-id": userKey },
        body: JSON.stringify({})
      })
      conversationId = conversationData.conversation.id
    } else {
      conversationId = existingConversationId
    }

    // Send message
    const messageData = await makeAPICall('/messages', {
      method: "POST",
      headers: { "x-user-id": userKey },
      body: JSON.stringify({
        conversationId,
        payload: {
          type: "text",
          text: lastMessage.content
        }
      })
    })

    // Wait for and collect response
    let attempts = 0
    let assistantMessage = null
    let lastSeenMessageId = messageData.message.id
    let noNewMessagesCount = 0
    const MAX_ATTEMPTS = 15
    const WAIT_TIME = 1000
    const MAX_NO_NEW_MESSAGES = 3
    
    while (attempts < MAX_ATTEMPTS) {
      await new Promise(resolve => setTimeout(resolve, WAIT_TIME))
      
      const responseData = await makeAPICall(
        `/conversations/${conversationId}/messages?limit=10`,
        { headers: { "x-user-id": userKey } }
      )
      
      const newMessages = responseData.messages
        .filter(msg => {
          const isAssistant = msg.userId === process.env.BOT_ID
          const isNew = msg.id !== lastSeenMessageId && 
                       new Date(msg.createdAt) > new Date(messageData.message.createdAt)
          return isAssistant && isNew
        })
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

      if (newMessages.length > 0) {
        lastSeenMessageId = newMessages[newMessages.length - 1].id
        
        const validMessages = newMessages.filter(msg => 
          msg.payload?.text || msg.payload?.image || 
          (msg.payload?.type === 'carousel' && msg.payload?.items?.length > 0)
        )

        if (validMessages.length > 0) {
          noNewMessagesCount = 0
          assistantMessage = validMessages

          const hasTextAndMedia = validMessages.some(msg => msg.payload.type === 'text') &&
                                validMessages.some(msg => msg.payload.type === 'carousel' || msg.payload.type === 'image')
          const isSimpleText = validMessages.length === 1 && validMessages[0].payload.type === 'text'
          
          if (hasTextAndMedia || isSimpleText) break
        }
      } else {
        noNewMessagesCount++
        if (assistantMessage && noNewMessagesCount >= MAX_NO_NEW_MESSAGES) break
      }
      
      attempts++
    }
    
    if (!assistantMessage || assistantMessage.length === 0) {
      throw new Error("Response timeout")
    }

    return NextResponse.json({
      role: "assistant",
      userId: userKey,
      conversationId: conversationId,
      messages: assistantMessage.map(msg => transformMessage(msg, true))
    })
  } catch (error) {
    console.error("Chat error:", error)
    return NextResponse.json(
      {
        role: "assistant",
        content: "Unable to process your request. Please try again.",
      },
      { status: 500 }
    )
  }
}

