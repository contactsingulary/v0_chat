'use client'

import { useEffect, useState } from 'react'
import { ChatInterface } from '@/components/chat-interface'
import { useTheme } from '@/contexts/ThemeContext'
import { CookieConsent } from '@/components/CookieConsent'

interface WidgetConfig {
  borderRadius?: number
  opacity?: number
  blur?: number
  botName?: string
  showPoweredBy?: boolean
  showCloseButton?: boolean
  showRefreshButton?: boolean
  showSettingsButton?: boolean
  privacyApproach?: 'pre' | 'in-chat' | 'passive' | 'none'
  chatPlaceholders?: string[]
  showInitialPopup?: boolean
  initialPopupMessage?: string
  theme?: 'light' | 'dark'
}

export default function WidgetPage() {
  const [config, setConfig] = useState<WidgetConfig | null>(null)
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [initialMessages, setInitialMessages] = useState<any[]>([])
  const [showCookieConsent, setShowCookieConsent] = useState(false)
  const { setTheme } = useTheme()

  useEffect(() => {
    // Get config from URL
    const searchParams = new URLSearchParams(window.location.search)
    const configParam = searchParams.get('config')
    
    if (configParam) {
      try {
        const parsedConfig = JSON.parse(decodeURIComponent(configParam))
        setConfig(parsedConfig)
        
        // Set theme from config
        if (parsedConfig.theme) {
          setTheme(parsedConfig.theme)
        }
        
        // Check for stored privacy consent
        const storedConsent = localStorage.getItem('privacyConsent')
        if (storedConsent) {
          setPrivacyAccepted(true)
        } else if (parsedConfig.privacyApproach === 'pre') {
          setShowCookieConsent(true)
        }
      } catch (error) {
        console.error('Failed to parse config:', error)
        // Use default config
        setConfig({
          borderRadius: 16,
          opacity: 99,
          blur: 3,
          botName: 'Chat Assistent',
          showPoweredBy: true,
          showCloseButton: true,
          showRefreshButton: true,
          showSettingsButton: true,
          privacyApproach: 'passive',
          chatPlaceholders: [
            "Wie funktioniert der Login-Prozess?",
            "Was sind die wichtigsten Features?",
            "Wie kann ich mein Passwort zurücksetzen?"
          ],
          showInitialPopup: true,
          initialPopupMessage: "Haben Sie Fragen? Ich bin hier, um zu helfen!",
          theme: 'light'
        })
      }
    }
  }, [])

  // Listen for theme changes from parent
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'theme-change') {
        setTheme(event.data.theme)
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const handlePrivacyAccept = () => {
    localStorage.setItem('privacyConsent', 'true')
    setPrivacyAccepted(true)
    setShowCookieConsent(false)
  }

  const handleCookieConsent = (settings: { essential: boolean; nonEssential: boolean }) => {
    localStorage.setItem('privacyConsent', JSON.stringify(settings))
    setPrivacyAccepted(true)
    setShowCookieConsent(false)
  }

  const handleCookieDecline = () => {
    setShowCookieConsent(false)
  }

  if (!config) {
    return <div>Loading...</div>
  }

  return (
    <>
      {showCookieConsent && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <CookieConsent
            onAccept={handleCookieConsent}
            onDecline={handleCookieDecline}
            position={{}}
          />
        </div>
      )}
      <div 
        className="h-screen"
        style={{
          '--chat-border-radius': `${config.borderRadius}px`,
          '--chat-opacity': config.opacity / 100,
          '--chat-blur': `${config.blur}px`
        } as React.CSSProperties}
      >
        <ChatInterface
          botName={config.botName}
          showPoweredBy={config.showPoweredBy}
          showCloseButton={config.showCloseButton}
          showRefreshButton={config.showRefreshButton}
          showSettingsButton={config.showSettingsButton}
          privacyApproach={config.privacyApproach}
          privacyAccepted={privacyAccepted}
          onPrivacyAccept={handlePrivacyAccept}
          onSettingsClick={() => setShowCookieConsent(true)}
          initialMessages={initialMessages}
          chatPlaceholders={config.chatPlaceholders}
          showInitialPopup={config.showInitialPopup}
          initialPopupMessage={config.initialPopupMessage}
          customStyles={{
            borderRadius: config.borderRadius,
            opacity: config.opacity,
            blur: config.blur
          }}
        />
      </div>
    </>
  )
} 