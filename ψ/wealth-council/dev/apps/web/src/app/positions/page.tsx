'use client'

import { useState, useCallback } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Edit2,
  Trash2,
  Target,
  AlertTriangle,
  DollarSign,
  Percent,
  BarChart3,
  ChevronDown,
  ChevronUp,
  X,
  Loader2,
  RefreshCw,
  ShoppingCart,
  Clock,
} from 'lucide-react'
import { useMarketData } from '@/hooks'
import { TradeModal, TradeOrder, OrderHistory } from '@/components/trade'

// Position detail view data
const positionDetails = {
  TMV: {
    description: 'Direxion Daily 20+ Year Treasury Bear 3X Shares',
    leverage: '3x',
    expense: '1.01%',
    aum: '$285M',
    avgVolume: '1.2M',
    beta: -3.2,
    correlation: -0.98,
    notes: 'Core position for 30x thesis. 3x leverage means tighter stops required.',
    trades: [
      { date: '2026-01-15', action: 'BUY', shares: 25, price: 41.50, total: 1037.50 },
      { date: '2026-01-18', action: 'BUY', shares: 25, price: 42.50, total: 1062.50 },
    ],
  },
  TBT: {
    description: 'ProShares UltraShort 20+ Year Treasury',
    leverage: '2x',
    expense: '0.90%',
    aum: '$1.2B',
    avgVolume: '2.5M',
    beta: -2.1,
    correlation: -0.96,
    notes: 'Secondary position. Lower leverage = wider stops allowed.',
    trades: [
      { date: '2026-01-10', action: 'BUY', shares: 50, price: 28.00, total: 1400.00 },
      { date: '2026-01-12', action: 'BUY', shares: 50, price: 29.00, total: 1450.00 },
    ],
  },
}

