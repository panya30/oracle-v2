/**
 * Signal Generation Engine
 *
 * Analyzes market data and generates trading signals based on strategy rules.
 * Feeds signals to the automation engine for execution.
 */

export interface MarketConditions {
  yields: {
    y2: number
    y5: number
    y10: number
    y30: number
    // Daily changes (in percentage points, e.g., 0.05 = 5bps)
    y2Change: number
    y5Change: number
    y10Change: number
    y30Change: number
    spread2Y10Y: number
    spread10Y30Y: number
  }
  prices: {
    [ticker: string]: {
      price: number
      change: number
      changePercent: number
      volume: number
    }
  }
  timestamp: string
}

export interface Signal {
  id: string
  timestamp: string
  agent: string
  ticker: string
  action: 'buy' | 'sell'
  confidence: number // 0-100
  reasoning: string
  triggers: string[]
  currentPrice: number
  targetPrice?: number
  stopLoss?: number
}

export interface StrategyRule {
  id: string
  name: string
  enabled: boolean
  agent: string
  conditions: RuleCondition[]
  action: 'buy' | 'sell'
  ticker: string
  baseConfidence: number
  description: string
}

export interface RuleCondition {
  type: 'yield' | 'yield_change' | 'price' | 'spread' | 'change' | 'threshold'
  field: string
  operator: '>' | '<' | '>=' | '<=' | '==' | 'between'
  value: number
  value2?: number // for 'between' operator
  weight: number // how much this condition affects confidence
}

// Default strategy rules based on 30x bond thesis
// IMPORTANT: These thresholds are for 2026 market conditions (10Y ~4.5-5.0%)
// Adjust based on current yield environment - signals won't fire if thresholds are wrong!
export const DEFAULT_STRATEGY_RULES: StrategyRule[] = [
  // DELPHI - Yield-based signals (UPDATED for current market)
  {
    id: 'delphi-yield-rising',
    name: 'Yield Rising Entry',
    enabled: true,
    agent: 'DELPHI',
    conditions: [
      // Trigger when 10Y is elevated AND rising (change > 0)
      { type: 'yield', field: 'y10', operator: '>=', value: 4.3, weight: 30 },
      { type: 'yield_change', field: 'y10', operator: '>', value: 0.02, weight: 40 }, // Rising by 2bps+
    ],
    action: 'buy',
    ticker: 'TMV',
    baseConfidence: 70,
    description: '10Y yield elevated and rising - buy inverse bond ETF',
  },
  {
    id: 'delphi-yield-high',
    name: 'High Yield Entry',
    enabled: true,
    agent: 'DELPHI',
    conditions: [
      { type: 'yield', field: 'y10', operator: '>=', value: 4.6, weight: 40 },
      { type: 'yield', field: 'y30', operator: '>=', value: 4.8, weight: 30 },
    ],
    action: 'buy',
    ticker: 'TMV',
    baseConfidence: 75,
    description: '10Y yield ≥4.6% signals bond weakness',
  },
  {
    id: 'delphi-yield-extreme',
    name: 'Extreme Yield Entry',
    enabled: true,
    agent: 'DELPHI',
    conditions: [
      { type: 'yield', field: 'y10', operator: '>=', value: 5.0, weight: 50 },
      { type: 'yield', field: 'y30', operator: '>=', value: 5.2, weight: 40 },
    ],
    action: 'buy',
    ticker: 'TMV',
    baseConfidence: 90,
    description: 'Extreme yields (10Y ≥5%) - strong buy for inverse bond ETFs',
  },
  {
    id: 'delphi-yield-falling',
    name: 'Yield Falling Exit',
    enabled: true,
    agent: 'DELPHI',
    conditions: [
      // Trigger when yields are falling sharply
      { type: 'yield_change', field: 'y10', operator: '<', value: -0.05, weight: 45 }, // Falling 5bps+
    ],
    action: 'sell',
    ticker: 'TMV',
    baseConfidence: 70,
    description: '10Y yield falling sharply - exit inverse bond position',
  },
  {
    id: 'delphi-yield-low',
    name: 'Low Yield Exit',
    enabled: true,
    agent: 'DELPHI',
    conditions: [
      { type: 'yield', field: 'y10', operator: '<', value: 4.0, weight: 40 },
    ],
    action: 'sell',
    ticker: 'TMV',
    baseConfidence: 65,
    description: '10Y yield below 4% - take profits on inverse position',
  },

  // DELPHI - Spread-based signals
  {
    id: 'delphi-curve-steepen',
    name: 'Curve Steepening',
    enabled: true,
    agent: 'DELPHI',
    conditions: [
      { type: 'spread', field: 'spread2Y10Y', operator: '>', value: 0.5, weight: 35 },
      { type: 'spread', field: 'spread10Y30Y', operator: '>', value: 0.3, weight: 25 },
    ],
    action: 'buy',
    ticker: 'TBT',
    baseConfidence: 60,
    description: 'Yield curve steepening - bullish for inverse bond ETFs',
  },

  // ATHENA - Price momentum signals
  {
    id: 'athena-momentum-up',
    name: 'Strong Upward Momentum',
    enabled: true,
    agent: 'ATHENA',
    conditions: [
      { type: 'change', field: 'TMV', operator: '>', value: 2, weight: 40 },
    ],
    action: 'buy',
    ticker: 'TMV',
    baseConfidence: 65,
    description: 'TMV showing strong daily momentum',
  },
  {
    id: 'athena-momentum-down',
    name: 'Strong Downward Momentum',
    enabled: true,
    agent: 'ATHENA',
    conditions: [
      { type: 'change', field: 'TMV', operator: '<', value: -3, weight: 45 },
    ],
    action: 'sell',
    ticker: 'TMV',
    baseConfidence: 70,
    description: 'TMV showing strong negative momentum - consider exit',
  },

  // TYCHE - Risk-based signals (profit taking / stop loss)
  {
    id: 'tyche-take-profit',
    name: 'Take Profit Signal',
    enabled: true,
    agent: 'TYCHE',
    conditions: [
      { type: 'threshold', field: 'position_profit_pct', operator: '>=', value: 15, weight: 50 },
    ],
    action: 'sell',
    ticker: 'TMV',
    baseConfidence: 75,
    description: 'Position profit ≥15% - consider taking profits',
  },
  {
    id: 'tyche-stop-loss',
    name: 'Stop Loss Signal',
    enabled: true,
    agent: 'TYCHE',
    conditions: [
      { type: 'threshold', field: 'position_loss_pct', operator: '>=', value: 10, weight: 60 },
    ],
    action: 'sell',
    ticker: 'TMV',
    baseConfidence: 90,
    description: 'Position loss ≥10% - stop loss triggered',
  },
]

