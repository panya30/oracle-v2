'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  AlertTriangle,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  RefreshCw,
  Info,
  AlertCircle,
  BarChart2,
} from 'lucide-react'
import { useMarketData } from '@/hooks'

// Dynamic import for charts (no SSR)
const YieldChart = dynamic(() => import('@/components/charts/YieldChart'), { ssr: false })
const PriceChart = dynamic(() => import('@/components/charts/PriceChart'), { ssr: false })

// Helper to format time ago
function formatTimeAgo(timestamp: string): string {
  const now = new Date()
  const alertTime = new Date(timestamp)
  const diffMs = now.getTime() - alertTime.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

// Get alert icon based on level
function getAlertIcon(level: string) {
  switch (level) {
    case 'danger':
      return <AlertCircle className="w-4 h-4 mt-0.5 text-status-danger" />
    case 'warning':
      return <AlertTriangle className="w-4 h-4 mt-0.5 text-status-warning" />
    case 'success':
      return <CheckCircle className="w-4 h-4 mt-0.5 text-status-success" />
    default:
      return <Info className="w-4 h-4 mt-0.5 text-accent-blue" />
  }
}

// Thesis status (calculated from yields data)
function calculateThesisStatus(yields: any) {
  if (!yields) {
    return { status: 'neutral', confidence: 50, signals: [] }
  }

  const y10 = yields.yields.find((y: any) => y.tenor === '10Y')
  const y30 = yields.yields.find((y: any) => y.tenor === '30Y')
  const signals: string[] = []
  let confidence = 50

  // 10Y above 4.3% is bullish for our short bond thesis
  if (y10 && y10.yield > 4.3) {
    signals.push('10Y yield elevated')
    confidence += 15
  }

  // 30Y approaching 5% is very bullish
  if (y30 && y30.yield > 4.8) {
    signals.push('30Y yield near 5%')
    confidence += 20
  }

  // Yields rising (positive change)
  if (y10 && y10.change > 0) {
    signals.push('Yields trending higher')
    confidence += 10
  }

  // Curve not inverted
  if (yields.curveStatus === 'normal') {
    signals.push('Yield curve normal')
    confidence += 5
  }

  const status = confidence >= 70 ? 'bullish' : confidence <= 40 ? 'bearish' : 'neutral'

  return { status, confidence: Math.min(95, confidence), signals }
}

export default function Dashboard() {
  const [selectedTicker, setSelectedTicker] = useState('TMV')

  // Real market data from Yahoo Finance + FRED
  const { prices, yields, portfolio, alerts, loading, error, refresh, lastUpdated } = useMarketData({
    refreshInterval: 30000
  })

  // Calculate thesis status from yields
  const thesisStatus = calculateThesisStatus(yields)

  // Loading state
  if (loading && !portfolio) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-accent-cyan mx-auto mb-4" />
          <p className="text-text-secondary">Loading market data...</p>
        </div>
      </div>
    )
  }

  // Use portfolio data or defaults
  const portfolioData = portfolio || {
    totalValue: 10000,
    cash: 3000,
    cashPercent: 30,
    positions: [],
    dailyPnL: 0,
    dailyPnLPercent: 0,
    weeklyPnL: 0,
    weeklyPnLPercent: 0,
    monthlyPnL: 0,
    monthlyPnLPercent: 0,
  }

  return (
    <div className="space-y-6 animate-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-text-primary">Dashboard</h1>
          <p className="text-sm text-text-secondary mt-1">30x Bond Play - Portfolio Overview</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          {error && (
            <span className="text-xs text-status-warning flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Cached
            </span>
          )}
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs text-text-muted">Updated:</span>
            <span className="text-xs font-mono text-text-secondary">
              {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Never'}
            </span>
          </div>
          <button
            onClick={refresh}
            className="p-2 hover:bg-palantir-bg-hover rounded-lg transition-colors"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 text-text-secondary ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Portfolio Value Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Value */}
        <div className="metric-card glow-border">
          <div className="flex items-center justify-between">
            <span className="data-label">Total Value</span>
            <DollarSign className="w-4 h-4 text-accent-cyan" />
          </div>
          <span className="metric-value text-text-primary">
            ${portfolioData.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <div className="flex items-center gap-1">
            {portfolioData.dailyPnL >= 0 ? (
              <ArrowUpRight className="w-4 h-4 text-status-success" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-status-danger" />
            )}
            <span className={`metric-change ${portfolioData.dailyPnL >= 0 ? 'metric-change-positive' : 'metric-change-negative'}`}>
              {portfolioData.dailyPnL >= 0 ? '+' : ''}${portfolioData.dailyPnL.toFixed(2)} ({portfolioData.dailyPnLPercent.toFixed(2)}%)
            </span>
            <span className="text-xs text-text-muted">today</span>
          </div>
        </div>

        {/* Invested */}
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <span className="data-label">Invested</span>
            <TrendingUp className="w-4 h-4 text-accent-blue" />
          </div>
          <span className="metric-value text-text-primary">
            ${(portfolioData.totalValue - portfolioData.cash).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-sm text-text-secondary">
            {(100 - portfolioData.cashPercent).toFixed(1)}% of portfolio
          </span>
        </div>

        {/* Cash */}
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <span className="data-label">Cash</span>
            <Percent className="w-4 h-4 text-status-success" />
          </div>
          <span className="metric-value text-text-primary">
            ${portfolioData.cash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-sm text-text-secondary">
            {portfolioData.cashPercent.toFixed(1)}% of portfolio
          </span>
        </div>

        {/* Weekly P&L */}
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <span className="data-label">Weekly P&L</span>
            {portfolioData.weeklyPnL >= 0 ? (
              <TrendingUp className="w-4 h-4 text-status-success" />
            ) : (
              <TrendingDown className="w-4 h-4 text-status-danger" />
            )}
          </div>
          <span className={`metric-value ${portfolioData.weeklyPnL >= 0 ? 'text-status-success' : 'text-status-danger'}`}>
            {portfolioData.weeklyPnL >= 0 ? '+' : ''}${portfolioData.weeklyPnL.toFixed(2)}
          </span>
          <span className={`text-sm ${portfolioData.weeklyPnL >= 0 ? 'text-status-success' : 'text-status-danger'}`}>
            {portfolioData.weeklyPnLPercent >= 0 ? '+' : ''}{portfolioData.weeklyPnLPercent.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Yield Chart */}
        <div className="card p-4">
          <YieldChart title="Treasury Yields (90 Days)" height={280} />
        </div>

        {/* Price Chart */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-accent-cyan" />
              <span className="font-semibold">ETF Prices</span>
            </div>
            <div className="flex gap-2">
              {['TMV', 'TBT', 'TLT'].map((ticker) => (
                <button
                  key={ticker}
                  onClick={() => setSelectedTicker(ticker)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    selectedTicker === ticker
                      ? 'bg-accent-cyan text-palantir-bg'
                      : 'bg-palantir-bg-hover text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {ticker}
                </button>
              ))}
            </div>
          </div>
          <PriceChart ticker={selectedTicker} height={250} showVolume={false} />
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Positions Table */}
        <div className="lg:col-span-2 card p-0 overflow-x-auto">
          <div className="p-4 border-b border-palantir-border flex items-center justify-between">
            <h2 className="font-semibold">Positions</h2>
            <span className="badge badge-info">{portfolioData.positions.length} Active</span>
          </div>
          {portfolioData.positions.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ticker</th>
                  <th>Shares</th>
                  <th>Price</th>
                  <th>Value</th>
                  <th>P&L</th>
                  <th>Weight</th>
                  <th>Stop</th>
                </tr>
              </thead>
              <tbody>
                {portfolioData.positions.map((pos) => (
                  <tr key={pos.id}>
                    <td>
                      <div>
                        <span className="font-semibold text-text-primary">{pos.ticker}</span>
                        <p className="text-xs text-text-muted truncate max-w-[150px]">{pos.name}</p>
                      </div>
                    </td>
                    <td>{pos.shares}</td>
                    <td>${pos.currentPrice.toFixed(2)}</td>
                    <td>${pos.marketValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td>
                      <span className={pos.unrealizedPnL >= 0 ? 'text-status-success' : 'text-status-danger'}>
                        {pos.unrealizedPnL >= 0 ? '+' : ''}${pos.unrealizedPnL.toFixed(2)} ({pos.unrealizedPnLPercent.toFixed(2)}%)
                      </span>
                    </td>
                    <td>{pos.weight.toFixed(1)}%</td>
                    <td className="text-status-danger">
                      {pos.stopLoss ? `$${pos.stopLoss.toFixed(2)}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center">
              <p className="text-text-muted">No positions yet</p>
              <p className="text-xs text-text-muted mt-1">Add positions in the Positions page</p>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Thesis Status */}
          <div className="card p-4">
            <h2 className="font-semibold mb-4">30x Thesis Status</h2>
            <div className="flex items-center gap-3 mb-4">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                thesisStatus.status === 'bullish'
                  ? 'bg-status-success-dim/30 text-status-success'
                  : thesisStatus.status === 'bearish'
                  ? 'bg-status-danger-dim/30 text-status-danger'
                  : 'bg-status-warning-dim/30 text-status-warning'
              }`}>
                {thesisStatus.status.toUpperCase()}
              </div>
              <div className="flex-1 h-2 bg-palantir-bg rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-accent-cyan to-accent-blue transition-all duration-500"
                  style={{ width: `${thesisStatus.confidence}%` }}
                />
              </div>
              <span className="text-sm font-mono">{thesisStatus.confidence}%</span>
            </div>
            <div className="space-y-2">
              {thesisStatus.signals.length > 0 ? (
                thesisStatus.signals.map((signal, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-status-success" />
                    <span className="text-text-secondary">{signal}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-text-muted">Loading signals...</p>
              )}
            </div>
          </div>

          {/* Yield Curve */}
          <div className="card p-4">
            <h2 className="font-semibold mb-4">Treasury Yields</h2>
            <div className="space-y-3">
              {yields?.yields.map((y) => (
                <div key={y.tenor} className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary w-12">{y.tenor}</span>
                  <div className="flex-1 mx-3">
                    <div className="h-2 bg-palantir-bg rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${y.yield > 4.5 ? 'bg-status-danger' : 'bg-accent-blue'}`}
                        style={{ width: `${(y.yield / 6) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-sm">{y.yield.toFixed(2)}%</span>
                    <span className={`text-xs ml-2 ${y.change > 0 ? 'text-status-danger' : 'text-status-success'}`}>
                      {y.change > 0 ? '+' : ''}{y.change.toFixed(2)}
                    </span>
                  </div>
                </div>
              )) || (
                <div className="text-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-accent-cyan mx-auto" />
                </div>
              )}
            </div>
            {yields && (
              <div className="mt-4 pt-4 border-t border-palantir-border">
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">2Y-10Y Spread</span>
                  <span className={`font-mono ${yields.spread2Y10Y >= 0 ? 'text-status-success' : 'text-status-danger'}`}>
                    {yields.spread2Y10Y >= 0 ? '+' : ''}{yields.spread2Y10Y.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-text-muted">Curve Status</span>
                  <span className={`badge ${
                    yields.curveStatus === 'normal' ? 'badge-success' :
                    yields.curveStatus === 'inverted' ? 'badge-danger' : 'badge-warning'
                  }`}>
                    {yields.curveStatus.toUpperCase()}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Recent Alerts */}
          <div className="card p-4">
            <h2 className="font-semibold mb-4">Recent Alerts</h2>
            <div className="space-y-3">
              {alerts.length > 0 ? (
                alerts.slice(0, 4).map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-lg border ${
                      alert.level === 'danger'
                        ? 'bg-status-danger/10 border-status-danger/30'
                        : alert.level === 'warning'
                        ? 'bg-status-warning-dim/10 border-status-warning/30'
                        : alert.level === 'success'
                        ? 'bg-status-success-dim/10 border-status-success/30'
                        : 'bg-accent-blue/10 border-accent-blue/30'
                    } ${alert.acknowledged ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-start gap-2">
                      {getAlertIcon(alert.level)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text-primary font-medium">{alert.title}</p>
                        <p className="text-xs text-text-muted mt-1">{alert.message}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-text-muted">{formatTimeAgo(alert.timestamp)}</span>
                          <span className="text-xs text-accent-blue">{alert.agent}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-text-muted">No alerts</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
