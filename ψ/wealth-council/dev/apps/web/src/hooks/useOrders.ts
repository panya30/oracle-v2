'use client'

import { useState, useEffect, useCallback } from 'react'

export interface Order {
  id: string
  symbol: string
  qty: string
  side: 'buy' | 'sell'
  type: 'market' | 'limit' | 'stop' | 'stop_limit'
  status: string
  created_at: string
  filled_at: string | null
  filled_qty: string
  filled_avg_price: string | null
  limit_price: string | null
  stop_price: string | null
}

interface UseOrdersOptions {
  status?: 'open' | 'closed' | 'all'
  limit?: number
  autoRefresh?: boolean
  refreshInterval?: number
}

export function useOrders(options: UseOrdersOptions = {}) {
  const {
    status = 'all',
    limit = 20,
    autoRefresh = true,
    refreshInterval = 30000,
  } = options

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const response = await fetch('/api/broker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_orders',
          status,
          limit,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setOrders(result.data || [])
        setError(null)
      } else {
        setError(result.error || 'Failed to fetch orders')
      }
    } catch (e) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }, [status, limit])

  const cancelOrder = useCallback(async (orderId: string) => {
    try {
      const response = await fetch('/api/broker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel_order',
          order_id: orderId,
        }),
      })

      const result = await response.json()

      if (result.success) {
        await refresh()
        return true
      }
      return false
    } catch {
      return false
    }
  }, [refresh])

  useEffect(() => {
    refresh()

    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(refresh, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [refresh, autoRefresh, refreshInterval])

  return {
    orders,
    loading,
    error,
    refresh,
    cancelOrder,
  }
}
