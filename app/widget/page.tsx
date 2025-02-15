'use client'

import { useEffect, useState } from 'react'
import { ChatInterface } from '@/components/chat-interface'

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
}

export default function WidgetPage() {
  const [config, setConfig] = useState<WidgetConfig | null>(null)
  const [privacyAccepted, setPrivacyAccepted] = useState(false)

  useEffect(() => {
    // Get config from URL
    const searchParams = new URLSearchParams(window.location.search)
    const configParam = searchParams.get('config')
    
    if (configParam) {
      try {
        const parsedConfig = JSON.parse(decodeURIComponent(configParam))
        setConfig(parsedConfig)
        
        // Check for stored privacy consent
        const storedConsent = localStorage.getItem('privacyConsent')
        if (storedConsent) {
          setPrivacyAccepted(true)
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
          initialPopupMessage: "Haben Sie Fragen? Ich bin hier, um zu helfen!"
        })
      }
    } else {
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
        initialPopupMessage: "Haben Sie Fragen? Ich bin hier, um zu helfen!"
      })
    }
  }, [])

  const handlePrivacyAccept = () => {
    localStorage.setItem('privacyConsent', 'true')
    setPrivacyAccepted(true)
  }

  if (!config) {
    return <div>Loading...</div>
  }

  return (
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
  )
} 