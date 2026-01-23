/**
 * ARGUS API Route
 * Connects WebUI to ARGUS MCP Server
 * Integrates with Alpaca broker for real portfolio data when configured
 */

import { NextRequest, NextResponse } from 'next/server'
import argus from '@wealth-council/mcp-argus'
import { fetchAlpacaPortfolio, isAlpacaConfigured } from '@/lib/alpaca-broker'
import { fetchIBKRPortfolio, isIBKRConfigured } from '@/lib/ibkr-broker'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action') || 'portfolio'
  const ticker = searchParams.get('ticker')
  const period = searchParams.get('period') as 'daily' | 'weekly' | 'monthly'
  const level = searchParams.get('level') as 'info' | 'notice' | 'warning' | 'critical' | undefined

  try {
    switch (action) {
      case 'portfolio': {
        // Try IBKR first for real data
        if (isIBKRConfigured()) {
          const ibkrPortfolio = await fetchIBKRPortfolio()
          if (ibkrPortfolio) {
            return NextResponse.json({
              success: true,
              data: ibkrPortfolio,
              source: 'ibkr',
              timestamp: new Date(),
            })
          }
        }

        // Try Alpaca next
        if (isAlpacaConfigured()) {
          const alpacaPortfolio = await fetchAlpacaPortfolio()
          if (alpacaPortfolio) {
            return NextResponse.json({
              success: true,
              data: alpacaPortfolio,
              source: 'alpaca',
              timestamp: new Date(),
            })
          }
        }

        // Fallback to MCP mock data
        return NextResponse.json(argus.getPortfolio())
      }

      case 'positions':
        return NextResponse.json(argus.getPositions())

      case 'position':
        if (!ticker) {
          return NextResponse.json({ success: false, error: 'Ticker required' }, { status: 400 })
        }
        return NextResponse.json(argus.getPosition(ticker))

      case 'pnl':
        return NextResponse.json(argus.getPnL(period || 'daily'))

      case 'alerts':
        return NextResponse.json(argus.getAlerts(level))

      case 'risk':
        return NextResponse.json(argus.getRiskMetrics())

      case 'limits':
        return NextResponse.json(argus.checkRiskLimits())

      case 'summary':
        return NextResponse.json(argus.generateDailySummary())

      default:
        return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 })
    }
  } catch (error) {
    console.error('ARGUS API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { action, ...params } = body

  try {
    switch (action) {
      case 'updatePrice':
        if (!params.ticker || !params.price) {
          return NextResponse.json({ success: false, error: 'Ticker and price required' }, { status: 400 })
        }
        return NextResponse.json(argus.updatePrice(params.ticker, params.price))

      case 'createAlert':
        return NextResponse.json(argus.createAlert(params))

      case 'acknowledgeAlert':
        if (!params.alertId) {
          return NextResponse.json({ success: false, error: 'Alert ID required' }, { status: 400 })
        }
        return NextResponse.json(argus.acknowledgeAlert(params.alertId))

      case 'clearAlert':
        if (!params.alertId) {
          return NextResponse.json({ success: false, error: 'Alert ID required' }, { status: 400 })
        }
        return NextResponse.json(argus.clearAlert(params.alertId))

      default:
        return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 })
    }
  } catch (error) {
    console.error('ARGUS API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
