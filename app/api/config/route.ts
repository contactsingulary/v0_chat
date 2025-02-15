import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const configId = searchParams.get('configId')

  if (!configId) {
    return NextResponse.json({ error: 'Config ID is required' }, { status: 400 })
  }

  try {
    const config = await db.widgetConfig.findUnique({
      where: { id: configId }
    })

    if (!config) {
      return NextResponse.json({ error: 'Configuration not found' }, { status: 404 })
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
    
    const config = await db.widgetConfig.create({
      data: {
        position: body.position || 'right',
        width: body.width || 400,
        height: body.height || 700,
        privacyApproach: body.privacyApproach || 'passive',
        botName: body.botName || 'Chat Assistent',
        showPoweredBy: body.showPoweredBy ?? true,
        showCloseButton: body.showCloseButton ?? true,
        showRefreshButton: body.showRefreshButton ?? true,
        showSettingsButton: body.showSettingsButton ?? true,
        customStyles: body.customStyles || {},
      }
    })

    return NextResponse.json({
      configId: config.id,
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
    
    const config = await db.widgetConfig.update({
      where: { id: configId },
      data: {
        position: body.position,
        width: body.width,
        height: body.height,
        privacyApproach: body.privacyApproach,
        botName: body.botName,
        showPoweredBy: body.showPoweredBy,
        showCloseButton: body.showCloseButton,
        showRefreshButton: body.showRefreshButton,
        showSettingsButton: body.showSettingsButton,
        customStyles: body.customStyles,
      }
    })

    return NextResponse.json(config)
  } catch (error) {
    console.error('Error updating config:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 