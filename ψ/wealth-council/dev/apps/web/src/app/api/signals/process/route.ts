/**
 * Signal Processing API
 *
 * Endpoint that:
 * 1. Fetches current market data
 * 2. Generates signals using strategy rules
 * 3. Passes signals to automation engine
 *
 * Can be called periodically for autonomous trading.
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateSignals, formatMarketConditions, shouldPauseSignals, DEFAULT_STRATEGY_RULES } from '@/lib/signal-engine'
import { fetchYields } from '@/lib/yields-data'
import { fetchPrices } from '@/lib/market-data'
import { fetchAlpacaPortfolio, isAlpacaConfigured } from '@/lib/alpaca-broker'

// In-memory store for signal history and last run
let lastRunTime: string | null = null
let signalHistory: any[] = []
let processedCount = 0

// Minimum interval between runs (in milliseconds)
const MIN_INTERVAL = 60000 // 1 minute

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action') || 'status'

  switch (action) {
    case 'status':
      return NextResponse.json({
        success: true,
        data: {
          lastRunTime,
          processedCount,
          recentSignals: signalHistory.slice(0, 10),
          rulesCount: DEFAULT_STRATEGY_RULES.filter(r => r.enabled).length,
        },
      })

    case 'history':
      return NextResponse.json({
        success: true,
        data: signalHistory,
      })

    case 'rules':
      return NextResponse.json({
        success: true,
        data: DEFAULT_STRATEGY_RULES,
      })

    default:
      return NextResponse.json(
        { success: false, error: 'Unknown action' },
        { status: 400 }
      )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { force = false } = body

    // Check minimum interval (unless forced)
    if (!force && lastRunTime) {
      const timeSinceLastRun = Date.now() - new Date(lastRunTime).getTime()
      if (timeSinceLastRun < MIN_INTERVAL) {
        return NextResponse.json({
          success: false,
          error: 'Too soon since last run',
          nextRunIn: Math.ceil((MIN_INTERVAL - timeSinceLastRun) / 1000),
        })
      }
    }

    console.log('🔄 Running signal processor...')

    // 1. Fetch current market data
    const [yields, prices, portfolio] = await Promise.all([
      fetchYields(),
      fetchPrices(['TLT', 'TMV', 'TBT', 'TBF']),
      isAlpacaConfigured() ? fetchAlpacaPortfolio() : null,
    ])

    if (!yields || !prices) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch market data',
      })
    }

    // Check for mock data - BLOCK TRADING if using mock data
    const usingMockYields = (yields as any).usingMockData || false
    const usingMockPrices = prices.some(p => p.source === 'mock')
    const usingMockData = usingMockYields || usingMockPrices

    if (usingMockData) {
      console.error('🚫 BLOCKING: Mock data detected - refusing to generate trading signals')
      console.error(`   Mock yields: ${usingMockYields}, Mock prices: ${usingMockPrices}`)
      return NextResponse.json({
        success: false,
        error: 'Trading blocked: Using mock data. Configure FRED_API_KEY and FINNHUB_API_KEY for real data.',
        mockDataSources: {
          yields: usingMockYields,
          prices: usingMockPrices ? prices.filter(p => p.source === 'mock').map(p => p.ticker) : [],
        },
      }, { status: 503 })
    }

    // Validation warnings
    const validation = (yields as any).validation
    if (validation && !validation.valid) {
      console.warn('⚠️ Data validation warnings:', validation.warnings)
      // Don't block but log for monitoring
    }

    // Check data freshness - block if data is too old (>5 minutes)
    const now = Date.now()
    const yieldAge = now - new Date((yields as any).timestamp || now).getTime()
    const maxAge = 5 * 60 * 1000 // 5 minutes
    if (yieldAge > maxAge) {
      console.error(`🚫 BLOCKING: Yield data is ${Math.round(yieldAge / 1000)}s old (max: ${maxAge / 1000}s)`)
      return NextResponse.json({
        success: false,
        error: `Trading blocked: Stale data (${Math.round(yieldAge / 1000)}s old)`,
      }, { status: 503 })
    }

    // 2. Format market conditions
    const market = formatMarketConditions(yields, prices)

    console.log('📊 Market conditions:', {
      y10: market.yields.y10,
      y30: market.yields.y30,
      tmvPrice: market.prices['TMV']?.price,
      tmvChange: market.prices['TMV']?.changePercent,
    })

    // 3. Check if we should pause (e.g., before FOMC)
    // TODO: Fetch calendar events and check
    const pauseCheck = shouldPauseSignals([])
    if (pauseCheck.pause) {
      return NextResponse.json({
        success: true,
        paused: true,
        reason: pauseCheck.reason,
        signals: [],
      })
    }

    // 4. Generate signals
    const positions = portfolio?.positions || []
    const signals = generateSignals(market, DEFAULT_STRATEGY_RULES, positions)

    console.log(`📡 Generated ${signals.length} signals`)

    // 5. Process each signal through automation engine
    const results = []
    for (const signal of signals) {
      console.log(`  → ${signal.agent}: ${signal.action.toUpperCase()} ${signal.ticker} (${signal.confidence}%)`)

      // Add to history
      signalHistory.unshift({
        ...signal,
        processedAt: new Date().toISOString(),
      })

      // Call automation engine
      try {
        const automationResponse = await fetch(`${getBaseUrl(request)}/api/automation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'process_signal',
            signal: {
              ticker: signal.ticker,
              action: signal.action,
              confidence: signal.confidence,
              reasoning: `${signal.reasoning}. Triggers: ${signal.triggers.join(', ')}`,
              agent: signal.agent,
              currentPrice: signal.currentPrice,
            },
          }),
        })

        const automationResult = await automationResponse.json()
        results.push({
          signal,
          automationResult: automationResult.data,
        })
      } catch (error) {
        console.error(`Failed to process signal ${signal.id}:`, error)
        results.push({
          signal,
          error: 'Failed to send to automation engine',
        })
      }
    }

    // Keep only last 100 signals in history
    signalHistory = signalHistory.slice(0, 100)

    // Update stats
    lastRunTime = new Date().toISOString()
    processedCount++

    return NextResponse.json({
      success: true,
      data: {
        timestamp: lastRunTime,
        market: {
          yields: market.yields,
          prices: Object.fromEntries(
            Object.entries(market.prices).map(([k, v]) => [k, { price: v.price, change: v.changePercent }])
          ),
        },
        signalsGenerated: signals.length,
        results,
      },
    })
  } catch (error) {
    console.error('Signal processor error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    )
  }
}

function getBaseUrl(request: NextRequest): string {
  const host = request.headers.get('host') || 'localhost:3200'
  const protocol = host.includes('localhost') ? 'http' : 'https'
  return `${protocol}://${host}`
}
