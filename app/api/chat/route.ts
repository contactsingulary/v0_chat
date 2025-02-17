import { NextResponse } from "next/server"

export const runtime = "edge"

const API_URL = 'https://chat.botpress.cloud'

// Validate webhook ID format
const isValidWebhookId = (webhookId: string) => {
  return /^[a-zA-Z0-9-]+$/.test(webhookId)
}

// Helper function to transform messages
const transformMessages = (messages: any[], conversationId: string) => {
  return messages
    .map((msg: any) => {
      // Skip system messages or messages without payload
      if (!msg.payload) return null
      
      // Consider any message not from the current user as a bot message
      // The conversation ID format is userId:randomString
      const userId = conversationId.split(':')[0]
      const isBot = msg.userId !== userId
      
      if (msg.payload.type === 'carousel') {
        return {
          role: isBot ? "assistant" : "user",
          type: "carousel",
          content: msg.payload.items,
          timestamp: msg.createdAt
        }
      }
      
      return {
        role: isBot ? "assistant" : "user",
        type: msg.payload.type,
        content: msg.payload.text || msg.payload.image || "Received non-text response",
        timestamp: msg.createdAt
      }
    })
    .filter(Boolean) // Remove null entries
}

// Get conversation history
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const conversationId = searchParams.get('conversationId')
    const userId = searchParams.get('userId')
    const webhookId = searchParams.get('webhookId')

    // Validate required parameters
    if (!conversationId || !userId || !webhookId) {
      console.error("Missing required parameters:", { conversationId, userId, webhookId })
      return NextResponse.json(
        { error: "Missing required parameters: conversationId, userId, or webhookId" },
        { status: 400 }
      )
    }

    // Validate webhook ID format
    if (!isValidWebhookId(webhookId)) {
      console.error("Invalid webhook ID format:", webhookId)
      return NextResponse.json(
        { error: "Invalid webhook ID format" },
        { status: 400 }
      )
    }

    console.log(`Fetching conversation history for bot ${webhookId}, user ${userId}, conversation ${conversationId}`)

    // Get conversation history
    const listMessagesResponse = await fetch(
      `${API_URL}/${webhookId}/conversations/${conversationId}/messages?limit=50`,
      {
        headers: {
          "x-user-key": userId,
        },
      }
    )

    if (!listMessagesResponse.ok) {
      const errorData = await listMessagesResponse.text()
      console.error("Failed to get conversation history:", {
        status: listMessagesResponse.status,
        error: errorData,
        webhookId,
        userId,
        conversationId
      })
      throw new Error(`Failed to get conversation history: ${listMessagesResponse.status} ${errorData}`)
    }

    const data = await listMessagesResponse.json()
    console.log(`Retrieved ${data.messages.length} messages for conversation ${conversationId}`)
    
    // Transform and sort messages
    const messages = transformMessages(data.messages, conversationId).reverse() // Most recent first

    return NextResponse.json({ messages })
  } catch (error) {
    console.error("Error in chat history API:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "An unexpected error occurred",
      },
      { status: 500 }
    )
  }
}

