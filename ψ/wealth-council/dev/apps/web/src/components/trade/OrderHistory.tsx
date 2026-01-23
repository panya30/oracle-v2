'use client'

import { useState } from 'react'
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import { useOrders, type Order } from '@/hooks'

interface OrderHistoryProps {
  isOpen: boolean
  onClose: () => void
}

function getStatusColor(status: string) {
  switch (status) {
    case 'filled':
      return 'text-status-success'
    case 'canceled':
    case 'expired':
    case 'rejected':
      return 'text-status-danger'
    case 'new':
    case 'accepted':
    case 'pending_new':
      return 'text-status-warning'
    case 'partially_filled':
      return 'text-accent-cyan'
    default:
      return 'text-text-muted'
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'filled':
      return <CheckCircle className="w-4 h-4" />
    case 'canceled':
    case 'expired':
    case 'rejected':
      return <XCircle className="w-4 h-4" />
    case 'new':
    case 'accepted':
    case 'pending_new':
    case 'partially_filled':
      return <Clock className="w-4 h-4" />
    default:
      return <AlertCircle className="w-4 h-4" />
  }
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function OrderHistory({ isOpen, onClose }: OrderHistoryProps) {
  const { orders, loading, error, refresh, cancelOrder } = useOrders({
    status: 'all',
    limit: 50,
    autoRefresh: isOpen,
  })
  const [cancelingId, setCancelingId] = useState<string | null>(null)

  if (!isOpen) return null

  const handleCancel = async (orderId: string) => {
    setCancelingId(orderId)
    await cancelOrder(orderId)
    setCancelingId(null)
  }

  const openOrders = orders.filter(o =>
    ['new', 'accepted', 'pending_new', 'partially_filled'].includes(o.status)
  )
  const completedOrders = orders.filter(o =>
    !['new', 'accepted', 'pending_new', 'partially_filled'].includes(o.status)
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-surface-primary border border-palantir-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden animate-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-palantir-border">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-accent-cyan" />
            <h2 className="text-lg font-semibold">Order History</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refresh}
              className="p-2 hover:bg-surface-secondary rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-surface-secondary rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto max-h-[calc(80vh-80px)]">
          {loading && orders.length === 0 ? (
            <div className="p-8 text-center text-text-muted">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
              Loading orders...
            </div>
          ) : error ? (
            <div className="p-8 text-center text-status-danger">
              {error}
            </div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center text-text-muted">
              No orders found
            </div>
          ) : (
            <>
              {/* Open Orders */}
              {openOrders.length > 0 && (
                <div className="p-4 border-b border-palantir-border">
                  <h3 className="text-sm font-medium text-text-muted mb-3">
                    Open Orders ({openOrders.length})
                  </h3>
                  <div className="space-y-2">
                    {openOrders.map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-3 bg-surface-secondary rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`flex items-center gap-1 ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`badge ${order.side === 'buy' ? 'badge-success' : 'badge-danger'} text-xs`}>
                                {order.side.toUpperCase()}
                              </span>
                              <span className="font-semibold">{order.symbol}</span>
                              <span className="font-mono text-sm">{order.qty} shares</span>
                            </div>
                            <div className="text-xs text-text-muted mt-1">
                              {order.type} • {formatDate(order.created_at)}
                              {order.limit_price && ` • Limit $${order.limit_price}`}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleCancel(order.id)}
                          disabled={cancelingId === order.id}
                          className="px-3 py-1 text-sm text-status-danger hover:bg-status-danger/10 rounded transition-colors disabled:opacity-50"
                        >
                          {cancelingId === order.id ? 'Canceling...' : 'Cancel'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Completed Orders */}
              <div className="p-4">
                <h3 className="text-sm font-medium text-text-muted mb-3">
                  Recent Orders
                </h3>
                <div className="space-y-2">
                  {completedOrders.slice(0, 20).map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-3 bg-surface-secondary rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`flex items-center gap-1 ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`badge ${order.side === 'buy' ? 'badge-success' : 'badge-danger'} text-xs`}>
                              {order.side.toUpperCase()}
                            </span>
                            <span className="font-semibold">{order.symbol}</span>
                            <span className="font-mono text-sm">
                              {order.filled_qty || order.qty} shares
                            </span>
                          </div>
                          <div className="text-xs text-text-muted mt-1">
                            {order.status} • {formatDate(order.filled_at || order.created_at)}
                            {order.filled_avg_price && ` • $${parseFloat(order.filled_avg_price).toFixed(2)}`}
                          </div>
                        </div>
                      </div>
                      <span className={`text-sm font-mono ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
