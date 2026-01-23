import { useState, useEffect, useCallback } from 'react'

// Types matching TYCHE agent responses
export interface RiskMetrics {
  portfolioVaR: number
  maxDrawdown: number
  sharpeRatio: number
  concentrationRisk: number
  correlationRisk: number
  leverageRatio: number
}

export interface RiskLimits {
  maxSinglePosition: number
  maxTotalExposure: number
  maxLeverage: number
  minCashBuffer: number
  maxCorrelatedExposure: number
}

export interface RiskScore {
  score: number
  level: 'low' | 'medium' | 'high' | 'extreme'
  factors: string[]
  recommendations: string[]
}

export interface ScenarioResult {
  name: string
  description: string
  impact: number
  probability: number
  portfolioChange: number
}

export interface PortfolioRiskAnalysis {
  totalValue: number
  riskScore: RiskScore
  metrics: RiskMetrics
  warnings: string[]
  recommendations: string[]
}

export interface PositionSizeRecommendation {
  ticker: string
  maxPosition: number
  recommendedSize: number
  reasoning: string[]
}

// Hook for risk metrics
export function useRiskMetrics() {
  const [metrics, setMetrics] = useState<RiskMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/tyche?action=metrics')
      if (!response.ok) throw new Error('Failed to fetch risk metrics')

      const result = await response.json()
      if (result.success && result.data) {
        setMetrics(result.data)
      }
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics])

  return { metrics, loading, error, refetch: fetchMetrics }
}

// Hook for risk limits
export function useRiskLimits() {
  const [limits, setLimits] = useState<RiskLimits | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLimits = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/tyche?action=limits')
      if (!response.ok) throw new Error('Failed to fetch risk limits')

      const result = await response.json()
      if (result.success && result.data) {
        setLimits(result.data)
      }
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLimits()
  }, [fetchLimits])

  return { limits, loading, error, refetch: fetchLimits }
}

// Hook for risk score
export function useRiskScore() {
  const [riskScore, setRiskScore] = useState<RiskScore | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchScore = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/tyche?action=score')
      if (!response.ok) throw new Error('Failed to fetch risk score')

      const result = await response.json()
      if (result.success && result.data) {
        const data = result.data
        setRiskScore({
          score: data.score || 0,
          level: data.level || 'medium',
          factors: data.factors || [],
          recommendations: data.recommendations || generateRecommendations(data.level, data.factors),
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
    fetchScore()
  }, [fetchScore])

  return { riskScore, loading, error, refetch: fetchScore }
}

// Generate recommendations based on risk level and factors
function generateRecommendations(level: string, factors: string[]): string[] {
  const recommendations: string[] = []

  if (level === 'high' || level === 'extreme') {
    recommendations.push('Consider reducing position sizes')
    recommendations.push('Review stop-loss levels')
  }

  if (factors?.some(f => f.toLowerCase().includes('correlation'))) {
    recommendations.push('Diversify across less correlated assets')
  }

  if (factors?.some(f => f.toLowerCase().includes('concentrated'))) {
    recommendations.push('Spread exposure across multiple positions')
  }

  if (recommendations.length === 0) {
    recommendations.push('Monitor market conditions')
  }

  return recommendations
}

// Hook for scenario analysis
export function useScenarioAnalysis() {
  const [scenarios, setScenarios] = useState<ScenarioResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchScenarios = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/tyche?action=scenarios')
      if (!response.ok) throw new Error('Failed to fetch scenarios')

      const result = await response.json()
      if (result.success && result.data) {
        const scenariosData = result.data.scenarios || result.data || []
        const mapped = Array.isArray(scenariosData) ? scenariosData.map((s: any) => ({
          name: s.name,
          description: s.description,
          impact: Math.round((s.portfolioImpact || 0) * 100), // Convert to dollar estimate
          probability: Math.round((s.probability || 0) * 100), // Convert to percentage
          portfolioChange: s.portfolioImpact || 0,
        })) : []
        setScenarios(mapped)
      }
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchScenarios()
  }, [fetchScenarios])

  return { scenarios, loading, error, refetch: fetchScenarios }
}

// Hook for portfolio risk analysis
export function usePortfolioRiskAnalysis() {
  const [analysis, setAnalysis] = useState<PortfolioRiskAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const analyze = useCallback(async (portfolio: {
    positions: Array<{ ticker: string; quantity: number; avgCost: number; currentPrice: number }>
    cash: number
  }) => {
    try {
      setLoading(true)
      const response = await fetch('/api/tyche', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze',
          portfolio
        })
      })

      if (!response.ok) throw new Error('Failed to analyze portfolio')
      const result = await response.json()
      if (result.success && result.data) {
        setAnalysis(result.data)
      }
      setError(null)
      return result.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { analysis, analyze, loading, error }
}

// Hook for position size recommendation
export function usePositionSizeRecommendation() {
  const [recommendation, setRecommendation] = useState<PositionSizeRecommendation | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getRecommendation = useCallback(async (
    portfolio: {
      positions: Array<{ ticker: string; quantity: number; avgCost: number; currentPrice: number }>
      cash: number
    },
    ticker: string
  ) => {
    try {
      setLoading(true)
      const response = await fetch('/api/tyche', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'positionSize',
          portfolio,
          ticker
        })
      })

      if (!response.ok) throw new Error('Failed to get position size recommendation')
      const result = await response.json()
      if (result.success && result.data) {
        setRecommendation(result.data)
      }
      setError(null)
      return result.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { recommendation, getRecommendation, loading, error }
}
