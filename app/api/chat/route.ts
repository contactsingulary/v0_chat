import { NextResponse } from "next/server"

export const runtime = "edge"

const WEBHOOK_ID = "a1074f64-b6b4-4902-a956-edede409a503"
const BOTPRESS_URL = `https://chat.botpress.cloud/${WEBHOOK_ID}`

// Helper function to transform messages
const transformMessages = (messages: any[]) => {
  return messages
    .map((msg: any) => {
      // Skip system messages or messages without payload
      if (!msg.payload) return null
      
      const isBot = msg.userId === "user_01JM2BN5FV4ECV1D16XB6FH873"
      
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

    if (!conversationId || !userId) {
      return NextResponse.json(
        { error: "Missing conversationId or userId" },
        { status: 400 }
      )
    }

    // Get conversation history from Botpress
    const listMessagesResponse = await fetch(
      `${BOTPRESS_URL}/conversations/${conversationId}/messages?limit=50`,
      {
        headers: {
          "x-user-key": userId,
        },
      }
    )

    if (!listMessagesResponse.ok) {
      const errorData = await listMessagesResponse.text()
      console.error("Failed to get conversation history:", errorData)
      throw new Error(`Failed to get conversation history: ${listMessagesResponse.status} ${errorData}`)
    }

    const data = await listMessagesResponse.json()
    
    // Transform and sort messages
    const messages = transformMessages(data.messages).reverse() // Most recent first

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
    const { messages, userId: existingUserId, conversationId: existingConversationId } = await req.json()
    const lastMessage = messages[messages.length - 1]
    let userKey: string
    let userId: string
    let conversationId: string

    // Only create a new user if we don't have an existing one
    if (!existingUserId) {
      const userResponse = await fetch(`${BOTPRESS_URL}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      })

      if (!userResponse.ok) {
        const errorData = await userResponse.text()
        console.error("Failed to create user:", errorData)
        throw new Error(`Failed to create user: ${userResponse.status} ${errorData}`)
      }

      const userData = await userResponse.json()
      userKey = userData.key
      userId = userData.user.id
    } else {
      console.log("Using existing user:", existingUserId)
      userKey = existingUserId
      userId = existingUserId
    }

    // Only create a new conversation if we don't have an existing one
    if (!existingConversationId) {
      const conversationResponse = await fetch(`${BOTPRESS_URL}/conversations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-key": userKey,
        },
        body: JSON.stringify({}),
      })

      if (!conversationResponse.ok) {
        const errorData = await conversationResponse.text()
        console.error("Failed to create conversation:", errorData)
        throw new Error(`Failed to create conversation: ${conversationResponse.status} ${errorData}`)
      }

      const conversationData = await conversationResponse.json()
      console.log("Created new conversation:", conversationData)
      conversationId = conversationData.conversation.id
    } else {
      console.log("Using existing conversation:", existingConversationId)
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
    
    console.log("Sending message with payload:", messagePayload)

    const messageResponse = await fetch(`${BOTPRESS_URL}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-key": userKey,
      },
      body: JSON.stringify(messagePayload),
    })

    if (!messageResponse.ok) {
      const errorData = await messageResponse.text()
      console.error("Failed to send message:", errorData)
      throw new Error(`Failed to send message: ${messageResponse.status} ${errorData}`)
    }

    const messageData = await messageResponse.json()
    const userMessageId = messageData.message.id
    console.log("Message sent with ID:", userMessageId)

    // Get bot's response
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
        `${BOTPRESS_URL}/conversations/${conversationId}/messages?limit=10`,
        {
          headers: {
            "x-user-key": userKey,
          },
        }
      )

      if (!listMessagesResponse.ok) {
        const errorData = await listMessagesResponse.text()
        console.error("Failed to get bot response:", errorData)
        throw new Error(`Failed to get bot response: ${listMessagesResponse.status} ${errorData}`)
      }

      const botMessages = await listMessagesResponse.json()
      
      // Get all messages after our last seen message
      const newMessages = botMessages.messages
        .filter(msg => {
          const isBot = msg.userId === "user_01JM2BN5FV4ECV1D16XB6FH873"
          const isNew = msg.id !== lastSeenMessageId && 
                       new Date(msg.createdAt) > new Date(messageData.message.createdAt)
          if (isBot) {
            console.log(`Bot message ${msg.id}: isNew=${isNew}, type=${msg.payload?.type}`)
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
          console.log(`Found ${validMessages.length} new valid messages:`)
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
            console.log("Found complete response, returning")
            break
          }
          
          console.log("Waiting for potential additional messages...")
        }
      } else {
        noNewMessagesCount++
        console.log(`No new messages found (${noNewMessagesCount}/${MAX_NO_NEW_MESSAGES} attempts)`)
        
        // If we have messages and haven't seen new ones for a while, assume we're done
        if (botMessage && noNewMessagesCount >= MAX_NO_NEW_MESSAGES) {
          console.log("No new messages for a while, assuming response is complete")
          break
        }
      }
      
      attempts++
      console.log(`Waiting for bot response... Attempt ${attempts}/${MAX_ATTEMPTS}`)
    }
    
    if (!botMessage || botMessage.length === 0) {
      console.error("No bot response found after multiple attempts")
      throw new Error("No bot response received after waiting")
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

