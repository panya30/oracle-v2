import { useEffect, useRef, useCallback, useState } from 'react'

interface UseAutoRefreshOptions {
  enabled?: boolean
  interval?: number // in milliseconds
  onRefresh: () => void | Promise<void>
}

export function useAutoRefresh({
  enabled = true,
  interval = 30000, // default 30 seconds
  onRefresh,
}: UseAutoRefreshOptions) {
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const refresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await onRefresh()
      setLastRefresh(new Date())
    } finally {
      setIsRefreshing(false)
    }
  }, [onRefresh])

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    intervalRef.current = setInterval(refresh, interval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [enabled, interval, refresh])

  return {
    lastRefresh,
    isRefreshing,
    refresh,
  }
}

// Utility to format relative time
export function formatRelativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)

  if (seconds < 5) return 'just now'
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

// Hook for displaying refresh status
export function useRefreshTimer(lastRefresh: Date, updateInterval: number = 1000) {
  const [displayTime, setDisplayTime] = useState(formatRelativeTime(lastRefresh))

  useEffect(() => {
    const timer = setInterval(() => {
      setDisplayTime(formatRelativeTime(lastRefresh))
    }, updateInterval)

    return () => clearInterval(timer)
  }, [lastRefresh, updateInterval])

  return displayTime
}