export default function PositionsPage() {
  // Real market data from Yahoo Finance + persistence
  const { portfolio, prices, loading, error, refresh } = useMarketData({ refreshInterval: 30000 })
  const [expandedPosition, setExpandedPosition] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showOrderHistory, setShowOrderHistory] = useState(false)

  // Trade modal state
  const [tradeModal, setTradeModal] = useState<{
    isOpen: boolean
    ticker: string
    action: 'buy' | 'sell'
    currentPrice: number
    maxShares: number
  }>({
    isOpen: false,
    ticker: '',
    action: 'buy',
    currentPrice: 0,
    maxShares: 0,
  })

  // Get positions from portfolio
  const positions = portfolio?.positions || []

  const toggleExpand = (ticker: string) => {
    setExpandedPosition(expandedPosition === ticker ? null : ticker)
  }

  // Open trade modal
  const openTradeModal = useCallback((ticker: string, action: 'buy' | 'sell') => {
    const position = positions.find(p => p.ticker === ticker)
    const priceData = prices?.find(p => p.ticker === ticker)
    const currentPrice = priceData?.price || position?.currentPrice || 0

    setTradeModal({
      isOpen: true,
      ticker,
      action,
      currentPrice,
      maxShares: action === 'sell' ? (position?.shares || 0) : 0,
    })
  }, [positions, prices])

  // Execute trade via Alpaca API
  const executeTrade = useCallback(async (trade: TradeOrder) => {
    console.log('📤 Executing trade:', trade)

    const response = await fetch('/api/broker', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'submit_order',
        symbol: trade.ticker,
        qty: trade.shares,
        side: trade.action,
        type: trade.orderType,
        time_in_force: 'day',
        limit_price: trade.orderType === 'limit' ? trade.limitPrice : undefined,
      }),
    })

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.error || 'Order failed')
    }

    console.log('✅ Order submitted:', result.data)

    // Refresh portfolio data to reflect new position
    await refresh()
  }, [refresh])

  return (
    <div className="space-y-6 animate-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-text-primary flex items-center gap-3">
            <TrendingUp className="w-6 sm:w-7 h-6 sm:h-7 text-accent-cyan" />
            Positions
          </h1>
          <p className="text-sm text-text-secondary mt-1">Manage your portfolio positions</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => setShowOrderHistory(true)}
            className="btn-secondary flex items-center justify-center gap-2 flex-1 sm:flex-none"
          >
            <Clock className="w-4 h-4" />
            Orders
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center justify-center gap-2 flex-1 sm:flex-none"
          >
            <Plus className="w-4 h-4" />
            Add Position
          </button>
        </div>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="metric-card">
          <span className="data-label">Total Value</span>
          <span className="metric-value">
            ${portfolio?.totalValue.toLocaleString() || '--'}
          </span>
        </div>
        <div className="metric-card">
          <span className="data-label">Invested</span>
          <span className="metric-value">
            ${((portfolio?.totalValue || 0) - (portfolio?.cash || 0)).toLocaleString()}
          </span>
          <span className="text-sm text-text-muted">
            {(100 - (portfolio?.cashPercent || 0)).toFixed(0)}%
          </span>
        </div>
        <div className="metric-card">
          <span className="data-label">Cash</span>
          <span className="metric-value text-status-success">
            ${portfolio?.cash.toLocaleString() || '--'}
          </span>
          <span className="text-sm text-text-muted">
            {portfolio?.cashPercent || 0}%
          </span>
        </div>
        <div className="metric-card">
          <span className="data-label">Unrealized P&L</span>
          <span className={`metric-value ${(portfolio?.dailyPnL || 0) >= 0 ? 'text-status-success' : 'text-status-danger'}`}>
            {(portfolio?.dailyPnL || 0) >= 0 ? '+' : ''}${portfolio?.dailyPnL || 0}
          </span>
        </div>
        <div className="metric-card">
          <span className="data-label">Positions</span>
          <span className="metric-value">{positions.length}</span>
          <span className="text-sm text-text-muted">Active</span>
        </div>
      </div>

      {/* Positions List */}
      <div className="card p-0">
        <div className="p-4 border-b border-palantir-border flex items-center justify-between">
          <h2 className="font-semibold">Active Positions</h2>
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <span>Click to expand details</span>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-text-muted">Loading positions...</div>
        ) : positions.length === 0 ? (
          <div className="p-8 text-center text-text-muted">
            No positions yet. Click "Add Position" to start.
          </div>
        ) : (
          <div className="divide-y divide-palantir-border">
            {positions.map((position) => {
              const isExpanded = expandedPosition === position.ticker
              const details = positionDetails[position.ticker as keyof typeof positionDetails]
              const pnlPositive = position.unrealizedPnL >= 0
              const nearStop = position.stopLoss && position.currentPrice < position.stopLoss * 1.1
              const nearTarget = position.targetPrice && position.currentPrice > position.targetPrice * 0.9

              return (
                <div key={position.id} className="bg-palantir-bg-card">
                  {/* Main Row */}
                  <div
                    className="p-4 cursor-pointer hover:bg-palantir-bg-hover transition-colors"
                    onClick={() => toggleExpand(position.ticker)}
                  >
                    {/* Mobile Layout */}
                    <div className="lg:hidden">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent-cyan/20 to-accent-blue/20 flex items-center justify-center">
                            {pnlPositive ? (
                              <TrendingUp className="w-5 h-5 text-status-success" />
                            ) : (
                              <TrendingDown className="w-5 h-5 text-status-danger" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{position.ticker}</span>
                              {nearStop && (
                                <span className="badge badge-danger text-xs">Stop</span>
                              )}
                            </div>
                            <p className="text-xs text-text-muted truncate max-w-[120px]">{position.name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-mono font-semibold ${pnlPositive ? 'text-status-success' : 'text-status-danger'}`}>
                            {pnlPositive ? '+' : ''}{position.unrealizedPnLPercent.toFixed(2)}%
                          </p>
                          <p className="text-xs text-text-muted">${position.marketValue.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-center text-sm">
                        <div>
                          <p className="text-xs text-text-muted">Shares</p>
                          <p className="font-mono">{position.shares}</p>
                        </div>
                        <div>
                          <p className="text-xs text-text-muted">Avg</p>
                          <p className="font-mono">${position.avgCost.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-text-muted">Current</p>
                          <p className="font-mono">${position.currentPrice.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-text-muted">Weight</p>
                          <p className={`font-mono ${position.weight > 25 ? 'text-status-warning' : ''}`}>
                            {position.weight.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden lg:flex items-center justify-between">
                      {/* Left: Ticker & Name */}
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent-cyan/20 to-accent-blue/20 flex items-center justify-center">
                          {pnlPositive ? (
                            <TrendingUp className="w-5 h-5 text-status-success" />
                          ) : (
                            <TrendingDown className="w-5 h-5 text-status-danger" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-lg">{position.ticker}</span>
                            {nearStop && (
                              <span className="badge badge-danger text-xs">Near Stop</span>
                            )}
                            {nearTarget && (
                              <span className="badge badge-success text-xs">Near Target</span>
                            )}
                          </div>
                          <p className="text-sm text-text-muted">{position.name}</p>
                        </div>
                      </div>

                      {/* Center: Shares & Price */}
                      <div className="flex items-center gap-8">
                        <div className="text-center">
                          <p className="text-sm text-text-muted">Shares</p>
                          <p className="font-mono font-semibold">{position.shares}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-text-muted">Avg Cost</p>
                          <p className="font-mono">${position.avgCost.toFixed(2)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-text-muted">Current</p>
                          <p className="font-mono font-semibold">${position.currentPrice.toFixed(2)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-text-muted">Value</p>
                          <p className="font-mono">${position.marketValue.toLocaleString()}</p>
                        </div>
                      </div>

                      {/* Right: P&L & Weight */}
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-sm text-text-muted">P&L</p>
                          <p className={`font-mono font-semibold ${pnlPositive ? 'text-status-success' : 'text-status-danger'}`}>
                            {pnlPositive ? '+' : ''}${position.unrealizedPnL.toFixed(0)}
                            <span className="text-sm ml-1">
                              ({pnlPositive ? '+' : ''}{position.unrealizedPnLPercent.toFixed(2)}%)
                            </span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-text-muted">Weight</p>
                          <p className={`font-mono font-semibold ${position.weight > 25 ? 'text-status-warning' : ''}`}>
                            {position.weight.toFixed(1)}%
                          </p>
                        </div>
                        <div className="w-6 flex justify-center">
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-text-muted" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-text-muted" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && details && (
                    <div className="p-4 pt-0 border-t border-palantir-border bg-palantir-bg">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                        {/* ETF Info */}
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-text-muted uppercase tracking-wider">ETF Info</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-text-muted">Leverage</span>
                              <span className="font-mono text-accent-cyan">{details.leverage}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-text-muted">Expense</span>
                              <span className="font-mono">{details.expense}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-text-muted">AUM</span>
                              <span className="font-mono">{details.aum}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-text-muted">Avg Volume</span>
                              <span className="font-mono">{details.avgVolume}</span>
                            </div>
                          </div>
                        </div>

                        {/* Risk Metrics */}
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-text-muted uppercase tracking-wider">Risk</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-text-muted">Beta</span>
                              <span className="font-mono text-status-danger">{details.beta}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-text-muted">Correlation</span>
                              <span className="font-mono">{details.correlation}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-text-muted">Stop Loss</span>
                              <span className="font-mono text-status-danger">
                                ${position.stopLoss?.toFixed(2) || '--'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-text-muted">Target</span>
                              <span className="font-mono text-status-success">
                                ${position.targetPrice?.toFixed(2) || '--'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Trade History */}
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-text-muted uppercase tracking-wider">Trades</h4>
                          <div className="space-y-2">
                            {details.trades.map((trade, i) => (
                              <div key={i} className="flex items-center justify-between text-sm p-2 bg-palantir-bg-card rounded">
                                <div>
                                  <span className={`badge ${trade.action === 'BUY' ? 'badge-success' : 'badge-danger'} text-xs mr-2`}>
                                    {trade.action}
                                  </span>
                                  <span className="text-text-muted">{trade.date}</span>
                                </div>
                                <div className="font-mono">
                                  {trade.shares} @ ${trade.price}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Notes & Actions */}
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-text-muted uppercase tracking-wider">Notes</h4>
                          <p className="text-sm text-text-secondary">{details.notes}</p>
                          <div className="flex gap-2 pt-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                openTradeModal(position.ticker, 'buy')
                              }}
                              className="btn-secondary text-sm flex items-center gap-1 text-status-success border-status-success/30 hover:bg-status-success/10"
                            >
                              <TrendingUp className="w-3 h-3" /> Buy More
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                openTradeModal(position.ticker, 'sell')
                              }}
                              className="btn-secondary text-sm flex items-center gap-1 text-status-danger border-status-danger/30 hover:bg-status-danger/10"
                            >
                              <TrendingDown className="w-3 h-3" /> Sell
                            </button>
                            <button className="btn-secondary text-sm flex items-center gap-1">
                              <Edit2 className="w-3 h-3" /> Edit
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Position Allocation Chart */}
      <div className="card p-4">
        <h3 className="font-semibold mb-4">Portfolio Allocation</h3>
        <div className="flex items-center gap-4">
          {/* Visual Bar */}
          <div className="flex-1 h-8 bg-palantir-bg rounded-lg overflow-hidden flex">
            {positions.map((pos, i) => (
              <div
                key={pos.ticker}
                className="h-full flex items-center justify-center text-xs font-medium"
                style={{
                  width: `${pos.weight}%`,
                  backgroundColor: i === 0 ? '#00d4ff' : i === 1 ? '#2f81f7' : '#8b5cf6',
                }}
              >
                {pos.weight > 10 && `${pos.ticker} ${pos.weight.toFixed(0)}%`}
              </div>
            ))}
            <div
              className="h-full bg-status-success/30 flex items-center justify-center text-xs font-medium text-status-success"
              style={{ width: `${portfolio?.cashPercent || 30}%` }}
            >
              Cash {portfolio?.cashPercent || 30}%
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6 mt-4 text-sm">
          {positions.map((pos, i) => (
            <div key={pos.ticker} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: i === 0 ? '#00d4ff' : i === 1 ? '#2f81f7' : '#8b5cf6' }}
              />
              <span className="text-text-secondary">{pos.ticker}</span>
              <span className="font-mono">{pos.weight.toFixed(1)}%</span>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-status-success/30" />
            <span className="text-text-secondary">Cash</span>
            <span className="font-mono">{portfolio?.cashPercent || 30}%</span>
          </div>
        </div>
      </div>

      {/* Add Position Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add New Position</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-palantir-bg-hover rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-text-muted mb-1">Ticker</label>
                <select className="w-full bg-palantir-bg border border-palantir-border rounded-lg px-3 py-2">
                  <option value="">Select instrument...</option>
                  <option value="TMV">TMV - 3x Inverse 20Y+</option>
                  <option value="TBT">TBT - 2x Inverse 20Y+</option>
                  <option value="TBF">TBF - 1x Inverse 20Y+</option>
                  <option value="TLT">TLT - Long 20Y+ (for puts)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-text-muted mb-1">Shares</label>
                  <input type="number" className="w-full bg-palantir-bg border border-palantir-border rounded-lg px-3 py-2" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm text-text-muted mb-1">Entry Price</label>
                  <input type="number" step="0.01" className="w-full bg-palantir-bg border border-palantir-border rounded-lg px-3 py-2" placeholder="0.00" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-text-muted mb-1">Stop Loss</label>
                  <input type="number" step="0.01" className="w-full bg-palantir-bg border border-palantir-border rounded-lg px-3 py-2" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm text-text-muted mb-1">Target Price</label>
                  <input type="number" step="0.01" className="w-full bg-palantir-bg border border-palantir-border rounded-lg px-3 py-2" placeholder="0.00" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-text-muted mb-1">Notes</label>
                <textarea className="w-full bg-palantir-bg border border-palantir-border rounded-lg px-3 py-2 h-20" placeholder="Trade rationale..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowAddModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button className="btn-primary flex-1">Add Position</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trade Modal */}
      <TradeModal
        isOpen={tradeModal.isOpen}
        onClose={() => setTradeModal(prev => ({ ...prev, isOpen: false }))}
        ticker={tradeModal.ticker}
        currentPrice={tradeModal.currentPrice}
        action={tradeModal.action}
        maxShares={tradeModal.maxShares}
        portfolioCash={portfolio?.cash || 0}
        onExecute={executeTrade}
      />

      {/* Order History Modal */}
      <OrderHistory
        isOpen={showOrderHistory}
        onClose={() => setShowOrderHistory(false)}
      />
    </div>
  )
}
