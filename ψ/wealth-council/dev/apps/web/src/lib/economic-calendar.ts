/**
 * Economic Calendar Data Service
 * Fetches real economic calendar data from Finnhub
 *
 * Data Sources:
 * 1. Finnhub Economic Calendar (requires API key)
 * 2. Mock data (fallback)
 *
 * Finnhub provides:
 * - Economic events (CPI, GDP, NFP, etc.)
 * - Country-specific data
 * - Impact levels
 *
 * Get your key at: https://finnhub.io/
 */

interface FinnhubEconomicEvent {
  actual: number | null
  country: string
  estimate: number | null
  event: string
  impact: 'low' | 'medium' | 'high'
  prev: number | null
  time: string
  unit: string
}

interface CalendarEvent {
  id: string
  date: Date
  time?: string
  title: string
  type: 'fomc' | 'data' | 'auction' | 'speaker' | 'holiday' | 'economic' | 'earnings' | 'other'
  impact: 'high' | 'medium' | 'low'
  description: string
  relevance: 'bullish' | 'bearish' | 'neutral'
  forecast?: string
  previous?: string
  actual?: string
  country?: string
  source: 'finnhub' | 'mock'
}

// Mock calendar data (fallback)
function getMockCalendarEvents(): CalendarEvent[] {
  const today = new Date()
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth()

  // Generate events relative to current date
  return [
    // FOMC Events
    {
      id: 'fomc-next',
      date: getNextFOMCDate(),
      time: '14:00 ET',
      title: 'FOMC Rate Decision',
      type: 'fomc',
      impact: 'high',
      description: 'Federal Reserve interest rate decision and statement',
      relevance: 'neutral',
      forecast: 'Hold',
      previous: '4.50%',
      source: 'mock',
    },
    // Economic Data
    {
      id: 'gdp-next',
      date: new Date(currentYear, currentMonth, today.getDate() + 7),
      time: '08:30 ET',
      title: 'GDP Quarterly',
      type: 'data',
      impact: 'high',
      description: 'Quarterly GDP growth estimate',
      relevance: 'neutral',
      forecast: '2.1%',
      previous: '2.8%',
      source: 'mock',
    },
    {
      id: 'nfp-next',
      date: getNextFirstFriday(),
      time: '08:30 ET',
      title: 'Nonfarm Payrolls',
      type: 'data',
      impact: 'high',
      description: 'Monthly employment report',
      relevance: 'neutral',
      forecast: '+150K',
      previous: '+175K',
      source: 'mock',
    },
    {
      id: 'cpi-next',
      date: new Date(currentYear, currentMonth, 12),
      time: '08:30 ET',
      title: 'CPI Monthly',
      type: 'data',
      impact: 'high',
      description: 'Consumer Price Index',
      relevance: 'bearish',
      forecast: '2.8% YoY',
      previous: '2.9% YoY',
      source: 'mock',
    },
    {
      id: 'retail-next',
      date: new Date(currentYear, currentMonth, 14),
      time: '08:30 ET',
      title: 'Retail Sales',
      type: 'data',
      impact: 'medium',
      description: 'Monthly retail sales data',
      relevance: 'neutral',
      source: 'mock',
    },
    // Treasury Auctions
    {
      id: 'auction-2y',
      date: new Date(currentYear, currentMonth, today.getDate() + 2),
      time: '13:00 ET',
      title: '2-Year Note Auction',
      type: 'auction',
      impact: 'medium',
      description: '$69B 2-Year Treasury Note auction',
      relevance: 'neutral',
      source: 'mock',
    },
    {
      id: 'auction-10y',
      date: new Date(currentYear, currentMonth, today.getDate() + 10),
      time: '13:00 ET',
      title: '10-Year Note Auction',
      type: 'auction',
      impact: 'high',
      description: '$42B 10-Year Treasury Note auction',
      relevance: 'neutral',
      source: 'mock',
    },
  ].filter(e => e.date >= today) as CalendarEvent[] // Only future events
}

// Helper to get next FOMC date (roughly every 6-8 weeks)
function getNextFOMCDate(): Date {
  // FOMC typically meets 8 times per year
  const fomcDates2026 = [
    new Date('2026-01-29'),
    new Date('2026-03-19'),
    new Date('2026-05-07'),
    new Date('2026-06-18'),
    new Date('2026-07-30'),
    new Date('2026-09-17'),
    new Date('2026-11-05'),
    new Date('2026-12-17'),
  ]

  const today = new Date()
  return fomcDates2026.find(d => d > today) || fomcDates2026[0]
}

// Helper to get next first Friday (NFP release day)
function getNextFirstFriday(): Date {
  const today = new Date()
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)

  // Find first Friday of next month
  while (nextMonth.getDay() !== 5) {
    nextMonth.setDate(nextMonth.getDate() + 1)
  }

  // If this month's first Friday hasn't passed, use it
  const thisMonthFirstFriday = new Date(today.getFullYear(), today.getMonth(), 1)
  while (thisMonthFirstFriday.getDay() !== 5) {
    thisMonthFirstFriday.setDate(thisMonthFirstFriday.getDate() + 1)
  }

  return thisMonthFirstFriday > today ? thisMonthFirstFriday : nextMonth
}

