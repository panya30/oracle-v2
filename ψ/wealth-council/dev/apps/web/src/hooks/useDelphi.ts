import { useState, useEffect, useCallback } from 'react'

// Types matching DELPHI agent
export interface Signal {
  id: string
  type: 'entry' | 'exit' | 'warning' | 'info'
  ticker: string
  direction: 'bullish' | 'bearish' | 'neutral'
  strength: 'strong' | 'moderate' | 'weak'
  confidence: number
  reason: string
  timestamp: Date
  status: 'active' | 'pending' | 'expired'
  entry?: number
  stopLoss?: number
  target?: number
  target1?: number
  target2?: number
  price?: number
  agent?: string
  expiresAt?: Date
}

export interface ThesisStatus {
  confidence: number
  status: string
  yieldTrend: 'rising' | 'falling' | 'stable'
  marketRegime: 'bullish' | 'bearish' | 'neutral' | 'volatile'
  activeSignals: number
  lastUpdate: Date
}

export interface OracleReading {
  recommendation: string
  confidence: number
  keyFactors: string[]
  risks: string[]
  timestamp: Date
  market?: {
    regime: string
    yieldTrend: string
    description: string
  }
}

// Hook for active signals only
export function useActiveSignals() {
  const [signals, setSignals] = useState<Signal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSignals = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/delphi?action=active')
      if (!response.ok) throw new Error('Failed to fetch active signals')

      const result = await response.json()

      if (result.success && result.data) {
        // API returns array directly in data
        const signalsData = Array.isArray(result.data) ? result.data : []
        const signalsWithDates = signalsData.map((s: any) => ({
          ...s,
          timestamp: new Date(s.timestamp),
          status: s.status || 'active',
          entry: s.price,
          target1: s.target,
        }))
        setSignals(signalsWithDates)
      } else {
        setSignals([])
      }
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setSignals([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSignals()
  }, [fetchSignals])

  return { signals, loading, error, refetch: fetchSignals }
}

// Hook for all signals with optional type filter
export function useSignals(type?: 'entry' | 'exit' | 'warning' | 'info') {
  const [signals, setSignals] = useState<Signal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSignals = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ action: 'signals' })
      if (type) params.append('type', type)

      const response = await fetch(`/api/delphi?${params}`)
      if (!response.ok) throw new Error('Failed to fetch signals')

      const result = await response.json()

      if (result.success && result.data) {
        const signalsData = result.data.signals || result.data || []
        const signalsArray = Array.isArray(signalsData) ? signalsData : []
        const signalsWithDates = signalsArray.map((s: any) => ({
          ...s,
          timestamp: new Date(s.timestamp),
          status: s.status || 'active',
        }))
        setSignals(signalsWithDates)
      } else {
        setSignals([])
      }
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [type])

  useEffect(() => {
    fetchSignals()
  }, [fetchSignals])

  return { signals, loading, error, refetch: fetchSignals }
}

// Hook for thesis status
export function useThesisStatus() {
  const [thesis, setThesis] = useState<ThesisStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchThesis = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/delphi?action=thesis')
      if (!response.ok) throw new Error('Failed to fetch thesis status')

      const result = await response.json()

      if (result.success && result.data) {
        const data = result.data
        setThesis({
          confidence: data.thesis?.confidence || data.confidence || 0,
          status: data.thesis?.status || data.status || 'neutral',
          yieldTrend: data.market?.yieldTrend || data.yieldTrend || 'stable',
          marketRegime: data.market?.regime || data.marketRegime || 'neutral',
          activeSignals: data.thesis?.signals?.length || data.activeSignals || 0,
          lastUpdate: new Date(result.timestamp || Date.now()),
        })
      }
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchThesis()
  }, [fetchThesis])

  return { thesis, loading, error, refetch: fetchThesis }
}

// Hook for oracle reading
export function useOracleReading() {
  const [oracle, setOracle] = useState<OracleReading | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOracle = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/delphi?action=oracle')
      if (!response.ok) throw new Error('Failed to fetch oracle reading')

      const result = await response.json()

      if (result.success && result.data) {
        const data = result.data
        // Extract key factors from thesis and market info
        const keyFactors: string[] = []
        if (data.market?.yieldTrend) keyFactors.push(`Yields ${data.market.yieldTrend}`)
        if (data.market?.regime) keyFactors.push(`${data.market.regime} regime`)
        if (data.thesis?.status) keyFactors.push(`Thesis: ${data.thesis.status}`)
        if (data.thesis?.signals?.length) keyFactors.push(`${data.thesis.signals.length} active signals`)

        // Extract risks
        const risks: string[] = []
        if (data.market?.regime === 'volatile') risks.push('High volatility expected')
        if (data.thesis?.confidence < 50) risks.push('Low thesis confidence')

        setOracle({
          recommendation: data.recommendation || 'No oracle reading available',
          confidence: data.thesis?.confidence || 50,
          keyFactors: keyFactors.length > 0 ? keyFactors : ['Market data loading...'],
          risks: risks,
          timestamp: new Date(result.timestamp || Date.now()),
          market: data.market,
        })
      }
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOracle()
  }, [fetchOracle])

  return { oracle, loading, error, refetch: fetchOracle }
}

// Combined hook for signal generation
export function useGenerateSignals() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generate = useCallback(async (
    yields: Record<string, number>,
    prices: Record<string, number>,
    positions: Array<{ ticker: string; quantity: number; avgCost: number }>
  ) => {
    try {
      setLoading(true)
      const response = await fetch('/api/delphi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          yields,
          prices,
          positions
        })
      })

      if (!response.ok) throw new Error('Failed to generate signals')
      const data = await response.json()
      setError(null)
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { generate, loading, error }
}
