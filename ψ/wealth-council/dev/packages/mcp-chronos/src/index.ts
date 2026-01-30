/**
 * CHRONOS - Calendar & Timing MCP Server
 * "The Keeper of Time"
 *
 * Tracks economic calendar, FOMC meetings, Treasury auctions,
 * and provides timing guidance for trades.
 */

import type { ApiResponse } from '@wealth-council/shared';

// ============================================
// TYPES
// ============================================

interface CalendarEvent {
  id: string;
  date: Date;
  time?: string;
  title: string;
  type: 'fomc' | 'data' | 'auction' | 'speaker' | 'holiday' | 'other';
  impact: 'high' | 'medium' | 'low';
  description: string;
  relevance: 'bullish' | 'bearish' | 'neutral';
  forecast?: string;
  previous?: string;
}

interface FOMCMeeting {
  date: Date;
  type: 'meeting' | 'minutes';
  rateExpectation: 'hike' | 'hold' | 'cut';
  probability: number;
  dotPlotUpdate: boolean;
  seaSummary: boolean;
}

interface TreasuryAuction {
  date: Date;
  security: string;
  tenor: '2Y' | '5Y' | '7Y' | '10Y' | '20Y' | '30Y';
  amount: string;
  previousYield?: number;
  bidToCover?: number;
}

// ============================================
// STATE MANAGEMENT
// ============================================

interface ChronosState {
  events: CalendarEvent[];
  fomcMeetings: FOMCMeeting[];
  auctions: TreasuryAuction[];
  lastUpdate: Date;
}

