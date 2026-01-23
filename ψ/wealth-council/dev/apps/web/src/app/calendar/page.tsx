'use client'

import { useState, useCallback, useMemo } from 'react'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Landmark,
  BarChart2,
  FileText,
  Bell,
  Star,
  Loader2,
} from 'lucide-react'
import {
  useUpcomingEvents,
  useHighImpactEvents,
  useFOMCSchedule,
  useAuctionCalendar,
  useTimingGuidance,
  CalendarEvent,
  FOMCMeeting,
  AuctionEvent,
} from '@/hooks'
import { useAutoRefresh } from '@/hooks/useAutoRefresh'
import RefreshIndicator from '@/components/common/RefreshIndicator'

// Fallback economic events data (used when API is loading or fails)
const fallbackEconomicEvents = [
  {
    date: '2026-01-21',
    events: [
      { time: '08:30', name: 'Existing Home Sales', impact: 'medium', forecast: '4.00M', previous: '3.96M' },
    ],
  },
  {
    date: '2026-01-22',
    events: [
      { time: '10:00', name: 'Richmond Fed Index', impact: 'low', forecast: '-5', previous: '-7' },
    ],
  },
  {
    date: '2026-01-23',
    events: [
      { time: '08:30', name: 'Initial Jobless Claims', impact: 'high', forecast: '220K', previous: '217K' },
      { time: '10:00', name: 'Leading Indicators', impact: 'medium', forecast: '0.1%', previous: '0.0%' },
    ],
  },
  {
    date: '2026-01-24',
    events: [
      { time: '09:45', name: 'S&P Flash PMI', impact: 'high', forecast: '52.0', previous: '51.4' },
      { time: '10:00', name: 'New Home Sales', impact: 'medium', forecast: '660K', previous: '664K' },
    ],
  },
  {
    date: '2026-01-28',
    events: [
      { time: '08:30', name: 'Durable Goods Orders', impact: 'high', forecast: '0.8%', previous: '-1.2%' },
    ],
  },
  {
    date: '2026-01-29',
    events: [
      { time: '14:00', name: 'FOMC Rate Decision', impact: 'critical', forecast: '4.50%', previous: '4.50%', isHighlight: true },
      { time: '14:30', name: 'Powell Press Conference', impact: 'critical', isHighlight: true },
    ],
  },
  {
    date: '2026-01-30',
    events: [
      { time: '08:30', name: 'GDP (Q4 Advance)', impact: 'critical', forecast: '2.0%', previous: '2.8%', isHighlight: true },
      { time: '08:30', name: 'Initial Jobless Claims', impact: 'high', forecast: '225K', previous: '220K' },
    ],
  },
  {
    date: '2026-01-31',
    events: [
      { time: '08:30', name: 'PCE Price Index', impact: 'critical', forecast: '2.6%', previous: '2.4%', isHighlight: true },
      { time: '08:30', name: 'Personal Income', impact: 'medium', forecast: '0.4%', previous: '0.3%' },
      { time: '10:00', name: 'UMich Consumer Sentiment (Final)', impact: 'medium', forecast: '74.0', previous: '74.0' },
    ],
  },
  {
    date: '2026-02-05',
    events: [
      { time: '10:00', name: 'ISM Services PMI', impact: 'high', forecast: '52.5', previous: '52.1' },
    ],
  },
  {
    date: '2026-02-07',
    events: [
      { time: '08:30', name: 'Non-Farm Payrolls', impact: 'critical', forecast: '175K', previous: '256K', isHighlight: true },
      { time: '08:30', name: 'Unemployment Rate', impact: 'critical', forecast: '4.1%', previous: '4.1%', isHighlight: true },
    ],
  },
  {
    date: '2026-02-12',
    events: [
      { time: '08:30', name: 'CPI (YoY)', impact: 'critical', forecast: '2.8%', previous: '2.9%', isHighlight: true },
      { time: '08:30', name: 'Core CPI (YoY)', impact: 'critical', forecast: '3.2%', previous: '3.2%', isHighlight: true },
    ],
  },
  {
    date: '2026-03-19',
    events: [
      { time: '14:00', name: 'FOMC Rate Decision', impact: 'critical', forecast: '4.50%', previous: '4.50%', isHighlight: true },
      { time: '14:30', name: 'Powell Press Conference', impact: 'critical', isHighlight: true },
    ],
  },
]

