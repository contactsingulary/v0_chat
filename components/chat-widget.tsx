"use client"

import { useState, useEffect } from "react"
import { MessageCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ChatInterface } from "@/components/chat-interface"
import { CookieConsent } from "@/components/ui/cookie-consent"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import { AnimatePresence, motion } from "framer-motion"

interface CustomizationProps {
  borderRadius: number;
  opacity: number;
  blur: number;
  botName: string;
  showPoweredBy?: boolean;
  showCloseButton?: boolean;
  showRefreshButton?: boolean;
  showSettingsButton?: boolean;
  privacyApproach?: 'pre' | 'in-chat' | 'passive' | 'none';
  chatPlaceholders?: string[];
  showInitialPopup?: boolean;
  initialPopupMessage?: string;
}

interface ChatWidgetProps {
  customization?: CustomizationProps;
}

export function ChatWidget({ customization }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showPopup, setShowPopup] = useState(false)
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [showCookieConsent, setShowCookieConsent] = useState(false)
  const [initialMessages, setInitialMessages] = useState<any[]>([])
  const { theme } = useTheme()

  // Default values if no customization is provided
  const borderRadius = customization?.borderRadius ?? 16
  const opacity = customization?.opacity ?? 99
  const blur = customization?.blur ?? 3
  const botName = customization?.botName ?? "Chat Assistent"
  const showPoweredBy = customization?.showPoweredBy ?? true
  const showCloseButton = customization?.showCloseButton ?? true
  const showRefreshButton = customization?.showRefreshButton ?? true
  const showSettingsButton = customization?.showSettingsButton ?? true
  const privacyApproach = customization?.privacyApproach ?? 'passive'
  const chatPlaceholders = customization?.chatPlaceholders ?? []
  const showInitialPopup = customization?.showInitialPopup ?? false
  const initialPopupMessage = customization?.initialPopupMessage ?? "Haben Sie Fragen? Ich bin hier, um zu helfen!"

  // Reset states when privacy approach changes
  useEffect(() => {
    setPrivacyAccepted(false)
    setShowCookieConsent(false)
    setIsOpen(false)
    localStorage.removeItem('privacyConsent')
    
    if (privacyApproach === 'in-chat') {
      setInitialMessages([{
        role: "assistant",
        content: `Bevor wir beginnen, benötige ich Ihre Zustimmung zur Datenverarbeitung. Details finden Sie in unserer [Datenschutzerklärung](https://www.singulary.net/datenschutz).\n\nBitte antworten Sie mit "Ja" oder "Akzeptieren" um fortzufahren, oder "Nein" oder "Ablehnen" um abzulehnen.`,
        timestamp: new Date().toISOString(),
        type: 'text'
      }])
    } else {
      setInitialMessages([])
    }
  }, [privacyApproach])

  // Load privacy consent status from localStorage
  useEffect(() => {
    const storedConsent = localStorage.getItem('privacyConsent')
    if (storedConsent) {
      setPrivacyAccepted(true)
    }
  }, [privacyApproach])

  // Clear localStorage when setting is disabled
  useEffect(() => {
    if (!showInitialPopup) {
      localStorage.removeItem('chatPopupShown')
      setShowPopup(false)
    }
  }, [showInitialPopup])

  // Show initial popup on mount
  useEffect(() => {
    if (showInitialPopup) {
      console.log('Scheduling popup show')
      const showTimer = setTimeout(() => {
        console.log('Showing popup now')
        setShowPopup(true)
      }, 1000)
      return () => {
        console.log('Cleaning up show timer')
        clearTimeout(showTimer)
      }
    } else {
      setShowPopup(false)
    }
  }, [showInitialPopup])

  // Handle auto-hide of popup
  useEffect(() => {
    console.log('Popup state changed:', showPopup)
    if (showPopup) {
      console.log('Scheduling popup hide')
      const hideTimer = setTimeout(() => {
        console.log('Hiding popup now')
        setShowPopup(false)
      }, 4000)
      return () => {
        console.log('Cleaning up hide timer')
        clearTimeout(hideTimer)
      }
    }
  }, [showPopup])

  // Hide popup when chat is opened
  useEffect(() => {
    if (isOpen) {
      setShowPopup(false)
    }
  }, [isOpen])

  // Handle opening the chat
  const handleOpenChat = () => {
    if (privacyApproach === 'pre' && !privacyAccepted) {
      setShowCookieConsent(true)
    } else {
      setIsOpen(true)
      if (privacyApproach === 'passive') {
        setPrivacyAccepted(true)
      }
    }
  }

  // Handle closing the chat
  const handleCloseChat = () => {
    setIsOpen(false)
  }

  // Handle cookie consent
  const handleAcceptCookies = (settings: { essential: boolean; nonEssential: boolean }) => {
    localStorage.setItem('privacyConsent', JSON.stringify(settings))
    setPrivacyAccepted(true)
    setShowCookieConsent(false)
    setIsOpen(true)
  }

  const handleDeclineCookies = () => {
    setShowCookieConsent(false)
  }

  // Handle privacy acceptance in chat
  const handlePrivacyAccept = () => {
    localStorage.setItem('privacyConsent', JSON.stringify({ essential: true, nonEssential: true }))
    setPrivacyAccepted(true)
  }

  // Convert opacity to actual transparency
  const transparency = opacity / 100
  const bgColor = theme === 'dark' ? '0 0 0' : '255 255 255'

  return (
    <>
      {/* Cookie Consent Modal */}
      {showCookieConsent && (
        <div className="fixed bottom-[450px] right-4 z-[2147483647] w-full max-w-[400px] transition-all duration-300 ease-in-out">
          <CookieConsent
            onAccept={handleAcceptCookies}
            onDecline={handleDeclineCookies}
            position={undefined}
          />
        </div>
      )}

      {/* Chat Window */}
      <div
        className={cn(
          "fixed bottom-20 right-4 z-40 w-full max-w-[400px] transition-all duration-300 ease-in-out",
          isOpen ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0 pointer-events-none"
        )}
      >
        <div 
          className="border flex flex-col transition-all duration-300 dark:border-gray-800 overflow-hidden"
          style={{
            borderRadius: `${borderRadius}px`,
            backdropFilter: `blur(${blur}px)`,
            background: `rgb(${bgColor} / ${transparency})`,
            boxShadow: "0 20px 48px -12px rgba(0,0,0,0.12), 0 12px 24px -4px rgba(0,0,0,0.08)",
            height: 'min(calc(100vh - 120px), 700px)',
          }}
        >
          {/* Empty Chat Disclaimer for Passive Approach */}
          {privacyApproach === 'passive' && !privacyAccepted && (
            <div className="absolute inset-0 flex items-center justify-center p-8 text-center bg-background/95 backdrop-blur-sm z-10">
              <div className="max-w-md space-y-4">
                <h3 className="font-semibold text-lg">Datenschutzhinweis</h3>
                <p className="text-sm text-muted-foreground">
                  Mit der Nutzung dieses Chat-Widgets stimmen Sie unserer{" "}
                  <a
                    href="https://www.singulary.net/datenschutz"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Datenschutzerklärung
                  </a>
                  {" "}zu. Ihre Daten werden ausschließlich zur Bereitstellung des Chat-Services verwendet.
                </p>
                <Button onClick={() => setPrivacyAccepted(true)}>
                  Verstanden
                </Button>
              </div>
            </div>
          )}

          {/* Chat Interface */}
          <div 
            className="flex-1 overflow-hidden"
            style={{
              borderRadius: `${borderRadius}px`,
            }}
          >
            <ChatInterface 
              showPoweredBy={showPoweredBy}
              showCloseButton={showCloseButton}
              showRefreshButton={showRefreshButton}
              showSettingsButton={showSettingsButton}
              onClose={handleCloseChat}
              onSettingsClick={() => setShowCookieConsent(true)}
              botName={botName}
              privacyApproach={privacyApproach}
              privacyAccepted={privacyAccepted}
              onPrivacyAccept={handlePrivacyAccept}
              initialMessages={initialMessages}
              chatPlaceholders={chatPlaceholders}
            />
          </div>
        </div>
      </div>

      {/* Chat Button and Popup */}
      <div className="fixed bottom-4 right-4 z-[2147483646]">
        <AnimatePresence>
          {showPopup && (
            <motion.div 
              onClick={handleOpenChat}
              className={cn(
                "absolute bottom-16 right-0 mb-2 p-4 bg-background rounded-lg shadow-lg cursor-pointer",
                "w-64 border dark:border-gray-800"
              )}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                y: 0,
                transition: {
                  type: "spring",
                  stiffness: 400,
                  damping: 25
                }
              }}
              exit={{ 
                opacity: 0, 
                scale: 0.95, 
                y: 10,
                transition: {
                  duration: 0.2,
                  ease: "easeOut"
                }
              }}
              style={{
                borderRadius: `${borderRadius}px`,
                backdropFilter: `blur(${blur}px)`,
                background: `rgb(${theme === 'dark' ? '0 0 0' : '255 255 255'} / ${opacity / 100})`
              }}
            >
              <p className="text-sm">{initialPopupMessage}</p>
              <div 
                className="absolute -bottom-2 right-6 w-4 h-4 bg-background border-r border-b dark:border-gray-800 transform rotate-45"
                style={{
                  background: `rgb(${theme === 'dark' ? '0 0 0' : '255 255 255'} / ${opacity / 100})`
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
        
        <Button
          className={cn(
            "h-12 w-12 rounded-full shadow-lg transition-transform duration-300 hover:scale-110 p-0 overflow-hidden",
            "bg-[url(https://images.squarespace-cdn.com/content/641c5981823d0207a111bb74/999685ce-589d-4f5f-9763-4e094070fb4b/64e9502e4159bed6f8f57b071db5ac7e+%281%29.gif?content-type=image%2Fgif)]",
            "bg-cover bg-center relative"
          )}
          onClick={() => isOpen ? handleCloseChat() : handleOpenChat()}
        >
          <div 
            className={cn(
              "absolute inset-0 rounded-full transition-opacity duration-300 flex items-center justify-center",
              "bg-gradient-to-br from-black/80 to-black/60 backdrop-blur-sm",
              isOpen ? "opacity-100" : "opacity-0"
            )}
          >
            <X className="h-6 w-6 text-white transition-transform duration-300 rotate-0 hover:rotate-90" />
          </div>
          <span className="sr-only">{isOpen ? 'Chat schließen' : 'Chat öffnen'}</span>
        </Button>
      </div>
    </>
  )
} 