// Send message and get response
export async function POST(req: Request) {
  try {
    const { messages, userId: existingUserId, conversationId: existingConversationId, webhookId } = await req.json()
    
    // Validate required parameters
    if (!webhookId) {
      console.error("Missing webhook ID")
      return NextResponse.json(
        { error: "Missing webhookId" },
        { status: 400 }
      )
    }

    // Validate webhook ID format
    if (!isValidWebhookId(webhookId)) {
      console.error("Invalid webhook ID format:", webhookId)
      return NextResponse.json(
        { error: "Invalid webhook ID format" },
        { status: 400 }
      )
    }

    if (!messages || !messages.length) {
      console.error("No messages provided")
      return NextResponse.json(
        { error: "No messages provided" },
        { status: 400 }
      )
    }

    const lastMessage = messages[messages.length - 1]
    let userKey: string
    let userId: string
    let conversationId: string

    console.log(`Processing message for bot ${webhookId}`, {
      existingUserId,
      existingConversationId
    })

    // Only create a new user if we don't have an existing one
    if (!existingUserId) {
      console.log(`Creating new user for bot ${webhookId}`)
      const userResponse = await fetch(`${API_URL}/${webhookId}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      })

      if (!userResponse.ok) {
        const errorData = await userResponse.text()
        console.error("Failed to create user:", {
          status: userResponse.status,
          error: errorData,
          webhookId
        })
        throw new Error(`Failed to create user: ${userResponse.status} ${errorData}`)
      }

      const userData = await userResponse.json()
      userKey = userData.key
      userId = userData.user.id
      console.log(`Created new user for bot ${webhookId}:`, { userKey, userId })
    } else {
      console.log(`Using existing user for bot ${webhookId}:`, existingUserId)
      userKey = existingUserId
      userId = existingUserId
    }

    // Only create a new conversation if we don't have an existing one
    if (!existingConversationId) {
      console.log(`Creating new conversation for bot ${webhookId}`)
      const conversationResponse = await fetch(`${API_URL}/${webhookId}/conversations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-key": userKey,
        },
        body: JSON.stringify({}),
      })

      if (!conversationResponse.ok) {
        const errorData = await conversationResponse.text()
        console.error("Failed to create conversation:", {
          status: conversationResponse.status,
          error: errorData,
          webhookId,
          userKey
        })
        throw new Error(`Failed to create conversation: ${conversationResponse.status} ${errorData}`)
      }

      const conversationData = await conversationResponse.json()
      console.log(`Created new conversation for bot ${webhookId}:`, conversationData)
      conversationId = conversationData.conversation.id
    } else {
      console.log(`Using existing conversation for bot ${webhookId}:`, existingConversationId)
      conversationId = existingConversationId
    }

    // Send the message
    const messagePayload = {
      conversationId,
      payload: {
        type: "text",
        text: lastMessage.content
      }
    }
    
    console.log(`Sending message to bot ${webhookId}:`, messagePayload)

    const messageResponse = await fetch(`${API_URL}/${webhookId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-key": userKey,
      },
      body: JSON.stringify(messagePayload),
    })

    if (!messageResponse.ok) {
      const errorData = await messageResponse.text()
      console.error("Failed to send message:", {
        status: messageResponse.status,
        error: errorData,
        webhookId,
        userKey,
        conversationId
      })
      throw new Error(`Failed to send message: ${messageResponse.status} ${errorData}`)
    }

    const messageData = await messageResponse.json()
    const userMessageId = messageData.message.id
    console.log(`Message sent to bot ${webhookId} with ID:`, userMessageId)

    // Get bot's response
    let attempts = 0;
    let botMessage = null;
    let lastSeenMessageId = userMessageId;
    let noNewMessagesCount = 0;
    const MAX_ATTEMPTS = 15;
    const WAIT_TIME = 1000;
    const MAX_NO_NEW_MESSAGES = 3;
    
    console.log(`Waiting for bot ${webhookId} response...`)
    
    while (attempts < MAX_ATTEMPTS) {
      await new Promise(resolve => setTimeout(resolve, WAIT_TIME));
      
      const listMessagesResponse = await fetch(
        `${API_URL}/${webhookId}/conversations/${conversationId}/messages?limit=10`,
        {
          headers: {
            "x-user-key": userKey,
          },
        }
      )

      if (!listMessagesResponse.ok) {
        const errorData = await listMessagesResponse.text()
        console.error("Failed to get response:", {
          status: listMessagesResponse.status,
          error: errorData,
          webhookId,
          userKey,
          conversationId
        })
        throw new Error(`Failed to get response: ${listMessagesResponse.status} ${errorData}`)
      }

      const botMessages = await listMessagesResponse.json()
      
      // Get all messages after our last seen message
      const newMessages = botMessages.messages
        .filter(msg => {
          const userId = conversationId.split(':')[0]
          const isBot = msg.userId !== userId
          const isNew = msg.id !== lastSeenMessageId && 
                       new Date(msg.createdAt) > new Date(messageData.message.createdAt)
          if (isBot) {
            console.log(`Bot ${webhookId} response message ${msg.id}:`, {
              isNew,
              type: msg.payload?.type,
              content: msg.payload?.text || 'media'
            })
          }
          return isBot && isNew
        })
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

      if (newMessages.length > 0) {
        // Update last seen message ID
        lastSeenMessageId = newMessages[newMessages.length - 1].id
        
        // Check if we have any valid messages
        const validMessages = newMessages.filter(msg => 
          msg.payload?.text || msg.payload?.image || (msg.payload?.type === 'carousel' && msg.payload?.items?.length > 0)
        )

        if (validMessages.length > 0) {
          console.log(`Found ${validMessages.length} new valid messages from bot ${webhookId}`)
          validMessages.forEach(msg => {
            console.log(`- ${msg.id}: type=${msg.payload.type}, content=${msg.payload?.text || 'media'}`)
          })
          
          // Reset no new messages counter since we found messages
          noNewMessagesCount = 0
          botMessage = validMessages

          // If we have a complete response (text followed by media or just text), we can return
          const hasTextAndMedia = validMessages.some(msg => msg.payload.type === 'text') &&
                                validMessages.some(msg => msg.payload.type === 'carousel' || msg.payload.type === 'image')
          const isSimpleText = validMessages.length === 1 && validMessages[0].payload.type === 'text'
          
          if (hasTextAndMedia || isSimpleText) {
            console.log(`Found complete response from bot ${webhookId}, returning`)
            break
          }
          
          console.log(`Waiting for potential additional messages from bot ${webhookId}...`)
        }
      } else {
        noNewMessagesCount++
        console.log(`No new messages found from bot ${webhookId} (${noNewMessagesCount}/${MAX_NO_NEW_MESSAGES} attempts)`)
        
        // If we have messages and haven't seen new ones for a while, assume we're done
        if (botMessage && noNewMessagesCount >= MAX_NO_NEW_MESSAGES) {
          console.log(`No new messages from bot ${webhookId} for a while, assuming response is complete`)
          break
        }
      }
      
      attempts++
      console.log(`Waiting for bot ${webhookId} response... Attempt ${attempts}/${MAX_ATTEMPTS}`)
    }
    
    if (!botMessage || botMessage.length === 0) {
      console.error(`No response found from bot ${webhookId} after ${attempts} attempts`)
      throw new Error("No response received after waiting")
    }

    // Return all bot messages along with user and conversation IDs
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
        content: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
      },
      { status: 500 }
    )
  }
}

