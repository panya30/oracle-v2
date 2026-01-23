'use client'

import { useState, useEffect } from 'react'
import {
  Settings,
  Server,
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Zap,
  Bot,
  Hand,
  Brain,
  Bell,
  Power,
  Save,
  Loader2,
} from 'lucide-react'
import { useAutomation } from '@/hooks'
import type { AutomationSettings, AutomationLevel } from '@/lib/automation-settings'
import ProposalQueue from '@/components/automation/ProposalQueue'

interface BrokerStatus {
  ibkr: {
    configured: boolean
    gatewayUrl: string | null
    authenticated: boolean
  }
  alpaca: {
    configured: boolean
    paper: boolean
  }
  preferred: string | null
}

interface BrokerSettings {
  preferredBroker: 'auto' | 'ibkr' | 'alpaca'
  tradingMode: 'paper' | 'live'
}

const SETTINGS_KEY = 'wealth-council-broker-settings'

const defaultSettings: BrokerSettings = {
  preferredBroker: 'auto',
  tradingMode: 'paper',
}

const AUTOMATION_LEVELS: {
  level: AutomationLevel
  name: string
  icon: typeof Hand
  description: string
  color: string
}[] = [
  {
    level: 'manual',
    name: 'Manual',
    icon: Hand,
    description: 'Alerts only. You execute all trades manually.',
    color: 'text-text-muted',
  },
  {
    level: 'semi-auto',
    name: 'Semi-Auto',
    icon: Brain,
    description: 'Agents propose trades. You approve with 1-click.',
    color: 'text-status-warning',
  },
  {
    level: 'full-auto',
    name: 'Full Auto',
    icon: Bot,
    description: 'Agents execute trades automatically with safety guards.',
    color: 'text-status-success',
  },
]

