'use client'

import { useState, useEffect, useCallback } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T) {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(initialValue)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const item = window.localStorage.getItem(key)
      if (item) {
        setStoredValue(JSON.parse(item))
      }
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error)
    } finally {
      setIsLoaded(true)
    }
  }, [key])

  // Return a wrapped version of useState's setter function that persists to localStorage
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)

      // Save to localStorage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error)
    }
  }, [key, storedValue])

  // Remove item from localStorage
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue)
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key)
      }
    } catch (error) {
      console.error(`Error removing ${key} from localStorage:`, error)
    }
  }, [key, initialValue])

  return { value: storedValue, setValue, removeValue, isLoaded }
}

// Portfolio-specific persistence
export interface StoredPosition {
  id: string
  ticker: string
  name: string
  shares: number
  avgCost: number
  stopLoss?: number
  targetPrice?: number
  notes?: string
  addedAt: string
}

export interface StoredPortfolio {
  cash: number
  positions: StoredPosition[]
  updatedAt: string
}

const PORTFOLIO_KEY = 'wealth-council-portfolio'

const DEFAULT_PORTFOLIO: StoredPortfolio = {
  cash: 10000,
  positions: [],
  updatedAt: new Date().toISOString(),
}

export function usePersistedPortfolio() {
  const { value, setValue, isLoaded } = useLocalStorage<StoredPortfolio>(
    PORTFOLIO_KEY,
    DEFAULT_PORTFOLIO
  )

  // Add position
  const addPosition = useCallback((position: Omit<StoredPosition, 'id' | 'addedAt'>) => {
    setValue(prev => ({
      ...prev,
      positions: [
        ...prev.positions,
        {
          ...position,
          id: `pos-${Date.now()}`,
          addedAt: new Date().toISOString(),
        }
      ],
      updatedAt: new Date().toISOString(),
    }))
  }, [setValue])

  // Update position
  const updatePosition = useCallback((id: string, updates: Partial<StoredPosition>) => {
    setValue(prev => ({
      ...prev,
      positions: prev.positions.map(p =>
        p.id === id ? { ...p, ...updates } : p
      ),
      updatedAt: new Date().toISOString(),
    }))
  }, [setValue])

  // Remove position
  const removePosition = useCallback((id: string) => {
    setValue(prev => ({
      ...prev,
      positions: prev.positions.filter(p => p.id !== id),
      updatedAt: new Date().toISOString(),
    }))
  }, [setValue])

  // Update cash
  const updateCash = useCallback((cash: number) => {
    setValue(prev => ({
      ...prev,
      cash,
      updatedAt: new Date().toISOString(),
    }))
  }, [setValue])

  // Import portfolio (replace all)
  const importPortfolio = useCallback((portfolio: StoredPortfolio) => {
    setValue({
      ...portfolio,
      updatedAt: new Date().toISOString(),
    })
  }, [setValue])

  // Export portfolio
  const exportPortfolio = useCallback(() => {
    const dataStr = JSON.stringify(value, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    const exportFileName = `wealth-council-portfolio-${new Date().toISOString().split('T')[0]}.json`

    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileName)
    linkElement.click()
  }, [value])

  return {
    portfolio: value,
    isLoaded,
    addPosition,
    updatePosition,
    removePosition,
    updateCash,
    importPortfolio,
    exportPortfolio,
  }
}

// ============================================
// ALERT RULES PERSISTENCE
// ============================================

export interface StoredAlertRule {
  id: string
  name: string
  description: string
  enabled: boolean
  type: 'price' | 'yield' | 'risk' | 'pnl' | 'custom'
  condition: 'above' | 'below' | 'equals' | 'crosses'
  ticker?: string
  threshold: number
  unit: 'price' | 'percent' | 'basis_points'
  priority: 'low' | 'medium' | 'high' | 'critical'
  cooldown: number
  notifyOnce: boolean
  createdAt: string
}

const ALERT_RULES_KEY = 'wealth-council-alert-rules'

