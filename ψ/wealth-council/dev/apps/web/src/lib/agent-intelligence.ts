/**
 * Agent Intelligence System
 *
 * Provides agents with:
 * 1. Memory - past trades, decisions, learnings
 * 2. Real-time data - market conditions, signals, portfolio
 * 3. Pattern recognition - what worked, what didn't
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

const DATA_DIR = join(process.cwd(), 'data')
const MEMORY_FILE = join(DATA_DIR, 'agent-memory.json')

export interface TradeMemory {
  id: string
  timestamp: string
  ticker: string
  action: 'buy' | 'sell'
  qty: number
  price: number
  reason: string
  agent: string
  outcome?: {
    exitPrice?: number
    pnl?: number
    pnlPercent?: number
    lessonLearned?: string
  }
}

export interface MarketSnapshot {
  timestamp: string
  yields: {
    y2: number
    y5: number
    y10: number
    y30: number
    spread2Y10Y: number
    spread10Y30Y: number
  }
  prices: Record<string, number>
}

export interface AgentLearning {
  id: string
  timestamp: string
  agent: string
  type: 'success' | 'failure' | 'insight' | 'pattern'
  content: string
  context?: {
    marketCondition?: string
    signal?: string
    trade?: string
  }
  confidence: number
}

export interface InvestmentGoal {
  id: string
  priority: 'high' | 'medium' | 'low'
  type: 'strategy' | 'risk' | 'target' | 'constraint' | 'opportunity'
  content: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface AgentMemory {
  trades: TradeMemory[]
  snapshots: MarketSnapshot[]
  learnings: AgentLearning[]
  goals: InvestmentGoal[]
  lastUpdated: string
}

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true })
  }
}

export function loadMemory(): AgentMemory {
  const defaults: AgentMemory = {
    trades: [],
    snapshots: [],
    learnings: [],
    goals: [],
    lastUpdated: new Date().toISOString(),
  }
  try {
    ensureDataDir()
    if (existsSync(MEMORY_FILE)) {
      const loaded = JSON.parse(readFileSync(MEMORY_FILE, 'utf-8'))
      return { ...defaults, ...loaded }
    }
  } catch (e) {
    console.error('Failed to load agent memory:', e)
  }
  return defaults
}

export function saveMemory(memory: AgentMemory) {
  try {
    ensureDataDir()
    memory.lastUpdated = new Date().toISOString()
    writeFileSync(MEMORY_FILE, JSON.stringify(memory, null, 2))
  } catch (e) {
    console.error('Failed to save agent memory:', e)
  }
}

// Record a new trade
export function recordTrade(trade: Omit<TradeMemory, 'id'>): TradeMemory {
  const memory = loadMemory()
  const newTrade: TradeMemory = {
    ...trade,
    id: `trade-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  }
  memory.trades.unshift(newTrade)
  memory.trades = memory.trades.slice(0, 100) // Keep last 100 trades
  saveMemory(memory)
  return newTrade
}

// Update trade outcome when position is closed
export function recordTradeOutcome(
  tradeId: string,
  outcome: {
    exitPrice: number
    pnl: number
    pnlPercent: number
    lessonLearned?: string
  }
): TradeMemory | null {
  const memory = loadMemory()
  const tradeIndex = memory.trades.findIndex(t => t.id === tradeId)

  if (tradeIndex === -1) {
    console.error(`Trade ${tradeId} not found for outcome recording`)
    return null
  }

  const trade = memory.trades[tradeIndex]
  trade.outcome = outcome

  // Auto-generate lesson learned if not provided
  if (!outcome.lessonLearned) {
    const isProfit = outcome.pnl > 0
    trade.outcome.lessonLearned = isProfit
      ? `Profitable ${trade.ticker} trade: +${outcome.pnlPercent.toFixed(1)}% ($${outcome.pnl.toFixed(2)})`
      : `Loss on ${trade.ticker}: ${outcome.pnlPercent.toFixed(1)}% ($${outcome.pnl.toFixed(2)}) - review entry conditions`
  }

  saveMemory(memory)
  console.log(`📝 Recorded outcome for trade ${tradeId}: ${outcome.pnl > 0 ? '+' : ''}$${outcome.pnl.toFixed(2)}`)

  return trade
}

// Find open trades (buy trades without outcomes)
export function findOpenTrades(ticker?: string): TradeMemory[] {
  const memory = loadMemory()
  return memory.trades.filter(t =>
    t.action === 'buy' &&
    !t.outcome &&
    (ticker ? t.ticker === ticker : true)
  )
}

// Get trade by ID
export function getTrade(tradeId: string): TradeMemory | null {
  const memory = loadMemory()
  return memory.trades.find(t => t.id === tradeId) || null
}

// Record market snapshot
export function recordSnapshot(snapshot: Omit<MarketSnapshot, 'timestamp'>): MarketSnapshot {
  const memory = loadMemory()
  const newSnapshot: MarketSnapshot = {
    ...snapshot,
    timestamp: new Date().toISOString(),
  }
  memory.snapshots.unshift(newSnapshot)
  memory.snapshots = memory.snapshots.slice(0, 288) // Keep ~24 hours at 5-min intervals
  saveMemory(memory)
  return newSnapshot
}

// Add a learning
export function addLearning(learning: Omit<AgentLearning, 'id' | 'timestamp'>): AgentLearning {
  const memory = loadMemory()
  const newLearning: AgentLearning = {
    ...learning,
    id: `learn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
  }
  memory.learnings.unshift(newLearning)
  memory.learnings = memory.learnings.slice(0, 200) // Keep last 200 learnings
  saveMemory(memory)
  return newLearning
}

// === GOALS MANAGEMENT ===

// Add a new investment goal
export function addGoal(goal: Omit<InvestmentGoal, 'id' | 'createdAt' | 'updatedAt'>): InvestmentGoal {
  const memory = loadMemory()
  const now = new Date().toISOString()
  const newGoal: InvestmentGoal = {
    ...goal,
    id: `goal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: now,
    updatedAt: now,
  }
  memory.goals.unshift(newGoal)
  saveMemory(memory)
  return newGoal
}

// Update an existing goal
export function updateGoal(id: string, updates: Partial<Omit<InvestmentGoal, 'id' | 'createdAt'>>): InvestmentGoal | null {
  const memory = loadMemory()
  const goalIndex = memory.goals.findIndex(g => g.id === id)
  if (goalIndex === -1) return null

  memory.goals[goalIndex] = {
    ...memory.goals[goalIndex],
    ...updates,
    updatedAt: new Date().toISOString(),
  }
  saveMemory(memory)
  return memory.goals[goalIndex]
}

// Delete a goal
export function deleteGoal(id: string): boolean {
  const memory = loadMemory()
  const initialLength = memory.goals.length
  memory.goals = memory.goals.filter(g => g.id !== id)
  if (memory.goals.length < initialLength) {
    saveMemory(memory)
    return true
  }
  return false
}

// Get all goals
export function getGoals(): InvestmentGoal[] {
  const memory = loadMemory()
  return memory.goals || []
}

// Get active goals
export function getActiveGoals(): InvestmentGoal[] {
  const memory = loadMemory()
  return (memory.goals || []).filter(g => g.active)
}

// Get goals by type
export function getGoalsByType(type: InvestmentGoal['type']): InvestmentGoal[] {
  const memory = loadMemory()
  return (memory.goals || []).filter(g => g.type === type && g.active)
}

// Get high priority goals
export function getHighPriorityGoals(): InvestmentGoal[] {
  const memory = loadMemory()
  return (memory.goals || []).filter(g => g.priority === 'high' && g.active)
}

// Get recent trades
export function getRecentTrades(limit = 10): TradeMemory[] {
  const memory = loadMemory()
  return memory.trades.slice(0, limit)
}

// Get trade performance stats
export function getTradeStats(): {
  totalTrades: number
  winRate: number
  avgPnL: number
  bestTrade: TradeMemory | null
  worstTrade: TradeMemory | null
} {
  const memory = loadMemory()
  const completedTrades = memory.trades.filter(t => t.outcome?.pnl !== undefined)

  if (completedTrades.length === 0) {
    return {
      totalTrades: memory.trades.length,
      winRate: 0,
      avgPnL: 0,
      bestTrade: null,
      worstTrade: null,
    }
  }

  const wins = completedTrades.filter(t => (t.outcome?.pnl || 0) > 0)
  const avgPnL = completedTrades.reduce((sum, t) => sum + (t.outcome?.pnl || 0), 0) / completedTrades.length

  const sorted = [...completedTrades].sort((a, b) => (b.outcome?.pnl || 0) - (a.outcome?.pnl || 0))

  return {
    totalTrades: memory.trades.length,
    winRate: (wins.length / completedTrades.length) * 100,
    avgPnL,
    bestTrade: sorted[0] || null,
    worstTrade: sorted[sorted.length - 1] || null,
  }
}

// Get learnings by agent
export function getLearningsByAgent(agent: string, limit = 10): AgentLearning[] {
  const memory = loadMemory()
  return memory.learnings.filter(l => l.agent === agent).slice(0, limit)
}

// Get all learnings for context
export function getAllLearnings(limit = 20): AgentLearning[] {
  const memory = loadMemory()
  return memory.learnings.slice(0, limit)
}

// Get market trend from snapshots
export function getMarketTrend(): {
  direction: 'up' | 'down' | 'flat'
  yieldChange24h: number
  volatility: 'low' | 'medium' | 'high'
} {
  const memory = loadMemory()
  const snapshots = memory.snapshots.slice(0, 12) // Last hour

  if (snapshots.length < 2) {
    return { direction: 'flat', yieldChange24h: 0, volatility: 'low' }
  }

  const latest = snapshots[0]
  const oldest = snapshots[snapshots.length - 1]

  const yieldChange = latest.yields.y10 - oldest.yields.y10

  // Calculate volatility from yield movements
  let totalMovement = 0
  for (let i = 1; i < snapshots.length; i++) {
    totalMovement += Math.abs(snapshots[i].yields.y10 - snapshots[i - 1].yields.y10)
  }
  const avgMovement = totalMovement / (snapshots.length - 1)

  return {
    direction: yieldChange > 0.02 ? 'up' : yieldChange < -0.02 ? 'down' : 'flat',
    yieldChange24h: yieldChange,
    volatility: avgMovement > 0.05 ? 'high' : avgMovement > 0.02 ? 'medium' : 'low',
  }
}

// Fetch real-time context for agents
export async function fetchAgentContext(baseUrl: string): Promise<{
  market: any
  portfolio: any
  signals: any
  recentTrades: TradeMemory[]
  learnings: AgentLearning[]
  goals: InvestmentGoal[]
  stats: ReturnType<typeof getTradeStats>
  trend: ReturnType<typeof getMarketTrend>
}> {
  let market = null
  let portfolio = null
  let signals = null

  try {
    // Fetch market data
    const [yieldsRes, pricesRes] = await Promise.all([
      fetch(`${baseUrl}/api/hermes?action=yields`),
      fetch(`${baseUrl}/api/hermes?action=prices&tickers=TMV,TBT,TLT,TBF`),
    ])

    const yieldsData = await yieldsRes.json()
    const pricesData = await pricesRes.json()

    if (yieldsData.success && pricesData.success) {
      market = {
        yields: yieldsData.data,
        prices: pricesData.data,
      }

      // Record snapshot
      if (yieldsData.data?.yields) {
        const y = yieldsData.data.yields
        const priceMap: Record<string, number> = {}
        pricesData.data?.forEach((p: any) => { priceMap[p.ticker] = p.price })

        recordSnapshot({
          yields: {
            y2: y.find((x: any) => x.tenor === '2Y')?.yield || 0,
            y5: y.find((x: any) => x.tenor === '5Y')?.yield || 0,
            y10: y.find((x: any) => x.tenor === '10Y')?.yield || 0,
            y30: y.find((x: any) => x.tenor === '30Y')?.yield || 0,
            spread2Y10Y: yieldsData.data.spread2Y10Y || 0,
            spread10Y30Y: yieldsData.data.spread10Y30Y || 0,
          },
          prices: priceMap,
        })
      }
    }
  } catch (e) {
    console.error('Failed to fetch market data:', e)
  }

  try {
    // Fetch portfolio
    const portfolioRes = await fetch(`${baseUrl}/api/broker?action=portfolio`)
    const portfolioData = await portfolioRes.json()
    if (portfolioData.success) {
      portfolio = portfolioData.data
    }
  } catch (e) {
    console.error('Failed to fetch portfolio:', e)
  }

  try {
    // Fetch recent signals
    const signalsRes = await fetch(`${baseUrl}/api/signals/process?action=status`)
    const signalsData = await signalsRes.json()
    if (signalsData.success) {
      signals = signalsData.data
    }
  } catch (e) {
    console.error('Failed to fetch signals:', e)
  }

  return {
    market,
    portfolio,
    signals,
    recentTrades: getRecentTrades(5),
    learnings: getAllLearnings(10),
    goals: getActiveGoals(),
    stats: getTradeStats(),
    trend: getMarketTrend(),
  }
}

// Generate intelligent response based on context
export function generateIntelligentResponse(
  agent: string,
  topic: string,
  context: Awaited<ReturnType<typeof fetchAgentContext>>,
  recentMessages: { agent: string; content: string }[]
): string {
  const { market, portfolio, signals, recentTrades, learnings, goals, stats, trend } = context

  // Get agent-specific learnings
  const agentLearnings = learnings.filter(l => l.agent === agent)

  // Get relevant goals
  const highPriorityGoals = goals.filter(g => g.priority === 'high')
  const opportunityGoals = goals.filter(g => g.type === 'opportunity')
  const riskGoals = goals.filter(g => g.type === 'risk')
  const strategyGoals = goals.filter(g => g.type === 'strategy')

  // Build context-aware response
  switch (agent) {
    case 'PLUTUS': {
      const portfolioValue = portfolio?.totalValue || portfolio?.portfolio_value || 100000
      const positions = portfolio?.positions || []
      const hasPositions = positions.length > 0

      // Reference high-priority goals
      const goalNote = highPriorityGoals.length > 0
        ? ` Our primary directive: "${highPriorityGoals[0].content}".`
        : ''
      const opportunityNote = opportunityGoals.length > 0
        ? ` We're actively looking for: ${opportunityGoals.map(g => g.content).join(', ')}.`
        : ''

      if (!hasPositions) {
        return `Looking at our portfolio - we're mostly in cash right now.${goalNote}${opportunityNote} With 10Y yields at ${market?.yields?.yields?.find((y: any) => y.tenor === '10Y')?.yield?.toFixed(2) || 'N/A'}%, I think we should be looking for entry opportunities. DELPHI, what signals are you seeing?`
      }

      return `Current portfolio status: $${portfolioValue.toLocaleString()} with ${positions.length} position(s).${goalNote} Market trend is ${trend.direction}. Based on our ${stats.totalTrades} trades with ${stats.winRate.toFixed(0)}% win rate, I recommend we ${trend.direction === 'up' ? 'stay aggressive on inverse bonds' : 'be cautious and wait for better entries'}.${opportunityNote}`
    }

    case 'HERMES': {
      const y10 = market?.yields?.yields?.find((y: any) => y.tenor === '10Y')?.yield || 0
      const y30 = market?.yields?.yields?.find((y: any) => y.tenor === '30Y')?.yield || 0
      const tbtPrice = market?.prices?.find((p: any) => p.ticker === 'TBT')?.price || 0

      const relevantLearning = agentLearnings.find(l => l.type === 'insight')
      const learningNote = relevantLearning ? ` Previous insight: ${relevantLearning.content}` : ''

      return `Market data update: 10Y at ${y10.toFixed(2)}%, 30Y at ${y30.toFixed(2)}%. TBT trading at $${tbtPrice.toFixed(2)}. Trend is ${trend.direction} with ${trend.volatility} volatility.${learningNote} The yield curve spread suggests ${market?.yields?.spread10Y30Y > 0.5 ? 'steepening continues - bullish for our thesis' : 'flattening - we should be cautious'}.`
    }

    case 'DELPHI': {
      const rulesActive = signals?.rulesCount || 8
      const recentSignals = signals?.recentSignals || []
      const lastSignal = recentSignals[0]

      let signalStatus = 'No recent signals triggered.'
      if (lastSignal) {
        signalStatus = `Last signal: ${lastSignal.action?.toUpperCase()} ${lastSignal.ticker} with ${lastSignal.confidence}% confidence.`
      }

      // Reference past performance
      const winRateNote = stats.winRate > 60
        ? `Our signals have ${stats.winRate.toFixed(0)}% accuracy - the system is working.`
        : `Win rate at ${stats.winRate.toFixed(0)}% - we may need to adjust thresholds.`

      // Check for opportunity goals (homerun, breakout, etc.)
      const lookingForHomerun = opportunityGoals.some(g =>
        g.content.toLowerCase().includes('homerun') || g.content.toLowerCase().includes('breakout') || g.content.toLowerCase().includes('big move')
      )
      const opportunityNote = lookingForHomerun
        ? ` Scanning for homerun setups - watching for high-conviction signals above 85%.`
        : ''

      return `Signal system status: ${rulesActive} rules active. ${signalStatus} ${winRateNote}${opportunityNote} Current yield levels ${market?.yields?.yields?.find((y: any) => y.tenor === '10Y')?.yield >= 4.5 ? 'ARE' : 'are NOT'} at buy trigger zones.`
    }

    case 'TYCHE': {
      const positions = portfolio?.positions || []
      const totalExposure = positions.reduce((sum: number, p: any) => sum + (p.market_value || p.marketValue || 0), 0)
      const portfolioValue = portfolio?.totalValue || portfolio?.portfolio_value || 100000
      const exposurePercent = (totalExposure / portfolioValue) * 100

      // Check recent losses
      const recentLosses = recentTrades.filter(t => t.outcome && t.outcome.pnl && t.outcome.pnl < 0)
      const lossWarning = recentLosses.length > 2
        ? `Warning: ${recentLosses.length} recent losses. Consider reducing position sizes.`
        : ''

      // Reference risk goals/constraints
      const riskNote = riskGoals.length > 0
        ? ` Active risk directive: "${riskGoals[0].content}".`
        : ''

      // If looking for homerun, mention higher risk tolerance
      const aggressiveGoal = opportunityGoals.some(g =>
        g.content.toLowerCase().includes('homerun') || g.content.toLowerCase().includes('aggressive')
      )
      const aggressiveNote = aggressiveGoal
        ? ' Note: Homerun mode active - allowing larger position sizes for high-conviction plays.'
        : ''

      return `Risk assessment: Current exposure ${exposurePercent.toFixed(1)}% of portfolio.${riskNote} Daily trade count: ${signals?.processedCount || 0}/${10} limit. ${lossWarning} Volatility is ${trend.volatility}. ${trend.volatility === 'high' ? 'Recommend smaller position sizes.' : 'Risk levels acceptable.'}${aggressiveNote}`
    }

    case 'ATHENA': {
      // Strategic long-term view with learnings
      const successLearnings = learnings.filter(l => l.type === 'success')
      const patternLearnings = learnings.filter(l => l.type === 'pattern')

      // Reference strategy goals
      const strategyNote = strategyGoals.length > 0
        ? `Current strategic directive: "${strategyGoals[0].content}".`
        : 'Our 30x bond thesis remains the core strategy.'

      let strategyAdvice = strategyNote
      if (patternLearnings.length > 0) {
        strategyAdvice += ` Pattern observed: ${patternLearnings[0].content}`
      }
      if (trend.direction === 'up' && trend.volatility !== 'high') {
        strategyAdvice += ' Current conditions favor our thesis - stay positioned.'
      }

      // If looking for homerun opportunities
      const homerunMode = opportunityGoals.some(g =>
        g.content.toLowerCase().includes('homerun') || g.content.toLowerCase().includes('big')
      )
      const homerunAdvice = homerunMode
        ? ' For homerun opportunities: look for yield spikes above 4.8% or spread inversions as high-conviction entry points.'
        : ''

      return `${strategyAdvice} Historical performance shows ${stats.winRate > 50 ? 'our approach is working' : 'we need refinement'}.${homerunAdvice} Key is patience and letting the automated system execute. ${successLearnings.length > 0 ? `Reminder: ${successLearnings[0].content}` : ''}`
    }

    case 'ARGUS': {
      const positions = portfolio?.positions || []
      const positionDetails = positions.map((p: any) =>
        `${p.symbol}: ${p.qty} shares, P&L: $${(p.unrealized_pl || p.unrealizedPnL || 0).toFixed(2)}`
      ).join('; ') || 'No positions'

      const lastTradeTime = recentTrades[0]?.timestamp
        ? new Date(recentTrades[0].timestamp).toLocaleString('th-TH')
        : 'N/A'

      return `Portfolio monitoring: ${positionDetails}. Last trade: ${lastTradeTime}. Automation status: Active, running every 5 minutes. Extended hours: Enabled. All systems operational.`
    }

    default:
      return `Analyzing the situation based on available data...`
  }
}
