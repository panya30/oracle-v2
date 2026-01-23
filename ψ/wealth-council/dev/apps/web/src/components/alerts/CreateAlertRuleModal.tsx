'use client'

import { useState, useCallback } from 'react'
import {
  X,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  AlertTriangle,
  Bell,
  Target,
} from 'lucide-react'

export interface AlertRule {
  id: string
  name: string
  description: string
  enabled: boolean
  type: 'price' | 'yield' | 'risk' | 'pnl' | 'custom'
  condition: 'above' | 'below' | 'equals' | 'crosses'
  ticker?: string
  threshold?: number
  unit?: 'price' | 'percent' | 'basis_points'
  priority: 'low' | 'medium' | 'high' | 'critical'
  cooldown: number // minutes between alerts
  notifyOnce: boolean
  createdAt: Date
}

interface CreateAlertRuleModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (rule: Omit<AlertRule, 'id' | 'createdAt'>) => void
  editRule?: AlertRule | null
}

const TICKERS = ['TMV', 'TBT', 'TBF', 'TLT', '10Y', '30Y', '2Y']

export default function CreateAlertRuleModal({
  isOpen,
  onClose,
  onSave,
  editRule,
}: CreateAlertRuleModalProps) {
  const [name, setName] = useState(editRule?.name || '')
  const [description, setDescription] = useState(editRule?.description || '')
  const [type, setType] = useState<AlertRule['type']>(editRule?.type || 'price')
  const [condition, setCondition] = useState<AlertRule['condition']>(editRule?.condition || 'above')
  const [ticker, setTicker] = useState(editRule?.ticker || 'TMV')
  const [threshold, setThreshold] = useState(editRule?.threshold || 0)
  const [unit, setUnit] = useState<AlertRule['unit']>(editRule?.unit || 'price')
  const [priority, setPriority] = useState<AlertRule['priority']>(editRule?.priority || 'medium')
  const [cooldown, setCooldown] = useState(editRule?.cooldown || 60)
  const [notifyOnce, setNotifyOnce] = useState(editRule?.notifyOnce || false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = useCallback(() => {
    // Validation
    if (!name.trim()) {
      setError('Name is required')
      return
    }

    if (threshold <= 0 && (type === 'price' || type === 'yield')) {
      setError('Threshold must be greater than 0')
      return
    }

    const rule: Omit<AlertRule, 'id' | 'createdAt'> = {
      name: name.trim(),
      description: description.trim() || `Alert when ${ticker} ${condition} ${threshold}`,
      enabled: true,
      type,
      condition,
      ticker: type === 'price' || type === 'yield' ? ticker : undefined,
      threshold,
      unit,
      priority,
      cooldown,
      notifyOnce,
    }

    onSave(rule)
    onClose()
  }, [name, description, type, condition, ticker, threshold, unit, priority, cooldown, notifyOnce, onSave, onClose])

  if (!isOpen) return null

  const getTypeIcon = (t: AlertRule['type']) => {
    switch (t) {
      case 'price': return <DollarSign className="w-4 h-4" />
      case 'yield': return <Percent className="w-4 h-4" />
      case 'risk': return <AlertTriangle className="w-4 h-4" />
      case 'pnl': return <TrendingUp className="w-4 h-4" />
      case 'custom': return <Bell className="w-4 h-4" />
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-surface-primary border border-palantir-border rounded-xl shadow-2xl w-full max-w-lg animate-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-palantir-border">
          <div className="flex items-center gap-3">
            <Target className="w-5 h-5 text-accent-cyan" />
            <h2 className="text-lg font-semibold">
              {editRule ? 'Edit Alert Rule' : 'Create Alert Rule'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-secondary rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Name */}
          <div>
            <label className="block text-sm text-text-muted mb-2">Rule Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., TMV Price Target"
              className="w-full px-4 py-2 bg-surface-secondary rounded-lg border border-palantir-border focus:border-accent-cyan focus:outline-none"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm text-text-muted mb-2">Alert Type</label>
            <div className="grid grid-cols-5 gap-2">
              {(['price', 'yield', 'risk', 'pnl', 'custom'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`p-3 rounded-lg text-xs font-medium flex flex-col items-center gap-1 transition-colors ${
                    type === t
                      ? 'bg-accent-cyan text-palantir-bg'
                      : 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary'
                  }`}
                >
                  {getTypeIcon(t)}
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Ticker (for price/yield types) */}
          {(type === 'price' || type === 'yield') && (
            <div>
              <label className="block text-sm text-text-muted mb-2">
                {type === 'price' ? 'Ticker' : 'Yield'}
              </label>
              <div className="grid grid-cols-7 gap-2">
                {(type === 'yield' ? ['2Y', '10Y', '30Y'] : ['TMV', 'TBT', 'TBF', 'TLT']).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTicker(t)}
                    className={`py-2 rounded-lg text-sm font-mono transition-colors ${
                      ticker === t
                        ? 'bg-accent-cyan text-palantir-bg'
                        : 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Condition */}
          <div>
            <label className="block text-sm text-text-muted mb-2">Condition</label>
            <div className="grid grid-cols-4 gap-2">
              {(['above', 'below', 'crosses', 'equals'] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setCondition(c)}
                  className={`py-2 rounded-lg text-sm transition-colors ${
                    condition === c
                      ? 'bg-accent-cyan text-palantir-bg'
                      : 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary'
                  }`}
                >
                  {c === 'above' && <TrendingUp className="w-3 h-3 inline mr-1" />}
                  {c === 'below' && <TrendingDown className="w-3 h-3 inline mr-1" />}
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Threshold */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-text-muted mb-2">Threshold</label>
              <div className="relative">
                {type === 'price' && (
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                )}
                <input
                  type="number"
                  step={type === 'yield' ? '0.01' : '0.1'}
                  value={threshold}
                  onChange={(e) => setThreshold(parseFloat(e.target.value) || 0)}
                  className={`w-full ${type === 'price' ? 'pl-10' : 'pl-4'} pr-4 py-2 bg-surface-secondary rounded-lg font-mono border border-palantir-border focus:border-accent-cyan focus:outline-none`}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-text-muted mb-2">Unit</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as AlertRule['unit'])}
                className="w-full px-4 py-2 bg-surface-secondary rounded-lg border border-palantir-border focus:border-accent-cyan focus:outline-none"
              >
                <option value="price">Price ($)</option>
                <option value="percent">Percent (%)</option>
                <option value="basis_points">Basis Points (bp)</option>
              </select>
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm text-text-muted mb-2">Priority</label>
            <div className="grid grid-cols-4 gap-2">
              {(['low', 'medium', 'high', 'critical'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`py-2 rounded-lg text-sm transition-colors ${
                    priority === p
                      ? p === 'critical' ? 'bg-status-danger text-white' :
                        p === 'high' ? 'bg-status-warning text-black' :
                        p === 'medium' ? 'bg-accent-blue text-white' :
                        'bg-status-success text-white'
                      : 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary'
                  }`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Cooldown */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-text-muted mb-2">Cooldown (minutes)</label>
              <input
                type="number"
                min="1"
                value={cooldown}
                onChange={(e) => setCooldown(parseInt(e.target.value) || 60)}
                className="w-full px-4 py-2 bg-surface-secondary rounded-lg font-mono border border-palantir-border focus:border-accent-cyan focus:outline-none"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyOnce}
                  onChange={(e) => setNotifyOnce(e.target.checked)}
                  className="w-5 h-5 rounded border-palantir-border"
                />
                <span className="text-sm">Notify once only</span>
              </label>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm text-text-muted mb-2">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional notes about this alert..."
              rows={2}
              className="w-full px-4 py-2 bg-surface-secondary rounded-lg border border-palantir-border focus:border-accent-cyan focus:outline-none resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-status-danger/10 border border-status-danger/30 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-status-danger" />
              <span className="text-sm text-status-danger">{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-palantir-border flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-surface-secondary rounded-lg font-medium hover:bg-surface-tertiary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-3 bg-accent-cyan rounded-lg font-medium text-palantir-bg hover:bg-accent-cyan/90 transition-colors"
          >
            {editRule ? 'Save Changes' : 'Create Rule'}
          </button>
        </div>
      </div>
    </div>
  )
}
