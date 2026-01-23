/**
 * Data Persistence Service
 * Stores portfolio and alert data in JSON files
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { sendNotification } from './notifications'

// Data directory
const DATA_DIR = join(process.cwd(), 'data')

// Ensure data directory exists
function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true })
  }
}

// Portfolio types
interface Position {
  id: string
  ticker: string
  name: string
  shares: number
  avgCost: number
  currentPrice: number
  marketValue: number
  unrealizedPnL: number
  unrealizedPnLPercent: number
  weight: number
  stopLoss?: number
  targetPrice?: number
  entryDate: string
  notes?: string
}

interface Portfolio {
  totalValue: number
  cash: number
  cashPercent: number
  positions: Position[]
  dailyPnL: number
  dailyPnLPercent: number
  weeklyPnL: number
  weeklyPnLPercent: number
  monthlyPnL: number
  monthlyPnLPercent: number
  updatedAt: string
}

interface Alert {
  id: string
  level: 'info' | 'warning' | 'danger' | 'success'
  category: string
  title: string
  message: string
  acknowledged: boolean
  agent: string
  timestamp: string
}

// Default portfolio
const defaultPortfolio: Portfolio = {
  totalValue: 10000,
  cash: 3000,
  cashPercent: 30,
  positions: [
    {
      id: 'pos-1',
      ticker: 'TMV',
      name: 'Direxion Daily 20+ Yr Trsy Bear 3X',
      shares: 50,
      avgCost: 42.00,
      currentPrice: 43.50,
      marketValue: 2175,
      unrealizedPnL: 75,
      unrealizedPnLPercent: 3.57,
      weight: 21.75,
      stopLoss: 38.00,
      targetPrice: 55.00,
      entryDate: '2026-01-15',
      notes: 'Core position for 30x thesis',
    },
    {
      id: 'pos-2',
      ticker: 'TBT',
      name: 'ProShares UltraShort 20+ Year Treasury',
      shares: 100,
      avgCost: 28.50,
      currentPrice: 29.25,
      marketValue: 2925,
      unrealizedPnL: 75,
      unrealizedPnLPercent: 2.63,
      weight: 29.25,
      stopLoss: 26.00,
      entryDate: '2026-01-10',
      notes: 'Secondary position',
    },
  ],
  dailyPnL: 150,
  dailyPnLPercent: 1.52,
  weeklyPnL: 320,
  weeklyPnLPercent: 3.31,
  monthlyPnL: -180,
  monthlyPnLPercent: -1.77,
  updatedAt: new Date().toISOString(),
}

// Default alerts
const defaultAlerts: Alert[] = [
  {
    id: 'alert-1',
    level: 'info',
    category: 'price',
    title: 'TMV approaching target',
    message: 'TMV is within 10% of first target at $48',
    acknowledged: false,
    agent: 'ARGUS',
    timestamp: new Date().toISOString(),
  },
]

// ============================================
// PORTFOLIO OPERATIONS
// ============================================

export function loadPortfolio(): Portfolio {
  ensureDataDir()
  const filePath = join(DATA_DIR, 'portfolio.json')

  try {
    if (existsSync(filePath)) {
      const data = readFileSync(filePath, 'utf-8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Error loading portfolio:', error)
  }

  // Save and return default
  savePortfolio(defaultPortfolio)
  return defaultPortfolio
}

export function savePortfolio(portfolio: Portfolio): void {
  ensureDataDir()
  const filePath = join(DATA_DIR, 'portfolio.json')

  try {
    portfolio.updatedAt = new Date().toISOString()
    writeFileSync(filePath, JSON.stringify(portfolio, null, 2))
  } catch (error) {
    console.error('Error saving portfolio:', error)
  }
}

export function updatePositionPrice(ticker: string, price: number): Portfolio {
  const portfolio = loadPortfolio()

  const position = portfolio.positions.find(p => p.ticker === ticker)
  if (position) {
    position.currentPrice = price
    position.marketValue = position.shares * price
    position.unrealizedPnL = position.marketValue - (position.shares * position.avgCost)
    position.unrealizedPnLPercent = (position.unrealizedPnL / (position.shares * position.avgCost)) * 100

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

  return portfolio
}

export function addPosition(position: Omit<Position, 'id' | 'marketValue' | 'unrealizedPnL' | 'unrealizedPnLPercent' | 'weight'>): Portfolio {
  const portfolio = loadPortfolio()

  const newPosition: Position = {
    ...position,
    id: `pos-${Date.now()}`,
    marketValue: position.shares * position.currentPrice,
    unrealizedPnL: (position.currentPrice - position.avgCost) * position.shares,
    unrealizedPnLPercent: ((position.currentPrice - position.avgCost) / position.avgCost) * 100,
    weight: 0, // Will be calculated
  }

  // Deduct from cash
  const cost = position.shares * position.avgCost
  portfolio.cash -= cost

  portfolio.positions.push(newPosition)

  // Recalculate totals
  const totalInvested = portfolio.positions.reduce((sum, p) => sum + p.marketValue, 0)
  portfolio.totalValue = totalInvested + portfolio.cash
  portfolio.cashPercent = (portfolio.cash / portfolio.totalValue) * 100

  // Update weights
  portfolio.positions.forEach(p => {
    p.weight = (p.marketValue / portfolio.totalValue) * 100
  })

  savePortfolio(portfolio)
  return portfolio
}

export function removePosition(positionId: string): Portfolio {
  const portfolio = loadPortfolio()

  const position = portfolio.positions.find(p => p.id === positionId)
  if (position) {
    // Add back to cash (at current price)
    portfolio.cash += position.marketValue
    portfolio.positions = portfolio.positions.filter(p => p.id !== positionId)

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

  return portfolio
}

// ============================================
// ALERT OPERATIONS
// ============================================

export function loadAlerts(): Alert[] {
  ensureDataDir()
  const filePath = join(DATA_DIR, 'alerts.json')

  try {
    if (existsSync(filePath)) {
      const data = readFileSync(filePath, 'utf-8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Error loading alerts:', error)
  }

  // Save and return default
  saveAlerts(defaultAlerts)
  return defaultAlerts
}

export function saveAlerts(alerts: Alert[]): void {
  ensureDataDir()
  const filePath = join(DATA_DIR, 'alerts.json')

  try {
    writeFileSync(filePath, JSON.stringify(alerts, null, 2))
  } catch (error) {
    console.error('Error saving alerts:', error)
  }
}

export function addAlert(alert: Omit<Alert, 'id' | 'timestamp' | 'acknowledged'>): Alert {
  const alerts = loadAlerts()

  const newAlert: Alert = {
    ...alert,
    id: `alert-${Date.now()}`,
    acknowledged: false,
    timestamp: new Date().toISOString(),
  }

  alerts.unshift(newAlert)

  // Keep only last 100 alerts
  if (alerts.length > 100) {
    alerts.splice(100)
  }

  saveAlerts(alerts)

  // Send real-time notification (async, don't block)
  sendNotification(newAlert).catch(err => {
    console.error('Failed to send notification:', err)
  })

  return newAlert
}

export function acknowledgeAlert(alertId: string): boolean {
  const alerts = loadAlerts()
  const alert = alerts.find(a => a.id === alertId)

  if (alert) {
    alert.acknowledged = true
    saveAlerts(alerts)
    return true
  }

  return false
}

export function clearAlert(alertId: string): boolean {
  const alerts = loadAlerts()
  const index = alerts.findIndex(a => a.id === alertId)

  if (index >= 0) {
    alerts.splice(index, 1)
    saveAlerts(alerts)
    return true
  }

  return false
}

// ============================================
// PRICE HISTORY (for charts)
// ============================================

interface PricePoint {
  timestamp: string
  price: number
}

export function savePriceHistory(ticker: string, price: number): void {
  ensureDataDir()
  const filePath = join(DATA_DIR, `prices_${ticker}.json`)

  let history: PricePoint[] = []

  try {
    if (existsSync(filePath)) {
      history = JSON.parse(readFileSync(filePath, 'utf-8'))
    }
  } catch (error) {
    // Start fresh
  }

  history.push({
    timestamp: new Date().toISOString(),
    price,
  })

  // Keep only last 1000 points
  if (history.length > 1000) {
    history = history.slice(-1000)
  }

  writeFileSync(filePath, JSON.stringify(history))
}

export function loadPriceHistory(ticker: string): PricePoint[] {
  ensureDataDir()
  const filePath = join(DATA_DIR, `prices_${ticker}.json`)

  try {
    if (existsSync(filePath)) {
      return JSON.parse(readFileSync(filePath, 'utf-8'))
    }
  } catch (error) {
    console.error(`Error loading price history for ${ticker}:`, error)
  }

  return []
}

export type { Portfolio, Position, Alert, PricePoint }
