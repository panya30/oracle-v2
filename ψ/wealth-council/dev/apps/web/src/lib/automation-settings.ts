/**
 * Trading Automation Settings
 *
 * Three automation levels:
 * - manual: Alerts only, user executes all trades
 * - semi-auto: Agents propose trades, user approves with 1-click
 * - full-auto: Agents execute trades automatically with safety guards
 */

export type AutomationLevel = 'manual' | 'semi-auto' | 'full-auto'

export interface RiskLimits {
  // Position limits
  maxPositionSize: number          // Max % of portfolio per position (default: 25%)
  maxDailyTrades: number           // Max trades per day (default: 10)
  maxDailyLoss: number             // Max daily loss % before halt (default: 5%)
  maxDrawdown: number              // Max total drawdown % before halt (default: 15%)

  // Order limits
  maxOrderValue: number            // Max single order value $ (default: 10000)
  minCashReserve: number           // Min cash % to keep (default: 20%)

  // Time limits
  tradingHoursOnly: boolean        // Only trade during market hours (default: true)
  noTradingBeforeFOMC: number      // Hours before FOMC to stop trading (default: 24)
}

export interface AutomationSettings {
  // Core setting
  level: AutomationLevel
  enabled: boolean                 // Master kill switch

  // Risk limits
  riskLimits: RiskLimits

  // Signal filters
  signalFilters: {
    minConfidence: number          // Min signal confidence 0-100 (default: 70)
    allowedAgents: string[]        // Which agents can trigger trades
    allowedTickers: string[]       // Which tickers can be traded
    requireMultipleAgents: boolean // Require 2+ agents to agree (default: false)
  }

  // Notifications
  notifications: {
    onProposal: boolean            // Notify on trade proposal
    onExecution: boolean           // Notify on trade execution
    onRiskLimit: boolean           // Notify when risk limit hit
    onError: boolean               // Notify on errors
  }

  // Audit
  lastModified: string
  modifiedBy: string
}

export interface TradeProposal {
  id: string
  timestamp: string
  agent: string                    // Which agent proposed
  signal: {
    ticker: string
    action: 'buy' | 'sell'
    confidence: number
    reasoning: string
  }
  order: {
    symbol: string
    qty: number
    side: 'buy' | 'sell'
    type: 'market' | 'limit'
    limitPrice?: number
  }
  status: 'pending' | 'approved' | 'rejected' | 'executed' | 'expired'
  riskCheck: {
    passed: boolean
    warnings: string[]
    blocked: string[]
  }
  approvedAt?: string
  approvedBy?: string
  executedAt?: string
  orderId?: string
  expiresAt: string
}

// Default settings
export const DEFAULT_SETTINGS: AutomationSettings = {
  level: 'manual',
  enabled: true,

  riskLimits: {
    maxPositionSize: 25,
    maxDailyTrades: 10,
    maxDailyLoss: 5,
    maxDrawdown: 15,
    maxOrderValue: 10000,
    minCashReserve: 20,
    tradingHoursOnly: true,
    noTradingBeforeFOMC: 24,
  },

  signalFilters: {
    minConfidence: 70,
    allowedAgents: ['DELPHI', 'ATHENA'],
    allowedTickers: ['TMV', 'TBT', 'TBF', 'TLT'],
    requireMultipleAgents: false,
  },

  notifications: {
    onProposal: true,
    onExecution: true,
    onRiskLimit: true,
    onError: true,
  },

  lastModified: new Date().toISOString(),
  modifiedBy: 'system',
}

// Storage key
const SETTINGS_KEY = 'wealth-council-automation'
const PROPOSALS_KEY = 'wealth-council-proposals'
const DAILY_STATS_KEY = 'wealth-council-daily-stats'

