/**
 * Trade Outcome Tracker
 *
 * Monitors positions and records outcomes when they close.
 * Should run periodically (e.g., every 5 minutes) to detect closed positions.
 */

import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { fetchAlpacaPortfolio, getOrders } from '@/lib/alpaca-broker'
import { loadMemory, saveMemory, addLearning, type TradeMemory } from '@/lib/agent-intelligence'

const DATA_DIR = join(process.cwd(), 'data')
const TRACKED_POSITIONS_FILE = join(DATA_DIR, 'tracked-positions.json')

interface TrackedPosition {
  symbol: string
  entryTradeId: string
  entryPrice: number
  qty: number
  entryTime: string
  agent: string
}

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true })
  }
}

function loadTrackedPositions(): TrackedPosition[] {
  try {
    ensureDataDir()
    if (existsSync(TRACKED_POSITIONS_FILE)) {
      return JSON.parse(readFileSync(TRACKED_POSITIONS_FILE, 'utf-8'))
    }
  } catch (e) {
    console.error('Failed to load tracked positions:', e)
  }
  return []
}

function saveTrackedPositions(positions: TrackedPosition[]) {
  try {
    ensureDataDir()
    writeFileSync(TRACKED_POSITIONS_FILE, JSON.stringify(positions, null, 2))
  } catch (e) {
    console.error('Failed to save tracked positions:', e)
  }
}

export async function GET(request: NextRequest) {
  console.log('📊 Outcome Tracker: Checking for closed positions...')

  try {
    // Get current portfolio
    const portfolio = await fetchAlpacaPortfolio()
    if (!portfolio) {
      return NextResponse.json({
        success: false,
        error: 'Could not fetch portfolio',
      })
    }

    // Get tracked positions (open trades we're monitoring)
    const tracked = loadTrackedPositions()
    const currentSymbols = new Set(portfolio.positions.map(p => p.ticker))

    // Find positions that have closed
    const closedPositions: TrackedPosition[] = []
    const stillOpen: TrackedPosition[] = []

    for (const pos of tracked) {
      if (!currentSymbols.has(pos.symbol)) {
        closedPositions.push(pos)
      } else {
        stillOpen.push(pos)
      }
    }

    // Record outcomes for closed positions
    const memory = loadMemory()
    let outcomesRecorded = 0

    for (const closed of closedPositions) {
      // Find the trade in memory
      const trade = memory.trades.find(t => t.id === closed.entryTradeId)

      if (trade && !trade.outcome) {
        // Get recent orders to find the exit price
        const recentOrders = await getOrders('closed', 50)
        const exitOrder = recentOrders?.find(o =>
          o.symbol === closed.symbol &&
          o.side === 'sell' &&
          o.status === 'filled' &&
          new Date(o.filled_at || '').getTime() > new Date(closed.entryTime).getTime()
        )

        const exitPrice = exitOrder?.filled_avg_price
          ? parseFloat(exitOrder.filled_avg_price)
          : portfolio.positions.find(p => p.ticker === closed.symbol)?.currentPrice || closed.entryPrice

        const pnl = (exitPrice - closed.entryPrice) * closed.qty
        const pnlPercent = ((exitPrice - closed.entryPrice) / closed.entryPrice) * 100

        // Record outcome
        trade.outcome = {
          exitPrice,
          pnl,
          pnlPercent,
          lessonLearned: pnl > 0
            ? `Successful ${closed.symbol} trade: +${pnlPercent.toFixed(1)}%`
            : `Loss on ${closed.symbol}: ${pnlPercent.toFixed(1)}% - review entry conditions`,
        }

        outcomesRecorded++

        // Add learning based on outcome
        if (pnl > 0) {
          addLearning({
            agent: closed.agent,
            type: 'success',
            content: `Profitable trade on ${closed.symbol}: +$${pnl.toFixed(2)} (+${pnlPercent.toFixed(1)}%)`,
            context: {
              trade: closed.entryTradeId,
              marketCondition: `Entry at $${closed.entryPrice}, exit at $${exitPrice}`,
            },
            confidence: 80,
          })
        } else {
          addLearning({
            agent: closed.agent,
            type: 'failure',
            content: `Loss on ${closed.symbol}: -$${Math.abs(pnl).toFixed(2)} (${pnlPercent.toFixed(1)}%). Entry: $${closed.entryPrice}, Exit: $${exitPrice}`,
            context: {
              trade: closed.entryTradeId,
            },
            confidence: 90,
          })
        }

        console.log(`📝 Recorded outcome for ${closed.symbol}: ${pnl > 0 ? '+' : ''}$${pnl.toFixed(2)} (${pnlPercent.toFixed(1)}%)`)
      }
    }

    // Save updated memory
    if (outcomesRecorded > 0) {
      saveMemory(memory)
    }

    // Update tracked positions (remove closed ones)
    saveTrackedPositions(stillOpen)

    // Also sync any new positions from portfolio that we're not tracking
    const newPositions: TrackedPosition[] = []
    for (const pos of portfolio.positions) {
      const isTracked = stillOpen.some(t => t.symbol === pos.ticker)
      if (!isTracked) {
        // Find the most recent buy trade for this symbol
        const recentTrade = memory.trades.find(t =>
          t.ticker === pos.ticker &&
          t.action === 'buy' &&
          !t.outcome
        )

        if (recentTrade) {
          newPositions.push({
            symbol: pos.ticker,
            entryTradeId: recentTrade.id,
            entryPrice: recentTrade.price,
            qty: pos.shares,
            entryTime: recentTrade.timestamp,
            agent: recentTrade.agent,
          })
          console.log(`📌 Now tracking ${pos.ticker} position`)
        }
      }
    }

    if (newPositions.length > 0) {
      saveTrackedPositions([...stillOpen, ...newPositions])
    }

    return NextResponse.json({
      success: true,
      data: {
        outcomesRecorded,
        closedPositions: closedPositions.length,
        stillTracking: stillOpen.length + newPositions.length,
        newlyTracked: newPositions.length,
      },
    })
  } catch (error) {
    console.error('Outcome tracker error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal error',
    }, { status: 500 })
  }
}
