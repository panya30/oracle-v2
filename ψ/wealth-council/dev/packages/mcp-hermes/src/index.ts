/**
 * HERMES - Research Analyst MCP Server
 * "God of Commerce & Messenger"
 *
 * Provides macro data, yield data, Fed analysis, and news.
 */

import type {
  YieldData,
  YieldSnapshot,
  PriceData,
  MacroData,
  NewsItem,
  ApiResponse,
} from '@wealth-council/shared';

// ============================================
// STATE MANAGEMENT
// ============================================

interface HermesState {
  yields: YieldSnapshot;
  prices: Record<string, PriceData>;
  macro: MacroData;
  news: NewsItem[];
}

// Initialize with current-ish data
const state: HermesState = {
  yields: {
    yields: [
      { tenor: '2Y', yield: 4.15, change: 0.03, changePercent: 0.73, previousClose: 4.12, timestamp: new Date() },
      { tenor: '5Y', yield: 4.22, change: 0.05, changePercent: 1.20, previousClose: 4.17, timestamp: new Date() },
      { tenor: '10Y', yield: 4.29, change: 0.07, changePercent: 1.66, previousClose: 4.22, timestamp: new Date() },
      { tenor: '30Y', yield: 4.93, change: 0.09, changePercent: 1.86, previousClose: 4.84, timestamp: new Date() },
    ],
    spread2Y10Y: 0.14,
    spread10Y30Y: 0.64,
    curveStatus: 'normal',
    timestamp: new Date(),
  },
  prices: {
    TLT: {
      ticker: 'TLT',
      price: 87.45,
      change: -1.23,
      changePercent: -1.39,
      open: 88.50,
      high: 88.75,
      low: 87.20,
      volume: 12500000,
      timestamp: new Date(),
    },
    TMV: {
      ticker: 'TMV',
      price: 43.50,
      change: 1.85,
      changePercent: 4.44,
      open: 42.00,
      high: 44.10,
      low: 41.80,
      volume: 850000,
      timestamp: new Date(),
    },
    TBT: {
      ticker: 'TBT',
      price: 29.25,
      change: 0.75,
      changePercent: 2.63,
      open: 28.60,
      high: 29.50,
      low: 28.45,
      volume: 1200000,
      timestamp: new Date(),
    },
    TBF: {
      ticker: 'TBF',
      price: 18.90,
      change: 0.25,
      changePercent: 1.34,
      open: 18.70,
      high: 19.05,
      low: 18.65,
      volume: 450000,
      timestamp: new Date(),
    },
  },
  macro: {
    fedFundsRate: 4.50,
    cpiYoY: 3.2,
    cpiCore: 3.8,
    unemploymentRate: 4.1,
    gdpGrowth: 2.1,
    nextFedMeeting: new Date('2026-01-29'),
    fedRateExpectation: 'hold',
    updatedAt: new Date(),
  },
  news: [
    {
      id: 'news-1',
      title: 'Bond Sell-off Accelerates as Trump Ramps Up Tariff Threats',
      summary: 'Treasury yields spike as investors worry about inflation from potential new tariffs.',
      source: 'CNBC',
      url: 'https://cnbc.com/...',
      sentiment: 'negative',
      relevance: 95,
      timestamp: new Date(),
    },
    {
      id: 'news-2',
      title: 'Fed Minutes Show Officials Concerned About Fiscal Path',
      summary: 'Federal Reserve officials expressed worry about long-term debt sustainability.',
      source: 'Reuters',
      url: 'https://reuters.com/...',
      sentiment: 'negative',
      relevance: 90,
      timestamp: new Date(Date.now() - 3600000),
    },
    {
      id: 'news-3',
      title: 'Japan 40-Year Yield Hits Record High',
      summary: 'Global bond selloff spreads to Japan as 40-year JGB yield reaches all-time high.',
      source: 'Bloomberg',
      url: 'https://bloomberg.com/...',
      sentiment: 'negative',
      relevance: 85,
      timestamp: new Date(Date.now() - 7200000),
    },
  ],
};

// ============================================
// YIELD FUNCTIONS
// ============================================

export function getYields(): ApiResponse<YieldSnapshot> {
  return {
    success: true,
    data: state.yields,
    timestamp: new Date(),
  };
}

export function getYield(tenor: '2Y' | '5Y' | '10Y' | '30Y'): ApiResponse<YieldData | null> {
  const yieldData = state.yields.yields.find(y => y.tenor === tenor);
  return {
    success: true,
    data: yieldData || null,
    timestamp: new Date(),
  };
}

