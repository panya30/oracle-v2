'use client'

import { useState, useCallback } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Target,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  BarChart3,
  Clock,
  Zap,
  Loader2,
  Eye,
  Play,
  Pause,
  Power,
  Bot,
  RefreshCw,
} from 'lucide-react'
import { useActiveSignals, useThesisStatus, useOracleReading, Signal, useSignalProcessor, useAutomation } from '@/hooks'
import { useRealYields, useRealPrices } from '@/hooks'
import { useAutoRefresh } from '@/hooks/useAutoRefresh'
import RefreshIndicator from '@/components/common/RefreshIndicator'

// Technical levels - can be computed from price data
const technicalLevels = {
  TLT: {
    resistance: [90.00, 92.50, 95.00],
    support: [86.00, 84.00, 80.00],
    sma50: 89.20,
    sma200: 91.50,
    rsi: 32,
    macd: { value: -0.85, signal: -0.62, histogram: -0.23 },
    trend: 'bearish' as const,
  },
  TMV: {
    resistance: [45.00, 48.00, 52.00],
    support: [42.00, 40.00, 38.00],
    sma50: 41.30,
    sma200: 39.80,
    rsi: 58,
    macd: { value: 1.20, signal: 0.95, histogram: 0.25 },
    trend: 'bullish' as const,
  },
  TBT: {
    resistance: [30.00, 31.50, 33.00],
    support: [28.50, 27.50, 26.00],
    sma50: 28.40,
    sma200: 27.90,
    rsi: 54,
    macd: { value: 0.45, signal: 0.38, histogram: 0.07 },
    trend: 'bullish' as const,
  },
}

// Signal history - could be persisted
const signalHistory = [
  { date: '2026-01-20', ticker: 'TMV', type: 'entry', result: 'win', pnl: '+4.2%' },
  { date: '2026-01-18', ticker: 'TBT', type: 'entry', result: 'win', pnl: '+2.8%' },
  { date: '2026-01-15', ticker: 'TMV', type: 'exit', result: 'partial', pnl: '+6.5%' },
  { date: '2026-01-12', ticker: 'TLT', type: 'short', result: 'win', pnl: '+3.1%' },
  { date: '2026-01-10', ticker: 'TMV', type: 'entry', result: 'loss', pnl: '-2.3%' },
]

function formatTime(date: Date) {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)

  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return date.toLocaleDateString()
}