// Fallback Treasury auction calendar
const fallbackAuctionCalendar = [
  { date: '2026-01-22', type: '2Y Note', amount: '$63B', time: '13:00' },
  { date: '2026-01-23', type: '5Y Note', amount: '$70B', time: '13:00' },
  { date: '2026-01-24', type: '7Y Note', amount: '$44B', time: '13:00' },
  { date: '2026-01-28', type: '2Y FRN', amount: '$28B', time: '11:30' },
  { date: '2026-02-05', type: '10Y Note', amount: '$42B', time: '13:00' },
  { date: '2026-02-06', type: '30Y Bond', amount: '$25B', time: '13:00' },
  { date: '2026-02-11', type: '3Y Note', amount: '$58B', time: '13:00' },
  { date: '2026-02-12', type: '10Y Note Reopen', amount: '$39B', time: '13:00' },
  { date: '2026-02-13', type: '30Y Bond Reopen', amount: '$22B', time: '13:00' },
]

// Fallback Fed speakers
const fallbackFedSpeakers = [
  { date: '2026-01-22', speaker: 'Barkin', topic: 'Economic Outlook', time: '12:30' },
  { date: '2026-01-23', speaker: 'Bostic', topic: 'Monetary Policy', time: '14:00' },
  { date: '2026-01-27', speaker: 'Waller', topic: 'Inflation Dynamics', time: '10:00' },
  { date: '2026-02-03', speaker: 'Kashkari', topic: 'Banking & Economy', time: '11:30' },
  { date: '2026-02-06', speaker: 'Kugler', topic: 'Labor Market', time: '13:00' },
]

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 0, 21)) // January 21, 2026
  const [selectedDate, setSelectedDate] = useState<string | null>('2026-01-29')
  const [view, setView] = useState<'calendar' | 'list'>('calendar')
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true)

  // CHRONOS hooks
  const { events: upcomingEventsRaw, loading: eventsLoading, refetch: refetchEvents } = useUpcomingEvents(60)
  const { events: highImpactEventsRaw, loading: highImpactLoading, refetch: refetchHighImpact } = useHighImpactEvents(60)
  const { meetings: fomcSchedule, loading: fomcLoading, refetch: refetchFomc } = useFOMCSchedule()
  const { auctions: auctionsRaw, loading: auctionsLoading, refetch: refetchAuctions } = useAuctionCalendar(60)
  const { guidance, loading: guidanceLoading, refetch: refetchGuidance } = useTimingGuidance()

  const isLoading = eventsLoading || highImpactLoading || fomcLoading || auctionsLoading

  // Combined refresh function
  const refreshAll = useCallback(async () => {
    await Promise.all([
      refetchEvents(),
      refetchHighImpact(),
      refetchFomc(),
      refetchAuctions(),
      refetchGuidance(),
    ])
  }, [refetchEvents, refetchHighImpact, refetchFomc, refetchAuctions, refetchGuidance])

  // Auto-refresh every 60 seconds
  const { lastRefresh, isRefreshing, refresh } = useAutoRefresh({
    enabled: autoRefreshEnabled,
    interval: 60000,
    onRefresh: refreshAll,
  })

  // Convert API events to grouped format, falling back to static data
  const economicEvents = useMemo(() => {
    if (!upcomingEventsRaw || upcomingEventsRaw.length === 0) {
      return fallbackEconomicEvents
    }

    // Group events by date
    const grouped: Record<string, any[]> = {}
    upcomingEventsRaw.forEach((event: CalendarEvent) => {
      const dateStr = event.date.toISOString().split('T')[0]
      if (!grouped[dateStr]) grouped[dateStr] = []
      grouped[dateStr].push({
        time: event.time || '09:00',
        name: event.title,
        impact: event.impact,
        forecast: event.forecast,
        previous: event.previous,
        isHighlight: event.impact === 'high',
      })
    })

    return Object.entries(grouped).map(([date, events]) => ({ date, events }))
  }, [upcomingEventsRaw])

  // Convert auctions from API or use fallback
  const auctionCalendar = useMemo(() => {
    if (!auctionsRaw || auctionsRaw.length === 0) {
      return fallbackAuctionCalendar
    }
    return auctionsRaw.map((a: AuctionEvent) => ({
      date: a.date.toISOString().split('T')[0],
      type: a.security,
      amount: a.size,
      time: '13:00', // Default auction time
    }))
  }, [auctionsRaw])

  // Convert FOMC schedule to speakers format or use fallback
  const fedSpeakers = useMemo(() => {
    if (!fomcSchedule || fomcSchedule.length === 0) {
      return fallbackFedSpeakers
    }
    return fomcSchedule.map((m: FOMCMeeting) => ({
      date: m.date.toISOString().split('T')[0],
      speaker: m.type === 'meeting' ? 'FOMC' : m.type === 'minutes' ? 'FOMC Minutes' : 'Fed Speaker',
      topic: m.description,
      time: m.type === 'meeting' ? '14:00' : '14:30',
    }))
  }, [fomcSchedule])

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

  const formatDateKey = (day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  const getEventsForDate = (dateStr: string) => {
    return economicEvents.find(e => e.date === dateStr)?.events || []
  }

  const getAuctionsForDate = (dateStr: string) => {
    return auctionCalendar.filter(a => a.date === dateStr)
  }

  const getSpeakersForDate = (dateStr: string) => {
    return fedSpeakers.filter(s => s.date === dateStr)
  }

  const selectedEvents = selectedDate ? getEventsForDate(selectedDate) : []
  const selectedAuctions = selectedDate ? getAuctionsForDate(selectedDate) : []
  const selectedSpeakers = selectedDate ? getSpeakersForDate(selectedDate) : []

  // Upcoming critical events (from API or fallback)
  const upcomingCritical = useMemo(() => {
    if (highImpactEventsRaw && highImpactEventsRaw.length > 0) {
      return highImpactEventsRaw.slice(0, 5).map((e: CalendarEvent) => ({
        date: e.date.toISOString().split('T')[0],
        time: e.time || '09:00',
        name: e.title,
        forecast: e.forecast,
        previous: e.previous,
      }))
    }

    return economicEvents
      .flatMap(e => e.events.filter(ev => ev.impact === 'critical').map(ev => ({ ...ev, date: e.date })))
      .filter(e => e.date >= '2026-01-21')
      .slice(0, 5)
  }, [highImpactEventsRaw, economicEvents])

  return (
    <div className="space-y-6 animate-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-text-primary flex items-center gap-3">
            <CalendarIcon className="w-6 sm:w-7 h-6 sm:h-7 text-accent-cyan" />
            Economic Calendar
          </h1>
          <p className="text-sm text-text-secondary mt-1">CHRONOS - Market Events & Fed Calendar</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <RefreshIndicator
            lastRefresh={lastRefresh}
            isRefreshing={isRefreshing || isLoading}
            onRefresh={refresh}
            enabled={autoRefreshEnabled}
            onToggle={setAutoRefreshEnabled}
          />
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView('calendar')}
              className={`px-3 py-1 rounded-md text-sm ${view === 'calendar' ? 'bg-accent-cyan text-palantir-bg' : 'bg-palantir-bg-card'}`}
            >
              Calendar
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-3 py-1 rounded-md text-sm ${view === 'list' ? 'bg-accent-cyan text-palantir-bg' : 'bg-palantir-bg-card'}`}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {/* Upcoming Critical Events */}
      <div className="card p-4 glow-border">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Star className="w-4 h-4 text-status-warning" />
          Upcoming Critical Events
        </h3>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {upcomingCritical.map((event, i) => (
            <div
              key={i}
              className="flex-shrink-0 p-3 bg-palantir-bg rounded-lg border border-status-danger/30 min-w-[200px]"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-status-danger font-medium">{event.date}</span>
                <span className="text-xs text-text-muted">{event.time}</span>
              </div>
              <p className="font-medium text-sm">{event.name}</p>
              {event.forecast && (
                <p className="text-xs text-text-muted mt-1">
                  Forecast: {event.forecast} | Prev: {event.previous}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 card p-0 overflow-x-auto">
          {/* Calendar Header */}
          <div className="p-4 border-b border-palantir-border flex items-center justify-between">
            <button onClick={prevMonth} className="p-2 hover:bg-palantir-bg-hover rounded-lg">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="font-semibold text-lg">
              {monthNames[month]} {year}
            </h2>
            <button onClick={nextMonth} className="p-2 hover:bg-palantir-bg-hover rounded-lg">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="p-4">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-xs text-text-muted py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for days before first day */}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="h-24 bg-palantir-bg/30 rounded-lg" />
              ))}

              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const dateStr = formatDateKey(day)
                const events = getEventsForDate(dateStr)
                const auctions = getAuctionsForDate(dateStr)
                const speakers = getSpeakersForDate(dateStr)
                const isToday = dateStr === '2026-01-21'
                const isSelected = dateStr === selectedDate
                const hasCritical = events.some(e => e.impact === 'critical')
                const hasHigh = events.some(e => e.impact === 'high')

                return (
                  <div
                    key={day}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`h-24 p-2 rounded-lg cursor-pointer transition-colors ${
                      isSelected ? 'bg-accent-cyan/20 border border-accent-cyan' :
                      isToday ? 'bg-palantir-bg-hover border border-palantir-border' :
                      'bg-palantir-bg-card hover:bg-palantir-bg-hover'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm ${isToday ? 'font-bold text-accent-cyan' : ''}`}>
                        {day}
                      </span>
                      {hasCritical && <span className="w-2 h-2 rounded-full bg-status-danger" />}
                      {!hasCritical && hasHigh && <span className="w-2 h-2 rounded-full bg-status-warning" />}
                    </div>
                    <div className="space-y-0.5 overflow-hidden">
                      {events.slice(0, 2).map((event, ei) => (
                        <div
                          key={ei}
                          className={`text-xs truncate px-1 rounded ${
                            event.impact === 'critical' ? 'bg-status-danger/20 text-status-danger' :
                            event.impact === 'high' ? 'bg-status-warning/20 text-status-warning' :
                            'bg-palantir-bg text-text-muted'
                          }`}
                        >
                          {event.name}
                        </div>
                      ))}
                      {events.length > 2 && (
                        <div className="text-xs text-text-muted">+{events.length - 2} more</div>
                      )}
                      {auctions.length > 0 && (
                        <div className="text-xs px-1 rounded bg-accent-blue/20 text-accent-blue truncate">
                          {auctions[0].type}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="p-4 border-t border-palantir-border flex items-center gap-6 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-status-danger" />
              <span>Critical Impact</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-status-warning" />
              <span>High Impact</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-accent-blue/20" />
              <span>Treasury Auction</span>
            </div>
          </div>
        </div>

        {/* Right Column - Selected Date Details */}
        <div className="space-y-6">
          {/* Selected Date Events */}
          <div className="card p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-accent-cyan" />
              {selectedDate ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              }) : 'Select a date'}
            </h3>

            {selectedDate && (
              <div className="space-y-4">
                {/* Economic Events */}
                {selectedEvents.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                      Economic Data
                    </h4>
                    <div className="space-y-2">
                      {selectedEvents.map((event, i) => (
                        <div
                          key={i}
                          className={`p-3 rounded-lg ${
                            event.impact === 'critical' ? 'bg-status-danger/10 border border-status-danger/30' :
                            event.impact === 'high' ? 'bg-status-warning/10 border border-status-warning/30' :
                            'bg-palantir-bg'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">{event.name}</span>
                            <span className="text-xs text-text-muted">{event.time} ET</span>
                          </div>
                          {event.forecast && (
                            <div className="flex gap-4 text-xs">
                              <span>
                                <span className="text-text-muted">Forecast:</span>{' '}
                                <span className="font-mono">{event.forecast}</span>
                              </span>
                              <span>
                                <span className="text-text-muted">Previous:</span>{' '}
                                <span className="font-mono">{event.previous}</span>
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Treasury Auctions */}
                {selectedAuctions.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                      Treasury Auctions
                    </h4>
                    <div className="space-y-2">
                      {selectedAuctions.map((auction, i) => (
                        <div key={i} className="p-3 rounded-lg bg-accent-blue/10 border border-accent-blue/30">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">{auction.type}</span>
                            <span className="font-mono text-accent-cyan">{auction.amount}</span>
                          </div>
                          <span className="text-xs text-text-muted">{auction.time} ET</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Fed Speakers */}
                {selectedSpeakers.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                      Fed Speakers
                    </h4>
                    <div className="space-y-2">
                      {selectedSpeakers.map((speaker, i) => (
                        <div key={i} className="p-3 rounded-lg bg-palantir-bg">
                          <div className="flex items-center gap-2">
                            <Landmark className="w-4 h-4 text-text-muted" />
                            <span className="font-medium text-sm">{speaker.speaker}</span>
                          </div>
                          <p className="text-xs text-text-muted mt-1">{speaker.topic} • {speaker.time} ET</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedEvents.length === 0 && selectedAuctions.length === 0 && selectedSpeakers.length === 0 && (
                  <p className="text-sm text-text-muted text-center py-4">No events scheduled</p>
                )}
              </div>
            )}
          </div>

          {/* Upcoming Treasury Auctions */}
          <div className="card p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-accent-blue" />
              Treasury Auctions
            </h3>
            <div className="space-y-2">
              {auctionCalendar.filter(a => a.date >= '2026-01-21').slice(0, 5).map((auction, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-palantir-bg rounded-lg text-sm">
                  <div>
                    <span className="font-medium">{auction.type}</span>
                    <p className="text-xs text-text-muted">{auction.date}</p>
                  </div>
                  <span className="font-mono text-accent-cyan">{auction.amount}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Fed Speakers */}
          <div className="card p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Landmark className="w-4 h-4 text-status-warning" />
              Fed Speakers
            </h3>
            <div className="space-y-2">
              {fedSpeakers.filter(s => s.date >= '2026-01-21').slice(0, 4).map((speaker, i) => (
                <div key={i} className="p-2 bg-palantir-bg rounded-lg text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{speaker.speaker}</span>
                    <span className="text-xs text-text-muted">{speaker.date}</span>
                  </div>
                  <p className="text-xs text-text-muted">{speaker.topic}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
