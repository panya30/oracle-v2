/**
 * HERMES API Route
 * Connects WebUI to HERMES MCP Server
 */

import { NextRequest, NextResponse } from 'next/server'
import hermes from '@wealth-council/mcp-hermes'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action') || 'yields'
  const ticker = searchParams.get('ticker')
  const tenor = searchParams.get('tenor') as '2Y' | '5Y' | '10Y' | '30Y'
  const limit = parseInt(searchParams.get('limit') || '10')
  const query = searchParams.get('query')

  try {
    switch (action) {
      case 'yields':
        return NextResponse.json(hermes.getYields())

      case 'yield':
        if (!tenor) {
          return NextResponse.json({ success: false, error: 'Tenor required' }, { status: 400 })
        }
        return NextResponse.json(hermes.getYield(tenor))

      case 'curve':
        return NextResponse.json(hermes.getYieldCurveStatus())

      case 'price':
        if (!ticker) {
          return NextResponse.json({ success: false, error: 'Ticker required' }, { status: 400 })
        }
        return NextResponse.json(hermes.getPrice(ticker))

      case 'prices':
        return NextResponse.json(hermes.getAllPrices())

      case 'macro':
        return NextResponse.json(hermes.getMacroData())

      case 'fed':
        return NextResponse.json(hermes.getFedAnalysis())

      case 'news':
        if (query) {
          return NextResponse.json(hermes.searchNews(query))
        }
        return NextResponse.json(hermes.getNews(limit))

      case 'thesis':
        return NextResponse.json(hermes.getThesisStatus())

      case 'brief':
        return NextResponse.json(hermes.generateDailyBrief())

      default:
        return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 })
    }
  } catch (error) {
    console.error('HERMES API Error:', error)
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
      case 'updateYield':
        if (!params.tenor || params.yield === undefined) {
          return NextResponse.json({ success: false, error: 'Tenor and yield required' }, { status: 400 })
        }
        return NextResponse.json(hermes.updateYield(params.tenor, params.yield))

      default:
        return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 })
    }
  } catch (error) {
    console.error('HERMES API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