// Daily trading stats for risk tracking
export interface DailyStats {
  date: string
  tradesCount: number
  totalPnL: number
  maxDrawdown: number        // Max drawdown % from peak (peak-to-trough)
  peakPortfolioValue: number // Track the peak portfolio value for drawdown calc
  currentDrawdown: number    // Current drawdown % from peak
  trades: {
    timestamp: string
    ticker: string
    side: string
    qty: number
    price: number
    pnl?: number
  }[]
}

// Load settings from localStorage
export function loadAutomationSettings(): AutomationSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS

  try {
    const stored = localStorage.getItem(SETTINGS_KEY)
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }
    }
  } catch (e) {
    console.error('Failed to load automation settings:', e)
  }

  return DEFAULT_SETTINGS
}

// Save settings to localStorage
export function saveAutomationSettings(settings: AutomationSettings): void {
  if (typeof window === 'undefined') return

  try {
    settings.lastModified = new Date().toISOString()
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch (e) {
    console.error('Failed to save automation settings:', e)
  }
}

// Load trade proposals
export function loadProposals(): TradeProposal[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = localStorage.getItem(PROPOSALS_KEY)
    if (stored) {
      const proposals = JSON.parse(stored) as TradeProposal[]
      // Filter out expired proposals
      const now = new Date().toISOString()
      return proposals.filter(p => p.expiresAt > now || p.status !== 'pending')
    }
  } catch (e) {
    console.error('Failed to load proposals:', e)
  }

  return []
}

// Save trade proposals
export function saveProposals(proposals: TradeProposal[]): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(PROPOSALS_KEY, JSON.stringify(proposals))
  } catch (e) {
    console.error('Failed to save proposals:', e)
  }
}

// Add new proposal
export function addProposal(proposal: Omit<TradeProposal, 'id' | 'timestamp' | 'expiresAt'>): TradeProposal {
  const proposals = loadProposals()

  const newProposal: TradeProposal = {
    ...proposal,
    id: `prop-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min expiry
  }

  proposals.unshift(newProposal)
  saveProposals(proposals)

  return newProposal
}

// Update proposal status
export function updateProposal(id: string, updates: Partial<TradeProposal>): TradeProposal | null {
  const proposals = loadProposals()
  const index = proposals.findIndex(p => p.id === id)

  if (index === -1) return null

  proposals[index] = { ...proposals[index], ...updates }
  saveProposals(proposals)

  return proposals[index]
}

// Load daily stats
export function loadDailyStats(): DailyStats {
  const defaultStats: DailyStats = {
    date: new Date().toISOString().split('T')[0],
    tradesCount: 0,
    totalPnL: 0,
    maxDrawdown: 0,
    peakPortfolioValue: 0,
    currentDrawdown: 0,
    trades: [],
  }

  if (typeof window === 'undefined') {
    return defaultStats
  }

  try {
    const stored = localStorage.getItem(DAILY_STATS_KEY)
    if (stored) {
      const stats = JSON.parse(stored) as DailyStats
      const today = new Date().toISOString().split('T')[0]

      // Reset if new day, but preserve peak value
      if (stats.date !== today) {
        return {
          ...defaultStats,
          date: today,
          peakPortfolioValue: stats.peakPortfolioValue || 0, // Preserve peak
        }
      }

      return { ...defaultStats, ...stats }
    }
  } catch (e) {
    console.error('Failed to load daily stats:', e)
  }

  return defaultStats
}

// Save daily stats
export function saveDailyStats(stats: DailyStats): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(DAILY_STATS_KEY, JSON.stringify(stats))
  } catch (e) {
    console.error('Failed to save daily stats:', e)
  }
}

// Record a trade
export function recordTrade(trade: DailyStats['trades'][0]): void {
  const stats = loadDailyStats()
  stats.tradesCount++
  stats.trades.push(trade)
  if (trade.pnl) {
    stats.totalPnL += trade.pnl
    if (stats.totalPnL < 0 && Math.abs(stats.totalPnL) > stats.maxDrawdown) {
      stats.maxDrawdown = Math.abs(stats.totalPnL)
    }
  }
  saveDailyStats(stats)
}
