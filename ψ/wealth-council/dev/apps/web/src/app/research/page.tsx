'use client'

import { useState } from 'react'
import {
  Globe,
  TrendingUp,
  TrendingDown,
  Newspaper,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Landmark,
  BarChart2,
  FileText,
  ExternalLink,
  ChevronRight,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { useMarketData } from '@/hooks'

// Mock data from HERMES
const macroData = {
  fedRate: { value: 4.50, change: 0, lastUpdate: '2026-01-15' },
  cpi: { value: 2.9, change: -0.1, lastUpdate: '2026-01-15' },
  unemployment: { value: 4.1, change: 0.1, lastUpdate: '2026-01-10' },
  gdpGrowth: { value: 2.3, change: -0.2, lastUpdate: '2026-01-25' },
  debtToGdp: { value: 123.4, change: 1.2, lastUpdate: '2026-01-01' },
  tenYearYield: { value: 4.29, change: 0.07, lastUpdate: 'Live' },
}

const yieldCurve = [
  { tenor: '3M', yield: 4.35, prevYield: 4.32 },
  { tenor: '6M', yield: 4.28, prevYield: 4.25 },
  { tenor: '1Y', yield: 4.20, prevYield: 4.18 },
  { tenor: '2Y', yield: 4.15, prevYield: 4.12 },
  { tenor: '5Y', yield: 4.22, prevYield: 4.17 },
  { tenor: '10Y', yield: 4.29, prevYield: 4.22 },
  { tenor: '20Y', yield: 4.62, prevYield: 4.55 },
  { tenor: '30Y', yield: 4.93, prevYield: 4.84 },
]

const curveStatus = {
  shape: 'Steepening',
  twoTenSpread: 0.14,
  threeTenSpread: -0.06,
  fiveTenSpread: 0.07,
  status: 'normal',
}

const newsFeed = [
  {
    id: 1,
    headline: 'Treasury Yields Surge as Inflation Concerns Resurface',
    source: 'Bloomberg',
    time: '15m ago',
    sentiment: 'bearish',
    relevance: 'high',
    summary: '10-year Treasury yield climbed to highest level since November as traders reduced bets on Fed rate cuts.',
  },
  {
    id: 2,
    headline: 'Fed Officials Signal Patience on Rate Cuts Amid Sticky Inflation',
    source: 'Reuters',
    time: '1h ago',
    sentiment: 'bearish',
    relevance: 'high',
    summary: 'Multiple Fed governors emphasized need to see more progress on inflation before considering cuts.',
  },
  {
    id: 3,
    headline: 'Japan BOJ Hints at Further Rate Hikes, Yen Strengthens',
    source: 'Nikkei',
    time: '2h ago',
    sentiment: 'bearish',
    relevance: 'medium',
    summary: 'BOJ rate hikes could reduce demand for US Treasuries as Japanese investors repatriate funds.',
  },
  {
    id: 4,
    headline: 'Treasury Auction Shows Weakening Foreign Demand',
    source: 'CNBC',
    time: '4h ago',
    sentiment: 'bearish',
    relevance: 'high',
    summary: '$22B 30-year auction saw lowest foreign participation in 18 months, yields rose post-auction.',
  },
  {
    id: 5,
    headline: 'US Budget Deficit Widens to $129B in December',
    source: 'WSJ',
    time: '1d ago',
    sentiment: 'bearish',
    relevance: 'medium',
    summary: 'Fiscal year deficit pace suggests $2T+ annual shortfall, increasing Treasury supply concerns.',
  },
]

const fedMeetings = [
  { date: '2026-01-29', type: 'FOMC Meeting', expectation: 'Hold', probability: 92 },
  { date: '2026-03-19', type: 'FOMC Meeting', expectation: 'Hold', probability: 78 },
  { date: '2026-05-07', type: 'FOMC Meeting', expectation: 'Cut 25bp', probability: 45 },
  { date: '2026-06-18', type: 'FOMC Meeting', expectation: 'Cut 25bp', probability: 62 },
]

const thesisAnalysis = {
  status: 'ACTIVE',
  confidence: 78,
  bullishSignals: [
    'Rising yields across the curve',
    'Steepening yield curve (bear steepener)',
    'Weak Treasury auction demand',
    'Fed hawkish rhetoric continuing',
    'Fiscal deficit expanding',
  ],
  bearishSignals: [
    'RSI oversold on TLT',
    'Possible short-term yield pullback',
  ],
  catalysts: [
    { event: 'FOMC Meeting', date: '2026-01-29', impact: 'high' },
    { event: 'GDP Report', date: '2026-01-30', impact: 'medium' },
    { event: 'Jobs Report', date: '2026-02-07', impact: 'high' },
  ],
}

const dailyBrief = {
  date: '2026-01-21',
  summary: 'Bond market selloff continues as 10Y yield approaches 4.30%. Treasury supply concerns mount ahead of next week\'s auction calendar. Fed speakers maintain hawkish tone, markets now pricing fewer cuts in 2026.',
  keyPoints: [
    '10Y yield +7bps, highest close since November',
    '30Y approaching psychological 5% level',
    'TLT broke below key $88 support',
    'Yield curve steepening - classic bear steepener',
  ],
  tradingView: 'Maintain bearish Treasury bias. TMV/TBT positions performing well. Watch for potential short-term bounce from oversold conditions, but use any rally to add to short positions.',
}

export default function ResearchPage() {
  const [selectedNews, setSelectedNews] = useState<number | null>(null)

  // Real yield data from FRED API
  const { yields, prices, loading, lastUpdated, refresh } = useMarketData({ refreshInterval: 60000 })

  // Get real 10Y yield if available
  const real10Y = yields?.yields.find(y => y.tenor === '10Y')
  const real30Y = yields?.yields.find(y => y.tenor === '30Y')

  // Update macro data with real values when available
  const liveMacroData = {
    ...macroData,
    tenYearYield: real10Y ? {
      value: real10Y.yield,
      change: real10Y.change,
      lastUpdate: 'Live'
    } : macroData.tenYearYield
  }

  // Build real yield curve from API data when available
  const liveYieldCurve = yields ? yieldCurve.map(point => {
    const realYield = yields.yields.find(y => y.tenor === point.tenor)
    if (realYield) {
      return {
        ...point,
        yield: realYield.yield,
        prevYield: realYield.previousClose
      }
    }
    return point
  }) : yieldCurve

  // Live curve status
  const liveCurveStatus = yields ? {
    shape: yields.curveStatus === 'inverted' ? 'Inverted' : yields.curveStatus === 'flat' ? 'Flat' : 'Steepening',
    twoTenSpread: yields.spread2Y10Y,
    threeTenSpread: curveStatus.threeTenSpread, // Keep mock for 3M (not in API)
    fiveTenSpread: curveStatus.fiveTenSpread,
    status: yields.curveStatus
  } : curveStatus

  return (
    <div className="space-y-6 animate-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-text-primary flex items-center gap-3">
            <Globe className="w-6 sm:w-7 h-6 sm:h-7 text-accent-cyan" />
            Research
          </h1>
          <p className="text-sm text-text-secondary mt-1">HERMES Market Intelligence & Analysis</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="badge badge-warning">{thesisAnalysis.bullishSignals.length} Bullish</span>
          <span className="hidden sm:inline text-xs text-text-muted">
            {lastUpdated ? lastUpdated.toLocaleTimeString() : '...'}
          </span>
          <button
            onClick={refresh}
            className="p-2 hover:bg-palantir-bg-hover rounded-lg transition-colors"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 text-text-secondary ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Daily Brief Banner */}
      <div className="card p-4 glow-border">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-accent-cyan/20">
              <FileText className="w-5 h-5 text-accent-cyan" />
            </div>
            <div>
              <h2 className="font-semibold flex items-center gap-2">
                Daily Brief
                <span className="text-xs font-normal text-text-muted">{dailyBrief.date}</span>
              </h2>
              <p className="text-sm text-text-secondary mt-1 max-w-3xl">{dailyBrief.summary}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {dailyBrief.keyPoints.map((point, i) => (
                  <span key={i} className="px-2 py-1 text-xs bg-palantir-bg rounded-md text-text-secondary">
                    {point}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-palantir-border">
          <h3 className="text-sm font-medium text-text-muted mb-2">Trading View</h3>
          <p className="text-sm text-text-primary">{dailyBrief.tradingView}</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Left Column - Macro & Yields */}
        <div className="lg:col-span-2 space-y-4 lg:space-y-6">
          {/* Macro Economic Data */}
          <div className="card p-0">
            <div className="p-4 border-b border-palantir-border">
              <h2 className="font-semibold flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-accent-blue" />
                Macro Economic Data
              </h2>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Fed Rate */}
              <div className="p-4 bg-palantir-bg rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-text-muted">Fed Funds Rate</span>
                  <Landmark className="w-4 h-4 text-text-muted" />
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-mono font-semibold">{macroData.fedRate.value.toFixed(2)}%</span>
                  {macroData.fedRate.change !== 0 && (
                    <span className={`text-sm ${macroData.fedRate.change > 0 ? 'text-status-danger' : 'text-status-success'}`}>
                      {macroData.fedRate.change > 0 ? '+' : ''}{macroData.fedRate.change}%
                    </span>
                  )}
                </div>
                <span className="text-xs text-text-muted">{macroData.fedRate.lastUpdate}</span>
              </div>

              {/* CPI */}
              <div className="p-4 bg-palantir-bg rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-text-muted">CPI YoY</span>
                  <TrendingUp className="w-4 h-4 text-text-muted" />
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-mono font-semibold">{macroData.cpi.value}%</span>
                  <span className={`text-sm ${macroData.cpi.change > 0 ? 'text-status-danger' : 'text-status-success'}`}>
                    {macroData.cpi.change > 0 ? '+' : ''}{macroData.cpi.change}%
                  </span>
                </div>
                <span className="text-xs text-text-muted">{macroData.cpi.lastUpdate}</span>
              </div>

              {/* Unemployment */}
              <div className="p-4 bg-palantir-bg rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-text-muted">Unemployment</span>
                  <TrendingDown className="w-4 h-4 text-text-muted" />
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-mono font-semibold">{macroData.unemployment.value}%</span>
                  <span className={`text-sm ${macroData.unemployment.change > 0 ? 'text-status-danger' : 'text-status-success'}`}>
                    {macroData.unemployment.change > 0 ? '+' : ''}{macroData.unemployment.change}%
                  </span>
                </div>
                <span className="text-xs text-text-muted">{macroData.unemployment.lastUpdate}</span>
              </div>

              {/* GDP Growth */}
              <div className="p-4 bg-palantir-bg rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-text-muted">GDP Growth</span>
                  <BarChart2 className="w-4 h-4 text-text-muted" />
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-mono font-semibold">{macroData.gdpGrowth.value}%</span>
                  <span className={`text-sm ${macroData.gdpGrowth.change > 0 ? 'text-status-success' : 'text-status-danger'}`}>
                    {macroData.gdpGrowth.change > 0 ? '+' : ''}{macroData.gdpGrowth.change}%
                  </span>
                </div>
                <span className="text-xs text-text-muted">{macroData.gdpGrowth.lastUpdate}</span>
              </div>

              {/* Debt to GDP */}
              <div className="p-4 bg-palantir-bg rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-text-muted">Debt/GDP</span>
                  <AlertTriangle className="w-4 h-4 text-status-warning" />
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-mono font-semibold text-status-warning">{macroData.debtToGdp.value}%</span>
                  <span className="text-sm text-status-danger">+{macroData.debtToGdp.change}%</span>
                </div>
                <span className="text-xs text-text-muted">{macroData.debtToGdp.lastUpdate}</span>
              </div>

              {/* 10Y Yield - Live from FRED */}
              <div className="p-4 bg-palantir-bg rounded-lg border border-accent-cyan/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-text-muted">10Y Yield</span>
                  <div className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-mono font-semibold text-accent-cyan">
                    {liveMacroData.tenYearYield.value.toFixed(2)}%
                  </span>
                  <span className={`text-sm ${liveMacroData.tenYearYield.change >= 0 ? 'text-status-danger' : 'text-status-success'}`}>
                    {liveMacroData.tenYearYield.change >= 0 ? '+' : ''}{liveMacroData.tenYearYield.change.toFixed(2)}%
                  </span>
                </div>
                <span className="text-xs text-accent-cyan">{liveMacroData.tenYearYield.lastUpdate}</span>
              </div>
            </div>
          </div>

          {/* Yield Curve - Live from FRED */}
          <div className="card p-0">
            <div className="p-4 border-b border-palantir-border flex items-center justify-between">
              <h2 className="font-semibold flex items-center gap-2">
                Treasury Yield Curve
                {loading && <Loader2 className="w-4 h-4 animate-spin text-accent-cyan" />}
              </h2>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-text-muted">Curve Shape:</span>
                <span className={`badge ${liveCurveStatus.status === 'normal' ? 'badge-success' : liveCurveStatus.status === 'inverted' ? 'badge-danger' : 'badge-warning'}`}>
                  {liveCurveStatus.shape}
                </span>
              </div>
            </div>
            <div className="p-4">
              {/* Yield Curve Visualization */}
              <div className="flex items-end justify-between h-40 px-4">
                {liveYieldCurve.map((point, i) => (
                  <div key={point.tenor} className="flex flex-col items-center gap-2">
                    <div className="relative">
                      <div
                        className="w-8 bg-gradient-to-t from-accent-cyan to-accent-blue rounded-t-sm transition-all"
                        style={{ height: `${(point.yield / 6) * 120}px` }}
                      />
                      <div
                        className="absolute bottom-0 left-0 w-8 bg-palantir-border/50 rounded-t-sm"
                        style={{ height: `${(point.prevYield / 6) * 120}px` }}
                      />
                    </div>
                    <div className="text-center">
                      <span className="text-xs text-text-muted">{point.tenor}</span>
                      <div className="font-mono text-sm">{point.yield.toFixed(2)}%</div>
                      <span className={`text-xs ${point.yield > point.prevYield ? 'text-status-danger' : 'text-status-success'}`}>
                        {point.yield > point.prevYield ? '+' : ''}{(point.yield - point.prevYield).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Spread Data - Live */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-4 border-t border-palantir-border">
                <div className="text-center">
                  <span className="text-sm text-text-muted">2Y-10Y Spread</span>
                  <div className={`font-mono text-lg ${liveCurveStatus.twoTenSpread >= 0 ? 'text-status-success' : 'text-status-danger'}`}>
                    {liveCurveStatus.twoTenSpread >= 0 ? '+' : ''}{liveCurveStatus.twoTenSpread.toFixed(2)}%
                  </div>
                </div>
                <div className="text-center">
                  <span className="text-sm text-text-muted">3M-10Y Spread</span>
                  <div className={`font-mono text-lg ${liveCurveStatus.threeTenSpread >= 0 ? 'text-status-success' : 'text-status-danger'}`}>
                    {liveCurveStatus.threeTenSpread >= 0 ? '+' : ''}{liveCurveStatus.threeTenSpread.toFixed(2)}%
                  </div>
                </div>
                <div className="text-center">
                  <span className="text-sm text-text-muted">10Y-30Y Spread</span>
                  <div className={`font-mono text-lg ${(yields?.spread10Y30Y || 0) >= 0 ? 'text-status-success' : 'text-status-danger'}`}>
                    {(yields?.spread10Y30Y || liveCurveStatus.fiveTenSpread) >= 0 ? '+' : ''}{(yields?.spread10Y30Y || liveCurveStatus.fiveTenSpread).toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* News Feed */}
          <div className="card p-0">
            <div className="p-4 border-b border-palantir-border">
              <h2 className="font-semibold flex items-center gap-2">
                <Newspaper className="w-5 h-5 text-accent-blue" />
                Market News
              </h2>
            </div>
            <div className="divide-y divide-palantir-border">
              {newsFeed.map((news) => (
                <div
                  key={news.id}
                  className={`p-4 cursor-pointer transition-colors ${
                    selectedNews === news.id ? 'bg-palantir-bg-hover' : 'hover:bg-palantir-bg-hover'
                  }`}
                  onClick={() => setSelectedNews(selectedNews === news.id ? null : news.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className={`w-2 h-2 rounded-full ${
                          news.sentiment === 'bullish' ? 'bg-status-success' :
                          news.sentiment === 'bearish' ? 'bg-status-danger' :
                          'bg-status-warning'
                        }`} />
                        <span className="text-xs text-text-muted">{news.source}</span>
                        <span className="text-xs text-text-muted">{news.time}</span>
                        <span className={`badge text-xs ${
                          news.relevance === 'high' ? 'badge-danger' : 'badge-info'
                        }`}>
                          {news.relevance}
                        </span>
                      </div>
                      <h3 className="font-medium text-text-primary">{news.headline}</h3>
                      {selectedNews === news.id && (
                        <p className="text-sm text-text-secondary mt-2">{news.summary}</p>
                      )}
                    </div>
                    <ChevronRight className={`w-4 h-4 text-text-muted transition-transform ${
                      selectedNews === news.id ? 'rotate-90' : ''
                    }`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Thesis Analysis */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">30x Thesis Analysis</h2>
              <span className={`badge ${
                thesisAnalysis.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'
              }`}>
                {thesisAnalysis.status}
              </span>
            </div>

            {/* Confidence Meter */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-text-muted">Thesis Confidence</span>
                <span className="font-mono">{thesisAnalysis.confidence}%</span>
              </div>
              <div className="h-2 bg-palantir-bg rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-accent-cyan to-accent-blue transition-all"
                  style={{ width: `${thesisAnalysis.confidence}%` }}
                />
              </div>
            </div>

            {/* Bullish Signals */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-status-success mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Bullish for Thesis
              </h3>
              <div className="space-y-2">
                {thesisAnalysis.bullishSignals.map((signal, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-3 h-3 text-status-success flex-shrink-0" />
                    <span className="text-text-secondary">{signal}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bearish Signals */}
            <div>
              <h3 className="text-sm font-medium text-status-danger mb-2 flex items-center gap-2">
                <TrendingDown className="w-4 h-4" />
                Risks to Monitor
              </h3>
              <div className="space-y-2">
                {thesisAnalysis.bearishSignals.map((signal, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="w-3 h-3 text-status-danger flex-shrink-0" />
                    <span className="text-text-secondary">{signal}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Fed Calendar */}
          <div className="card p-4">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-status-warning" />
              Fed Calendar
            </h2>
            <div className="space-y-3">
              {fedMeetings.map((meeting, i) => (
                <div key={i} className="p-3 bg-palantir-bg rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{meeting.type}</span>
                    <span className="text-xs text-text-muted">{meeting.date}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-secondary">{meeting.expectation}</span>
                    <span className={`text-xs font-mono ${
                      meeting.probability > 60 ? 'text-status-success' :
                      meeting.probability > 40 ? 'text-status-warning' :
                      'text-text-muted'
                    }`}>
                      {meeting.probability}% prob
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Catalysts */}
          <div className="card p-4">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-accent-cyan" />
              Upcoming Catalysts
            </h2>
            <div className="space-y-2">
              {thesisAnalysis.catalysts.map((catalyst, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-palantir-bg rounded-lg">
                  <div>
                    <span className="text-sm font-medium">{catalyst.event}</span>
                    <p className="text-xs text-text-muted">{catalyst.date}</p>
                  </div>
                  <span className={`badge ${
                    catalyst.impact === 'high' ? 'badge-danger' :
                    catalyst.impact === 'medium' ? 'badge-warning' :
                    'badge-info'
                  }`}>
                    {catalyst.impact}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="card p-4">
            <h2 className="font-semibold mb-4">Quick Links</h2>
            <div className="space-y-2">
              {[
                { name: 'Treasury Direct', url: '#' },
                { name: 'Fed Watch Tool', url: '#' },
                { name: 'FRED Economic Data', url: '#' },
                { name: 'TradingView - TLT', url: '#' },
              ].map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-palantir-bg-hover transition-colors"
                >
                  <span className="text-sm text-text-secondary">{link.name}</span>
                  <ExternalLink className="w-4 h-4 text-text-muted" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