export function getYieldCurveStatus(): ApiResponse<{
  status: 'normal' | 'flat' | 'inverted';
  spread2Y10Y: number;
  spread10Y30Y: number;
  interpretation: string;
}> {
  const { curveStatus, spread2Y10Y, spread10Y30Y } = state.yields;

  let interpretation = '';
  if (curveStatus === 'inverted') {
    interpretation = 'Yield curve inverted - historically signals recession within 12-18 months.';
  } else if (curveStatus === 'flat') {
    interpretation = 'Yield curve flat - uncertainty about economic direction.';
  } else {
    interpretation = 'Yield curve normal - healthy economic expectations.';
  }

  return {
    success: true,
    data: { status: curveStatus, spread2Y10Y, spread10Y30Y, interpretation },
    timestamp: new Date(),
  };
}

// ============================================
// PRICE FUNCTIONS
// ============================================

export function getPrice(ticker: string): ApiResponse<PriceData | null> {
  return {
    success: true,
    data: state.prices[ticker] || null,
    timestamp: new Date(),
  };
}

export function getAllPrices(): ApiResponse<PriceData[]> {
  return {
    success: true,
    data: Object.values(state.prices),
    timestamp: new Date(),
  };
}

// ============================================
// MACRO FUNCTIONS
// ============================================

export function getMacroData(): ApiResponse<MacroData> {
  return {
    success: true,
    data: state.macro,
    timestamp: new Date(),
  };
}

export function getFedAnalysis(): ApiResponse<{
  currentRate: number;
  nextMeeting: Date;
  expectation: string;
  analysis: string;
}> {
  const { fedFundsRate, nextFedMeeting, fedRateExpectation } = state.macro;

  const analysis = `
Fed Funds Rate: ${fedFundsRate}%
Next Meeting: ${nextFedMeeting.toISOString().split('T')[0]}
Market Expectation: ${fedRateExpectation.toUpperCase()}

Analysis:
- With inflation at ${state.macro.cpiYoY}% (core ${state.macro.cpiCore}%), Fed likely to hold rates.
- Unemployment at ${state.macro.unemploymentRate}% shows labor market still tight.
- Fiscal concerns may keep long-end yields elevated even if Fed cuts.
- Bond vigilantes are active - watch 30Y closely.

Implication for 30x Play:
- High rates = pressure on long bonds = GOOD for TMV/TBT
- Fed cut would hurt thesis short-term but doesn't change debt dynamics
- Focus on FISCAL situation more than Fed policy
`.trim();

  return {
    success: true,
    data: {
      currentRate: fedFundsRate,
      nextMeeting: nextFedMeeting,
      expectation: fedRateExpectation,
      analysis,
    },
    timestamp: new Date(),
  };
}

// ============================================
// NEWS FUNCTIONS
// ============================================

export function getNews(limit: number = 10): ApiResponse<NewsItem[]> {
  return {
    success: true,
    data: state.news.slice(0, limit),
    timestamp: new Date(),
  };
}

export function searchNews(query: string): ApiResponse<NewsItem[]> {
  const results = state.news.filter(
    n => n.title.toLowerCase().includes(query.toLowerCase()) ||
         n.summary.toLowerCase().includes(query.toLowerCase())
  );
  return {
    success: true,
    data: results,
    timestamp: new Date(),
  };
}

// ============================================
// ANALYSIS FUNCTIONS
// ============================================

export function getThesisStatus(): ApiResponse<{
  status: 'bullish' | 'neutral' | 'bearish';
  confidence: number;
  signals: string[];
  risks: string[];
}> {
  const yield10Y = state.yields.yields.find(y => y.tenor === '10Y')?.yield || 0;
  const yield30Y = state.yields.yields.find(y => y.tenor === '30Y')?.yield || 0;

  const signals: string[] = [];
  const risks: string[] = [];
  let score = 0;

  // Check yield levels
  if (yield10Y > 4.5) { signals.push('10Y yield above 4.5% warning level'); score += 2; }
  if (yield10Y > 5.0) { signals.push('10Y yield above 5.0% crisis level'); score += 3; }
  if (yield30Y > 5.0) { signals.push('30Y yield near 5.0% danger zone'); score += 2; }

  // Check yield changes
  const change10Y = state.yields.yields.find(y => y.tenor === '10Y')?.change || 0;
  if (change10Y > 0) { signals.push('10Y yield rising today'); score += 1; }

  // Check TLT
  const tltChange = state.prices['TLT']?.changePercent || 0;
  if (tltChange < -1) { signals.push('TLT falling sharply'); score += 1; }

  // Check news sentiment
  const negativeNews = state.news.filter(n => n.sentiment === 'negative' && n.relevance > 80);
  if (negativeNews.length > 0) { signals.push(`${negativeNews.length} negative high-relevance news items`); score += 1; }

  // Risks
  if (state.macro.fedRateExpectation === 'cut') { risks.push('Fed rate cut expected - could hurt thesis short-term'); }
  if (yield10Y < 4.2) { risks.push('10Y yield below accumulation level - wait for better entry'); }

  // Determine status
  let status: 'bullish' | 'neutral' | 'bearish';
  if (score >= 5) status = 'bullish';
  else if (score >= 2) status = 'neutral';
  else status = 'bearish';

  const confidence = Math.min(95, 50 + score * 10);

  return {
    success: true,
    data: { status, confidence, signals, risks },
    timestamp: new Date(),
  };
}