const state: ChronosState = {
  events: [
    // FOMC Events
    {
      id: 'fomc-jan',
      date: new Date('2026-01-29'),
      time: '14:00 ET',
      title: 'FOMC Rate Decision',
      type: 'fomc',
      impact: 'high',
      description: 'Federal Reserve interest rate decision and statement',
      relevance: 'neutral',
      forecast: 'Hold',
      previous: '4.50%',
    },
    {
      id: 'fomc-mar',
      date: new Date('2026-03-19'),
      time: '14:00 ET',
      title: 'FOMC Rate Decision + SEP',
      type: 'fomc',
      impact: 'high',
      description: 'Rate decision with Summary of Economic Projections (dot plot)',
      relevance: 'bearish',
      forecast: 'Hold',
      previous: '4.50%',
    },
    // Economic Data
    {
      id: 'gdp-q4',
      date: new Date('2026-01-30'),
      time: '08:30 ET',
      title: 'GDP Q4 Advance',
      type: 'data',
      impact: 'high',
      description: 'First estimate of Q4 2025 GDP growth',
      relevance: 'neutral',
      forecast: '2.1%',
      previous: '2.8%',
    },
    {
      id: 'nfp-feb',
      date: new Date('2026-02-07'),
      time: '08:30 ET',
      title: 'Nonfarm Payrolls',
      type: 'data',
      impact: 'high',
      description: 'January employment report',
      relevance: 'neutral',
      forecast: '+150K',
      previous: '+175K',
    },
    {
      id: 'cpi-jan',
      date: new Date('2026-02-12'),
      time: '08:30 ET',
      title: 'CPI January',
      type: 'data',
      impact: 'high',
      description: 'Consumer Price Index for January',
      relevance: 'bearish',
      forecast: '2.8% YoY',
      previous: '2.9% YoY',
    },
    {
      id: 'retail-jan',
      date: new Date('2026-02-14'),
      time: '08:30 ET',
      title: 'Retail Sales',
      type: 'data',
      impact: 'medium',
      description: 'January retail sales data',
      relevance: 'neutral',
    },
    // Treasury Auctions
    {
      id: 'auction-2y-jan',
      date: new Date('2026-01-28'),
      time: '13:00 ET',
      title: '2-Year Note Auction',
      type: 'auction',
      impact: 'medium',
      description: '$69B 2-Year Treasury Note auction',
      relevance: 'neutral',
    },
    {
      id: 'auction-5y-jan',
      date: new Date('2026-01-29'),
      time: '13:00 ET',
      title: '5-Year Note Auction',
      type: 'auction',
      impact: 'medium',
      description: '$70B 5-Year Treasury Note auction',
      relevance: 'neutral',
    },
    {
      id: 'auction-7y-jan',
      date: new Date('2026-01-30'),
      time: '13:00 ET',
      title: '7-Year Note Auction',
      type: 'auction',
      impact: 'medium',
      description: '$44B 7-Year Treasury Note auction',
      relevance: 'neutral',
    },
    // Fed Speakers
    {
      id: 'waller-jan',
      date: new Date('2026-01-27'),
      time: '12:00 ET',
      title: 'Fed Gov Waller Speaks',
      type: 'speaker',
      impact: 'medium',
      description: 'Governor Waller on economic outlook',
      relevance: 'neutral',
    },
    {
      id: 'powell-feb',
      date: new Date('2026-02-11'),
      time: '10:00 ET',
      title: 'Powell Semi-Annual Testimony',
      type: 'speaker',
      impact: 'high',
      description: 'Chair Powell testimony to Congress',
      relevance: 'bearish',
    },
  ],
  fomcMeetings: [
    {
      date: new Date('2026-01-29'),
      type: 'meeting',
      rateExpectation: 'hold',
      probability: 92,
      dotPlotUpdate: false,
      seaSummary: false,
    },
    {
      date: new Date('2026-03-19'),
      type: 'meeting',
      rateExpectation: 'hold',
      probability: 78,
      dotPlotUpdate: true,
      seaSummary: true,
    },
    {
      date: new Date('2026-05-07'),
      type: 'meeting',
      rateExpectation: 'cut',
      probability: 45,
      dotPlotUpdate: false,
      seaSummary: false,
    },
    {
      date: new Date('2026-06-18'),
      type: 'meeting',
      rateExpectation: 'cut',
      probability: 62,
      dotPlotUpdate: true,
      seaSummary: true,
    },
  ],
  auctions: [
    {
      date: new Date('2026-01-28'),
      security: '2-Year Note',
      tenor: '2Y',
      amount: '$69B',
      previousYield: 4.12,
      bidToCover: 2.58,
    },
    {
      date: new Date('2026-01-29'),
      security: '5-Year Note',
      tenor: '5Y',
      amount: '$70B',
      previousYield: 4.18,
      bidToCover: 2.42,
    },
    {
      date: new Date('2026-01-30'),
      security: '7-Year Note',
      tenor: '7Y',
      amount: '$44B',
      previousYield: 4.25,
      bidToCover: 2.35,
    },
    {
      date: new Date('2026-02-11'),
      security: '10-Year Note',
      tenor: '10Y',
      amount: '$42B',
      previousYield: 4.22,
      bidToCover: 2.38,
    },
    {
      date: new Date('2026-02-13'),
      security: '30-Year Bond',
      tenor: '30Y',
      amount: '$22B',
      previousYield: 4.84,
      bidToCover: 2.28,
    },
  ],
  lastUpdate: new Date(),
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function isToday(date: Date): boolean {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

function isThisWeek(date: Date): boolean {
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);
  return date >= weekStart && date < weekEnd;
}

function daysUntil(date: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

// ============================================
// API FUNCTIONS
// ============================================

export function getUpcomingEvents(days: number = 14): ApiResponse<CalendarEvent[]> {
  const now = new Date();
  const cutoff = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const upcoming = state.events
    .filter(e => e.date >= now && e.date <= cutoff)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  return {
    success: true,
    data: upcoming,
    timestamp: new Date(),
  };
}

export function getTodayEvents(): ApiResponse<CalendarEvent[]> {
  const todayEvents = state.events.filter(e => isToday(e.date));
  return {
    success: true,
    data: todayEvents,
    timestamp: new Date(),
  };
}

export function getThisWeekEvents(): ApiResponse<CalendarEvent[]> {
  const weekEvents = state.events
    .filter(e => isThisWeek(e.date))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  return {
    success: true,
    data: weekEvents,
    timestamp: new Date(),
  };
}

export function getHighImpactEvents(days: number = 30): ApiResponse<CalendarEvent[]> {
  const now = new Date();
  const cutoff = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const highImpact = state.events
    .filter(e => e.date >= now && e.date <= cutoff && e.impact === 'high')
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  return {
    success: true,
    data: highImpact,
    timestamp: new Date(),
  };
}

export function getFOMCSchedule(): ApiResponse<FOMCMeeting[]> {
  const upcoming = state.fomcMeetings
    .filter(m => m.date >= new Date())
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  return {
    success: true,
    data: upcoming,
    timestamp: new Date(),
  };
}

export function getNextFOMC(): ApiResponse<{
  meeting: FOMCMeeting;
  daysUntil: number;
  tradingDaysUntil: number;
}> {
  const next = state.fomcMeetings
    .filter(m => m.date >= new Date())
    .sort((a, b) => a.date.getTime() - b.date.getTime())[0];

  if (!next) {
    return {
      success: false,
      error: 'No upcoming FOMC meetings',
      timestamp: new Date(),
    };
  }

  const days = daysUntil(next.date);
  // Rough estimate: trading days = calendar days * 5/7
  const tradingDays = Math.ceil(days * 5 / 7);

  return {
    success: true,
    data: {
      meeting: next,
      daysUntil: days,
      tradingDaysUntil: tradingDays,
    },
    timestamp: new Date(),
  };
}

export function getAuctionCalendar(days: number = 30): ApiResponse<TreasuryAuction[]> {
  const now = new Date();
  const cutoff = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const upcoming = state.auctions
    .filter(a => a.date >= now && a.date <= cutoff)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  return {
    success: true,
    data: upcoming,
    timestamp: new Date(),
  };
}

export function getTimingGuidance(): ApiResponse<{
  tradeWindow: 'favorable' | 'caution' | 'avoid';
  reasoning: string[];
  upcomingRisks: string[];
  recommendations: string[];
}> {
  const now = new Date();
  const threeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const nearTermHighImpact = state.events.filter(
    e => e.date >= now && e.date <= threeDays && e.impact === 'high'
  );

  const upcomingRisks: string[] = [];
  const recommendations: string[] = [];
  let tradeWindow: 'favorable' | 'caution' | 'avoid' = 'favorable';

  // Check for FOMC within 2 days
  const fomcNear = state.fomcMeetings.find(m => {
    const days = daysUntil(m.date);
    return days >= 0 && days <= 2;
  });

  if (fomcNear) {
    tradeWindow = 'avoid';
    upcomingRisks.push(`FOMC decision in ${daysUntil(fomcNear.date)} days`);
    recommendations.push('Reduce position sizes ahead of FOMC');
    recommendations.push('Consider hedging with options');
  }

  // Check for high-impact data
  for (const event of nearTermHighImpact) {
    const days = daysUntil(event.date);
    upcomingRisks.push(`${event.title} in ${days} day${days === 1 ? '' : 's'}`);
    if (tradeWindow !== 'avoid') {
      tradeWindow = 'caution';
    }
  }

  // Check for Treasury auctions (big ones can move yields)
  const bigAuctions = state.auctions.filter(
    a => a.date >= now && a.date <= threeDays &&
    ['10Y', '20Y', '30Y'].includes(a.tenor)
  );

  for (const auction of bigAuctions) {
    upcomingRisks.push(`${auction.security} auction (${auction.amount})`);
    recommendations.push(`Watch bid-to-cover ratio on ${auction.tenor} auction`);
  }

  const reasoning: string[] = [];
  if (tradeWindow === 'favorable') {
    reasoning.push('No major events in next 3 days');
    reasoning.push('Liquidity conditions normal');
    recommendations.push('Normal trading window - execute planned trades');
  } else if (tradeWindow === 'caution') {
    reasoning.push('High-impact events approaching');
    reasoning.push('Elevated volatility expected');
    recommendations.push('Reduce new position sizes by 50%');
  } else {
    reasoning.push('Critical event imminent');
    reasoning.push('Maximum uncertainty period');
    recommendations.push('Avoid new positions until event clears');
  }

  return {
    success: true,
    data: {
      tradeWindow,
      reasoning,
      upcomingRisks,
      recommendations,
    },
    timestamp: new Date(),
  };
}

export function getMarketHours(): ApiResponse<{
  isOpen: boolean;
  session: 'pre' | 'regular' | 'after' | 'closed';
  nextOpen: Date;
  nextClose: Date;
}> {
  const now = new Date();
  const etTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const hour = etTime.getHours();
  const minute = etTime.getMinutes();
  const dayOfWeek = etTime.getDay();

  let isOpen = false;
  let session: 'pre' | 'regular' | 'after' | 'closed' = 'closed';

  if (dayOfWeek >= 1 && dayOfWeek <= 5) {
    if (hour >= 4 && (hour < 9 || (hour === 9 && minute < 30))) {
      session = 'pre';
    } else if ((hour === 9 && minute >= 30) || (hour > 9 && hour < 16)) {
      session = 'regular';
      isOpen = true;
    } else if (hour >= 16 && hour < 20) {
      session = 'after';
    }
  }

  // Calculate next open/close
  const nextOpen = new Date(etTime);
  const nextClose = new Date(etTime);

  if (isOpen) {
    nextClose.setHours(16, 0, 0, 0);
  } else {
    // Find next trading day
    let daysToAdd = 0;
    if (dayOfWeek === 0) daysToAdd = 1;
    else if (dayOfWeek === 6) daysToAdd = 2;
    else if (hour >= 16) daysToAdd = 1;

    nextOpen.setDate(nextOpen.getDate() + daysToAdd);
    nextOpen.setHours(9, 30, 0, 0);
    nextClose.setDate(nextClose.getDate() + daysToAdd);
    nextClose.setHours(16, 0, 0, 0);
  }

  return {
    success: true,
    data: {
      isOpen,
      session,
      nextOpen,
      nextClose,
    },
    timestamp: new Date(),
  };
}

// ============================================
// EXPORTS
// ============================================

const chronos = {
  // Events
  getUpcomingEvents,
  getTodayEvents,
  getThisWeekEvents,
  getHighImpactEvents,

  // FOMC
  getFOMCSchedule,
  getNextFOMC,

  // Auctions
  getAuctionCalendar,

  // Timing
  getTimingGuidance,
  getMarketHours,
};

// For direct execution (Bun only)
// @ts-ignore - import.meta.main is Bun-specific
if (typeof import.meta !== 'undefined' && (import.meta as any).main) {
  console.log('⏰ CHRONOS MCP Server Starting...');
  console.log('Events tracked:', state.events.length);
  console.log('FOMC meetings:', state.fomcMeetings.length);
  console.log('Upcoming auctions:', state.auctions.length);
  console.log('CHRONOS is keeping time... 🕐');
}

export default chronos;
