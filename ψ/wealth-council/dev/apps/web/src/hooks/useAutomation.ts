'use client'

import { useState, useEffect, useCallback } from 'react'
import type { AutomationSettings, TradeProposal, DailyStats } from '@/lib/automation-settings'

interface AutomationStatus {
  settings: AutomationSettings
  stats: DailyStats
  pendingProposals: number
  alpacaConfigured: boolean
}

export function useAutomation() {
  const [settings, setSettings] = useState<AutomationSettings | null>(null)
  const [proposals, setProposals] = useState<TradeProposal[]>([])
  const [stats, setStats] = useState<DailyStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch current status
  const refresh = useCallback(async () => {
    try {
      const [statusRes, proposalsRes] = await Promise.all([
        fetch('/api/automation?action=status'),
        fetch('/api/automation?action=proposals'),
      ])

      const statusData = await statusRes.json()
      const proposalsData = await proposalsRes.json()

      if (statusData.success) {
        setSettings(statusData.data.settings)
        setStats(statusData.data.stats)
      }

      if (proposalsData.success) {
        setProposals(proposalsData.data)
      }

      setError(null)
    } catch (e) {
      setError('Failed to fetch automation status')
    } finally {
      setLoading(false)
    }
  }, [])

  // Update settings
  const updateSettings = useCallback(async (newSettings: Partial<AutomationSettings>) => {
    try {
      const response = await fetch('/api/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_settings',
          settings: newSettings,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setSettings(result.data)
        return true
      }

      return false
    } catch {
      return false
    }
  }, [])

  // Approve proposal
  const approveProposal = useCallback(async (proposalId: string) => {
    try {
      const response = await fetch('/api/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve_proposal',
          proposalId,
        }),
      })

      const result = await response.json()

      if (result.success) {
        await refresh()
        return { success: true, order: result.data.order }
      }

      return { success: false, error: result.error }
    } catch {
      return { success: false, error: 'Network error' }
    }
  }, [refresh])

  // Reject proposal
  const rejectProposal = useCallback(async (proposalId: string, reason?: string) => {
    try {
      const response = await fetch('/api/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject_proposal',
          proposalId,
          reason,
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

  // Kill switch
  const activateKillSwitch = useCallback(async () => {
    try {
      const response = await fetch('/api/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'kill_switch' }),
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

  // Process a signal (for testing)
  const processSignal = useCallback(async (signal: {
    ticker: string
    action: 'buy' | 'sell'
    confidence: number
    reasoning: string
    agent: string
    currentPrice: number
  }) => {
    try {
      const response = await fetch('/api/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'process_signal',
          signal,
        }),
      })

      const result = await response.json()

      if (result.success) {
        await refresh()
        return result.data
      }

      return { action: 'error', error: result.error }
    } catch {
      return { action: 'error', error: 'Network error' }
    }
  }, [refresh])

  useEffect(() => {
    refresh()

    // Poll every 10 seconds when there are pending proposals
    const interval = setInterval(refresh, 10000)
    return () => clearInterval(interval)
  }, [refresh])

  const pendingProposals = proposals.filter(p => p.status === 'pending')

  return {
    settings,
    proposals,
    pendingProposals,
    stats,
    loading,
    error,
    refresh,
    updateSettings,
    approveProposal,
    rejectProposal,
    activateKillSwitch,
    processSignal,
  }
}

export function useAutomationSettings() {
  const { settings, updateSettings, loading, error } = useAutomation()
  return { settings, updateSettings, loading, error }
}

export function useTradeProposals() {
  const { proposals, pendingProposals, approveProposal, rejectProposal, loading, refresh } = useAutomation()
  return { proposals, pendingProposals, approveProposal, rejectProposal, loading, refresh }
}
