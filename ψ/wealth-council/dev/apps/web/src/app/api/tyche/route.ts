/**
 * TYCHE API Route
 * Connects WebUI to TYCHE MCP Server (Risk Management)
 */

import { NextRequest, NextResponse } from 'next/server'
import tyche from '@wealth-council/mcp-tyche'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action') || 'metrics'

  try {
    switch (action) {
      case 'metrics':
        return NextResponse.json(tyche.getRiskMetrics())

      case 'limits':
        return NextResponse.json(tyche.getRiskLimits())

      case 'score':
        return NextResponse.json(tyche.getRiskScore())

      case 'scenarios':
        return NextResponse.json(tyche.getScenarioAnalysis())

      default:
        return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 })
    }
  } catch (error) {
    console.error('TYCHE API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { action, portfolio, ticker } = body

  try {
    switch (action) {
      case 'analyze':
        if (!portfolio) {
          return NextResponse.json(
            { success: false, error: 'portfolio required' },
            { status: 400 }
          )
        }
        return NextResponse.json(tyche.analyzePortfolioRisk(portfolio))

      case 'positionSize':
        if (!portfolio || !ticker) {
          return NextResponse.json(
            { success: false, error: 'portfolio and ticker required' },
            { status: 400 }
          )
        }
        return NextResponse.json(tyche.getPositionSizeRecommendation(portfolio, ticker))

      default:
        return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 })
    }
  } catch (error) {
    console.error('TYCHE API POST Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
