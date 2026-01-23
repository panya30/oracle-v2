'use client'

import { useState, useEffect, useCallback } from 'react'

interface PriceData {
  ticker: string
  price: number
  change: number
  changePercent: number
  open: number
  high: number
  low: number
  volume: number
  previousClose: number
  timestamp: string
}

interface YieldData {
  tenor: '2Y' | '5Y' | '10Y' | '30Y'
  yield: number
  change: number
  changePercent: number
  previousClose: number
  timestamp: string
}

interface YieldSnapshot {
  yields: YieldData[]
  spread2Y10Y: number
  spread10Y30Y: number
  curveStatus: 'normal' | 'flat' | 'inverted'
  timestamp: string
}

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

interface MarketData {
  prices: PriceData[]
  yields: YieldSnapshot | null
  portfolio: Portfolio | null
  alerts: Alert[]
}

interface UseMarketDataOptions {
  refreshInterval?: number
  autoRefresh?: boolean
}

/**
 * Hook to fetch all market data from the combined API
 */
export function useMarketData(options: UseMarketDataOptions = {}) {
  const { refreshInterval = 30000, autoRefresh = true } = options

  const [data, setData] = useState<MarketData>({
    prices: [],
    yields: null,
    portfolio: null,
    alerts: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const refresh = useCallback(async () => {
    try {
      const response = await fetch('/api/market?action=all')
      const result = await response.json()

      if (result.success) {
        setData(result.data)
        setLastUpdated(new Date())
        setError(null)
      } else {
        setError(result.error || 'Failed to fetch data')
      }
    } catch (e) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()

    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(refresh, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [refresh, autoRefresh, refreshInterval])

  // Acknowledge alert
  const acknowledgeAlert = useCallback(async (alertId: string) => {
    try {
      await fetch('/api/market', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'acknowledgeAlert', alertId }),
      })
      refresh()
    } catch (e) {
      console.error('Failed to acknowledge alert:', e)
    }
  }, [refresh])

  // Clear alert
  const clearAlert = useCallback(async (alertId: string) => {
    try {
      await fetch('/api/market', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clearAlert', alertId }),
      })
      refresh()
    } catch (e) {
      console.error('Failed to clear alert:', e)
    }
  }, [refresh])

  return {
    ...data,
    loading,
    error,
    lastUpdated,
    refresh,
    acknowledgeAlert,
    clearAlert,
  }
}

/**
 * Hook for just prices
 */
export function useRealPrices(options: UseMarketDataOptions = {}) {
  const { refreshInterval = 15000, autoRefresh = true } = options

  const [prices, setPrices] = useState<PriceData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const response = await fetch('/api/market?action=prices')
      const result = await response.json()

      if (result.success) {
        setPrices(result.data)
        setError(null)
      }
    } catch (e) {
      setError('Failed to fetch prices')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()

    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(refresh, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [refresh, autoRefresh, refreshInterval])

  return { prices, loading, error, refresh }
}

/**
 * Hook for just yields
 */
export function useRealYields(options: UseMarketDataOptions = {}) {
  const { refreshInterval = 60000, autoRefresh = true } = options

  const [yields, setYields] = useState<YieldSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const response = await fetch('/api/market?action=yields')
      const result = await response.json()

      if (result.success) {
        setYields(result.data)
        setError(null)
      }
    } catch (e) {
      setError('Failed to fetch yields')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()

    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(refresh, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [refresh, autoRefresh, refreshInterval])

  return { yields, loading, error, refresh }
}

export type { PriceData, YieldData, YieldSnapshot, Portfolio, Position, Alert, MarketData }
