'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Portfolio, Position, Alert, RiskMetrics, RiskLimit } from '@wealth-council/shared'

interface UseArgusOptions {
  refreshInterval?: number // ms
  autoRefresh?: boolean
}

// Generic fetch helper
async function fetchArgus<T>(action: string, params?: Record<string, string>): Promise<T | null> {
  try {
    const searchParams = new URLSearchParams({ action, ...params })
    const res = await fetch(`/api/argus?${searchParams}`)
    const data = await res.json()
    if (data.success) {
      return data.data as T
    }
    console.error('ARGUS Error:', data.error)
    return null
  } catch (error) {
    console.error('ARGUS Fetch Error:', error)
    return null
  }
}

// Portfolio hook
export function usePortfolio(options: UseArgusOptions = {}) {
  const { refreshInterval = 30000, autoRefresh = true } = options
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const data = await fetchArgus<Portfolio>('portfolio')
      setPortfolio(data)
      setError(null)
    } catch (e) {
      setError('Failed to fetch portfolio')
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

  return { portfolio, loading, error, refresh }
}

// Positions hook
export function usePositions(options: UseArgusOptions = {}) {
  const { refreshInterval = 30000, autoRefresh = true } = options
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const data = await fetchArgus<Position[]>('positions')
      setPositions(data || [])
      setError(null)
    } catch (e) {
      setError('Failed to fetch positions')
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

  return { positions, loading, error, refresh }
}

// Alerts hook
export function useAlerts(options: UseArgusOptions = {}) {
  const { refreshInterval = 10000, autoRefresh = true } = options
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const data = await fetchArgus<Alert[]>('alerts')
      setAlerts(data || [])
      setError(null)
    } catch (e) {
      setError('Failed to fetch alerts')
    } finally {
      setLoading(false)
    }
  }, [])

  const acknowledge = useCallback(async (alertId: string) => {
    try {
      await fetch('/api/argus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'acknowledgeAlert', alertId }),
      })
      refresh()
    } catch (e) {
      console.error('Failed to acknowledge alert:', e)
    }
  }, [refresh])

  const clear = useCallback(async (alertId: string) => {
    try {
      await fetch('/api/argus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clearAlert', alertId }),
      })
      refresh()
    } catch (e) {
      console.error('Failed to clear alert:', e)
    }
  }, [refresh])

  useEffect(() => {
    refresh()
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(refresh, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [refresh, autoRefresh, refreshInterval])

  return { alerts, loading, error, refresh, acknowledge, clear }
}

// Risk metrics hook
export function useRiskMetrics(options: UseArgusOptions = {}) {
  const { refreshInterval = 60000, autoRefresh = true } = options
  const [metrics, setMetrics] = useState<RiskMetrics | null>(null)
  const [limits, setLimits] = useState<RiskLimit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const [metricsData, limitsData] = await Promise.all([
        fetchArgus<RiskMetrics>('risk'),
        fetchArgus<RiskLimit[]>('limits'),
      ])
      setMetrics(metricsData)
      setLimits(limitsData || [])
      setError(null)
    } catch (e) {
      setError('Failed to fetch risk data')
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

  return { metrics, limits, loading, error, refresh }
}

// Combined dashboard hook
export function useDashboard(options: UseArgusOptions = {}) {
  const { refreshInterval = 30000, autoRefresh = true } = options
  const [data, setData] = useState<{
    portfolio: Portfolio | null
    alerts: Alert[]
    risk: RiskMetrics | null
  }>({
    portfolio: null,
    alerts: [],
    risk: null,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const [portfolio, alerts, risk] = await Promise.all([
        fetchArgus<Portfolio>('portfolio'),
        fetchArgus<Alert[]>('alerts'),
        fetchArgus<RiskMetrics>('risk'),
      ])
      setData({ portfolio, alerts: alerts || [], risk })
      setError(null)
    } catch (e) {
      setError('Failed to fetch dashboard data')
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

  return { ...data, loading, error, refresh }
}