export default function SettingsPage() {
  const [status, setStatus] = useState<BrokerStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<BrokerSettings>(defaultSettings)
  const [saving, setSaving] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  // Automation state
  const {
    settings: automationSettings,
    proposals,
    stats,
    loading: automationLoading,
    updateSettings: updateAutomation,
    approveProposal,
    rejectProposal,
    activateKillSwitch,
    processSignal,
    refresh: refreshAutomation,
  } = useAutomation()

  const [localAutomation, setLocalAutomation] = useState<AutomationSettings | null>(null)
  const [savingAutomation, setSavingAutomation] = useState(false)
  const [testingSignal, setTestingSignal] = useState(false)

  // Sync automation settings
  useEffect(() => {
    if (automationSettings && !localAutomation) {
      setLocalAutomation(automationSettings)
    }
  }, [automationSettings, localAutomation])

  const handleSaveAutomation = async () => {
    if (!localAutomation) return
    setSavingAutomation(true)
    await updateAutomation(localAutomation)
    setSavingAutomation(false)
  }

  const handleKillSwitch = async () => {
    if (confirm('Are you sure you want to activate the KILL SWITCH? This will halt all automated trading.')) {
      await activateKillSwitch()
      if (localAutomation) {
        setLocalAutomation({ ...localAutomation, enabled: false })
      }
    }
  }

  const handleTestSignal = async () => {
    setTestingSignal(true)
    await processSignal({
      ticker: 'TMV',
      action: 'buy',
      confidence: 85,
      reasoning: 'Test signal: 10Y yield rising, bond prices expected to fall.',
      agent: 'DELPHI',
      currentPrice: 36.69,
    })
    setTestingSignal(false)
  }

  const automationDirty = localAutomation && JSON.stringify(localAutomation) !== JSON.stringify(automationSettings)

  // Load settings from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(SETTINGS_KEY)
    if (stored) {
      setSettings(JSON.parse(stored))
    }
  }, [])

  // Fetch broker status
  const fetchStatus = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/broker?action=status')
      const data = await res.json()
      if (data.success) {
        setStatus(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch broker status:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  // Save settings
  const saveSettings = (newSettings: BrokerSettings) => {
    setSettings(newSettings)
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings))
    setSaving(true)
    setTimeout(() => setSaving(false), 1000)
  }

  // Test connection
  const testConnection = async () => {
    setTestResult(null)
    try {
      const broker = settings.preferredBroker === 'auto' ? '' : `&broker=${settings.preferredBroker}`
      const res = await fetch(`/api/broker?action=portfolio${broker}`)
      const data = await res.json()

      if (data.success) {
        setTestResult({
          success: true,
          message: `Connected to ${data.source}! Portfolio: $${data.data.totalValue?.toLocaleString() || 0}`,
        })
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Connection failed',
        })
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Network error',
      })
    }
  }

  return (
    <div className="space-y-6 animate-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-text-primary flex items-center gap-3">
            <Settings className="w-6 sm:w-7 h-6 sm:h-7 text-accent-cyan" />
            Settings
          </h1>
          <p className="text-sm text-text-secondary mt-1">Broker & Trading Configuration</p>
        </div>
        <button
          onClick={fetchStatus}
          className="btn-secondary flex items-center gap-2"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Broker Status */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Server className="w-5 h-5 text-accent-cyan" />
          Broker Connections
        </h2>

        {loading ? (
          <div className="text-center py-8 text-text-muted">Loading status...</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {/* Alpaca Status */}
            <div className={`p-4 rounded-lg border ${
              status?.alpaca.configured
                ? 'border-status-success/50 bg-status-success/10'
                : 'border-palantir-border bg-palantir-bg'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">Alpaca Markets</h3>
                {status?.alpaca.configured ? (
                  <span className="flex items-center gap-1 text-status-success text-sm">
                    <CheckCircle className="w-4 h-4" />
                    Connected
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-text-muted text-sm">
                    <XCircle className="w-4 h-4" />
                    Not configured
                  </span>
                )}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-muted">Mode:</span>
                  <span className={status?.alpaca.paper ? 'text-status-warning' : 'text-status-success'}>
                    {status?.alpaca.paper ? '📝 Paper Trading' : '💰 Live Trading'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Best for:</span>
                  <span>US Markets</span>
                </div>
              </div>
              {!status?.alpaca.configured && (
                <a
                  href="https://app.alpaca.markets/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 text-xs text-accent-cyan hover:underline flex items-center gap-1"
                >
                  Get API keys <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {/* IBKR Status */}
            <div className={`p-4 rounded-lg border ${
              status?.ibkr.configured && status?.ibkr.authenticated
                ? 'border-status-success/50 bg-status-success/10'
                : status?.ibkr.configured
                ? 'border-status-warning/50 bg-status-warning/10'
                : 'border-palantir-border bg-palantir-bg'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">Interactive Brokers</h3>
                {status?.ibkr.configured && status?.ibkr.authenticated ? (
                  <span className="flex items-center gap-1 text-status-success text-sm">
                    <CheckCircle className="w-4 h-4" />
                    Connected
                  </span>
                ) : status?.ibkr.configured ? (
                  <span className="flex items-center gap-1 text-status-warning text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    Gateway running
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-text-muted text-sm">
                    <XCircle className="w-4 h-4" />
                    Not configured
                  </span>
                )}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-muted">Gateway:</span>
                  <span className={status?.ibkr.gatewayUrl ? 'text-text-primary' : 'text-text-muted'}>
                    {status?.ibkr.gatewayUrl || 'Not set'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Best for:</span>
                  <span>Asia/HK Markets</span>
                </div>
              </div>
              {!status?.ibkr.configured && (
                <a
                  href="https://www.interactivebrokers.com/en/trading/ib-api.php"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 text-xs text-accent-cyan hover:underline flex items-center gap-1"
                >
                  Download Gateway <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Broker Selection */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-accent-cyan" />
          Trading Preferences
        </h2>

        <div className="space-y-6">
          {/* Preferred Broker */}
          <div>
            <label className="block text-sm font-medium mb-3">Preferred Broker</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'auto', label: 'Auto', desc: 'Use best available' },
                { value: 'alpaca', label: 'Alpaca', desc: 'US markets' },
                { value: 'ibkr', label: 'IBKR', desc: 'Asia/HK markets' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => saveSettings({ ...settings, preferredBroker: option.value as any })}
                  className={`p-4 rounded-lg border text-left transition-all ${
                    settings.preferredBroker === option.value
                      ? 'border-accent-cyan bg-accent-cyan/10'
                      : 'border-palantir-border hover:border-palantir-border-hover'
                  }`}
                >
                  <div className="font-medium">{option.label}</div>
                  <div className="text-xs text-text-muted mt-1">{option.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Trading Mode */}
          <div>
            <label className="block text-sm font-medium mb-3">Trading Mode</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => saveSettings({ ...settings, tradingMode: 'paper' })}
                className={`p-4 rounded-lg border text-left transition-all ${
                  settings.tradingMode === 'paper'
                    ? 'border-status-warning bg-status-warning/10'
                    : 'border-palantir-border hover:border-palantir-border-hover'
                }`}
              >
                <div className="font-medium flex items-center gap-2">
                  📝 Paper Trading
                </div>
                <div className="text-xs text-text-muted mt-1">Practice with virtual money</div>
              </button>
              <button
                onClick={() => saveSettings({ ...settings, tradingMode: 'live' })}
                className={`p-4 rounded-lg border text-left transition-all ${
                  settings.tradingMode === 'live'
                    ? 'border-status-danger bg-status-danger/10'
                    : 'border-palantir-border hover:border-palantir-border-hover'
                }`}
              >
                <div className="font-medium flex items-center gap-2">
                  💰 Live Trading
                </div>
                <div className="text-xs text-text-muted mt-1">Real money (use with caution)</div>
              </button>
            </div>
            {settings.tradingMode === 'live' && (
              <div className="mt-3 p-3 rounded-lg bg-status-danger/20 border border-status-danger/50 text-sm">
                <strong>Warning:</strong> Live trading uses real money. Make sure your broker account is properly configured.
              </div>
            )}
          </div>

          {/* Test Connection */}
          <div className="pt-4 border-t border-palantir-border">
            <button
              onClick={testConnection}
              className="btn-primary"
            >
              Test Connection
            </button>
            {testResult && (
              <div className={`mt-3 p-3 rounded-lg text-sm ${
                testResult.success
                  ? 'bg-status-success/20 border border-status-success/50'
                  : 'bg-status-danger/20 border border-status-danger/50'
              }`}>
                {testResult.success ? '✅' : '❌'} {testResult.message}
              </div>
            )}
            {saving && (
              <span className="ml-3 text-sm text-status-success">Settings saved!</span>
            )}
          </div>
        </div>
      </div>

      {/* Trading Automation */}
      {localAutomation && (
        <>
          {/* Kill Switch Banner */}
          {!localAutomation.enabled && (
            <div className="p-4 bg-status-danger/20 border border-status-danger/50 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-status-danger" />
                <div>
                  <p className="font-semibold text-status-danger">KILL SWITCH ACTIVE</p>
                  <p className="text-sm text-status-danger/80">All automated trading is halted</p>
                </div>
              </div>
              <button
                onClick={() => setLocalAutomation({ ...localAutomation, enabled: true })}
                className="btn-primary bg-status-success"
              >
                Re-enable
              </button>
            </div>
          )}

          {/* Automation Level */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Zap className="w-5 h-5 text-accent-cyan" />
                Trading Automation
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveAutomation}
                  disabled={!automationDirty || savingAutomation}
                  className="btn-primary flex items-center gap-2 text-sm"
                >
                  {savingAutomation ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {AUTOMATION_LEVELS.map(({ level, name, icon: Icon, description, color }) => {
                const isSelected = localAutomation.level === level

                return (
                  <button
                    key={level}
                    onClick={() => setLocalAutomation({ ...localAutomation, level })}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      isSelected
                        ? 'border-accent-cyan bg-accent-cyan/10'
                        : 'border-palantir-border hover:border-text-muted bg-surface-secondary'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Icon className={`w-6 h-6 ${isSelected ? 'text-accent-cyan' : color}`} />
                      <span className="font-semibold">{name}</span>
                      {isSelected && <CheckCircle className="w-4 h-4 text-accent-cyan ml-auto" />}
                    </div>
                    <p className="text-sm text-text-secondary">{description}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Trade Proposals (for semi-auto) */}
          {localAutomation.level === 'semi-auto' && (
            <ProposalQueue
              proposals={proposals}
              onApprove={approveProposal}
              onReject={rejectProposal}
              loading={automationLoading}
            />
          )}

          {/* Risk Limits */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-status-warning" />
              Risk Limits
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm text-text-muted mb-1">Max Position Size</label>
                <div className="relative">
                  <input
                    type="number"
                    value={localAutomation.riskLimits.maxPositionSize}
                    onChange={(e) => setLocalAutomation({
                      ...localAutomation,
                      riskLimits: { ...localAutomation.riskLimits, maxPositionSize: Number(e.target.value) }
                    })}
                    className="w-full px-3 py-2 bg-surface-secondary border border-palantir-border rounded-lg"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">%</span>
                </div>
              </div>

              <div>
                <label className="block text-sm text-text-muted mb-1">Max Daily Trades</label>
                <input
                  type="number"
                  value={localAutomation.riskLimits.maxDailyTrades}
                  onChange={(e) => setLocalAutomation({
                    ...localAutomation,
                    riskLimits: { ...localAutomation.riskLimits, maxDailyTrades: Number(e.target.value) }
                  })}
                  className="w-full px-3 py-2 bg-surface-secondary border border-palantir-border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm text-text-muted mb-1">Max Daily Loss</label>
                <div className="relative">
                  <input
                    type="number"
                    value={localAutomation.riskLimits.maxDailyLoss}
                    onChange={(e) => setLocalAutomation({
                      ...localAutomation,
                      riskLimits: { ...localAutomation.riskLimits, maxDailyLoss: Number(e.target.value) }
                    })}
                    className="w-full px-3 py-2 bg-surface-secondary border border-palantir-border rounded-lg"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">%</span>
                </div>
              </div>

              <div>
                <label className="block text-sm text-text-muted mb-1">Max Order Value</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">$</span>
                  <input
                    type="number"
                    value={localAutomation.riskLimits.maxOrderValue}
                    onChange={(e) => setLocalAutomation({
                      ...localAutomation,
                      riskLimits: { ...localAutomation.riskLimits, maxOrderValue: Number(e.target.value) }
                    })}
                    className="w-full pl-7 pr-3 py-2 bg-surface-secondary border border-palantir-border rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localAutomation.riskLimits.tradingHoursOnly}
                  onChange={(e) => setLocalAutomation({
                    ...localAutomation,
                    riskLimits: { ...localAutomation.riskLimits, tradingHoursOnly: e.target.checked }
                  })}
                  className="w-4 h-4 rounded border-palantir-border bg-surface-secondary"
                />
                <span className="text-sm">Only trade during market hours</span>
              </label>
            </div>
          </div>

          {/* Signal Filters */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-accent-blue" />
              Signal Filters
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-text-muted mb-1">
                  Minimum Confidence ({localAutomation.signalFilters.minConfidence}%)
                </label>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={localAutomation.signalFilters.minConfidence}
                  onChange={(e) => setLocalAutomation({
                    ...localAutomation,
                    signalFilters: { ...localAutomation.signalFilters, minConfidence: Number(e.target.value) }
                  })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm text-text-muted mb-2">Allowed Agents</label>
                <div className="flex flex-wrap gap-2">
                  {['DELPHI', 'ATHENA', 'HERMES', 'TYCHE'].map((agent) => {
                    const isAllowed = localAutomation.signalFilters.allowedAgents.includes(agent)
                    return (
                      <button
                        key={agent}
                        onClick={() => {
                          const agents = isAllowed
                            ? localAutomation.signalFilters.allowedAgents.filter(a => a !== agent)
                            : [...localAutomation.signalFilters.allowedAgents, agent]
                          setLocalAutomation({
                            ...localAutomation,
                            signalFilters: { ...localAutomation.signalFilters, allowedAgents: agents }
                          })
                        }}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                          isAllowed
                            ? 'bg-accent-cyan text-palantir-bg'
                            : 'bg-surface-secondary text-text-muted hover:bg-surface-tertiary'
                        }`}
                      >
                        {agent}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm text-text-muted mb-2">Allowed Tickers</label>
                <div className="flex flex-wrap gap-2">
                  {['TMV', 'TBT', 'TBF', 'TLT', 'ZROZ', 'IEF'].map((ticker) => {
                    const isAllowed = localAutomation.signalFilters.allowedTickers.includes(ticker)
                    return (
                      <button
                        key={ticker}
                        onClick={() => {
                          const tickers = isAllowed
                            ? localAutomation.signalFilters.allowedTickers.filter(t => t !== ticker)
                            : [...localAutomation.signalFilters.allowedTickers, ticker]
                          setLocalAutomation({
                            ...localAutomation,
                            signalFilters: { ...localAutomation.signalFilters, allowedTickers: tickers }
                          })
                        }}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                          isAllowed
                            ? 'bg-status-success text-white'
                            : 'bg-surface-secondary text-text-muted hover:bg-surface-tertiary'
                        }`}
                      >
                        {ticker}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Daily Stats & Controls */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Today's Trading Stats</h2>
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <p className="text-2xl font-mono font-bold">{stats?.tradesCount || 0}</p>
                <p className="text-xs text-text-muted">Trades</p>
              </div>
              <div className="text-center">
                <p className={`text-2xl font-mono font-bold ${(stats?.totalPnL || 0) >= 0 ? 'text-status-success' : 'text-status-danger'}`}>
                  {(stats?.totalPnL || 0) >= 0 ? '+' : ''}${(stats?.totalPnL || 0).toFixed(2)}
                </p>
                <p className="text-xs text-text-muted">P&L</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-mono font-bold text-status-danger">
                  ${(stats?.maxDrawdown || 0).toFixed(2)}
                </p>
                <p className="text-xs text-text-muted">Max Drawdown</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-mono font-bold">
                  {localAutomation.riskLimits.maxDailyTrades - (stats?.tradesCount || 0)}
                </p>
                <p className="text-xs text-text-muted">Trades Left</p>
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-palantir-border">
              <button
                onClick={handleTestSignal}
                disabled={testingSignal}
                className="btn-secondary flex items-center gap-2"
              >
                {testingSignal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                Test Signal
              </button>

              <button
                onClick={handleKillSwitch}
                disabled={!localAutomation.enabled}
                className="btn-secondary text-status-danger border-status-danger/50 hover:bg-status-danger/10 flex items-center gap-2 ml-auto"
              >
                <Power className="w-4 h-4" />
                KILL SWITCH
              </button>
            </div>
          </div>
        </>
      )}

      {/* Environment Info */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Environment Configuration</h2>
        <p className="text-sm text-text-muted mb-4">
          API keys are configured in <code className="bg-palantir-bg px-2 py-1 rounded">.env.local</code>
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="p-3 rounded-lg bg-palantir-bg">
            <div className="text-text-muted">Finnhub</div>
            <div className={status?.alpaca.configured ? 'text-status-success' : 'text-text-muted'}>
              {/* We don't have finnhub status, show based on general config */}
              Check .env
            </div>
          </div>
          <div className="p-3 rounded-lg bg-palantir-bg">
            <div className="text-text-muted">FRED</div>
            <div className="text-text-muted">Check .env</div>
          </div>
          <div className="p-3 rounded-lg bg-palantir-bg">
            <div className="text-text-muted">OpenAI</div>
            <div className="text-text-muted">Check .env</div>
          </div>
          <div className="p-3 rounded-lg bg-palantir-bg">
            <div className="text-text-muted">Alpha Vantage</div>
            <div className="text-text-muted">Check .env</div>
          </div>
        </div>
      </div>
    </div>
  )
}
