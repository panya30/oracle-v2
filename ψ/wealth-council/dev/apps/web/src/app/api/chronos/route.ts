/**
 * CHRONOS API Route
 * Connects WebUI to CHRONOS MCP Server (Calendar/Timing)
 * Integrates with Finnhub for real economic calendar data when configured
 */

import { NextRequest, NextResponse } from 'next/server'
import chronos from '@wealth-council/mcp-chronos'
import {
  fetchEconomicCalendar,
  fetchHighImpactEvents,
  fetchTodayEvents,
  isCalendarAPIConfigured,
} from '@/lib/economic-calendar'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action') || 'upcoming'
  const days = parseInt(searchParams.get('days') || '14')

  try {
    switch (action) {
      case 'upcoming': {
        // Try real calendar API first
        if (isCalendarAPIConfigured()) {
          const { events, source } = await fetchEconomicCalendar(days)
          if (events.length > 0) {
            return NextResponse.json({
              success: true,
              data: events,
              source,
              timestamp: new Date(),
            })
          }
        }
        // Fallback to MCP mock data
        return NextResponse.json(chronos.getUpcomingEvents(days))
      }

      case 'today': {
        // Try real calendar API first
        if (isCalendarAPIConfigured()) {
          const events = await fetchTodayEvents()
          if (events.length >= 0) {
            return NextResponse.json({
              success: true,
              data: events,
              source: 'finnhub',
              timestamp: new Date(),
            })
          }
        }
        return NextResponse.json(chronos.getTodayEvents())
      }

      case 'week':
        return NextResponse.json(chronos.getThisWeekEvents())

      case 'highImpact': {
        // Try real calendar API first
        if (isCalendarAPIConfigured()) {
          const events = await fetchHighImpactEvents(days)
          if (events.length > 0) {
            return NextResponse.json({
              success: true,
              data: events,
              source: 'finnhub',
              timestamp: new Date(),
            })
          }
        }
        return NextResponse.json(chronos.getHighImpactEvents(days))
      }

      case 'fomc':
        return NextResponse.json(chronos.getFOMCSchedule())

      case 'nextFomc':
        return NextResponse.json(chronos.getNextFOMC())

      case 'auctions':
        return NextResponse.json(chronos.getAuctionCalendar(days))

      case 'timing':
        return NextResponse.json(chronos.getTimingGuidance())

      case 'hours':
        return NextResponse.json(chronos.getMarketHours())

      default:
        return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 })
    }
  } catch (error) {
    console.error('CHRONOS API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
