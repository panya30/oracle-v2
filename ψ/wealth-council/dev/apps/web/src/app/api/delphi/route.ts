/**
 * DELPHI API Route
 * Connects WebUI to DELPHI MCP Server (Oracle/Signals)
 */

import { NextRequest, NextResponse } from 'next/server'
import delphi from '@wealth-council/mcp-delphi'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action') || 'signals'
  const type = searchParams.get('type') as 'entry' | 'exit' | 'warning' | 'info' | undefined

  try {
    switch (action) {
      case 'signals':
        return NextResponse.json(delphi.getSignals(type))

      case 'active':
        return NextResponse.json(delphi.getActiveSignals())

      case 'thesis':
        return NextResponse.json(delphi.getThesisStatus())

      case 'oracle':
        return NextResponse.json(delphi.getOracleReading())

      default:
        return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 })
    }
  } catch (error) {
    console.error('DELPHI API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { action, yields, prices, positions } = body

  try {
    switch (action) {
      case 'generate':
        if (!yields || !prices || !positions) {
          return NextResponse.json(
            { success: false, error: 'yields, prices, and positions required' },
            { status: 400 }
          )
        }
        return NextResponse.json(delphi.generateSignals(yields, prices, positions))

      case 'clearExpired':
        return NextResponse.json(delphi.clearExpiredSignals())

      default:
        return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 })
    }
  } catch (error) {
    console.error('DELPHI API POST Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
