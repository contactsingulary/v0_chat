'use client'

import { useEffect, useState } from 'react'
import { ChatInterface } from '@/components/chat-interface'

interface WidgetConfig {
  position: string
  width: number
  height: number
  privacyApproach: 'pre' | 'in-chat' | 'passive'
  botName: string
  showPoweredBy: boolean
  showCloseButton: boolean
  showRefreshButton: boolean
  showSettingsButton: boolean
  customStyles?: Record<string, any>
}

export default function WidgetPage() {
  const [config, setConfig] = useState<WidgetConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const searchParams = new URLSearchParams(window.location.search)
        const configId = searchParams.get('configId')

        if (configId) {
          const response = await fetch(`/api/config?configId=${encodeURIComponent(configId)}`)
          if (!response.ok) {
            throw new Error('Failed to load configuration')
          }
          const data = await response.json()
          setConfig(data)
        } else {
          // Use default config if no configId provided
          setConfig({
            position: 'right',
            width: 400,
            height: 700,
            privacyApproach: 'passive',
            botName: 'Chat Assistent',
            showPoweredBy: true,
            showCloseButton: true,
            showRefreshButton: true,
            showSettingsButton: true
          })
        }
      } catch (err) {
        console.error('Error loading config:', err)
        setError('Failed to load configuration')
      } finally {
        setLoading(false)
      }
    }

    loadConfig()
  }, [])

  if (loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  if (!config) {
    return null
  }

  return (
    <ChatInterface
      botName={config.botName}
      privacyApproach={config.privacyApproach}
      showPoweredBy={config.showPoweredBy}
      showCloseButton={config.showCloseButton}
      showRefreshButton={config.showRefreshButton}
      showSettingsButton={config.showSettingsButton}
    />
  )
} 