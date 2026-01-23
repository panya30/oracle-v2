'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  X,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  Calculator,
  Target,
} from 'lucide-react'

interface TradeModalProps {
  isOpen: boolean
  onClose: () => void
  ticker: string
  currentPrice: number
  action: 'buy' | 'sell'
  maxShares?: number // For sell orders
  portfolioCash?: number // For buy orders
  onExecute: (trade: TradeOrder) => Promise<void>
}

export interface TradeOrder {
  ticker: string
  action: 'buy' | 'sell'
  shares: number
  price: number
  orderType: 'market' | 'limit'
  limitPrice?: number
  stopLoss?: number
  takeProfit?: number
}

export default function TradeModal({
  isOpen,
  onClose,
  ticker,
  currentPrice,
  action,
  maxShares = 0,
  portfolioCash = 0,
  onExecute,
}: TradeModalProps) {
  const [shares, setShares] = useState(1)
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market')
  const [limitPrice, setLimitPrice] = useState(currentPrice)
  const [stopLoss, setStopLoss] = useState<number | undefined>()
  const [takeProfit, setTakeProfit] = useState<number | undefined>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setShares(1)
      setOrderType('market')
      setLimitPrice(currentPrice)
      setStopLoss(undefined)
      setTakeProfit(undefined)
      setError(null)
    }
  }, [isOpen, currentPrice])

  const estimatedCost = shares * (orderType === 'market' ? currentPrice : limitPrice)
  const maxBuyShares = Math.floor(portfolioCash / currentPrice)

  const handleExecute = useCallback(async () => {
    // Validation
    if (shares <= 0) {
      setError('Shares must be greater than 0')
      return
    }

    if (action === 'sell' && shares > maxShares) {
      setError(`Cannot sell more than ${maxShares} shares`)
      return
    }

    if (action === 'buy' && estimatedCost > portfolioCash) {
      setError(`Insufficient cash. Max: ${maxBuyShares} shares`)
      return
    }

    try {
      setLoading(true)
      setError(null)

      await onExecute({
        ticker,
        action,
        shares,
        price: orderType === 'market' ? currentPrice : limitPrice,
        orderType,
        limitPrice: orderType === 'limit' ? limitPrice : undefined,
        stopLoss,
        takeProfit,
      })

      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Trade failed')
    } finally {
      setLoading(false)
    }
  }, [shares, action, maxShares, estimatedCost, portfolioCash, maxBuyShares, ticker, currentPrice, orderType, limitPrice, stopLoss, takeProfit, onExecute, onClose])

  if (!isOpen) return null

  const isBuy = action === 'buy'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-surface-primary border border-palantir-border rounded-xl shadow-2xl w-full max-w-md animate-in">
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b border-palantir-border ${
          isBuy ? 'bg-status-success/10' : 'bg-status-danger/10'
        }`}>
          <div className="flex items-center gap-3">
            {isBuy ? (
              <TrendingUp className="w-6 h-6 text-status-success" />
            ) : (
              <TrendingDown className="w-6 h-6 text-status-danger" />
            )}
            <div>
              <h2 className="text-lg font-semibold">
                {isBuy ? 'Buy' : 'Sell'} {ticker}
              </h2>
              <p className="text-sm text-text-muted">
                Current: ${currentPrice.toFixed(2)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-secondary rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {/* Order Type */}
          <div>
            <label className="block text-sm text-text-muted mb-2">Order Type</label>
            <div className="flex gap-2">
              <button
                onClick={() => setOrderType('market')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  orderType === 'market'
                    ? 'bg-accent-cyan text-palantir-bg'
                    : 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary'
                }`}
              >
                Market
              </button>
              <button
                onClick={() => setOrderType('limit')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  orderType === 'limit'
                    ? 'bg-accent-cyan text-palantir-bg'
                    : 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary'
                }`}
              >
                Limit
              </button>
            </div>
          </div>

          {/* Shares */}
          <div>
            <label className="block text-sm text-text-muted mb-2">
              Shares
              {isBuy && <span className="text-text-muted"> (Max: {maxBuyShares})</span>}
              {!isBuy && <span className="text-text-muted"> (Have: {maxShares})</span>}
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShares(Math.max(1, shares - 1))}
                className="p-2 bg-surface-secondary rounded-lg hover:bg-surface-tertiary transition-colors"
              >
                -
              </button>
              <input
                type="number"
                value={shares}
                onChange={(e) => setShares(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex-1 px-4 py-2 bg-surface-secondary rounded-lg text-center font-mono text-lg border border-palantir-border focus:border-accent-cyan focus:outline-none"
              />
              <button
                onClick={() => setShares(shares + 1)}
                className="p-2 bg-surface-secondary rounded-lg hover:bg-surface-tertiary transition-colors"
              >
                +
              </button>
            </div>
            {/* Quick select buttons */}
            <div className="flex gap-2 mt-2">
              {[10, 25, 50, 100].map((qty) => (
                <button
                  key={qty}
                  onClick={() => setShares(qty)}
                  className="flex-1 py-1 text-xs bg-surface-secondary rounded hover:bg-surface-tertiary transition-colors"
                >
                  {qty}
                </button>
              ))}
              {isBuy && maxBuyShares > 0 && (
                <button
                  onClick={() => setShares(maxBuyShares)}
                  className="flex-1 py-1 text-xs bg-status-success/20 text-status-success rounded hover:bg-status-success/30 transition-colors"
                >
                  MAX
                </button>
              )}
              {!isBuy && maxShares > 0 && (
                <button
                  onClick={() => setShares(maxShares)}
                  className="flex-1 py-1 text-xs bg-status-danger/20 text-status-danger rounded hover:bg-status-danger/30 transition-colors"
                >
                  ALL
                </button>
              )}
            </div>
          </div>

          {/* Limit Price */}
          {orderType === 'limit' && (
            <div>
              <label className="block text-sm text-text-muted mb-2">Limit Price</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="number"
                  step="0.01"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(parseFloat(e.target.value) || 0)}
                  className="w-full pl-10 pr-4 py-2 bg-surface-secondary rounded-lg font-mono border border-palantir-border focus:border-accent-cyan focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Stop Loss & Take Profit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-text-muted mb-2 flex items-center gap-1">
                <Target className="w-3 h-3" />
                Stop Loss
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Optional"
                  value={stopLoss || ''}
                  onChange={(e) => setStopLoss(e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-full pl-10 pr-4 py-2 bg-surface-secondary rounded-lg font-mono text-sm border border-palantir-border focus:border-status-danger focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-text-muted mb-2 flex items-center gap-1">
                <Target className="w-3 h-3" />
                Take Profit
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Optional"
                  value={takeProfit || ''}
                  onChange={(e) => setTakeProfit(e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-full pl-10 pr-4 py-2 bg-surface-secondary rounded-lg font-mono text-sm border border-palantir-border focus:border-status-success focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-surface-secondary rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="w-4 h-4 text-accent-cyan" />
              <span className="text-sm font-medium">Order Summary</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">Shares</span>
                <span className="font-mono">{shares}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Price</span>
                <span className="font-mono">${(orderType === 'market' ? currentPrice : limitPrice).toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-palantir-border">
                <span className="font-medium">{isBuy ? 'Total Cost' : 'Total Proceeds'}</span>
                <span className={`font-mono font-semibold ${isBuy ? 'text-status-danger' : 'text-status-success'}`}>
                  ${estimatedCost.toFixed(2)}
                </span>
              </div>
              {isBuy && (
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">Cash After</span>
                  <span className="font-mono text-text-secondary">${(portfolioCash - estimatedCost).toFixed(2)}</span>
                </div>
              )}
            </div>
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
            onClick={handleExecute}
            disabled={loading}
            className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
              isBuy
                ? 'bg-status-success hover:bg-status-success/90 text-white'
                : 'bg-status-danger hover:bg-status-danger/90 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? 'Processing...' : `${isBuy ? 'Buy' : 'Sell'} ${shares} shares`}
          </button>
        </div>
      </div>
    </div>
  )
}
