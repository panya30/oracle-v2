/**
 * Automation Engine API
 *
 * Handles trading automation based on settings:
 * - manual: Just creates alerts
 * - semi-auto: Creates proposals for approval
 * - full-auto: Executes trades with risk checks
 */

import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import {
  type AutomationSettings,
  type TradeProposal,
  type DailyStats,
  DEFAULT_SETTINGS,
} from '@/lib/automation-settings'
import { submitOrder, isAlpacaConfigured, fetchAlpacaPortfolio, submitTrailingStopOrder, submitStopLossOrder } from '@/lib/alpaca-broker'
import { addAlert } from '@/lib/persistence'
import { recordTrade, addLearning, getTradeStats } from '@/lib/agent-intelligence'

// File-based persistence for settings
const DATA_DIR = join(process.cwd(), 'data')
const SETTINGS_FILE = join(DATA_DIR, 'automation-settings.json')
const STATS_FILE = join(DATA_DIR, 'daily-stats.json')

// Ensure data directory exists
function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true })
  }
}

// Load settings from file
function loadSettings(): AutomationSettings {
  try {
    ensureDataDir()
    if (existsSync(SETTINGS_FILE)) {
      const data = readFileSync(SETTINGS_FILE, 'utf-8')
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) }
    }
  } catch (e) {
    console.error('Failed to load automation settings:', e)
  }
  return DEFAULT_SETTINGS
}

// Save settings to file
function saveSettings(settings: AutomationSettings) {
  try {
    ensureDataDir()
    writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2))
  } catch (e) {
    console.error('Failed to save automation settings:', e)
  }
}

// Load daily stats from file
function loadDailyStats(): DailyStats {
  const defaultStats: DailyStats = {
    date: new Date().toISOString().split('T')[0],
    tradesCount: 0,
    totalPnL: 0,
    maxDrawdown: 0,
    peakPortfolioValue: 0,  // Will be set on first portfolio fetch
    currentDrawdown: 0,
    trades: [],
  }
  try {
    ensureDataDir()
    if (existsSync(STATS_FILE)) {
      const data = readFileSync(STATS_FILE, 'utf-8')
      return { ...defaultStats, ...JSON.parse(data) }
    }
  } catch (e) {
    console.error('Failed to load daily stats:', e)
  }
  return defaultStats
}

// Save daily stats to file
function saveDailyStats(stats: DailyStats) {
  try {
    ensureDataDir()
    writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2))
  } catch (e) {
    console.error('Failed to save daily stats:', e)
  }
}

// Initialize from persisted data
let automationSettings: AutomationSettings = loadSettings()
let proposals: TradeProposal[] = []
let dailyStats: DailyStats = loadDailyStats()

// Reset daily stats if new day
function checkDailyReset() {
  const today = new Date().toISOString().split('T')[0]
  if (dailyStats.date !== today) {
    // Keep the peak value for continuous drawdown tracking, but reset daily stats
    const previousPeak = dailyStats.peakPortfolioValue
    dailyStats = {
      date: today,
      tradesCount: 0,
      totalPnL: 0,
      maxDrawdown: 0,
      peakPortfolioValue: previousPeak, // Preserve peak across days
      currentDrawdown: 0,
      trades: [],
    }
  }
}

// Update drawdown calculation based on current portfolio value
async function updateDrawdown(currentValue: number): Promise<void> {
  // Initialize peak if not set
  if (dailyStats.peakPortfolioValue === 0 || currentValue > dailyStats.peakPortfolioValue) {
    dailyStats.peakPortfolioValue = currentValue
    console.log(`📈 New peak portfolio value: $${currentValue.toFixed(2)}`)
  }

  // Calculate current drawdown from peak
  if (dailyStats.peakPortfolioValue > 0) {
    dailyStats.currentDrawdown = ((dailyStats.peakPortfolioValue - currentValue) / dailyStats.peakPortfolioValue) * 100

    // Track max drawdown
    if (dailyStats.currentDrawdown > dailyStats.maxDrawdown) {
      dailyStats.maxDrawdown = dailyStats.currentDrawdown
      console.log(`📉 New max drawdown: ${dailyStats.maxDrawdown.toFixed(2)}%`)
    }
  }

  saveDailyStats(dailyStats)
}