const DEFAULT_ALERT_RULES: StoredAlertRule[] = [
  {
    id: 'price-target',
    name: 'Price Target Alert',
    description: 'Alert when position reaches target price',
    enabled: true,
    type: 'price',
    condition: 'above',
    ticker: 'TMV',
    threshold: 50,
    unit: 'price',
    priority: 'high',
    cooldown: 60,
    notifyOnce: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'stop-loss',
    name: 'Stop Loss Warning',
    description: 'Alert when price approaches stop loss (within 5%)',
    enabled: true,
    type: 'price',
    condition: 'below',
    ticker: 'TMV',
    threshold: 38,
    unit: 'price',
    priority: 'critical',
    cooldown: 30,
    notifyOnce: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'yield-threshold',
    name: '10Y Yield Alert',
    description: 'Alert when 10Y yield crosses 4.5%',
    enabled: true,
    type: 'yield',
    condition: 'above',
    ticker: '10Y',
    threshold: 4.5,
    unit: 'percent',
    priority: 'high',
    cooldown: 60,
    notifyOnce: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'position-size',
    name: 'Position Size Limit',
    description: 'Alert when position exceeds 25% of portfolio',
    enabled: true,
    type: 'risk',
    condition: 'above',
    threshold: 25,
    unit: 'percent',
    priority: 'medium',
    cooldown: 120,
    notifyOnce: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'daily-loss',
    name: 'Daily Loss Limit',
    description: 'Alert when daily loss exceeds 7%',
    enabled: true,
    type: 'pnl',
    condition: 'below',
    threshold: -7,
    unit: 'percent',
    priority: 'critical',
    cooldown: 60,
    notifyOnce: true,
    createdAt: new Date().toISOString(),
  },
]

export function usePersistedAlertRules() {
  const { value, setValue, isLoaded } = useLocalStorage<StoredAlertRule[]>(
    ALERT_RULES_KEY,
    DEFAULT_ALERT_RULES
  )

  // Add rule
  const addRule = useCallback((rule: Omit<StoredAlertRule, 'id' | 'createdAt'>) => {
    setValue(prev => [
      ...prev,
      {
        ...rule,
        id: `rule-${Date.now()}`,
        createdAt: new Date().toISOString(),
      }
    ])
  }, [setValue])

  // Update rule
  const updateRule = useCallback((id: string, updates: Partial<StoredAlertRule>) => {
    setValue(prev => prev.map(r =>
      r.id === id ? { ...r, ...updates } : r
    ))
  }, [setValue])

  // Remove rule
  const removeRule = useCallback((id: string) => {
    setValue(prev => prev.filter(r => r.id !== id))
  }, [setValue])

  // Toggle rule enabled/disabled
  const toggleRule = useCallback((id: string) => {
    setValue(prev => prev.map(r =>
      r.id === id ? { ...r, enabled: !r.enabled } : r
    ))
  }, [setValue])

  // Reset to defaults
  const resetRules = useCallback(() => {
    setValue(DEFAULT_ALERT_RULES)
  }, [setValue])

  return {
    rules: value,
    isLoaded,
    addRule,
    updateRule,
    removeRule,
    toggleRule,
    resetRules,
  }
}

// ============================================
// TRIGGERED ALERTS HISTORY PERSISTENCE
// ============================================

export interface StoredAlert {
  id: string
  level: 'info' | 'warning' | 'danger' | 'success'
  title: string
  message: string
  agent: string
  acknowledged: boolean
  timestamp: string
  ruleId?: string
}

const ALERTS_HISTORY_KEY = 'wealth-council-alerts-history'

export function usePersistedAlerts() {
  const { value, setValue, isLoaded } = useLocalStorage<StoredAlert[]>(
    ALERTS_HISTORY_KEY,
    []
  )

  // Add alert
  const addAlert = useCallback((alert: Omit<StoredAlert, 'id' | 'timestamp' | 'acknowledged'>) => {
    setValue(prev => [
      {
        ...alert,
        id: `alert-${Date.now()}`,
        acknowledged: false,
        timestamp: new Date().toISOString(),
      },
      ...prev.slice(0, 99) // Keep last 100 alerts
    ])
  }, [setValue])

  // Acknowledge alert
  const acknowledgeAlert = useCallback((id: string) => {
    setValue(prev => prev.map(a =>
      a.id === id ? { ...a, acknowledged: true } : a
    ))
  }, [setValue])

  // Clear alert
  const clearAlert = useCallback((id: string) => {
    setValue(prev => prev.filter(a => a.id !== id))
  }, [setValue])

  // Clear all acknowledged alerts
  const clearAcknowledged = useCallback(() => {
    setValue(prev => prev.filter(a => !a.acknowledged))
  }, [setValue])

  // Clear all alerts
  const clearAll = useCallback(() => {
    setValue([])
  }, [setValue])

  return {
    alerts: value,
    isLoaded,
    addAlert,
    acknowledgeAlert,
    clearAlert,
    clearAcknowledged,
    clearAll,
  }
}