export default function SignalsPage() {
  const [selectedTicker, setSelectedTicker] = useState<string>('TMV')
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true)

  // Fetch real data from agents
  const { signals: activeSignals, loading: signalsLoading, refetch: refetchSignals } = useActiveSignals()
  const { thesis, loading: thesisLoading, refetch: refetchThesis } = useThesisStatus()
  const { oracle, loading: oracleLoading, refetch: refetchOracle } = useOracleReading()
  const { yields, loading: yieldsLoading, refresh: refreshYields } = useRealYields()
  const { prices, loading: pricesLoading, refresh: refreshPrices } = useRealPrices()

  // Signal processor for autonomous trading
  const {
    status: processorStatus,
    running: processorRunning,
    lastResult: processorResult,
    error: processorError,
    enabled: processorEnabled,
    runProcessor,
    toggleAutoRun,
  } = useSignalProcessor({ autoRun: false, intervalMs: 5 * 60 * 1000 })

  // Automation settings
  const { settings: automationSettings } = useAutomation()

  // Combined refresh function
  const refreshAll = useCallback(async () => {
    await Promise.all([
      refetchSignals(),
      refetchThesis(),
      refetchOracle(),
      refreshYields(),
      refreshPrices(),
    ])
  }, [refetchSignals, refetchThesis, refetchOracle, refreshYields, refreshPrices])

  // Auto-refresh every 30 seconds
  const { lastRefresh, isRefreshing, refresh } = useAutoRefresh({
    enabled: autoRefreshEnabled,
    interval: 30000,
    onRefresh: refreshAll,
  })

  const levels = technicalLevels[selectedTicker as keyof typeof technicalLevels]

  // Helper to find price by ticker from the array
  const findPrice = (ticker: string) => prices.find(p => p.ticker === ticker)?.price || 0
  const currentPrice = findPrice(selectedTicker)

  // Get yield values from the snapshot
  const tenYearYield = yields?.yields?.find(y => y.tenor === '10Y')?.yield || 0
  const thirtyYearYield = yields?.yields?.find(y => y.tenor === '30Y')?.yield || 0
  const tltPrice = findPrice('TLT')

  // Generate yield signals from real data
  const yieldSignals = yields ? [
    {
      level: '10Y > 4.50%',
      status: tenYearYield >= 4.5 ? 'triggered' : tenYearYield >= 4.35 ? 'approaching' : 'watching',
      current: tenYearYield,
      trigger: 4.50,
      action: 'Add to TMV'
    },
    {
      level: '10Y > 5.00%',
      status: tenYearYield >= 5.0 ? 'triggered' : 'watching',
      current: tenYearYield,
      trigger: 5.00,
      action: 'Crisis mode - max position'
    },
    {
      level: '30Y > 5.00%',
      status: thirtyYearYield >= 5.0 ? 'triggered' : thirtyYearYield >= 4.8 ? 'approaching' : 'watching',
      current: thirtyYearYield,
      trigger: 5.00,
      action: 'Bond vigilantes active'
    },
    {
      level: 'TLT < 85.00',
      status: tltPrice < 85 && tltPrice > 0 ? 'triggered' : 'watching',
      current: tltPrice,
      trigger: 85.00,
      action: 'Strong short signal'
    },
  ] : []

  const isLoading = signalsLoading || thesisLoading || yieldsLoading || pricesLoading

  return (
    <div className="space-y-6 animate-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-text-primary flex items-center gap-3">
            <Activity className="w-6 sm:w-7 h-6 sm:h-7 text-accent-cyan" />
            Signals
          </h1>
          <p className="text-sm text-text-secondary mt-1">DELPHI Technical Analysis & Trade Signals</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {thesis && (
            <span className={`badge ${
              thesis.confidence >= 70 ? 'badge-success' :
              thesis.confidence >= 50 ? 'badge-warning' :
              'badge-danger'
            }`}>
              {thesis.confidence}%
            </span>
          )}
          <span className="badge badge-success">{activeSignals.length} Signals</span>
          <RefreshIndicator
            lastRefresh={lastRefresh}
            isRefreshing={isRefreshing || isLoading}
            onRefresh={refresh}
            enabled={autoRefreshEnabled}
            onToggle={setAutoRefreshEnabled}
          />
        </div>
      </div>

      {/* Oracle Reading Banner */}
      {oracle && !oracleLoading && (
        <div className="card p-4 border-l-4 border-accent-cyan bg-gradient-to-r from-accent-cyan/5 to-transparent">
          <div className="flex items-start gap-4">
            <Eye className="w-6 h-6 text-accent-cyan mt-1" />
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold text-accent-cyan">Oracle Reading</h3>
                <span className={`badge ${
                  oracle.confidence >= 70 ? 'badge-success' :
                  oracle.confidence >= 50 ? 'badge-warning' :
                  'badge-info'
                }`}>
                  {oracle.confidence}% confidence
                </span>
              </div>
              <p className="text-text-primary mb-3">{oracle.recommendation}</p>
              <div className="flex flex-wrap gap-2">
                {oracle.keyFactors.map((factor, i) => (
                  <span key={i} className="text-xs px-2 py-1 bg-palantir-bg-hover rounded-full text-text-secondary">
                    {factor}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Signal Processor Control Panel */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${processorEnabled ? 'bg-status-success/20' : 'bg-palantir-bg'}`}>
              <Bot className={`w-6 h-6 ${processorEnabled ? 'text-status-success' : 'text-text-muted'}`} />
            </div>
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                Signal Processor
                {processorRunning && <Loader2 className="w-4 h-4 animate-spin text-accent-cyan" />}
              </h3>
              <p className="text-sm text-text-secondary">
                {automationSettings?.level === 'full-auto'
                  ? 'Full Auto Mode - Signals execute automatically'
                  : automationSettings?.level === 'semi-auto'
                  ? 'Semi-Auto Mode - Signals create proposals for approval'
                  : 'Manual Mode - Signals generate alerts only'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Status badges */}
            {processorStatus && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-text-muted">Processed:</span>
                <span className="font-mono text-text-primary">{processorStatus.processedCount}</span>
                <span className="text-text-muted">|</span>
                <span className="text-text-muted">Rules:</span>
                <span className="font-mono text-text-primary">{processorStatus.rulesCount}</span>
              </div>
            )}

            {/* Manual run button */}
            <button
              onClick={() => runProcessor(true)}
              disabled={processorRunning}
              className="btn-secondary flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${processorRunning ? 'animate-spin' : ''}`} />
              Run Now
            </button>

            {/* Auto-run toggle */}
            <button
              onClick={toggleAutoRun}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                processorEnabled
                  ? 'bg-status-success text-white'
                  : 'bg-palantir-bg-hover text-text-secondary hover:text-text-primary'
              }`}
            >
              {processorEnabled ? (
                <>
                  <Pause className="w-4 h-4" />
                  Auto: ON
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Auto: OFF
                </>
              )}
            </button>
          </div>
        </div>

        {/* Last result / error */}
        {processorError && (
          <div className="mt-4 p-3 bg-status-danger/10 border border-status-danger/20 rounded-lg text-sm text-status-danger">
            {processorError}
          </div>
        )}

        {processorResult && !processorError && (
          <div className="mt-4 p-3 bg-palantir-bg rounded-lg">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="text-text-muted">Last run:</span>
              <span className="font-mono text-text-primary">
                {new Date(processorResult.timestamp).toLocaleTimeString()}
              </span>
              <span className="text-text-muted">|</span>
              <span className="text-text-muted">Signals:</span>
              <span className={`font-mono ${processorResult.signalsGenerated > 0 ? 'text-status-success' : 'text-text-primary'}`}>
                {processorResult.signalsGenerated}
              </span>
              {processorResult.market && (
                <>
                  <span className="text-text-muted">|</span>
                  <span className="text-text-muted">10Y:</span>
                  <span className="font-mono text-accent-cyan">{processorResult.market.yields?.y10?.toFixed(2)}%</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Active Signals */}
      <div className="card p-0">
        <div className="p-4 border-b border-palantir-border flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <Zap className="w-5 h-5 text-status-warning" />
            Active Signals
          </h2>
          {signalsLoading && <Loader2 className="w-4 h-4 animate-spin text-text-muted" />}
        </div>
        <div className="divide-y divide-palantir-border">
          {activeSignals.length === 0 && !signalsLoading ? (
            <div className="p-8 text-center text-text-muted">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No active signals. DELPHI is monitoring the market.</p>
            </div>
          ) : (
            activeSignals.map((signal: Signal) => (
              <div key={signal.id} className="p-4 hover:bg-palantir-bg-hover transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    {/* Signal Icon */}
                    <div className={`p-2 rounded-lg ${
                      signal.type === 'entry' ? 'bg-status-success-dim/20' :
                      signal.type === 'exit' ? 'bg-status-warning-dim/20' :
                      'bg-accent-blue/20'
                    }`}>
                      {signal.type === 'entry' ? (
                        <ArrowUpRight className={`w-5 h-5 ${signal.direction === 'bullish' ? 'text-status-success' : 'text-status-danger'}`} />
                      ) : signal.type === 'exit' ? (
                        <ArrowDownRight className="w-5 h-5 text-status-warning" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-accent-blue" />
                      )}
                    </div>

                    {/* Signal Details */}
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-lg">{signal.ticker}</span>
                        <span className={`badge ${
                          signal.direction === 'bullish' ? 'badge-success' :
                          signal.direction === 'bearish' ? 'badge-danger' :
                          'badge-warning'
                        }`}>
                          {signal.direction.toUpperCase()}
                        </span>
                        <span className={`badge ${
                          signal.strength === 'strong' ? 'badge-success' :
                          signal.strength === 'moderate' ? 'badge-warning' :
                          'badge-info'
                        }`}>
                          {signal.strength}
                        </span>
                      </div>
                      <p className="text-sm text-text-secondary mt-1 max-w-xl">{signal.reason}</p>

                      {/* Levels */}
                      {signal.entry && (
                        <div className="flex items-center gap-6 mt-3 text-sm">
                          <div>
                            <span className="text-text-muted">Entry:</span>
                            <span className="font-mono ml-2 text-text-primary">${signal.entry.toFixed(2)}</span>
                          </div>
                          {signal.stopLoss && (
                            <div>
                              <span className="text-text-muted">Stop:</span>
                              <span className="font-mono ml-2 text-status-danger">${signal.stopLoss.toFixed(2)}</span>
                            </div>
                          )}
                          {signal.target1 && (
                            <div>
                              <span className="text-text-muted">T1:</span>
                              <span className="font-mono ml-2 text-status-success">${signal.target1.toFixed(2)}</span>
                            </div>
                          )}
                          {signal.target2 && (
                            <div>
                              <span className="text-text-muted">T2:</span>
                              <span className="font-mono ml-2 text-status-success">${signal.target2.toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Side - Confidence & Time */}
                  <div className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-sm text-text-muted">Confidence</span>
                      <span className={`font-mono font-semibold ${
                        signal.confidence >= 70 ? 'text-status-success' :
                        signal.confidence >= 50 ? 'text-status-warning' :
                        'text-status-danger'
                      }`}>
                        {signal.confidence}%
                      </span>
                    </div>
                    <div className="flex items-center gap-1 justify-end mt-2 text-text-muted">
                      <Clock className="w-3 h-3" />
                      <span className="text-xs">{formatTime(signal.timestamp)}</span>
                    </div>
                    <span className={`badge mt-2 ${
                      signal.status === 'active' ? 'badge-success' :
                      signal.status === 'pending' ? 'badge-warning' :
                      'badge-info'
                    }`}>
                      {signal.status}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Technical Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Ticker Selector & Levels */}
        <div className="lg:col-span-2 card p-0">
          <div className="p-4 border-b border-palantir-border">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-accent-cyan" />
                Technical Levels
              </h2>
              <div className="flex gap-2">
                {Object.keys(technicalLevels).map((ticker) => (
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
          </div>

          <div className="p-4">
            {/* Price & Trend */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-3xl font-mono font-semibold">
                  ${currentPrice > 0 ? currentPrice.toFixed(2) : '--'}
                </span>
                <span className={`ml-3 badge ${levels.trend === 'bullish' ? 'badge-success' : 'badge-danger'}`}>
                  {levels.trend === 'bullish' ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                  {levels.trend.toUpperCase()}
                </span>
                {pricesLoading && <Loader2 className="w-4 h-4 animate-spin inline ml-2 text-text-muted" />}
              </div>
              <div className="text-right">
                <div className="text-sm text-text-muted">RSI (14)</div>
                <div className={`font-mono text-lg ${
                  levels.rsi > 70 ? 'text-status-danger' :
                  levels.rsi < 30 ? 'text-status-success' :
                  'text-text-primary'
                }`}>
                  {levels.rsi}
                </div>
              </div>
            </div>

            {/* Support & Resistance */}
            <div className="grid grid-cols-2 gap-6">
              {/* Resistance */}
              <div>
                <h3 className="text-sm font-medium text-text-muted mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-status-danger" />
                  Resistance Levels
                </h3>
                <div className="space-y-2">
                  {levels.resistance.map((level, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-palantir-bg rounded-lg">
                      <span className="text-sm text-text-secondary">R{i + 1}</span>
                      <span className="font-mono text-status-danger">${level.toFixed(2)}</span>
                      <span className="text-xs text-text-muted">
                        {currentPrice > 0 ? (((level - currentPrice) / currentPrice) * 100).toFixed(1) : '--'}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Support */}
              <div>
                <h3 className="text-sm font-medium text-text-muted mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-status-success" />
                  Support Levels
                </h3>
                <div className="space-y-2">
                  {levels.support.map((level, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-palantir-bg rounded-lg">
                      <span className="text-sm text-text-secondary">S{i + 1}</span>
                      <span className="font-mono text-status-success">${level.toFixed(2)}</span>
                      <span className="text-xs text-text-muted">
                        {currentPrice > 0 ? (((level - currentPrice) / currentPrice) * 100).toFixed(1) : '--'}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Moving Averages & MACD */}
            <div className="grid grid-cols-2 gap-6 mt-6 pt-6 border-t border-palantir-border">
              <div>
                <h3 className="text-sm font-medium text-text-muted mb-3">Moving Averages</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">50 SMA</span>
                    <span className={`font-mono ${currentPrice > levels.sma50 ? 'text-status-success' : 'text-status-danger'}`}>
                      ${levels.sma50.toFixed(2)}
                      {currentPrice > levels.sma50 ? ' ▲' : ' ▼'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">200 SMA</span>
                    <span className={`font-mono ${currentPrice > levels.sma200 ? 'text-status-success' : 'text-status-danger'}`}>
                      ${levels.sma200.toFixed(2)}
                      {currentPrice > levels.sma200 ? ' ▲' : ' ▼'}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-text-muted mb-3">MACD</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">MACD Line</span>
                    <span className={`font-mono ${levels.macd.value > 0 ? 'text-status-success' : 'text-status-danger'}`}>
                      {levels.macd.value.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Signal</span>
                    <span className="font-mono text-text-secondary">{levels.macd.signal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Histogram</span>
                    <span className={`font-mono ${levels.macd.histogram > 0 ? 'text-status-success' : 'text-status-danger'}`}>
                      {levels.macd.histogram > 0 ? '+' : ''}{levels.macd.histogram.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Yield Trigger Levels */}
          <div className="card p-4">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-status-warning" />
              Yield Triggers
              {yieldsLoading && <Loader2 className="w-4 h-4 animate-spin text-text-muted" />}
            </h2>
            <div className="space-y-3">
              {yieldSignals.length === 0 ? (
                <div className="text-center text-text-muted py-4">Loading yield data...</div>
              ) : (
                yieldSignals.map((trigger, i) => (
                  <div key={i} className="p-3 bg-palantir-bg rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{trigger.level}</span>
                      <span className={`badge ${
                        trigger.status === 'triggered' ? 'badge-success' :
                        trigger.status === 'approaching' ? 'badge-warning' : 'badge-info'
                      }`}>
                        {trigger.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-muted">Current: <span className="font-mono">{trigger.current.toFixed(2)}</span></span>
                      <span className="text-text-muted">Trigger: <span className="font-mono text-accent-cyan">{trigger.trigger.toFixed(2)}</span></span>
                    </div>
                    <p className="text-xs text-text-secondary mt-2">{trigger.action}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Signal History */}
          <div className="card p-4">
            <h2 className="font-semibold mb-4">Signal History</h2>
            <div className="space-y-2">
              {signalHistory.map((sig, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-palantir-bg rounded-lg">
                  <div className="flex items-center gap-3">
                    {sig.result === 'win' ? (
                      <CheckCircle2 className="w-4 h-4 text-status-success" />
                    ) : sig.result === 'loss' ? (
                      <XCircle className="w-4 h-4 text-status-danger" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-status-warning" />
                    )}
                    <div>
                      <span className="text-sm font-medium">{sig.ticker}</span>
                      <span className="text-xs text-text-muted ml-2">{sig.type}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`font-mono text-sm ${
                      sig.pnl.startsWith('+') ? 'text-status-success' : 'text-status-danger'
                    }`}>
                      {sig.pnl}
                    </span>
                    <p className="text-xs text-text-muted">{sig.date}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-palantir-border">
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Win Rate</span>
                <span className="font-mono text-status-success">80%</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-text-muted">Avg Return</span>
                <span className="font-mono text-status-success">+2.9%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
