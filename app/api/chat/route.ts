import { NextResponse } from "next/server"

export const runtime = "edge"

// Internal helper to make API calls
async function makeAPICall(endpoint: string, options: RequestInit = {}) {
  const base = process.env.API_BASE
  const apiKey = process.env.API_KEY
  
  if (!base || !apiKey) {
    console.error('Missing required environment variables:', { base: !!base, apiKey: !!apiKey })
    throw new Error('Service configuration error')
  }

  const url = `${base}${endpoint}`
  
  const headers = {
    ...options.headers,
    "Authorization": `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  }

  try {
    console.log(`Making API call to: ${endpoint}`)
    const response = await fetch(url, { ...options, headers })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`API call failed: ${endpoint}`, {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      })
      throw new Error(`API call failed: ${response.status}`)
    }
    
    const data = await response.json()
    console.log(`API call successful: ${endpoint}`)
    return data
  } catch (error) {
    console.error(`API call error: ${endpoint}`, error)
    throw new Error(error instanceof Error ? error.message : "Service temporarily unavailable")
  }
}

// Transform internal message format to public format
function transformMessage(msg: any, isAssistant: boolean) {
  if (!msg?.payload) {
    console.warn('Invalid message format:', msg)
    return null
  }
  
  try {
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
  } catch (error) {
    console.error('Message transformation error:', error)
    return null
  }
}

// Get conversation history
export async function GET(req: Request) {
  console.log('GET /api/chat - Starting request')
  try {
    const { searchParams } = new URL(req.url)
    const conversationId = searchParams.get('conversationId')
    const userId = searchParams.get('userId')

    if (!conversationId || !userId) {
      console.warn('Missing parameters:', { conversationId: !!conversationId, userId: !!userId })
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      )
    }

    const data = await makeAPICall(`/conversations/${conversationId}/messages?limit=50`, {
      headers: { "x-user-id": userId }
    })

    if (!data?.messages) {
      console.error('Invalid response format:', data)
      throw new Error('Invalid response format')
    }

    const messages = data.messages
      .map(msg => transformMessage(msg, msg.userId === process.env.BOT_ID))
      .filter(Boolean)
      .reverse()

    console.log('GET /api/chat - Request successful')
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
  console.log('POST /api/chat - Starting request')
  try {
    const body = await req.json()
    const { messages, userId: existingUserId, conversationId: existingConversationId } = body
    
    if (!messages?.length) {
      console.warn('Invalid request format:', body)
      return NextResponse.json(
        { error: "Invalid request format" },
        { status: 400 }
      )
    }

    const lastMessage = messages[messages.length - 1]
    let userKey: string
    let conversationId: string

    // Initialize or retrieve user session
    if (!existingUserId) {
      console.log('Creating new user')
      const userData = await makeAPICall('/users', {
        method: "POST",
        body: JSON.stringify({})
      })
      userKey = userData.key
    } else {
      console.log('Using existing user:', existingUserId)
      userKey = existingUserId
    }

    // Create or retrieve conversation
    if (!existingConversationId) {
      console.log('Creating new conversation')
      const conversationData = await makeAPICall('/conversations', {
        method: "POST",
        headers: { "x-user-id": userKey },
        body: JSON.stringify({})
      })
      conversationId = conversationData.conversation.id
    } else {
      console.log('Using existing conversation:', existingConversationId)
      conversationId = existingConversationId
    }

    // Send message
    console.log('Sending message')
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
    console.log('Waiting for response')
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
      
      if (!responseData?.messages) {
        console.error('Invalid response format:', responseData)
        continue
      }

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
          console.log(`Found ${validMessages.length} new messages`)
          noNewMessagesCount = 0
          assistantMessage = validMessages

          const hasTextAndMedia = validMessages.some(msg => msg.payload.type === 'text') &&
                                validMessages.some(msg => msg.payload.type === 'carousel' || msg.payload.type === 'image')
          const isSimpleText = validMessages.length === 1 && validMessages[0].payload.type === 'text'
          
          if (hasTextAndMedia || isSimpleText) {
            console.log('Found complete response')
            break
          }
        }
      } else {
        noNewMessagesCount++
        if (assistantMessage && noNewMessagesCount >= MAX_NO_NEW_MESSAGES) {
          console.log('No new messages, using existing response')
          break
        }
      }
      
      attempts++
      console.log(`Attempt ${attempts}/${MAX_ATTEMPTS}`)
    }
    
    if (!assistantMessage || assistantMessage.length === 0) {
      console.error('No response received')
      throw new Error("Response timeout")
    }

    console.log('POST /api/chat - Request successful')
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
        content: error instanceof Error ? error.message : "Unable to process your request. Please try again.",
      },
      { status: 500 }
    )
  }
}

