"use client"

import { useState } from "react"
import { MessageCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ChatInterface } from "@/components/chat-interface"
import { cn } from "@/lib/utils"

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Chat Window */}
      <div
        className={cn(
          "fixed bottom-20 right-4 z-50 w-full max-w-[400px] transition-all duration-300 ease-in-out",
          isOpen ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0 pointer-events-none"
        )}
      >
        <div className="bg-background border rounded-lg shadow-lg h-[600px] flex flex-col">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="font-semibold">Chat Assistant</h2>
          </div>
          <div className="flex-1 overflow-hidden">
            <ChatInterface />
          </div>
        </div>
      </div>

      {/* Chat Button */}
      <Button
        className="fixed bottom-4 right-4 h-12 w-12 rounded-full shadow-lg transition-transform duration-300 hover:scale-110"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <X className="h-6 w-6 transition-transform duration-300 rotate-0 hover:rotate-90" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
        <span className="sr-only">{isOpen ? 'Close Chat' : 'Open Chat'}</span>
      </Button>
    </>
  )
} 