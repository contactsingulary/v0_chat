import { NextResponse } from 'next/server'

// In-memory store for configurations (temporary solution)
const configs = new Map()

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const configId = searchParams.get('configId')

  if (!configId) {
    return NextResponse.json({ error: 'Config ID is required' }, { status: 400 })
  }

  try {
    const config = configs.get(configId) || {
      position: 'right',
      width: 400,
      height: 700,
      privacyApproach: 'passive',
      botName: 'Chat Assistent',
      showPoweredBy: true,
      showCloseButton: true,
      showRefreshButton: true,
      showSettingsButton: true,
      customStyles: {}
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error('Error fetching config:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const configId = Math.random().toString(36).substring(7)
    
    const config = {
      position: body.position || 'right',
      width: body.width || 400,
      height: body.height || 700,
      privacyApproach: body.privacyApproach || 'passive',
      botName: body.botName || 'Chat Assistent',
      showPoweredBy: body.showPoweredBy ?? true,
      showCloseButton: body.showCloseButton ?? true,
      showRefreshButton: body.showRefreshButton ?? true,
      showSettingsButton: body.showSettingsButton ?? true,
      customStyles: body.customStyles || {}
    }

    configs.set(configId, config)

    return NextResponse.json({
      configId,
      config
    })
  } catch (error) {
    console.error('Error creating config:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const { searchParams } = new URL(request.url)
  const configId = searchParams.get('configId')

  if (!configId) {
    return NextResponse.json({ error: 'Config ID is required' }, { status: 400 })
  }

  try {
    const body = await request.json()
    
    const config = {
      position: body.position,
      width: body.width,
      height: body.height,
      privacyApproach: body.privacyApproach,
      botName: body.botName,
      showPoweredBy: body.showPoweredBy,
      showCloseButton: body.showCloseButton,
      showRefreshButton: body.showRefreshButton,
      showSettingsButton: body.showSettingsButton,
      customStyles: body.customStyles
    }

    configs.set(configId, config)

    return NextResponse.json(config)
  } catch (error) {
    console.error('Error updating config:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 