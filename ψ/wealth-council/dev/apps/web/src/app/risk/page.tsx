'use client'

import { useState, useCallback } from 'react'
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Percent,
  DollarSign,
  Activity,
  BarChart2,
  PieChart,
  Target,
  Gauge,
  Loader2,
} from 'lucide-react'
import { useRiskMetrics, usePortfolio, usePositions } from '@/hooks'
import { useRiskScore, useRiskLimits, useScenarioAnalysis } from '@/hooks'
import { useAutoRefresh } from '@/hooks/useAutoRefresh'
import RefreshIndicator from '@/components/common/RefreshIndicator'

// Correlation matrix
const correlationMatrix = {
  tickers: ['TMV', 'TBT', 'TBF', 'TLT'],
  data: [
    [1.0, 0.98, 0.95, -0.98],
    [0.98, 1.0, 0.97, -0.96],
    [0.95, 0.97, 1.0, -0.94],
    [-0.98, -0.96, -0.94, 1.0],
  ],
}

// Risk limits configuration (static for now, could come from TYCHE)
const riskLimitsConfig = [
  {
    name: 'Max Single Position',
    limit: 25,
    unit: '%',
    description: 'No single position should exceed 25% of portfolio',
    action: 'Reduce position or add to others',
  },
  {
    name: 'Max Total Exposure',
    limit: 60,
    unit: '%',
    description: 'Total invested should not exceed 60%',
    action: 'Maintain cash buffer for opportunities',
  },
  {
    name: 'Min Cash Reserve',
    limit: 10,
    unit: '%',
    description: 'Always keep at least 10% in cash',
    action: 'Reduce positions if breached',
  },
  {
    name: 'Max Daily Loss',
    limit: 10,
    unit: '%',
    description: 'Halt trading if daily loss exceeds 10%',
    action: 'Stop all new entries, review positions',
  },
  {
    name: 'Max Weekly Loss',
    limit: 20,
    unit: '%',
    description: 'Full review required if weekly loss exceeds 20%',
    action: 'Consider reducing all positions',
  },
  {
    name: 'Leverage Limit',
    limit: 3,
    unit: 'x',
    description: 'Maximum portfolio leverage is 3x',
    action: 'Close leveraged positions',
  },
]

