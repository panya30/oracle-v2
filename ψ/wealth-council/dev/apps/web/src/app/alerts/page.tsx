'use client'

import { useState, useCallback } from 'react'
import {
  Bell,
  AlertTriangle,
  CheckCircle,
  Info,
  XCircle,
  Check,
  Trash2,
  Filter,
  Clock,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  Settings,
  Plus,
  X,
  RefreshCw,
  Edit2,
  RotateCcw,
} from 'lucide-react'
import { useMarketData, usePersistedAlertRules, type StoredAlertRule } from '@/hooks'
import { CreateAlertRuleModal, AlertRule } from '@/components/alerts'

// Mock historical alerts
const historicalAlerts = [
  {
    id: 'hist-1',
    level: 'success',
    title: 'Daily P&L target achieved',
    message: 'Portfolio gained 1.52% today, exceeding 1% daily target.',
    timestamp: new Date(Date.now() - 3600000),
    agent: 'ARGUS',
    acknowledged: true,
  },
  {
    id: 'hist-2',
    level: 'warning',
    title: '30Y yield approaching 5.0%',
    message: '30Y Treasury yield at 4.93%, within 7bp of danger zone.',
    timestamp: new Date(Date.now() - 7200000),
    agent: 'HERMES',
    acknowledged: true,
  },
  {
    id: 'hist-3',
    level: 'info',
    title: 'FOMC meeting reminder',
    message: 'Federal Reserve meeting scheduled for January 29, 2026.',
    timestamp: new Date(Date.now() - 86400000),
    agent: 'CHRONOS',
    acknowledged: true,
  },
  {
    id: 'hist-4',
    level: 'danger',
    title: 'Stop loss triggered',
    message: 'TBF position closed at $18.50 (stop loss hit).',
    timestamp: new Date(Date.now() - 172800000),
    agent: 'HEPHAESTUS',
    acknowledged: true,
  },
]

