/**
 * Market Data API Route
 * Fetches real-time data from Yahoo Finance and FRED
 */

import { NextRequest, NextResponse } from 'next/server'
import { fetchPrices, getAllETFPrices, type PriceData } from '@/lib/market-data'
import { fetchYields, type YieldSnapshot } from '@/lib/yields-data'
import {
  loadPortfolio,
  savePortfolio,
  updatePositionPrice,
  loadAlerts,
  addAlert,
  acknowledgeAlert,
  clearAlert,
  savePriceHistory,
} from '@/lib/persistence'
import { fetchAlpacaPortfolio, isAlpacaConfigured } from '@/lib/alpaca-broker'

export const dynamic = 'force-dynamic' // Disable caching for real-time data

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action') || 'all'

  try {
    switch (action) {
      case 'prices': {
        const tickers = searchParams.get('tickers')?.split(',') || ['TLT', 'TMV', 'TBT', 'TBF']
        const prices = await fetchPrices(tickers)
        return NextResponse.json({
          success: true,
          data: prices,
          timestamp: new Date().toISOString(),
        })
      }

      case 'yields': {
        const yields = await fetchYields()
        return NextResponse.json({
          success: true,
          data: yields,
          timestamp: new Date().toISOString(),
        })
      }

      case 'portfolio': {
        // Try Alpaca first, fallback to local
        let portfolio
        if (isAlpacaConfigured()) {
          const alpacaData = await fetchAlpacaPortfolio()
          if (alpacaData) {
            return NextResponse.json({
              success: true,
              data: alpacaData,
              source: 'alpaca',
              timestamp: new Date().toISOString(),
            })
          }
        }

        // Fallback to local portfolio and update prices
        portfolio = loadPortfolio()
        const tickers = portfolio.positions.map(p => p.ticker)

        if (tickers.length > 0) {
          const prices = await fetchPrices(tickers)

          // Update each position with current price
          for (const price of prices) {
            const position = portfolio.positions.find(p => p.ticker === price.ticker)
            if (position && price.price > 0) {
              position.currentPrice = price.price
              position.marketValue = position.shares * price.price
              position.unrealizedPnL = position.marketValue - (position.shares * position.avgCost)
              position.unrealizedPnLPercent = (position.unrealizedPnL / (position.shares * position.avgCost)) * 100

              // Save price history
              savePriceHistory(price.ticker, price.price)
            }
          }

          // Recalculate totals
          const totalInvested = portfolio.positions.reduce((sum, p) => sum + p.marketValue, 0)
          portfolio.totalValue = totalInvested + portfolio.cash
          portfolio.cashPercent = (portfolio.cash / portfolio.totalValue) * 100

          // Update weights
          portfolio.positions.forEach(p => {
            p.weight = (p.marketValue / portfolio.totalValue) * 100
          })

          savePortfolio(portfolio)
        }

        return NextResponse.json({
          success: true,
          data: portfolio,
          timestamp: new Date().toISOString(),
        })
      }

      case 'alerts': {
        const alerts = loadAlerts()
        return NextResponse.json({
          success: true,
          data: alerts,
          timestamp: new Date().toISOString(),
        })
      }

      case 'all': {
        // Fetch all data in parallel
        const [prices, yields, brokerPortfolio, alerts] = await Promise.all([
          getAllETFPrices(),
          fetchYields(),
          (async () => {
            // Try Alpaca first, fallback to local
            if (isAlpacaConfigured()) {
              const alpacaData = await fetchAlpacaPortfolio()
              if (alpacaData) return alpacaData
            }
            return loadPortfolio()
          })(),
          (async () => loadAlerts())(),
        ])

        // Use broker portfolio as base
        const portfolio = brokerPortfolio

        // Update portfolio with latest prices
        for (const price of prices) {
          const position = portfolio.positions.find(pos => pos.ticker === price.ticker)
          if (position && price.price > 0) {
            position.currentPrice = price.price
            position.marketValue = position.shares * price.price
            position.unrealizedPnL = position.marketValue - (position.shares * position.avgCost)
            position.unrealizedPnLPercent = (position.unrealizedPnL / (position.shares * position.avgCost)) * 100
          }
        }

        // Recalculate totals
        const totalInvested = portfolio.positions.reduce((sum, p) => sum + p.marketValue, 0)
        portfolio.totalValue = totalInvested + portfolio.cash
        portfolio.cashPercent = (portfolio.cash / portfolio.totalValue) * 100

        portfolio.positions.forEach(p => {
          p.weight = (p.marketValue / portfolio.totalValue) * 100
        })

        savePortfolio(portfolio as any)

        // Check for alerts
        await checkAlertConditions(prices, yields, portfolio as any)

        return NextResponse.json({
          success: true,
          data: {
            prices,
            yields,
            portfolio,
            alerts,
          },
          timestamp: new Date().toISOString(),
        })
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Unknown action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Market API Error:', error)
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
      case 'acknowledgeAlert':
        acknowledgeAlert(params.alertId)
        return NextResponse.json({ success: true })

      case 'clearAlert':
        clearAlert(params.alertId)
        return NextResponse.json({ success: true })

      case 'addAlert':
        const alert = addAlert(params)
        return NextResponse.json({ success: true, data: alert })

      default:
        return NextResponse.json(
          { success: false, error: 'Unknown action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Market API POST Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Check for alert conditions
async function checkAlertConditions(
  prices: PriceData[],
  yields: YieldSnapshot,
  portfolio: any
) {
  const alerts = loadAlerts()
  const recentAlertTitles = alerts
    .filter(a => {
      const alertTime = new Date(a.timestamp).getTime()
      const hourAgo = Date.now() - 3600000
      return alertTime > hourAgo
    })
    .map(a => a.title)

  // Check yield thresholds
  const y10 = yields.yields.find(y => y.tenor === '10Y')
  const y30 = yields.yields.find(y => y.tenor === '30Y')

  if (y10 && y10.yield > 4.5 && !recentAlertTitles.includes('10Y yield above 4.50%')) {
    addAlert({
      level: 'warning',
      category: 'yield',
      title: '10Y yield above 4.50%',
      message: `10Y Treasury yield at ${y10.yield.toFixed(2)}%. Consider adding to positions.`,
      agent: 'HERMES',
    })
  }

  if (y30 && y30.yield > 4.9 && !recentAlertTitles.includes('30Y approaching 5.00%')) {
    addAlert({
      level: 'danger',
      category: 'yield',
      title: '30Y approaching 5.00%',
      message: `30Y Treasury yield at ${y30.yield.toFixed(2)}%. Bond vigilantes may be active.`,
      agent: 'HERMES',
    })
  }

  // Check position stop losses
  for (const position of portfolio.positions) {
    if (position.stopLoss && position.currentPrice < position.stopLoss * 1.05) {
      const alertTitle = `${position.ticker} near stop loss`
      if (!recentAlertTitles.includes(alertTitle)) {
        addAlert({
          level: 'danger',
          category: 'price',
          title: alertTitle,
          message: `${position.ticker} at $${position.currentPrice.toFixed(2)}, stop loss at $${position.stopLoss.toFixed(2)}`,
          agent: 'ARGUS',
        })
      }
    }

    // Check targets
    if (position.targetPrice && position.currentPrice > position.targetPrice * 0.95) {
      const alertTitle = `${position.ticker} approaching target`
      if (!recentAlertTitles.includes(alertTitle)) {
        addAlert({
          level: 'success',
          category: 'price',
          title: alertTitle,
          message: `${position.ticker} at $${position.currentPrice.toFixed(2)}, target at $${position.targetPrice.toFixed(2)}`,
          agent: 'ARGUS',
        })
      }
    }
  }

  // Check position size limits
  for (const position of portfolio.positions) {
    if (position.weight > 25) {
      const alertTitle = `${position.ticker} exceeds 25% limit`
      if (!recentAlertTitles.includes(alertTitle)) {
        addAlert({
          level: 'warning',
          category: 'risk',
          title: alertTitle,
          message: `${position.ticker} is ${position.weight.toFixed(1)}% of portfolio. Consider rebalancing.`,
          agent: 'TYCHE',
        })
      }
    }
  }
}