export default function RiskPage() {
  const { metrics, loading: metricsLoading, refresh: refreshMetrics } = useRiskMetrics()
  const { portfolio } = usePortfolio()
  const { positions } = usePositions()
  const { riskScore, loading: scoreLoading, refetch: refetchScore } = useRiskScore()
  const { limits, refetch: refetchLimits } = useRiskLimits()
  const { scenarios, loading: scenariosLoading, refetch: refetchScenarios } = useScenarioAnalysis()
  const [selectedScenario, setSelectedScenario] = useState<number | null>(null)
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true)

  // Combined refresh function
  const refreshAll = useCallback(async () => {
    await Promise.all([
      refreshMetrics(),
      refetchScore(),
      refetchLimits(),
      refetchScenarios(),
    ])
  }, [refreshMetrics, refetchScore, refetchLimits, refetchScenarios])

  // Auto-refresh every 30 seconds
  const { lastRefresh, isRefreshing, refresh } = useAutoRefresh({
    enabled: autoRefreshEnabled,
    interval: 30000,
    onRefresh: refreshAll,
  })

  // Calculate current values
  const currentExposure = 100 - (portfolio?.cashPercent || 30)
  const largestPosition = Math.max(...positions.map(p => p.weight), 0)
  const dailyLoss = Math.abs(Math.min(portfolio?.dailyPnLPercent || 0, 0))

  const isLoading = metricsLoading || scoreLoading

  return (
    <div className="space-y-6 animate-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-text-primary flex items-center gap-3">
            <Shield className="w-6 sm:w-7 h-6 sm:h-7 text-accent-cyan" />
            Risk Management
          </h1>
          <p className="text-sm text-text-secondary mt-1">TYCHE - Portfolio Risk Analysis</p>
        </div>
        <div className="flex items-center gap-3">
          {riskScore && (
            <span className={`badge ${
              riskScore.level === 'low' ? 'badge-success' :
              riskScore.level === 'medium' ? 'badge-warning' :
              riskScore.level === 'high' ? 'badge-danger' :
              'badge-danger'
            }`}>
              {riskScore.level.toUpperCase()} RISK ({riskScore.score})
            </span>
          )}
          {!riskScore && (
            <span className={`badge ${
              metrics?.overallRisk === 'low' ? 'badge-success' :
              metrics?.overallRisk === 'medium' ? 'badge-warning' :
              'badge-danger'
            }`}>
              {metrics?.overallRisk?.toUpperCase() || 'MEDIUM'} RISK
            </span>
          )}
          <RefreshIndicator
            lastRefresh={lastRefresh}
            isRefreshing={isRefreshing || isLoading}
            onRefresh={refresh}
            enabled={autoRefreshEnabled}
            onToggle={setAutoRefreshEnabled}
          />
        </div>
      </div>

      {/* Risk Score Factors */}
      {riskScore && riskScore.factors.length > 0 && (
        <div className="card p-4 border-l-4 border-status-warning">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-status-warning" />
            Risk Factors
          </h3>
          <div className="flex flex-wrap gap-2">
            {riskScore.factors.map((factor, i) => (
              <span key={i} className="text-sm px-3 py-1 bg-status-warning/10 text-status-warning rounded-full">
                {factor}
              </span>
            ))}
          </div>
          {riskScore.recommendations.length > 0 && (
            <div className="mt-3 pt-3 border-t border-palantir-border">
              <h4 className="text-xs text-text-muted uppercase mb-2">Recommendations</h4>
              <ul className="text-sm text-text-secondary space-y-1">
                {riskScore.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-accent-cyan" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Risk Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="metric-card glow-border">
          <div className="flex items-center justify-between mb-2">
            <span className="data-label">VaR (95%)</span>
            <Gauge className="w-4 h-4 text-status-warning" />
          </div>
          <span className="metric-value text-status-warning">
            ${metrics?.portfolioVaR95?.toLocaleString() || '850'}
          </span>
          <span className="text-xs text-text-muted">Max daily loss (95% confidence)</span>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between mb-2">
            <span className="data-label">VaR (99%)</span>
            <Gauge className="w-4 h-4 text-status-danger" />
          </div>
          <span className="metric-value text-status-danger">
            ${metrics?.portfolioVaR99?.toLocaleString() || '1,200'}
          </span>
          <span className="text-xs text-text-muted">Max daily loss (99% confidence)</span>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between mb-2">
            <span className="data-label">Max Drawdown</span>
            <TrendingDown className="w-4 h-4 text-text-muted" />
          </div>
          <span className="metric-value">
            {metrics?.maxDrawdown || 15}%
          </span>
          <span className="text-xs text-text-muted">Historical worst</span>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between mb-2">
            <span className="data-label">Sharpe Ratio</span>
            <Activity className="w-4 h-4 text-status-success" />
          </div>
          <span className="metric-value text-status-success">
            {metrics?.sharpeRatio || 1.2}
          </span>
          <span className="text-xs text-text-muted">Risk-adjusted return</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Risk Limits */}
        <div className="lg:col-span-2 card p-0">
          <div className="p-4 border-b border-palantir-border">
            <h2 className="font-semibold flex items-center gap-2">
              <Target className="w-5 h-5 text-accent-cyan" />
              Risk Limits
            </h2>
          </div>
          <div className="divide-y divide-palantir-border">
            {riskLimitsConfig.map((rule, i) => {
              let current: number
              let status: 'ok' | 'warning' | 'breach'

              switch (rule.name) {
                case 'Max Single Position':
                  current = largestPosition
                  status = current > rule.limit ? 'breach' : current > rule.limit * 0.8 ? 'warning' : 'ok'
                  break
                case 'Max Total Exposure':
                  current = currentExposure
                  status = current > rule.limit ? 'breach' : current > rule.limit * 0.85 ? 'warning' : 'ok'
                  break
                case 'Min Cash Reserve':
                  current = portfolio?.cashPercent || 30
                  status = current < rule.limit ? 'breach' : current < rule.limit * 1.5 ? 'warning' : 'ok'
                  break
                case 'Max Daily Loss':
                  current = dailyLoss
                  status = current > rule.limit ? 'breach' : current > rule.limit * 0.7 ? 'warning' : 'ok'
                  break
                default:
                  current = 0
                  status = 'ok'
              }

              return (
                <div key={i} className="p-4 flex items-center gap-4">
                  {/* Status Icon */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    status === 'ok' ? 'bg-status-success/20' :
                    status === 'warning' ? 'bg-status-warning/20' :
                    'bg-status-danger/20'
                  }`}>
                    {status === 'ok' ? (
                      <CheckCircle className="w-5 h-5 text-status-success" />
                    ) : status === 'warning' ? (
                      <AlertTriangle className="w-5 h-5 text-status-warning" />
                    ) : (
                      <XCircle className="w-5 h-5 text-status-danger" />
                    )}
                  </div>

                  {/* Rule Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{rule.name}</span>
                      <span className={`badge text-xs ${
                        status === 'ok' ? 'badge-success' :
                        status === 'warning' ? 'badge-warning' :
                        'badge-danger'
                      }`}>
                        {status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-text-muted">{rule.description}</p>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-48">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-text-muted">Current</span>
                      <span className={`font-mono ${
                        status === 'ok' ? 'text-status-success' :
                        status === 'warning' ? 'text-status-warning' :
                        'text-status-danger'
                      }`}>
                        {current.toFixed(1)}{rule.unit}
                      </span>
                    </div>
                    <div className="h-2 bg-palantir-bg rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          status === 'ok' ? 'bg-status-success' :
                          status === 'warning' ? 'bg-status-warning' :
                          'bg-status-danger'
                        }`}
                        style={{
                          width: `${Math.min((current / rule.limit) * 100, 100)}%`
                        }}
                      />
                    </div>
                    <div className="text-xs text-text-muted text-right mt-1">
                      Limit: {rule.limit}{rule.unit}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Correlation Matrix */}
          <div className="card p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-accent-blue" />
              Correlation Matrix
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th className="p-1"></th>
                    {correlationMatrix.tickers.map(t => (
                      <th key={t} className="p-1 text-center font-mono">{t}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {correlationMatrix.tickers.map((ticker, i) => (
                    <tr key={ticker}>
                      <td className="p-1 font-mono font-medium">{ticker}</td>
                      {correlationMatrix.data[i].map((val, j) => (
                        <td key={j} className="p-1 text-center">
                          <span className={`px-2 py-1 rounded ${
                            val === 1 ? 'bg-palantir-bg' :
                            val > 0.9 ? 'bg-status-success/20 text-status-success' :
                            val > 0 ? 'bg-accent-blue/20 text-accent-blue' :
                            val > -0.9 ? 'bg-status-warning/20 text-status-warning' :
                            'bg-status-danger/20 text-status-danger'
                          }`}>
                            {val.toFixed(2)}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-text-muted mt-3">
              ⚠️ High correlation between TMV/TBT/TBF means concentrated risk
            </p>
          </div>

          {/* Position Risk */}
          <div className="card p-4">
            <h3 className="font-semibold mb-4">Position Risk</h3>
            <div className="space-y-3">
              {positions.map(pos => {
                const riskLevel = pos.weight > 25 ? 'high' : pos.weight > 15 ? 'medium' : 'low'
                return (
                  <div key={pos.ticker} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium">{pos.ticker}</span>
                      <span className={`badge text-xs ${
                        riskLevel === 'high' ? 'badge-danger' :
                        riskLevel === 'medium' ? 'badge-warning' :
                        'badge-success'
                      }`}>
                        {riskLevel}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono">{pos.weight.toFixed(1)}%</span>
                      {pos.stopLoss && (
                        <span className="text-xs text-text-muted ml-2">
                          Stop: ${pos.stopLoss}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Scenario Analysis */}
      <div className="card p-0">
        <div className="p-4 border-b border-palantir-border flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-accent-cyan" />
            Scenario Analysis
          </h2>
          {scenariosLoading && <Loader2 className="w-4 h-4 animate-spin text-text-muted" />}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-palantir-border">
          {(scenarios.length > 0 ? scenarios : [
            {
              name: 'Yield Spike (+50bp)',
              probability: 35,
              impact: 750,
              description: '10Y yield rises from 4.3% to 4.8%',
              portfolioChange: 15,
            },
            {
              name: 'Yield Collapse (-50bp)',
              probability: 15,
              impact: -750,
              description: 'Flight to safety event, yields fall',
              portfolioChange: -15,
            },
            {
              name: 'Sideways (±10bp)',
              probability: 40,
              impact: 100,
              description: 'Normal market conditions',
              portfolioChange: 2,
            },
            {
              name: 'Crisis Mode (+100bp)',
              probability: 10,
              impact: 1750,
              description: 'Bond market selloff, fiscal crisis',
              portfolioChange: 35,
            },
          ]).map((scenario, i) => (
            <div
              key={i}
              className={`p-4 cursor-pointer transition-colors ${
                selectedScenario === i ? 'bg-palantir-bg-hover' : 'hover:bg-palantir-bg-hover/50'
              }`}
              onClick={() => setSelectedScenario(selectedScenario === i ? null : i)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{scenario.name}</span>
                <span className="badge badge-info text-xs">{scenario.probability}%</span>
              </div>
              <p className="text-sm text-text-muted mb-3">{scenario.description}</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between border-t border-palantir-border pt-2">
                  <span className="text-text-muted">Portfolio Impact</span>
                  <span className={`font-mono font-semibold ${
                    scenario.portfolioChange > 0 ? 'text-status-success' :
                    scenario.portfolioChange < 0 ? 'text-status-danger' :
                    'text-text-secondary'
                  }`}>
                    {scenario.portfolioChange > 0 ? '+' : ''}{scenario.portfolioChange}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">P&L</span>
                  <span className={`font-mono ${
                    scenario.impact > 0 ? 'text-status-success' :
                    scenario.impact < 0 ? 'text-status-danger' :
                    'text-text-secondary'
                  }`}>
                    {scenario.impact > 0 ? '+' : ''}${Math.abs(scenario.impact).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