/**
 * Fetch economic calendar from Finnhub
 */
async function fetchFromFinnhub(fromDate: Date, toDate: Date): Promise<CalendarEvent[] | null> {
  const apiKey = process.env.FINNHUB_API_KEY

  if (!apiKey) {
    console.log('FINNHUB_API_KEY not set, skipping economic calendar fetch')
    return null
  }

  try {
    const from = fromDate.toISOString().split('T')[0]
    const to = toDate.toISOString().split('T')[0]

    const response = await fetch(
      `https://finnhub.io/api/v1/calendar/economic?from=${from}&to=${to}&token=${apiKey}`,
      { next: { revalidate: 3600 } } // Cache for 1 hour
    )

    if (!response.ok) {
      console.error(`Finnhub calendar API error: ${response.status}`)
      return null
    }

    const data = await response.json()

    if (!data.economicCalendar || !Array.isArray(data.economicCalendar)) {
      return null
    }

    // Filter for US events and high-impact treasury-related ones
    const usEvents = data.economicCalendar.filter(
      (e: FinnhubEconomicEvent) => e.country === 'US' || e.country === 'United States'
    )

    // Convert to our format
    const events: CalendarEvent[] = usEvents.map((e: FinnhubEconomicEvent, idx: number) => {
      // Determine event type
      let type: CalendarEvent['type'] = 'data'
      const eventLower = e.event.toLowerCase()

      if (eventLower.includes('fomc') || eventLower.includes('fed')) {
        type = 'fomc'
      } else if (eventLower.includes('auction') || eventLower.includes('treasury')) {
        type = 'auction'
      } else if (eventLower.includes('speech') || eventLower.includes('speaks')) {
        type = 'speaker'
      }

      // Determine relevance based on event type and actual vs estimate
      let relevance: CalendarEvent['relevance'] = 'neutral'
      if (e.actual !== null && e.estimate !== null) {
        if (eventLower.includes('cpi') || eventLower.includes('pce') || eventLower.includes('inflation')) {
          relevance = e.actual > e.estimate ? 'bearish' : e.actual < e.estimate ? 'bullish' : 'neutral'
        } else if (eventLower.includes('gdp') || eventLower.includes('employment') || eventLower.includes('payroll')) {
          relevance = e.actual > e.estimate ? 'bullish' : e.actual < e.estimate ? 'bearish' : 'neutral'
        }
      }

      return {
        id: `finnhub-${idx}-${e.time}`,
        date: new Date(e.time),
        time: new Date(e.time).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'America/New_York',
        }) + ' ET',
        title: e.event,
        type,
        impact: e.impact || 'medium',
        description: `${e.event}${e.unit ? ` (${e.unit})` : ''}`,
        relevance,
        forecast: e.estimate !== null ? String(e.estimate) + (e.unit || '') : undefined,
        previous: e.prev !== null ? String(e.prev) + (e.unit || '') : undefined,
        actual: e.actual !== null ? String(e.actual) + (e.unit || '') : undefined,
        country: e.country,
        source: 'finnhub' as const,
      }
    })

    console.log(`✓ Fetched ${events.length} economic events from Finnhub`)
    return events
  } catch (error) {
    console.error('Finnhub calendar fetch error:', error)
    return null
  }
}

/**
 * Fetch economic calendar with fallback
 */
export async function fetchEconomicCalendar(days: number = 30): Promise<{
  events: CalendarEvent[]
  source: 'finnhub' | 'mock'
}> {
  const today = new Date()
  const endDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000)

  console.log(`Fetching economic calendar for next ${days} days...`)

  // Try Finnhub first
  const finnhubEvents = await fetchFromFinnhub(today, endDate)
  if (finnhubEvents && finnhubEvents.length > 0) {
    return { events: finnhubEvents, source: 'finnhub' }
  }

  // Fallback to mock
  console.log('⚠ Using mock economic calendar data')
  return { events: getMockCalendarEvents(), source: 'mock' }
}

/**
 * Get high-impact events only
 */
export async function fetchHighImpactEvents(days: number = 30): Promise<CalendarEvent[]> {
  const { events } = await fetchEconomicCalendar(days)
  return events.filter(e => e.impact === 'high')
}

/**
 * Get events for today
 */
export async function fetchTodayEvents(): Promise<CalendarEvent[]> {
  const { events } = await fetchEconomicCalendar(1)
  const today = new Date()
  return events.filter(
    e => e.date.toDateString() === today.toDateString()
  )
}

/**
 * Check if Finnhub calendar is available
 */
export function isCalendarAPIConfigured(): boolean {
  return !!process.env.FINNHUB_API_KEY
}

export type { CalendarEvent, FinnhubEconomicEvent }