// Check if trading is allowed based on risk limits
async function checkRiskLimits(
  settings: AutomationSettings,
  order: { symbol: string; qty: number; side: 'buy' | 'sell'; estimatedValue: number }
): Promise<{ allowed: boolean; warnings: string[]; blocked: string[] }> {
  checkDailyReset()

  const warnings: string[] = []
  const blocked: string[] = []
  const limits = settings.riskLimits

  // Check if automation is enabled
  if (!settings.enabled) {
    blocked.push('Automation is disabled (kill switch)')
    return { allowed: false, warnings, blocked }
  }

  // Fetch real portfolio data from Alpaca
  const portfolio = await fetchAlpacaPortfolio()
  const portfolioValue = portfolio?.totalValue || 100000 // Fallback only if API fails
  const cashAvailable = portfolio?.cash || portfolioValue

  if (!portfolio) {
    warnings.push('Could not fetch portfolio - using fallback values')
  } else {
    // Update drawdown tracking with current portfolio value
    await updateDrawdown(portfolioValue)
  }

  // Check daily trade count
  if (dailyStats.tradesCount >= limits.maxDailyTrades) {
    blocked.push(`Daily trade limit reached (${limits.maxDailyTrades})`)
  }

  // Check daily loss against real portfolio value
  const maxLossAmount = (portfolioValue * limits.maxDailyLoss) / 100
  if (dailyStats.totalPnL < 0 && Math.abs(dailyStats.totalPnL) >= maxLossAmount) {
    blocked.push(`Daily loss limit reached (${limits.maxDailyLoss}% = $${maxLossAmount.toFixed(2)})`)
  }

  // Check max drawdown (peak-to-trough percentage)
  if (dailyStats.currentDrawdown >= limits.maxDrawdown) {
    blocked.push(`Max drawdown limit reached: ${dailyStats.currentDrawdown.toFixed(1)}% (limit: ${limits.maxDrawdown}%)`)
  } else if (dailyStats.currentDrawdown >= limits.maxDrawdown * 0.8) {
    // Warn when approaching drawdown limit (80% of max)
    warnings.push(`Approaching drawdown limit: ${dailyStats.currentDrawdown.toFixed(1)}% (limit: ${limits.maxDrawdown}%)`)
  }

  // Check order value
  if (order.estimatedValue > limits.maxOrderValue) {
    blocked.push(`Order value $${order.estimatedValue} exceeds limit $${limits.maxOrderValue}`)
  }

  // Check position size against portfolio
  const positionPercent = (order.estimatedValue / portfolioValue) * 100
  if (positionPercent > limits.maxPositionSize) {
    blocked.push(`Position size ${positionPercent.toFixed(1)}% exceeds limit ${limits.maxPositionSize}%`)
  }

  // Check concentration - total exposure to same ticker
  if (portfolio?.positions) {
    const existingPosition = portfolio.positions.find((p: any) => p.symbol === order.symbol)
    if (existingPosition) {
      const totalExposure = (existingPosition.marketValue || 0) + order.estimatedValue
      const totalPercent = (totalExposure / portfolioValue) * 100
      if (totalPercent > limits.maxPositionSize) {
        warnings.push(`Total ${order.symbol} exposure would be ${totalPercent.toFixed(1)}% (limit: ${limits.maxPositionSize}%)`)
      }
    }
  }

  // Check trading hours
  if (limits.tradingHoursOnly) {
    const now = new Date()
    const hour = now.getUTCHours()
    // NYSE hours: 14:30 - 21:00 UTC (9:30 AM - 4:00 PM ET)
    if (hour < 14 || hour >= 21 || (hour === 14 && now.getUTCMinutes() < 30)) {
      warnings.push('Outside regular trading hours')
    }
  }

  // Check cash reserve
  if (order.side === 'buy') {
    const cashAfterTrade = cashAvailable - order.estimatedValue
    const minCash = (portfolioValue * limits.minCashReserve) / 100
    if (cashAfterTrade < minCash) {
      blocked.push(`Would breach minimum cash reserve (${limits.minCashReserve}% = $${minCash.toFixed(2)})`)
    }
  }

  return {
    allowed: blocked.length === 0,
    warnings,
    blocked,
  }
}

