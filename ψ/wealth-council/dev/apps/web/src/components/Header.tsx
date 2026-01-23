'use client'

import { Bell, RefreshCw, Clock, Loader2 } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { useMarketData } from '@/hooks'

export function Header() {
  const [time, setTime] = useState<string>('')
  const [marketStatus, setMarketStatus] = useState<'open' | 'closed' | 'pre' | 'after'>('closed')
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Real market data from Yahoo Finance + FRED
  const { prices, yields, alerts, refresh, loading, error } = useMarketData({ refreshInterval: 15000 })

  // Get specific yields and prices
  const yield10Y = yields?.yields.find(y => y.tenor === '10Y')
  const yield30Y = yields?.yields.find(y => y.tenor === '30Y')
  const tlt = prices.find(p => p.ticker === 'TLT')
  const tmv = prices.find(p => p.ticker === 'TMV')

  // Count unacknowledged alerts
  const unacknowledgedCount = alerts.filter(a => !a.acknowledged).length

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await refresh()
    setTimeout(() => setIsRefreshing(false), 500)
  }, [refresh])

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }))

      // Check US market hours (9:30 AM - 4:00 PM ET)
      const etTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
      const hour = etTime.getHours()
      const minute = etTime.getMinutes()
      const dayOfWeek = etTime.getDay()

      if (dayOfWeek === 0 || dayOfWeek === 6) {
        setMarketStatus('closed')
      } else if (hour < 9 || (hour === 9 && minute < 30)) {
        setMarketStatus('pre')
      } else if (hour >= 16) {
        setMarketStatus('after')
      } else {
        setMarketStatus('open')
      }
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="hidden lg:flex h-14 bg-palantir-bg-elevated border-b border-palantir-border items-center justify-between px-6">
      {/* Left: Quick Stats - Hidden on tablet, shown on desktop */}
      <div className="hidden xl:flex items-center gap-6">
        <div className="flex items-center gap-4">
          {/* 10Y Yield */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">10Y</span>
            <span className={`font-mono text-sm ${yield10Y && yield10Y.change > 0 ? 'text-status-danger' : 'text-status-success'}`}>
              {yield10Y ? `${yield10Y.yield.toFixed(2)}%` : '--'}
            </span>
            {yield10Y && (
              <span className={`text-xs ${yield10Y.change > 0 ? 'text-status-danger' : 'text-status-success'}`}>
                {yield10Y.change > 0 ? '+' : ''}{yield10Y.change.toFixed(2)}
              </span>
            )}
          </div>

          <div className="w-px h-4 bg-palantir-border" />

          {/* 30Y Yield */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">30Y</span>
            <span className={`font-mono text-sm ${yield30Y && yield30Y.change > 0 ? 'text-status-danger' : 'text-status-success'}`}>
              {yield30Y ? `${yield30Y.yield.toFixed(2)}%` : '--'}
            </span>
            {yield30Y && (
              <span className={`text-xs ${yield30Y.change > 0 ? 'text-status-danger' : 'text-status-success'}`}>
                {yield30Y.change > 0 ? '+' : ''}{yield30Y.change.toFixed(2)}
              </span>
            )}
          </div>

          <div className="w-px h-4 bg-palantir-border" />

          {/* TLT */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">TLT</span>
            <span className="font-mono text-sm">
              {tlt ? `$${tlt.price.toFixed(2)}` : '--'}
            </span>
            {tlt && (
              <span className={`text-xs ${tlt.changePercent < 0 ? 'text-status-danger' : 'text-status-success'}`}>
                {tlt.changePercent > 0 ? '+' : ''}{tlt.changePercent.toFixed(2)}%
              </span>
            )}
          </div>

          <div className="w-px h-4 bg-palantir-border" />

          {/* TMV */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">TMV</span>
            <span className="font-mono text-sm">
              {tmv ? `$${tmv.price.toFixed(2)}` : '--'}
            </span>
            {tmv && (
              <span className={`text-xs ${tmv.changePercent > 0 ? 'text-status-success' : 'text-status-danger'}`}>
                {tmv.changePercent > 0 ? '+' : ''}{tmv.changePercent.toFixed(2)}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Compact stats for tablet */}
      <div className="xl:hidden flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">10Y</span>
          <span className={`font-mono text-sm ${yield10Y && yield10Y.change > 0 ? 'text-status-danger' : 'text-status-success'}`}>
            {yield10Y ? `${yield10Y.yield.toFixed(2)}%` : '--'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">TMV</span>
          <span className="font-mono text-sm">
            {tmv ? `$${tmv.price.toFixed(2)}` : '--'}
          </span>
        </div>
      </div>

      {/* Right: Time & Actions */}
      <div className="flex items-center gap-4">
        {/* Market Status */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-palantir-bg-card">
          <span
            className={`status-dot ${
              marketStatus === 'open'
                ? 'status-dot-success'
                : marketStatus === 'pre' || marketStatus === 'after'
                ? 'bg-status-warning'
                : 'bg-text-muted'
            }`}
          />
          <span className="text-xs uppercase">
            {marketStatus === 'open'
              ? 'Market Open'
              : marketStatus === 'pre'
              ? 'Pre-Market'
              : marketStatus === 'after'
              ? 'After-Hours'
              : 'Market Closed'}
          </span>
        </div>

        {/* Time */}
        <div className="flex items-center gap-2 text-text-secondary">
          <Clock className="w-4 h-4" />
          <span className="font-mono text-sm">{time}</span>
        </div>

        {/* Refresh */}
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-2 hover:bg-palantir-bg-hover rounded-lg transition-colors disabled:opacity-50"
        >
          {isRefreshing ? (
            <Loader2 className="w-4 h-4 text-accent-cyan animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 text-text-secondary" />
          )}
        </button>

        {/* Alerts */}
        <button className="relative p-2 hover:bg-palantir-bg-hover rounded-lg transition-colors">
          <Bell className="w-4 h-4 text-text-secondary" />
          {unacknowledgedCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-status-danger rounded-full text-[10px] font-bold text-white px-1">
              {unacknowledgedCount > 9 ? '9+' : unacknowledgedCount}
            </span>
          )}
        </button>
      </div>
    </header>
  )
}
