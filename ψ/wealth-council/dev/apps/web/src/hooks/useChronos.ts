import { useState, useEffect, useCallback } from 'react'

// Types matching CHRONOS agent responses
export interface CalendarEvent {
  id: string
  type: 'fomc' | 'auction' | 'data' | 'speaker' | 'economic' | 'earnings' | 'holiday' | 'other'
  title: string
  date: Date
  time?: string
  impact: 'high' | 'medium' | 'low'
  description?: string
  expectation?: string
  forecast?: string
  previous?: string
  relevance?: string
  source?: 'finnhub' | 'mock'
}

export interface FOMCMeeting {
  date: Date
  type: 'meeting' | 'minutes' | 'speech'
  description: string
  daysUntil: number
  expectation: 'hawkish' | 'dovish' | 'neutral' | 'hold'
}

export interface AuctionEvent {
  date: Date
  security: string
  size: string
  previousYield?: number
  expectedYield?: number
}

export interface TimingGuidance {
  currentPhase: string
  recommendation: string
  urgency: 'low' | 'medium' | 'high'
  nextKeyDate: Date
  reasoning: string[]
}

export interface MarketHours {
  isOpen: boolean
  currentSession: string
  nextOpen?: Date
  nextClose?: Date
  preMarketStart?: Date
  afterHoursEnd?: Date
}

// Hook for upcoming events
export function useUpcomingEvents(days: number = 14) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/chronos?action=upcoming&days=${days}`)
      if (!response.ok) throw new Error('Failed to fetch events')

      const result = await response.json()
      if (result.success && result.data) {
        const eventsData = Array.isArray(result.data) ? result.data : result.data.events || []
        const eventsWithDates = eventsData.map((e: any) => ({
          ...e,
          date: new Date(e.date)
        }))
        setEvents(eventsWithDates)
      }
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [days])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  return { events, loading, error, refetch: fetchEvents }
}

// Hook for today's events
export function useTodayEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/chronos?action=today')
      if (!response.ok) throw new Error('Failed to fetch today events')

      const result = await response.json()
      if (result.success && result.data) {
        const eventsData = Array.isArray(result.data) ? result.data : result.data.events || []
        const eventsWithDates = eventsData.map((e: any) => ({
          ...e,
          date: new Date(e.date)
        }))
        setEvents(eventsWithDates)
      }
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  return { events, loading, error, refetch: fetchEvents }
}

// Hook for this week's events
export function useWeekEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/chronos?action=week')
      if (!response.ok) throw new Error('Failed to fetch week events')

      const result = await response.json()
      if (result.success && result.data) {
        const eventsData = Array.isArray(result.data) ? result.data : result.data.events || []
        const eventsWithDates = eventsData.map((e: any) => ({
          ...e,
          date: new Date(e.date)
        }))
        setEvents(eventsWithDates)
      }
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  return { events, loading, error, refetch: fetchEvents }
}

// Hook for high impact events
export function useHighImpactEvents(days: number = 30) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/chronos?action=highImpact&days=${days}`)
      if (!response.ok) throw new Error('Failed to fetch high impact events')

      const result = await response.json()
      if (result.success && result.data) {
        const eventsData = Array.isArray(result.data) ? result.data : result.data.events || []
        const eventsWithDates = eventsData.map((e: any) => ({
          ...e,
          date: new Date(e.date)
        }))
        setEvents(eventsWithDates)
      }
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [days])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  return { events, loading, error, refetch: fetchEvents }
}

// Hook for FOMC schedule
export function useFOMCSchedule() {
  const [meetings, setMeetings] = useState<FOMCMeeting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSchedule = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/chronos?action=fomc')
      if (!response.ok) throw new Error('Failed to fetch FOMC schedule')

      const result = await response.json()
      if (result.success && result.data) {
        const meetingsData = result.data.meetings || result.data || []
        const meetingsArray = Array.isArray(meetingsData) ? meetingsData : []
        const meetingsWithDates = meetingsArray.map((m: any) => ({
          ...m,
          date: new Date(m.date)
        }))
        setMeetings(meetingsWithDates)
      }
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSchedule()
  }, [fetchSchedule])

  return { meetings, loading, error, refetch: fetchSchedule }
}

// Hook for next FOMC meeting
export function useNextFOMC() {
  const [nextFomc, setNextFomc] = useState<FOMCMeeting | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchNextFomc = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/chronos?action=nextFomc')
      if (!response.ok) throw new Error('Failed to fetch next FOMC')

      const result = await response.json()
      if (result.success && result.data) {
        setNextFomc({
          ...result.data,
          date: new Date(result.data.date)
        })
      }
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNextFomc()
  }, [fetchNextFomc])

  return { nextFomc, loading, error, refetch: fetchNextFomc }
}

// Hook for auction calendar
export function useAuctionCalendar(days: number = 14) {
  const [auctions, setAuctions] = useState<AuctionEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAuctions = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/chronos?action=auctions&days=${days}`)
      if (!response.ok) throw new Error('Failed to fetch auctions')

      const result = await response.json()
      if (result.success && result.data) {
        const auctionsData = result.data.auctions || result.data || []
        const auctionsArray = Array.isArray(auctionsData) ? auctionsData : []
        const auctionsWithDates = auctionsArray.map((a: any) => ({
          ...a,
          date: new Date(a.date)
        }))
        setAuctions(auctionsWithDates)
      }
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [days])

  useEffect(() => {
    fetchAuctions()
  }, [fetchAuctions])

  return { auctions, loading, error, refetch: fetchAuctions }
}

// Hook for timing guidance
export function useTimingGuidance() {
  const [guidance, setGuidance] = useState<TimingGuidance | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchGuidance = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/chronos?action=timing')
      if (!response.ok) throw new Error('Failed to fetch timing guidance')

      const result = await response.json()
      if (result.success && result.data) {
        setGuidance({
          ...result.data,
          nextKeyDate: new Date(result.data.nextKeyDate || Date.now()),
          reasoning: result.data.reasoning || [],
        })
      }
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchGuidance()
  }, [fetchGuidance])

  return { guidance, loading, error, refetch: fetchGuidance }
}

// Hook for market hours
export function useMarketHours() {
  const [hours, setHours] = useState<MarketHours | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHours = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/chronos?action=hours')
      if (!response.ok) throw new Error('Failed to fetch market hours')

      const result = await response.json()
      if (result.success && result.data) {
        setHours({
          ...result.data,
          nextOpen: result.data.nextOpen ? new Date(result.data.nextOpen) : undefined,
          nextClose: result.data.nextClose ? new Date(result.data.nextClose) : undefined,
          preMarketStart: result.data.preMarketStart ? new Date(result.data.preMarketStart) : undefined,
          afterHoursEnd: result.data.afterHoursEnd ? new Date(result.data.afterHoursEnd) : undefined,
        })
      }
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHours()
  }, [fetchHours])

  return { hours, loading, error, refetch: fetchHours }
}
