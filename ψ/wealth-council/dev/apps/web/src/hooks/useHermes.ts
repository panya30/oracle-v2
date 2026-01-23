'use client'

import { useState, useEffect, useCallback } from 'react'
import type { YieldSnapshot, PriceData, MacroData, NewsItem } from '@wealth-council/shared'

interface UseHermesOptions {
  refreshInterval?: number // ms
  autoRefresh?: boolean
}

// Generic fetch helper
async function fetchHermes<T>(action: string, params?: Record<string, string>): Promise<T | null> {
  try {
    const searchParams = new URLSearchParams({ action, ...params })
    const res = await fetch(`/api/hermes?${searchParams}`)
    const data = await res.json()
    if (data.success) {
      return data.data as T
    }
    console.error('HERMES Error:', data.error)
    return null
  } catch (error) {
    console.error('HERMES Fetch Error:', error)
    return null
  }
}

// Yields hook
export function useYields(options: UseHermesOptions = {}) {
  const { refreshInterval = 15000, autoRefresh = true } = options
  const [yields, setYields] = useState<YieldSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const data = await fetchHermes<YieldSnapshot>('yields')
      setYields(data)
      setError(null)
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

// Prices hook
export function usePrices(options: UseHermesOptions = {}) {
  const { refreshInterval = 15000, autoRefresh = true } = options
  const [prices, setPrices] = useState<PriceData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const data = await fetchHermes<PriceData[]>('prices')
      setPrices(data || [])
      setError(null)
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

// Single price hook
export function usePrice(ticker: string, options: UseHermesOptions = {}) {
  const { refreshInterval = 15000, autoRefresh = true } = options
  const [price, setPrice] = useState<PriceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const data = await fetchHermes<PriceData>('price', { ticker })
      setPrice(data)
      setError(null)
    } catch (e) {
      setError('Failed to fetch price')
    } finally {
      setLoading(false)
    }
  }, [ticker])

  useEffect(() => {
    refresh()
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(refresh, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [refresh, autoRefresh, refreshInterval])

  return { price, loading, error, refresh }
}

// Macro data hook
export function useMacro(options: UseHermesOptions = {}) {
  const { refreshInterval = 300000, autoRefresh = true } = options // 5 min default
  const [macro, setMacro] = useState<MacroData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const data = await fetchHermes<MacroData>('macro')
      setMacro(data)
      setError(null)
    } catch (e) {
      setError('Failed to fetch macro data')
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

  return { macro, loading, error, refresh }
}

// News hook
export function useNews(options: UseHermesOptions & { limit?: number } = {}) {
  const { refreshInterval = 60000, autoRefresh = true, limit = 10 } = options
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const data = await fetchHermes<NewsItem[]>('news', { limit: limit.toString() })
      setNews(data || [])
      setError(null)
    } catch (e) {
      setError('Failed to fetch news')
    } finally {
      setLoading(false)
    }
  }, [limit])

  useEffect(() => {
    refresh()
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(refresh, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [refresh, autoRefresh, refreshInterval])

  return { news, loading, error, refresh }
}

// Thesis status hook
export function useThesis(options: UseHermesOptions = {}) {
  const { refreshInterval = 60000, autoRefresh = true } = options
  const [thesis, setThesis] = useState<{
    status: 'bullish' | 'neutral' | 'bearish'
    confidence: number
    signals: string[]
    risks: string[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const data = await fetchHermes<typeof thesis>('thesis')
      setThesis(data)
      setError(null)
    } catch (e) {
      setError('Failed to fetch thesis')
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

  return { thesis, loading, error, refresh }
}

// Fed analysis hook
export function useFed(options: UseHermesOptions = {}) {
  const { refreshInterval = 300000, autoRefresh = true } = options
  const [fed, setFed] = useState<{
    currentRate: number
    nextMeeting: Date
    expectation: string
    analysis: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const data = await fetchHermes<typeof fed>('fed')
      setFed(data)
      setError(null)
    } catch (e) {
      setError('Failed to fetch fed analysis')
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

  return { fed, loading, error, refresh }
}

// Combined research hook
export function useResearch(options: UseHermesOptions = {}) {
  const { refreshInterval = 30000, autoRefresh = true } = options
  const [data, setData] = useState<{
    yields: YieldSnapshot | null
    prices: PriceData[]
    macro: MacroData | null
    news: NewsItem[]
    thesis: {
      status: 'bullish' | 'neutral' | 'bearish'
      confidence: number
      signals: string[]
      risks: string[]
    } | null
  }>({
    yields: null,
    prices: [],
    macro: null,
    news: [],
    thesis: null,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const [yields, prices, macro, news, thesis] = await Promise.all([
        fetchHermes<YieldSnapshot>('yields'),
        fetchHermes<PriceData[]>('prices'),
        fetchHermes<MacroData>('macro'),
        fetchHermes<NewsItem[]>('news', { limit: '5' }),
        fetchHermes<typeof data.thesis>('thesis'),
      ])
      setData({
        yields,
        prices: prices || [],
        macro,
        news: news || [],
        thesis,
      })
      setError(null)
    } catch (e) {
      setError('Failed to fetch research data')
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
