'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface ProcessorStatus {
  lastRunTime: string | null
  processedCount: number
  recentSignals: any[]
  rulesCount: number
}

interface UseSignalProcessorOptions {
  autoRun?: boolean
  intervalMs?: number // default 5 minutes
}

export function useSignalProcessor(options: UseSignalProcessorOptions = {}) {
  const { autoRun = false, intervalMs = 5 * 60 * 1000 } = options

  const [status, setStatus] = useState<ProcessorStatus | null>(null)
  const [running, setRunning] = useState(false)
  const [lastResult, setLastResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [enabled, setEnabled] = useState(autoRun)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const runningRef = useRef(false)

  // Fetch current status
  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/signals/process?action=status')
      const result = await response.json()
      if (result.success) {
        setStatus(result.data)
      }
    } catch (e) {
      console.error('Failed to fetch processor status:', e)
    }
  }, [])

  // Run the signal processor (stable reference using ref)
  const runProcessor = useCallback(async (force = false) => {
    if (runningRef.current) return

    runningRef.current = true
    setRunning(true)
    setError(null)

    try {
      const response = await fetch('/api/signals/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force }),
      })

      const result = await response.json()

      if (result.success) {
        setLastResult(result.data)
        // Fetch status separately without awaiting
        fetch('/api/signals/process?action=status')
          .then(r => r.json())
          .then(r => r.success && setStatus(r.data))
          .catch(() => {})
      } else {
        setError(result.error)
      }

      return result
    } catch (e) {
      setError('Network error')
      return { success: false, error: 'Network error' }
    } finally {
      runningRef.current = false
      setRunning(false)
    }
  }, []) // No dependencies - uses ref for running state

  // Toggle auto-run
  const toggleAutoRun = useCallback(() => {
    setEnabled(prev => !prev)
  }, [])

  // Initial fetch (only once)
  useEffect(() => {
    fetchStatus()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-run interval (stable - only depends on enabled and intervalMs)
  useEffect(() => {
    if (enabled) {
      // Run immediately when enabled
      runProcessor()

      // Set up interval
      intervalRef.current = setInterval(() => {
        runProcessor()
      }, intervalMs)
    } else {
      // Clear interval when disabled
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [enabled, intervalMs]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    status,
    running,
    lastResult,
    error,
    enabled,
    runProcessor,
    toggleAutoRun,
    fetchStatus,
  }
}
