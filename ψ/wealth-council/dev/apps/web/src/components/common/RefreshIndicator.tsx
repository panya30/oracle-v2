'use client'

import { useRefreshTimer } from '@/hooks/useAutoRefresh'

interface RefreshIndicatorProps {
  lastRefresh: Date
  isRefreshing: boolean
  onRefresh: () => void
  enabled?: boolean
  onToggle?: (enabled: boolean) => void
}

export default function RefreshIndicator({
  lastRefresh,
  isRefreshing,
  onRefresh,
  enabled = true,
  onToggle,
}: RefreshIndicatorProps) {
  const displayTime = useRefreshTimer(lastRefresh)

  return (
    <div className="flex items-center gap-3 text-sm">
      {/* Last updated time */}
      <span className="text-text-muted">
        Updated: <span className="text-text-secondary font-mono">{displayTime}</span>
      </span>

      {/* Auto-refresh toggle */}
      {onToggle && (
        <button
          onClick={() => onToggle(!enabled)}
          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
            enabled
              ? 'bg-status-success/20 text-status-success'
              : 'bg-surface-secondary text-text-muted'
          }`}
        >
          {enabled ? 'AUTO' : 'MANUAL'}
        </button>
      )}

      {/* Refresh button */}
      <button
        onClick={onRefresh}
        disabled={isRefreshing}
        className={`p-1.5 rounded transition-all ${
          isRefreshing
            ? 'text-accent-primary animate-spin'
            : 'text-text-muted hover:text-text-primary hover:bg-surface-secondary'
        }`}
        title="Refresh now"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-4 h-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
          />
        </svg>
      </button>
    </div>
  )
}
