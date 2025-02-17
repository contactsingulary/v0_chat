'use client'

import { useEffect, useState } from 'react'
import { ChatInterface } from '@/components/chat-interface'
import { useTheme } from 'next-themes'
import { CookieConsent } from '@/components/ui/cookie-consent'

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
  // Additional settings from editor
  headerBackgroundColor?: string
  headerTextColor?: string
  chatBackgroundColor?: string
  userMessageBackgroundColor?: string
  userMessageTextColor?: string
  botMessageBackgroundColor?: string
  botMessageTextColor?: string
  inputBackgroundColor?: string
  inputTextColor?: string
  buttonBackgroundColor?: string
  buttonTextColor?: string
  fontFamily?: string
  fontSize?: number
  messageSpacing?: number
  avatarSize?: number
  inputHeight?: number
  headerHeight?: number
  customCSS?: string
}

const defaultConfig: WidgetConfig = {
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
}

export default function WidgetPage() {
  const [config, setConfig] = useState<WidgetConfig>(defaultConfig)
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [initialMessages, setInitialMessages] = useState<any[]>([])
  const [showCookieConsent, setShowCookieConsent] = useState(false)
  const { setTheme } = useTheme()

  useEffect(() => {
    if (typeof window === 'undefined') return

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
        
        // Reset privacy state when config changes
        setPrivacyAccepted(false)
        setShowCookieConsent(false)
        localStorage.removeItem('privacyConsent')
        localStorage.removeItem('userId')
        localStorage.removeItem('conversationId')
        
        // Initialize privacy state based on approach
        if (parsedConfig.privacyApproach === 'pre') {
          setShowCookieConsent(true)
        } else if (parsedConfig.privacyApproach === 'in-chat') {
          setInitialMessages([{
            role: "assistant",
            content: `Bevor wir beginnen, benötige ich Ihre Zustimmung zur Datenverarbeitung. Details finden Sie in unserer [Datenschutzerklärung](https://www.singulary.net/datenschutz).\n\nBitte antworten Sie mit "Ja" oder "Akzeptieren" um fortzufahren, oder "Nein" oder "Ablehnen" um abzulehnen.`,
            timestamp: new Date().toISOString(),
            type: 'text'
          }])
        }
      } catch (error) {
        console.error('Failed to parse config:', error)
      }
    }
  }, [])

  // Effect to handle privacy approach changes
  useEffect(() => {
    if (!config) return

    setPrivacyAccepted(false)
    setShowCookieConsent(false)
    localStorage.removeItem('privacyConsent')
    localStorage.removeItem('userId')
    localStorage.removeItem('conversationId')
    
    if (config.privacyApproach === 'in-chat') {
      setInitialMessages([{
        role: "assistant",
        content: `Bevor wir beginnen, benötige ich Ihre Zustimmung zur Datenverarbeitung. Details finden Sie in unserer [Datenschutzerklärung](https://www.singulary.net/datenschutz).\n\nBitte antworten Sie mit "Ja" oder "Akzeptieren" um fortzufahren, oder "Nein" oder "Ablehnen" um abzulehnen.`,
        timestamp: new Date().toISOString(),
        type: 'text'
      }])
    } else {
      setInitialMessages([])
    }
  }, [config?.privacyApproach])

  // Listen for theme changes and consent requests from parent
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'theme-change') {
        setTheme(event.data.theme)
      } else if (event.data.type === 'show-consent') {
        setShowCookieConsent(true)
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
    
    // Notify parent window that consent was accepted
    if (typeof window !== 'undefined') {
      window.parent.postMessage({ type: 'consent-accepted' }, '*')
    }
  }

  const handleCookieDecline = () => {
    setShowCookieConsent(false)
  }

  return (
    <div className="h-screen flex flex-col">
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
        className="flex-1 flex flex-col overflow-hidden"
        style={{
          '--chat-border-radius': `${config.borderRadius}px`,
          '--chat-opacity': config.opacity / 100,
          '--chat-blur': `${config.blur}px`,
          '--header-bg': config.headerBackgroundColor,
          '--header-text': config.headerTextColor,
          '--chat-bg': config.chatBackgroundColor,
          '--user-msg-bg': config.userMessageBackgroundColor,
          '--user-msg-text': config.userMessageTextColor,
          '--bot-msg-bg': config.botMessageBackgroundColor,
          '--bot-msg-text': config.botMessageTextColor,
          '--input-bg': config.inputBackgroundColor,
          '--input-text': config.inputTextColor,
          '--button-bg': config.buttonBackgroundColor,
          '--button-text': config.buttonTextColor,
          fontFamily: config.fontFamily,
          fontSize: `${config.fontSize}px`,
          '--message-spacing': `${config.messageSpacing}px`,
          '--avatar-size': `${config.avatarSize}px`,
          '--input-height': `${config.inputHeight}px`,
          '--header-height': `${config.headerHeight}px`,
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
            blur: config.blur,
            headerBackgroundColor: config.headerBackgroundColor,
            headerTextColor: config.headerTextColor,
            chatBackgroundColor: config.chatBackgroundColor,
            userMessageBackgroundColor: config.userMessageBackgroundColor,
            userMessageTextColor: config.userMessageTextColor,
            botMessageBackgroundColor: config.botMessageBackgroundColor,
            botMessageTextColor: config.botMessageTextColor,
            inputBackgroundColor: config.inputBackgroundColor,
            inputTextColor: config.inputTextColor,
            buttonBackgroundColor: config.buttonBackgroundColor,
            buttonTextColor: config.buttonTextColor,
            fontFamily: config.fontFamily,
            fontSize: config.fontSize,
            messageSpacing: config.messageSpacing,
            avatarSize: config.avatarSize,
            inputHeight: config.inputHeight,
            headerHeight: config.headerHeight,
            customCSS: config.customCSS
          }}
        />
      </div>
    </div>
  )
} 