// Process a trading signal
async function processSignal(
  signal: {
    ticker: string
    action: 'buy' | 'sell'
    confidence: number
    reasoning: string
    agent: string
    currentPrice: number
  },
  settings: AutomationSettings
): Promise<{ action: string; proposal?: TradeProposal; order?: any; error?: string; stopLossOrder?: any }> {
  // Check if signal passes filters
  if (signal.confidence < settings.signalFilters.minConfidence) {
    return { action: 'filtered', error: `Confidence ${signal.confidence}% below threshold ${settings.signalFilters.minConfidence}%` }
  }

  if (!settings.signalFilters.allowedAgents.includes(signal.agent)) {
    return { action: 'filtered', error: `Agent ${signal.agent} not in allowed list` }
  }

  if (!settings.signalFilters.allowedTickers.includes(signal.ticker)) {
    return { action: 'filtered', error: `Ticker ${signal.ticker} not in allowed list` }
  }

  // Calculate order size using Kelly Criterion / confidence-based sizing
  const portfolio = await fetchAlpacaPortfolio()
  const portfolioValue = portfolio?.totalValue || 100000

  // Get historical stats for Kelly calculation
  const stats = getTradeStats()
  const historicalWinRate = stats.winRate > 0 ? stats.winRate / 100 : 0.5 // Default 50% if no history

  // Kelly Criterion: f* = (p * b - q) / b
  // Simplified: use confidence as probability, assume 1:1 risk/reward
  const signalProbability = signal.confidence / 100
  const kellyFraction = Math.max(0, signalProbability - (1 - signalProbability)) // Simplified Kelly

  // Apply half-Kelly for safety (full Kelly is too aggressive)
  const halfKelly = kellyFraction / 2

  // Confidence-based position sizing tiers (more conservative approach)
  // Higher confidence = larger position, but capped at maxPositionSize
  let basePositionPercent: number
  if (signal.confidence >= 90) {
    basePositionPercent = 15 // 15% for very high confidence
  } else if (signal.confidence >= 80) {
    basePositionPercent = 10 // 10% for high confidence
  } else if (signal.confidence >= 70) {
    basePositionPercent = 5  // 5% for medium confidence
  } else {
    basePositionPercent = 2  // 2% for lower confidence
  }

  // Adjust based on historical performance
  const performanceMultiplier = historicalWinRate > 0.6 ? 1.2 : historicalWinRate > 0.4 ? 1.0 : 0.8

  // Final position size (capped at maxPositionSize from settings)
  const maxPositionPercent = settings.riskLimits.maxPositionSize
  const targetPercent = Math.min(basePositionPercent * performanceMultiplier, maxPositionPercent)

  // Calculate order value
  const orderValue = Math.floor((portfolioValue * targetPercent) / 100)
  const qty = Math.floor(orderValue / signal.currentPrice)

  console.log(`📊 Position Sizing: confidence=${signal.confidence}%, baseSize=${basePositionPercent}%, ` +
    `perfMultiplier=${performanceMultiplier.toFixed(2)}, targetSize=${targetPercent.toFixed(1)}%, ` +
    `orderValue=$${orderValue}, qty=${qty}`)

  if (qty < 1) {
    return { action: 'filtered', error: 'Calculated quantity is 0 (position too small)' }
  }

  const order = {
    symbol: signal.ticker,
    qty,
    side: signal.action,
    type: 'market' as const,
    estimatedValue: qty * signal.currentPrice,
  }

  // Check risk limits
  const riskCheck = await checkRiskLimits(settings, order)

  // Create proposal object
  const proposal: Omit<TradeProposal, 'id' | 'timestamp' | 'expiresAt'> = {
    agent: signal.agent,
    signal: {
      ticker: signal.ticker,
      action: signal.action,
      confidence: signal.confidence,
      reasoning: signal.reasoning,
    },
    order: {
      symbol: order.symbol,
      qty: order.qty,
      side: order.side,
      type: order.type,
    },
    status: 'pending',
    riskCheck: {
      passed: riskCheck.allowed,
      warnings: riskCheck.warnings,
      blocked: riskCheck.blocked,
    },
  }

  // Handle based on automation level
  switch (settings.level) {
    case 'manual': {
      // Just create alert
      addAlert({
        level: signal.action === 'buy' ? 'success' : 'warning',
        category: 'signal',
        title: `${signal.agent}: ${signal.action.toUpperCase()} ${signal.ticker}`,
        message: `${signal.reasoning} (Confidence: ${signal.confidence}%)`,
        agent: signal.agent,
      })
      return { action: 'alert_created' }
    }

    case 'semi-auto': {
      // Create proposal for approval
      const newProposal: TradeProposal = {
        ...proposal,
        id: `prop-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      }
      proposals.unshift(newProposal)

      // Also create alert
      addAlert({
        level: 'info',
        category: 'proposal',
        title: `Trade Proposal: ${signal.action.toUpperCase()} ${signal.ticker}`,
        message: `${signal.agent} proposes ${order.qty} shares. Awaiting approval.`,
        agent: signal.agent,
      })

      return { action: 'proposal_created', proposal: newProposal }
    }

    case 'full-auto': {
      // Check if risk allows
      if (!riskCheck.allowed) {
        addAlert({
          level: 'danger',
          category: 'risk',
          title: `Trade Blocked: ${signal.ticker}`,
          message: `Risk check failed: ${riskCheck.blocked.join(', ')}`,
          agent: 'TYCHE',
        })
        return { action: 'blocked', error: riskCheck.blocked.join(', ') }
      }

      // Execute trade
      if (!isAlpacaConfigured()) {
        return { action: 'error', error: 'Alpaca not configured' }
      }

      const result = await submitOrder({
        symbol: order.symbol,
        qty: order.qty,
        side: order.side,
        type: 'limit', // Extended hours requires limit orders
        time_in_force: 'day',
        limit_price: Math.round(signal.currentPrice * (order.side === 'buy' ? 1.01 : 0.99) * 100) / 100, // 1% buffer, rounded to cents
        extended_hours: true,
      })

      if (result.success) {
        // Record trade
        dailyStats.tradesCount++
        dailyStats.trades.push({
          timestamp: new Date().toISOString(),
          ticker: order.symbol,
          side: order.side,
          qty: order.qty,
          price: signal.currentPrice,
        })
        saveDailyStats(dailyStats) // Persist to file

        // Record trade in agent memory
        recordTrade({
          timestamp: new Date().toISOString(),
          ticker: order.symbol,
          action: order.side,
          qty: order.qty,
          price: signal.currentPrice,
          reason: signal.reasoning,
          agent: signal.agent,
        })

        // Add learning about the trade
        addLearning({
          agent: signal.agent,
          type: 'insight',
          content: `Executed ${order.side} ${order.qty} ${order.symbol} at $${signal.currentPrice} based on: ${signal.reasoning}`,
          context: {
            signal: signal.reasoning,
            trade: result.order?.id,
          },
          confidence: signal.confidence,
        })

        // Create stop loss order for BUY orders (protect the position)
        let stopLossOrder = null
        if (order.side === 'buy') {
          // Calculate stop loss at 10% below entry price
          const stopLossPercent = 10
          const stopLossPrice = Math.round(signal.currentPrice * (1 - stopLossPercent / 100) * 100) / 100

          console.log(`🛡️ Creating stop loss at $${stopLossPrice} (${stopLossPercent}% below entry)`)

          // Try trailing stop first (better for trending markets)
          const trailingResult = await submitTrailingStopOrder({
            symbol: order.symbol,
            qty: order.qty,
            trailPercent: stopLossPercent,
          })

          if (trailingResult.success) {
            stopLossOrder = trailingResult.order
            console.log(`✅ Trailing stop created: ${trailingResult.order?.id}`)
          } else {
            // Fallback to fixed stop loss
            console.log(`⚠️ Trailing stop failed, trying fixed stop loss: ${trailingResult.error}`)
            const fixedStopResult = await submitStopLossOrder({
              symbol: order.symbol,
              qty: order.qty,
              stopPrice: stopLossPrice,
            })

            if (fixedStopResult.success) {
              stopLossOrder = fixedStopResult.order
              console.log(`✅ Fixed stop loss created: ${fixedStopResult.order?.id}`)
            } else {
              console.error(`❌ Failed to create any stop loss: ${fixedStopResult.error}`)
              addAlert({
                level: 'warning',
                category: 'risk',
                title: `Stop Loss Failed: ${signal.ticker}`,
                message: `Position opened but stop loss could not be created. Manual intervention required.`,
                agent: 'TYCHE',
              })
            }
          }
        }

        // Trigger council discussion about the trade (async, don't wait)
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3200'
        fetch(`${baseUrl}/api/cron/council?trigger=trade&force=true`)
          .catch(e => console.error('Failed to trigger council discussion:', e))

        // Create alert
        const stopLossMsg = stopLossOrder ? ` Stop loss set.` : ''
        addAlert({
          level: 'success',
          category: 'execution',
          title: `Auto-Executed: ${signal.action.toUpperCase()} ${signal.ticker}`,
          message: `${order.qty} shares at $${signal.currentPrice}. Order ID: ${result.order?.id}.${stopLossMsg}`,
          agent: signal.agent,
        })

        return { action: 'executed', order: result.order, stopLossOrder }
      } else {
        addAlert({
          level: 'danger',
          category: 'error',
          title: `Execution Failed: ${signal.ticker}`,
          message: result.error || 'Unknown error',
          agent: signal.agent,
        })
        return { action: 'error', error: result.error }
      }
    }

    default:
      return { action: 'error', error: 'Unknown automation level' }
  }
}

// GET: Fetch settings, proposals, stats
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action') || 'settings'

  try {
    switch (action) {
      case 'settings':
        return NextResponse.json({
          success: true,
          data: automationSettings,
        })

      case 'proposals':
        // Filter out expired pending proposals
        const now = new Date().toISOString()
        const activeProposals = proposals.filter(
          p => p.status !== 'pending' || p.expiresAt > now
        )
        return NextResponse.json({
          success: true,
          data: activeProposals,
        })

      case 'stats':
        checkDailyReset()
        return NextResponse.json({
          success: true,
          data: dailyStats,
        })

      case 'status':
        checkDailyReset()
        return NextResponse.json({
          success: true,
          data: {
            settings: automationSettings,
            stats: dailyStats,
            pendingProposals: proposals.filter(p => p.status === 'pending').length,
            alpacaConfigured: isAlpacaConfigured(),
          },
        })

      default:
        return NextResponse.json(
          { success: false, error: 'Unknown action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Automation GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    )
  }
}

// POST: Update settings, process signals, approve/reject proposals
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...params } = body

    switch (action) {
      case 'update_settings': {
        const { settings } = params
        automationSettings = {
          ...automationSettings,
          ...settings,
          lastModified: new Date().toISOString(),
          modifiedBy: 'user',
        }
        saveSettings(automationSettings) // Persist to file
        return NextResponse.json({
          success: true,
          data: automationSettings,
        })
      }

      case 'process_signal': {
        const { signal } = params
        const result = await processSignal(signal, automationSettings)
        return NextResponse.json({
          success: true,
          data: result,
        })
      }

      case 'approve_proposal': {
        const { proposalId } = params
        const proposal = proposals.find(p => p.id === proposalId)

        if (!proposal) {
          return NextResponse.json(
            { success: false, error: 'Proposal not found' },
            { status: 404 }
          )
        }

        if (proposal.status !== 'pending') {
          return NextResponse.json(
            { success: false, error: `Proposal is ${proposal.status}` },
            { status: 400 }
          )
        }

        // Execute the trade
        if (!isAlpacaConfigured()) {
          return NextResponse.json(
            { success: false, error: 'Alpaca not configured' },
            { status: 400 }
          )
        }

        const result = await submitOrder({
          symbol: proposal.order.symbol,
          qty: proposal.order.qty,
          side: proposal.order.side,
          type: 'limit', // Extended hours requires limit orders
          time_in_force: 'day',
          limit_price: proposal.order.limitPrice || 35, // Use existing limit price or default
          extended_hours: true,
        })

        if (result.success) {
          proposal.status = 'executed'
          proposal.approvedAt = new Date().toISOString()
          proposal.approvedBy = 'user'
          proposal.executedAt = new Date().toISOString()
          proposal.orderId = result.order?.id

          // Record trade
          dailyStats.tradesCount++
          dailyStats.trades.push({
            timestamp: new Date().toISOString(),
            ticker: proposal.order.symbol,
            side: proposal.order.side,
            qty: proposal.order.qty,
            price: 0, // Will be filled by Alpaca
          })
          saveDailyStats(dailyStats) // Persist to file

          addAlert({
            level: 'success',
            category: 'execution',
            title: `Approved & Executed: ${proposal.order.side.toUpperCase()} ${proposal.order.symbol}`,
            message: `${proposal.order.qty} shares. Order ID: ${result.order?.id}`,
            agent: proposal.agent,
          })

          return NextResponse.json({
            success: true,
            data: { proposal, order: result.order },
          })
        } else {
          return NextResponse.json(
            { success: false, error: result.error },
            { status: 400 }
          )
        }
      }

      case 'reject_proposal': {
        const { proposalId, reason } = params
        const proposal = proposals.find(p => p.id === proposalId)

        if (!proposal) {
          return NextResponse.json(
            { success: false, error: 'Proposal not found' },
            { status: 404 }
          )
        }

        proposal.status = 'rejected'

        return NextResponse.json({
          success: true,
          data: proposal,
        })
      }

      case 'kill_switch': {
        automationSettings.enabled = false
        automationSettings.lastModified = new Date().toISOString()
        automationSettings.modifiedBy = 'kill_switch'
        saveSettings(automationSettings) // Persist to file

        addAlert({
          level: 'danger',
          category: 'system',
          title: 'KILL SWITCH ACTIVATED',
          message: 'All automated trading has been halted.',
          agent: 'SYSTEM',
        })

        return NextResponse.json({
          success: true,
          message: 'Kill switch activated',
        })
      }

      case 'reset_daily_stats': {
        dailyStats = {
          date: new Date().toISOString().split('T')[0],
          tradesCount: 0,
          totalPnL: 0,
          maxDrawdown: 0,
          peakPortfolioValue: 0, // Reset peak to recalculate
          currentDrawdown: 0,
          trades: [],
        }
        saveDailyStats(dailyStats)
        return NextResponse.json({
          success: true,
          data: dailyStats,
        })
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Automation POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    )
  }
}