/**
 * Evaluate a single condition against market data
 */
function evaluateCondition(
  condition: RuleCondition,
  market: MarketConditions,
  positions?: any[]
): { met: boolean; value: number } {
  let actualValue: number = 0

  switch (condition.type) {
    case 'yield':
      if (condition.field === 'y2') actualValue = market.yields.y2
      else if (condition.field === 'y5') actualValue = market.yields.y5
      else if (condition.field === 'y10') actualValue = market.yields.y10
      else if (condition.field === 'y30') actualValue = market.yields.y30
      break

    case 'yield_change':
      // Daily yield change in percentage points (e.g., 0.05 = 5 basis points)
      if (condition.field === 'y2') actualValue = market.yields.y2Change
      else if (condition.field === 'y5') actualValue = market.yields.y5Change
      else if (condition.field === 'y10') actualValue = market.yields.y10Change
      else if (condition.field === 'y30') actualValue = market.yields.y30Change
      break

    case 'spread':
      if (condition.field === 'spread2Y10Y') actualValue = market.yields.spread2Y10Y
      else if (condition.field === 'spread10Y30Y') actualValue = market.yields.spread10Y30Y
      break

    case 'price':
      actualValue = market.prices[condition.field]?.price || 0
      break

    case 'change':
      actualValue = market.prices[condition.field]?.changePercent || 0
      break

    case 'threshold':
      // Position-based thresholds (need position data)
      if (positions) {
        const position = positions.find(p => p.ticker === 'TMV' || p.ticker === 'TBT')
        if (position) {
          if (condition.field === 'position_profit_pct' && position.unrealizedPnLPercent > 0) {
            actualValue = position.unrealizedPnLPercent
          } else if (condition.field === 'position_loss_pct' && position.unrealizedPnLPercent < 0) {
            actualValue = Math.abs(position.unrealizedPnLPercent)
          }
        }
      }
      break
  }

  let met = false
  switch (condition.operator) {
    case '>': met = actualValue > condition.value; break
    case '<': met = actualValue < condition.value; break
    case '>=': met = actualValue >= condition.value; break
    case '<=': met = actualValue <= condition.value; break
    case '==': met = Math.abs(actualValue - condition.value) < 0.01; break
    case 'between': met = actualValue >= condition.value && actualValue <= (condition.value2 || condition.value); break
  }

  return { met, value: actualValue }
}

/**
 * Evaluate a strategy rule and generate a signal if conditions are met
 */