function formatTime(date: Date) {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

export default function AlertsPage() {
  // Real alerts from market data API
  const { alerts, loading, acknowledgeAlert, clearAlert, refresh } = useMarketData({ refreshInterval: 30000 })
  const [filter, setFilter] = useState<'all' | 'active' | 'acknowledged'>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [showRulesModal, setShowRulesModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null)

  // Persisted alert rules (localStorage)
  const {
    rules: storedRules,
    isLoaded: rulesLoaded,
    addRule,
    updateRule,
    removeRule,
    toggleRule,
    resetRules,
  } = usePersistedAlertRules()

  // Convert stored rules to AlertRule format for UI
  const rules: AlertRule[] = storedRules.map(r => ({
    ...r,
    createdAt: new Date(r.createdAt),
  }))

  // Handle creating a new rule
  const handleCreateRule = useCallback((ruleData: Omit<AlertRule, 'id' | 'createdAt'>) => {
    addRule({
      ...ruleData,
      createdAt: new Date().toISOString(),
    } as Omit<StoredAlertRule, 'id' | 'createdAt'>)
  }, [addRule])

  // Handle editing a rule
  const handleEditRule = useCallback((rule: AlertRule) => {
    setEditingRule(rule)
    setShowCreateModal(true)
  }, [])

  // Handle updating a rule
  const handleUpdateRule = useCallback((ruleData: Omit<AlertRule, 'id' | 'createdAt'>) => {
    if (!editingRule) return
    updateRule(editingRule.id, ruleData)
    setEditingRule(null)
  }, [editingRule, updateRule])

  // Handle deleting a rule
  const handleDeleteRule = useCallback((ruleId: string) => {
    removeRule(ruleId)
  }, [removeRule])

  // Combine real alerts with historical (if any real alerts exist)
  const allAlerts = [
    ...alerts,
    ...(alerts.length === 0 ? historicalAlerts : []),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  // Apply filters
  const filteredAlerts = allAlerts.filter(alert => {
    if (filter === 'active' && alert.acknowledged) return false
    if (filter === 'acknowledged' && !alert.acknowledged) return false
    if (typeFilter !== 'all' && alert.level !== typeFilter) return false
    return true
  })

  const activeCount = allAlerts.filter(a => !a.acknowledged).length
  const dangerCount = allAlerts.filter(a => a.level === 'danger' && !a.acknowledged).length

  // Toggle rule uses the persisted hook
  const handleToggleRule = useCallback((ruleId: string) => {
    toggleRule(ruleId)
  }, [toggleRule])

  return (
    <div className="space-y-6 animate-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-text-primary flex items-center gap-3">
            <Bell className="w-6 sm:w-7 h-6 sm:h-7 text-accent-cyan" />
            Alerts
          </h1>
          <p className="text-sm text-text-secondary mt-1">ARGUS - Real-time Notifications</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {dangerCount > 0 && (
            <span className="badge badge-danger">{dangerCount} Critical</span>
          )}
          <span className="badge badge-warning">{activeCount} Active</span>
          <button
            onClick={() => setShowRulesModal(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Configure</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="metric-card">
          <div className="flex items-center justify-between mb-2">
            <span className="data-label">Active Alerts</span>
            <Bell className="w-4 h-4 text-status-warning" />
          </div>
          <span className="metric-value">{activeCount}</span>
        </div>
        <div className="metric-card">
          <div className="flex items-center justify-between mb-2">
            <span className="data-label">Critical</span>
            <XCircle className="w-4 h-4 text-status-danger" />
          </div>
          <span className="metric-value text-status-danger">{dangerCount}</span>
        </div>
        <div className="metric-card">
          <div className="flex items-center justify-between mb-2">
            <span className="data-label">Today</span>
            <Clock className="w-4 h-4 text-text-muted" />
          </div>
          <span className="metric-value">
            {allAlerts.filter(a => {
              const today = new Date()
              const alertDate = new Date(a.timestamp)
              return alertDate.toDateString() === today.toDateString()
            }).length}
          </span>
        </div>
        <div className="metric-card">
          <div className="flex items-center justify-between mb-2">
            <span className="data-label">Rules Active</span>
            <CheckCircle className="w-4 h-4 text-status-success" />
          </div>
          <span className="metric-value">{rules.filter(r => r.enabled).length}/{rules.length}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-text-muted" />
          <span className="text-sm text-text-muted">Filter:</span>
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'acknowledged'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                filter === f
                  ? 'bg-accent-cyan text-palantir-bg'
                  : 'bg-palantir-bg-card text-text-secondary hover:text-text-primary'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div className="w-px h-6 bg-palantir-border" />
        <div className="flex gap-2">
          {(['all', 'danger', 'warning', 'info', 'success'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                typeFilter === t
                  ? t === 'danger' ? 'bg-status-danger text-white' :
                    t === 'warning' ? 'bg-status-warning text-black' :
                    t === 'success' ? 'bg-status-success text-white' :
                    t === 'info' ? 'bg-accent-blue text-white' :
                    'bg-accent-cyan text-palantir-bg'
                  : 'bg-palantir-bg-card text-text-secondary hover:text-text-primary'
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts List */}
      <div className="card p-0">
        <div className="p-4 border-b border-palantir-border flex items-center justify-between">
          <h2 className="font-semibold">Alert History</h2>
          <span className="text-sm text-text-muted">{filteredAlerts.length} alerts</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-text-muted">Loading alerts...</div>
        ) : filteredAlerts.length === 0 ? (
          <div className="p-8 text-center text-text-muted">No alerts matching filters</div>
        ) : (
          <div className="divide-y divide-palantir-border">
            {filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 flex items-start gap-4 ${
                  alert.acknowledged ? 'opacity-60' : ''
                } hover:bg-palantir-bg-hover transition-colors`}
              >
                {/* Icon */}
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  alert.level === 'danger' ? 'bg-status-danger/20' :
                  alert.level === 'warning' ? 'bg-status-warning/20' :
                  alert.level === 'success' ? 'bg-status-success/20' :
                  'bg-accent-blue/20'
                }`}>
                  {alert.level === 'danger' ? (
                    <XCircle className="w-5 h-5 text-status-danger" />
                  ) : alert.level === 'warning' ? (
                    <AlertTriangle className="w-5 h-5 text-status-warning" />
                  ) : alert.level === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-status-success" />
                  ) : (
                    <Info className="w-5 h-5 text-accent-blue" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{alert.title}</span>
                    <span className={`badge text-xs ${
                      alert.level === 'danger' ? 'badge-danger' :
                      alert.level === 'warning' ? 'badge-warning' :
                      alert.level === 'success' ? 'badge-success' :
                      'badge-info'
                    }`}>
                      {alert.level}
                    </span>
                    {alert.acknowledged && (
                      <span className="badge text-xs bg-palantir-bg text-text-muted">acknowledged</span>
                    )}
                  </div>
                  <p className="text-sm text-text-secondary">{alert.message}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-text-muted">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(new Date(alert.timestamp))}
                    </span>
                    <span>From: {alert.agent}</span>
                  </div>
                </div>

                {/* Actions */}
                {!alert.acknowledged && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => acknowledgeAlert(alert.id)}
                      className="p-2 hover:bg-status-success/20 rounded-lg transition-colors"
                      title="Acknowledge"
                    >
                      <Check className="w-4 h-4 text-status-success" />
                    </button>
                    <button
                      onClick={() => clearAlert(alert.id)}
                      className="p-2 hover:bg-status-danger/20 rounded-lg transition-colors"
                      title="Dismiss"
                    >
                      <Trash2 className="w-4 h-4 text-status-danger" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Alert Rules Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card w-full max-w-2xl p-0">
            <div className="p-4 border-b border-palantir-border flex items-center justify-between">
              <h3 className="text-lg font-semibold">Alert Rules Configuration</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditingRule(null)
                    setShowCreateModal(true)
                  }}
                  className="btn-primary text-sm flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add Rule
                </button>
                <button onClick={() => setShowRulesModal(false)} className="p-1 hover:bg-palantir-bg-hover rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="divide-y divide-palantir-border max-h-96 overflow-y-auto">
              {rules.map(rule => (
                <div key={rule.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      rule.type === 'price' ? 'bg-accent-cyan/20' :
                      rule.type === 'yield' ? 'bg-status-warning/20' :
                      rule.type === 'risk' ? 'bg-status-danger/20' :
                      rule.type === 'pnl' ? 'bg-status-success/20' :
                      'bg-accent-blue/20'
                    }`}>
                      {rule.type === 'price' ? <DollarSign className="w-5 h-5 text-accent-cyan" /> :
                       rule.type === 'yield' ? <Percent className="w-5 h-5 text-status-warning" /> :
                       rule.type === 'risk' ? <AlertTriangle className="w-5 h-5 text-status-danger" /> :
                       rule.type === 'pnl' ? <TrendingUp className="w-5 h-5 text-status-success" /> :
                       <Info className="w-5 h-5 text-accent-blue" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{rule.name}</span>
                        <span className={`badge text-xs ${
                          rule.priority === 'critical' ? 'badge-danger' :
                          rule.priority === 'high' ? 'badge-warning' :
                          rule.priority === 'medium' ? 'badge-info' :
                          'badge-success'
                        }`}>
                          {rule.priority}
                        </span>
                      </div>
                      <p className="text-sm text-text-muted">{rule.description}</p>
                      {rule.ticker && rule.threshold && (
                        <p className="text-xs text-text-muted mt-1">
                          {rule.ticker} {rule.condition} {rule.threshold}{rule.unit === 'percent' ? '%' : rule.unit === 'basis_points' ? 'bp' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleEditRule(rule)}
                      className="p-2 hover:bg-palantir-bg-hover rounded-lg transition-colors"
                      title="Edit rule"
                    >
                      <Edit2 className="w-4 h-4 text-text-muted" />
                    </button>
                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className="p-2 hover:bg-status-danger/20 rounded-lg transition-colors"
                      title="Delete rule"
                    >
                      <Trash2 className="w-4 h-4 text-status-danger" />
                    </button>
                    <button
                      onClick={() => handleToggleRule(rule.id)}
                      className={`w-12 h-6 rounded-full transition-colors relative ${
                        rule.enabled ? 'bg-status-success' : 'bg-palantir-bg'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                        rule.enabled ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-palantir-border flex justify-between items-center">
              <button
                onClick={resetRules}
                className="text-sm text-text-muted hover:text-text-secondary flex items-center gap-1"
              >
                <RotateCcw className="w-4 h-4" />
                Reset to Defaults
              </button>
              <button onClick={() => setShowRulesModal(false)} className="btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Alert Rule Modal */}
      <CreateAlertRuleModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          setEditingRule(null)
        }}
        onSave={editingRule ? handleUpdateRule : handleCreateRule}
        editRule={editingRule}
      />
    </div>
  )
}