export function generateDailyBrief(): ApiResponse<string> {
  const { yields, macro, news } = state;
  const yield10Y = yields.yields.find(y => y.tenor === '10Y');
  const yield30Y = yields.yields.find(y => y.tenor === '30Y');
  const thesis = getThesisStatus().data;

  const brief = `
## HERMES Daily Brief
**Date**: ${new Date().toISOString().split('T')[0]}

### Yield Snapshot
| Tenor | Yield | Change |
|-------|-------|--------|
| 2Y    | ${yields.yields[0].yield}% | ${yields.yields[0].change > 0 ? '+' : ''}${yields.yields[0].change}% |
| 10Y   | ${yield10Y?.yield}% | ${yield10Y?.change && yield10Y.change > 0 ? '+' : ''}${yield10Y?.change}% |
| 30Y   | ${yield30Y?.yield}% | ${yield30Y?.change && yield30Y.change > 0 ? '+' : ''}${yield30Y?.change}% |

**Curve Status**: ${yields.curveStatus.toUpperCase()}
**2Y-10Y Spread**: ${yields.spread2Y10Y}%

### Macro Summary
- Fed Funds: ${macro.fedFundsRate}%
- CPI: ${macro.cpiYoY}% (Core: ${macro.cpiCore}%)
- Next Fed Meeting: ${macro.nextFedMeeting.toISOString().split('T')[0]}
- Expectation: ${macro.fedRateExpectation.toUpperCase()}

### Key Headlines
${news.slice(0, 3).map(n => `- [${n.sentiment.toUpperCase()}] ${n.title}`).join('\n')}

### 30x Thesis Status
**Status**: ${thesis?.status.toUpperCase()}
**Confidence**: ${thesis?.confidence}%

**Bullish Signals**:
${thesis?.signals.map(s => `- ${s}`).join('\n') || '- None'}

**Risks**:
${thesis?.risks.map(r => `- ${r}`).join('\n') || '- None'}

### Recommendation
${yield10Y && yield10Y.yield > 4.5
  ? '🟢 Yields elevated - thesis on track. Consider adding to positions.'
  : yield10Y && yield10Y.yield < 4.2
  ? '🟡 Yields below accumulation level. Wait for better entry.'
  : '🔵 Yields in neutral zone. Monitor for breakout above 4.5%.'
}
`;

  return {
    success: true,
    data: brief.trim(),
    timestamp: new Date(),
  };
}

// ============================================
// UPDATE FUNCTIONS (for simulation)
// ============================================

export function updateYield(tenor: '2Y' | '5Y' | '10Y' | '30Y', newYield: number): ApiResponse<YieldData> {
  const yieldData = state.yields.yields.find(y => y.tenor === tenor);
  if (yieldData) {
    yieldData.previousClose = yieldData.yield;
    yieldData.change = newYield - yieldData.previousClose;
    yieldData.changePercent = (yieldData.change / yieldData.previousClose) * 100;
    yieldData.yield = newYield;
    yieldData.timestamp = new Date();

    // Update spreads
    const y2 = state.yields.yields.find(y => y.tenor === '2Y')?.yield || 0;
    const y10 = state.yields.yields.find(y => y.tenor === '10Y')?.yield || 0;
    const y30 = state.yields.yields.find(y => y.tenor === '30Y')?.yield || 0;
    state.yields.spread2Y10Y = y10 - y2;
    state.yields.spread10Y30Y = y30 - y10;
    state.yields.curveStatus = y10 < y2 ? 'inverted' : Math.abs(y10 - y2) < 0.1 ? 'flat' : 'normal';

    return { success: true, data: yieldData, timestamp: new Date() };
  }
  return { success: false, error: 'Tenor not found', timestamp: new Date() } as any;
}

// ============================================
// EXPORT ALL FUNCTIONS
// ============================================

export const hermes = {
  // Yields
  getYields,
  getYield,
  getYieldCurveStatus,

  // Prices
  getPrice,
  getAllPrices,

  // Macro
  getMacroData,
  getFedAnalysis,

  // News
  getNews,
  searchNews,

  // Analysis
  getThesisStatus,
  generateDailyBrief,

  // Updates
  updateYield,
};

// For direct execution (Bun only)
// @ts-ignore - import.meta.main is Bun-specific
if (typeof import.meta !== 'undefined' && (import.meta as any).main) {
  console.log('📊 HERMES MCP Server Starting...');
  console.log('10Y Yield:', state.yields.yields.find(y => y.tenor === '10Y')?.yield);
  console.log('Curve Status:', state.yields.curveStatus);
  console.log('News Items:', state.news.length);
  console.log('HERMES is researching... 📈');
}

export default hermes;