function evaluateRule(
  rule: StrategyRule,
  market: MarketConditions,
  positions?: any[]
): Signal | null {
  if (!rule.enabled) return null

  const results = rule.conditions.map(c => ({
    condition: c,
    ...evaluateCondition(c, market, positions),
  }))

  // Check if all conditions are met
  const allMet = results.every(r => r.met)
  if (!allMet) return null

  // Calculate confidence based on condition weights
  const totalWeight = results.reduce((sum, r) => sum + r.condition.weight, 0)
  const weightedScore = results.reduce((sum, r) => sum + (r.met ? r.condition.weight : 0), 0)
  const conditionBonus = Math.round((weightedScore / totalWeight) * 20) // up to +20%

  const confidence = Math.min(100, rule.baseConfidence + conditionBonus)

  // Build reasoning
  const triggers = results.map(r => {
    const fieldName = r.condition.field.replace('_', ' ')
    return `${fieldName} ${r.condition.operator} ${r.condition.value} (actual: ${r.value.toFixed(2)})`
  })

  const currentPrice = market.prices[rule.ticker]?.price || 0

  return {
    id: `sig-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    agent: rule.agent,
    ticker: rule.ticker,
    action: rule.action,
    confidence,
    reasoning: rule.description,
    triggers,
    currentPrice,
  }
}

/**
 * Generate signals from market conditions using all strategy rules
 */
export function generateSignals(
  market: MarketConditions,
  rules: StrategyRule[] = DEFAULT_STRATEGY_RULES,
  positions?: any[]
): Signal[] {
  const signals: Signal[] = []

  for (const rule of rules) {
    const signal = evaluateRule(rule, market, positions)
    if (signal) {
      signals.push(signal)
    }
  }

  // Remove duplicate signals for same ticker/action
  const uniqueSignals = signals.reduce((acc, signal) => {
    const key = `${signal.ticker}-${signal.action}`
    const existing = acc.find(s => `${s.ticker}-${s.action}` === key)

    // Keep the one with higher confidence
    if (!existing || signal.confidence > existing.confidence) {
      return [...acc.filter(s => `${s.ticker}-${s.action}` !== key), signal]
    }
    return acc
  }, [] as Signal[])

  return uniqueSignals
}

/**
 * Check if we should avoid generating signals (e.g., before FOMC)
 */
export function shouldPauseSignals(events: any[]): { pause: boolean; reason?: string } {
  const now = new Date()

  for (const event of events) {
    if (event.type === 'FOMC' && event.date) {
      const eventDate = new Date(event.date)
      const hoursUntil = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60)

      if (hoursUntil > 0 && hoursUntil < 24) {
        return {
          pause: true,
          reason: `FOMC meeting in ${Math.round(hoursUntil)} hours - signals paused`,
        }
      }
    }
  }

  return { pause: false }
}

/**
 * Format market conditions from API responses
 */
export function formatMarketConditions(
  yields: any,
  prices: any[]
): MarketConditions {
  const yieldMap: Record<string, number> = {}
  const yieldChangeMap: Record<string, number> = {}

  if (yields?.yields) {
    for (const y of yields.yields) {
      if (y.tenor === '2Y') {
        yieldMap.y2 = y.yield
        yieldChangeMap.y2 = y.change || 0
      } else if (y.tenor === '5Y') {
        yieldMap.y5 = y.yield
        yieldChangeMap.y5 = y.change || 0
      } else if (y.tenor === '10Y') {
        yieldMap.y10 = y.yield
        yieldChangeMap.y10 = y.change || 0
      } else if (y.tenor === '30Y') {
        yieldMap.y30 = y.yield
        yieldChangeMap.y30 = y.change || 0
      }
    }
  }

  const priceMap: Record<string, any> = {}
  for (const p of prices) {
    priceMap[p.ticker] = {
      price: p.price,
      change: p.change,
      changePercent: p.changePercent,
      volume: p.volume,
    }
  }

  return {
    yields: {
      y2: yieldMap.y2 || 0,
      y5: yieldMap.y5 || 0,
      y10: yieldMap.y10 || 0,
      y30: yieldMap.y30 || 0,
      y2Change: yieldChangeMap.y2 || 0,
      y5Change: yieldChangeMap.y5 || 0,
      y10Change: yieldChangeMap.y10 || 0,
      y30Change: yieldChangeMap.y30 || 0,
      spread2Y10Y: (yieldMap.y10 || 0) - (yieldMap.y2 || 0),
      spread10Y30Y: (yieldMap.y30 || 0) - (yieldMap.y10 || 0),
    },
    prices: priceMap,
    timestamp: new Date().toISOString(),
  }
}
