'use client'

import { useState } from 'react'
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Loader2,
  Zap,
} from 'lucide-react'
import type { TradeProposal } from '@/lib/automation-settings'

interface ProposalQueueProps {
  proposals: TradeProposal[]
  onApprove: (id: string) => Promise<{ success: boolean; error?: string }>
  onReject: (id: string) => Promise<boolean>
  loading?: boolean
}

function formatTimeRemaining(expiresAt: string): string {
  const remaining = new Date(expiresAt).getTime() - Date.now()
  if (remaining <= 0) return 'Expired'

  const minutes = Math.floor(remaining / 60000)
  if (minutes < 1) return '<1 min'
  return `${minutes} min`
}

export default function ProposalQueue({
  proposals,
  onApprove,
  onReject,
  loading,
}: ProposalQueueProps) {
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const pendingProposals = proposals.filter(p => p.status === 'pending')

  const handleApprove = async (id: string) => {
    setProcessingId(id)
    setError(null)

    const result = await onApprove(id)

    if (!result.success) {
      setError(result.error || 'Failed to approve')
    }

    setProcessingId(null)
  }

  const handleReject = async (id: string) => {
    setProcessingId(id)
    await onReject(id)
    setProcessingId(null)
  }

  if (loading) {
    return (
      <div className="card p-6 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-text-muted" />
        <p className="text-text-muted mt-2">Loading proposals...</p>
      </div>
    )
  }

  if (pendingProposals.length === 0) {
    return (
      <div className="card p-6 text-center">
        <Zap className="w-8 h-8 mx-auto text-text-muted mb-2" />
        <p className="text-text-muted">No pending trade proposals</p>
        <p className="text-xs text-text-muted mt-1">
          Proposals appear here when agents detect trading opportunities
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Clock className="w-5 h-5 text-status-warning" />
          Pending Approvals ({pendingProposals.length})
        </h3>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-status-danger/10 border border-status-danger/30 rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-status-danger" />
          <span className="text-sm text-status-danger">{error}</span>
        </div>
      )}

      {/* Proposals */}
      <div className="space-y-3">
        {pendingProposals.map((proposal) => {
          const isProcessing = processingId === proposal.id
          const isBuy = proposal.signal.action === 'buy'
          const hasWarnings = proposal.riskCheck.warnings.length > 0
          const isBlocked = !proposal.riskCheck.passed

          return (
            <div
              key={proposal.id}
              className={`card p-4 border-l-4 ${
                isBlocked
                  ? 'border-l-status-danger'
                  : hasWarnings
                  ? 'border-l-status-warning'
                  : 'border-l-status-success'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isBuy ? 'bg-status-success/20' : 'bg-status-danger/20'}`}>
                    {isBuy ? (
                      <TrendingUp className="w-5 h-5 text-status-success" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-status-danger" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`badge ${isBuy ? 'badge-success' : 'badge-danger'}`}>
                        {proposal.signal.action.toUpperCase()}
                      </span>
                      <span className="font-semibold text-lg">{proposal.signal.ticker}</span>
                      <span className="font-mono text-text-muted">{proposal.order.qty} shares</span>
                    </div>
                    <div className="text-sm text-text-muted mt-1">
                      {proposal.agent} • {proposal.signal.confidence}% confidence
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-text-muted flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTimeRemaining(proposal.expiresAt)}
                  </span>
                </div>
              </div>

              {/* Reasoning */}
              <p className="text-sm text-text-secondary mb-3 bg-surface-secondary p-2 rounded">
                {proposal.signal.reasoning}
              </p>

              {/* Risk Warnings */}
              {(hasWarnings || isBlocked) && (
                <div className="mb-3 space-y-1">
                  {proposal.riskCheck.blocked.map((msg, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-status-danger">
                      <XCircle className="w-4 h-4" />
                      {msg}
                    </div>
                  ))}
                  {proposal.riskCheck.warnings.map((msg, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-status-warning">
                      <AlertTriangle className="w-4 h-4" />
                      {msg}
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleApprove(proposal.id)}
                  disabled={isProcessing || isBlocked}
                  className="flex-1 py-2 px-4 bg-status-success hover:bg-status-success/90 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  {isBlocked ? 'Blocked by Risk' : 'Approve & Execute'}
                </button>
                <button
                  onClick={() => handleReject(proposal.id)}
                  disabled={isProcessing}
                  className="py-2 px-4 bg-surface-secondary hover:bg-surface-tertiary rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
