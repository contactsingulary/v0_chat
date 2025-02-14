"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Send } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface CarouselItem {
  title: string;
  imageUrl: string;
  actions: {
    action: string;
    label: string;
    value: string;
  }[];
}

interface Message {
  role: string;
  content: string | CarouselItem[];
  timestamp?: string;
  type?: 'text' | 'image' | 'carousel';
}

// Helper function to convert markdown links to HTML
const parseMarkdownLinks = (text: string) => {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
  return text.replace(linkRegex, (_, title, url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-primary underline hover:opacity-80 transition-opacity">${title}</a>`
  })
}

// Helper function to detect if content is an image URL
const isImageUrl = (content: string) => {
  return content.match(/\.(jpg|jpeg|png|gif|webp)($|\?)/i) !== null;
}

// Helper function to check if content is a carousel
const isCarousel = (content: any): content is CarouselItem[] => {
  return Array.isArray(content) && content.length > 0 && 'imageUrl' in content[0];
}

const CarouselMessage = ({ items }: { items: CarouselItem[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  return (
    <div className="relative w-full max-w-xl">
      <div className="relative">
        <img
          src={items[currentIndex].imageUrl}
          alt={items[currentIndex].title}
          className="w-full rounded-lg object-cover"
          style={{ maxHeight: '300px' }}
        />
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 rounded-b-lg">
          <h3 className="font-semibold">{items[currentIndex].title}</h3>
          <div className="flex gap-2 mt-1">
            {items[currentIndex].actions.map((action, i) => (
              <a
                key={i}
                href={action.value}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm px-3 py-1 rounded"
              >
                {action.label}
              </a>
            ))}
          </div>
        </div>
        {items.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
              aria-label="Previous slide"
            >
              ←
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
              aria-label="Next slide"
            >
              →
            </button>
            <div className="absolute -bottom-6 left-0 right-0 flex justify-center gap-1">
              {items.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`w-2 h-2 rounded-full ${
                    i === currentIndex ? 'bg-primary' : 'bg-gray-300'
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load saved IDs and conversation history on component mount
  useEffect(() => {
    const loadHistory = async () => {
      const savedUserId = localStorage.getItem('userId')
      const savedConversationId = localStorage.getItem('conversationId')
      
      if (savedUserId && savedConversationId) {
        setUserId(savedUserId)
        setConversationId(savedConversationId)
        
        // Load conversation history
        try {
          setIsLoadingHistory(true)
          const response = await fetch(
            `/api/chat?conversationId=${encodeURIComponent(savedConversationId)}&userId=${encodeURIComponent(savedUserId)}`,
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
            }
          )
          
          if (!response.ok) {
            throw new Error(`Failed to load conversation history: ${response.status}`)
          }
          
          const data = await response.json()
          if (data.messages && data.messages.length > 0) {
            // Sort messages by timestamp
            const sortedMessages = data.messages.sort(
              (a: Message, b: Message) => 
                new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime()
            )
            setMessages(sortedMessages)
            // Scroll to bottom after loading history
            setTimeout(scrollToBottom, 100)
          }
        } catch (error) {
          console.error('Error loading conversation history:', error)
          setError('Failed to load conversation history. Starting new conversation.')
          // Clear stored IDs on error
          localStorage.removeItem('userId')
          localStorage.removeItem('conversationId')
          setUserId(null)
          setConversationId(null)
        } finally {
          setIsLoadingHistory(false)
        }
      }
    }
    
    loadHistory()
  }, [])

  // Save IDs when they change
  useEffect(() => {
    if (userId) localStorage.setItem('userId', userId)
    if (conversationId) localStorage.setItem('conversationId', conversationId)
  }, [userId, conversationId])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: [...messages, userMessage],
          userId,
          conversationId
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.content || "Failed to get response from bot")
      }

      // Save new IDs if they were created
      if (data.userId) setUserId(data.userId)
      if (data.conversationId) setConversationId(data.conversationId)

      // Handle multiple bot messages
      if (Array.isArray(data.messages)) {
        const botMessages = data.messages.map((msg: any) => ({
          role: "assistant",
          content: msg.content,
          timestamp: msg.timestamp,
          type: msg.type
        }));
        setMessages((prev) => [...prev, ...botMessages]);
      } else {
        // Fallback for backward compatibility
        const botMessage: Message = {
          role: "assistant",
          content: data.content,
          timestamp: new Date().toISOString(),
          type: 'text'
        }
        setMessages((prev) => [...prev, botMessage])
      }
    } catch (error) {
      console.error("Error:", error)
      setError(error instanceof Error ? error.message : "Failed to get response from the bot. Please try again.")
      // Remove the user's message if we couldn't get a response
      setMessages((prev) => prev.slice(0, -1))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-4">
          {isLoadingHistory ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-pulse text-muted-foreground">
                Loading conversation history...
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-muted-foreground">
              Start a conversation by typing a message below.
            </div>
          ) : (
            messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`rounded-lg px-4 py-2 max-w-[80%] ${
                    message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  {message.type === 'carousel' && isCarousel(message.content) ? (
                    <CarouselMessage items={message.content} />
                  ) : isImageUrl(message.content as string) ? (
                    <img 
                      src={message.content as string} 
                      alt="Bot response" 
                      className="max-w-full rounded-lg"
                      style={{ maxHeight: '300px' }}
                    />
                  ) : (
                    <div dangerouslySetInnerHTML={{ __html: parseMarkdownLinks(message.content as string) }} />
                  )}
                  {message.timestamp && (
                    <div className="text-xs opacity-50 mt-1">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex items-center justify-start">
              <div className="bg-muted rounded-lg px-4 py-2">
                <span className="animate-pulse">Typing...</span>
              </div>
            </div>
          )}
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="p-4 border-t">
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isLoading ? "AI is typing..." : "Type your message..."}
            disabled={isLoadingHistory}
          />
          <Button type="submit" size="icon" disabled={isLoading || isLoadingHistory}>
            <Send className="h-4 w-4" />
            <span className="sr-only">Send message</span>
          </Button>
        </form>
      </div>
    </div>
  )
}

