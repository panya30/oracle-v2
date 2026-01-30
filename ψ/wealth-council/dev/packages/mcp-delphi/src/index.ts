/**
 * DELPHI - Oracle MCP Server
 * "The Pythia of the Council"
 *
 * Generates trading signals based on yield analysis, price patterns,
 * and thesis conviction. Provides entry/exit recommendations.
 */

import type {
  Signal,
  SignalType,
  SignalStrength,
  SignalDirection,
  YieldSnapshot,
  PriceData,
  Position,
  ApiResponse,
  YIELD_THRESHOLDS,
} from '@wealth-council/shared';

// ============================================
// STATE MANAGEMENT
// ============================================

interface DelphiState {
  signals: Signal[];
  thesisConfidence: number;
  lastAnalysis: Date;
  yieldTrend: 'rising' | 'falling' | 'stable';
  marketRegime: 'bullish' | 'bearish' | 'neutral' | 'volatile';
}

const state: DelphiState = {
  signals: [
    {
      id: 'sig-1',
      type: 'entry',
      ticker: 'TMV',
      direction: 'bullish',
      strength: 'strong',
      price: 43.50,
      stopLoss: 38.00,
      target: 55.00,
      confidence: 78,
      reason: '10Y yield breakout above 4.25%, momentum strong',
      agent: 'DELPHI',
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + 86400000 * 7), // 7 days
    },
    {
      id: 'sig-2',
      type: 'warning',
      ticker: 'TBT',
      direction: 'neutral',
      strength: 'moderate',
      price: 29.25,
      confidence: 62,
      reason: 'Approaching resistance at $30, consider partial profit',
      agent: 'DELPHI',
      timestamp: new Date(Date.now() - 3600000),
    },
  ],
  thesisConfidence: 75,
  lastAnalysis: new Date(),
  yieldTrend: 'rising',
  marketRegime: 'bearish', // Bearish for bonds = bullish for our thesis
};

// ============================================
// YIELD THRESHOLDS
// ============================================

const THRESHOLDS = {
  // 10Y Yield levels
  Y10_ACCUMULATE: 4.2,   // Below this = accumulate shorts
  Y10_STRONG: 4.4,       // Above this = strong signal
  Y10_WARNING: 4.6,      // Above this = caution
  Y10_CRISIS: 5.0,       // Above this = extreme

  // 30Y Yield levels
  Y30_WARNING: 4.8,
  Y30_CRISIS: 5.0,

  // Price thresholds for signals
  NEAR_STOP_PCT: 0.05,   // 5% from stop loss
  NEAR_TARGET_PCT: 0.10, // 10% from target
};

// ============================================
// SIGNAL GENERATION
// ============================================

/**
 * Analyze yield data and generate signals
 */
export function analyzeYields(yields: YieldSnapshot): Signal[] {
  const signals: Signal[] = [];
  const y10 = yields.yields.find(y => y.tenor === '10Y');
  const y30 = yields.yields.find(y => y.tenor === '30Y');

  if (!y10 || !y30) return signals;

  // Update yield trend
  if (y10.change > 0.03) {
    state.yieldTrend = 'rising';
  } else if (y10.change < -0.03) {
    state.yieldTrend = 'falling';
  } else {
    state.yieldTrend = 'stable';
  }

  // Signal: Yield breakout
  if (y10.yield > THRESHOLDS.Y10_STRONG && y10.change > 0.05) {
    signals.push({
      id: `sig-yield-${Date.now()}`,
      type: 'entry',
      ticker: 'TMV',
      direction: 'bullish',
      strength: 'strong',
      price: 0, // To be filled with current price
      stopLoss: undefined,
      target: undefined,
      confidence: 85,
      reason: `10Y yield breakout at ${y10.yield.toFixed(2)}% (+${(y10.change * 100).toFixed(0)}bps). Strong momentum for inverse bonds.`,
      agent: 'DELPHI',
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + 86400000 * 3),
    });
  }

  // Signal: 30Y approaching crisis level
  if (y30.yield > THRESHOLDS.Y30_WARNING && y30.yield < THRESHOLDS.Y30_CRISIS) {
    signals.push({
      id: `sig-30y-${Date.now()}`,
      type: 'warning',
      ticker: 'TMV',
      direction: 'bullish',
      strength: 'moderate',
      price: 0,
      confidence: 70,
      reason: `30Y yield at ${y30.yield.toFixed(2)}%, approaching 5% psychological level. High volatility expected.`,
      agent: 'DELPHI',
      timestamp: new Date(),
    });
  }

  // Signal: Yield curve steepening
  if (yields.spread10Y30Y > 0.5 && yields.curveStatus === 'normal') {
    signals.push({
      id: `sig-curve-${Date.now()}`,
      type: 'info',
      ticker: 'TBT',
      direction: 'bullish',
      strength: 'weak',
      price: 0,
      confidence: 60,
      reason: `Bear steepener in progress. 10Y-30Y spread at ${(yields.spread10Y30Y * 100).toFixed(0)}bps. Long-end selling accelerating.`,
      agent: 'DELPHI',
      timestamp: new Date(),
    });
  }

  // Signal: Accumulation zone
  if (y10.yield < THRESHOLDS.Y10_ACCUMULATE && state.yieldTrend !== 'falling') {
    signals.push({
      id: `sig-accum-${Date.now()}`,
      type: 'entry',
      ticker: 'TMV',
      direction: 'bullish',
      strength: 'moderate',
      price: 0,
      confidence: 65,
      reason: `10Y yield at ${y10.yield.toFixed(2)}% - accumulation zone. Consider adding to position.`,
      agent: 'DELPHI',
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + 86400000 * 5),
    });
  }

  return signals;
}

/**
 * Analyze positions for exit signals
 */
export function analyzePositions(positions: Position[], prices: PriceData[]): Signal[] {
  const signals: Signal[] = [];

  for (const position of positions) {
    const priceData = prices.find(p => p.ticker === position.ticker);
    if (!priceData) continue;

    const currentPrice = priceData.price;

    // Check stop loss proximity
    if (position.stopLoss) {
      const distanceToStop = (currentPrice - position.stopLoss) / currentPrice;
      if (distanceToStop < THRESHOLDS.NEAR_STOP_PCT && distanceToStop > 0) {
        signals.push({
          id: `sig-stop-${position.ticker}-${Date.now()}`,
          type: 'warning',
          ticker: position.ticker,
          direction: 'bearish',
          strength: 'strong',
          price: currentPrice,
          stopLoss: position.stopLoss,
          confidence: 90,
          reason: `${position.ticker} at $${currentPrice.toFixed(2)}, only ${(distanceToStop * 100).toFixed(1)}% above stop loss ($${position.stopLoss.toFixed(2)})`,
          agent: 'DELPHI',
          timestamp: new Date(),
        });
      }
    }

    // Check target proximity
    if (position.targetPrice) {
      const distanceToTarget = (position.targetPrice - currentPrice) / currentPrice;
      if (distanceToTarget < THRESHOLDS.NEAR_TARGET_PCT && distanceToTarget > 0) {
        signals.push({
          id: `sig-target-${position.ticker}-${Date.now()}`,
          type: 'exit',
          ticker: position.ticker,
          direction: 'neutral',
          strength: 'moderate',
          price: currentPrice,
          target: position.targetPrice,
          confidence: 75,
          reason: `${position.ticker} at $${currentPrice.toFixed(2)}, within ${(distanceToTarget * 100).toFixed(1)}% of target ($${position.targetPrice.toFixed(2)}). Consider taking partial profits.`,
          agent: 'DELPHI',
          timestamp: new Date(),
        });
      }
    }

    // Check for significant daily gain
    if (priceData.changePercent > 5) {
      signals.push({
        id: `sig-spike-${position.ticker}-${Date.now()}`,
        type: 'info',
        ticker: position.ticker,
        direction: 'bullish',
        strength: 'moderate',
        price: currentPrice,
        confidence: 70,
        reason: `${position.ticker} up ${priceData.changePercent.toFixed(1)}% today. Consider locking in gains or tightening stop.`,
        agent: 'DELPHI',
        timestamp: new Date(),
      });
    }
  }

  return signals;
}

/**
 * Calculate thesis confidence based on multiple factors
 */
export function calculateThesisConfidence(
  yields: YieldSnapshot,
  positions: Position[]
): number {
  let confidence = 50; // Base confidence

  const y10 = yields.yields.find(y => y.tenor === '10Y');
  const y30 = yields.yields.find(y => y.tenor === '30Y');

  if (!y10 || !y30) return confidence;

  // Yield level factors
  if (y10.yield > 4.3) confidence += 10;
  if (y10.yield > 4.5) confidence += 10;
  if (y30.yield > 4.8) confidence += 10;

  // Trend factors
  if (y10.change > 0) confidence += 5;
  if (y10.change > 0.05) confidence += 5;
  if (y30.change > 0) confidence += 5;

  // Curve factors
  if (yields.curveStatus === 'normal') confidence += 5;
  if (yields.spread10Y30Y > 0.5) confidence += 5;

  // Position performance factors
  const totalPnL = positions.reduce((sum, p) => sum + p.unrealizedPnL, 0);
  if (totalPnL > 0) confidence += 5;

  // Cap at 95%
  return Math.min(95, Math.max(20, confidence));
}

/**
 * Get market regime assessment
 */
export function assessMarketRegime(yields: YieldSnapshot, prices: PriceData[]): {
  regime: 'bullish' | 'bearish' | 'neutral' | 'volatile';
  description: string;
} {
  const y10 = yields.yields.find(y => y.tenor === '10Y');
  const tlt = prices.find(p => p.ticker === 'TLT');

  if (!y10 || !tlt) {
    return { regime: 'neutral', description: 'Insufficient data' };
  }

  // High volatility check
  if (Math.abs(y10.change) > 0.10 || Math.abs(tlt.changePercent) > 3) {
    return {
      regime: 'volatile',
      description: 'High volatility regime. Large yield/price swings. Tighten risk controls.',
    };
  }

  // Bearish for bonds (bullish for our thesis)
  if (y10.yield > 4.4 && y10.change > 0 && tlt.changePercent < 0) {
    return {
      regime: 'bearish',
      description: 'Bond bear market active. Yields rising, TLT falling. Thesis environment is favorable.',
    };
  }

  // Bullish for bonds (bearish for our thesis)
  if (y10.change < -0.05 && tlt.changePercent > 1) {
    return {
      regime: 'bullish',
      description: 'Bond rally in progress. Yields falling, TLT rising. Consider reducing exposure.',
    };
  }

  return {
    regime: 'neutral',
    description: 'Mixed signals. No clear directional bias. Maintain current positions.',
  };
}

// ============================================
// API FUNCTIONS
// ============================================

export function getSignals(type?: SignalType): ApiResponse<Signal[]> {
  let signals = state.signals;
  if (type) {
    signals = signals.filter(s => s.type === type);
  }
  return {
    success: true,
    data: signals,
    timestamp: new Date(),
  };
}

export function getActiveSignals(): ApiResponse<Signal[]> {
  const now = new Date();
  const activeSignals = state.signals.filter(s => !s.expiresAt || s.expiresAt > now);
  return {
    success: true,
    data: activeSignals,
    timestamp: new Date(),
  };
}

export function getThesisStatus(): ApiResponse<{
  confidence: number;
  yieldTrend: string;
  marketRegime: string;
  lastAnalysis: Date;
}> {
  return {
    success: true,
    data: {
      confidence: state.thesisConfidence,
      yieldTrend: state.yieldTrend,
      marketRegime: state.marketRegime,
      lastAnalysis: state.lastAnalysis,
    },
    timestamp: new Date(),
  };
}

export function generateSignals(
  yields: YieldSnapshot,
  prices: PriceData[],
  positions: Position[]
): ApiResponse<Signal[]> {
  // Analyze and generate signals
  const yieldSignals = analyzeYields(yields);
  const positionSignals = analyzePositions(positions, prices);

  // Update state
  state.thesisConfidence = calculateThesisConfidence(yields, positions);
  const regime = assessMarketRegime(yields, prices);
  state.marketRegime = regime.regime;
  state.lastAnalysis = new Date();

  // Merge with existing signals, remove duplicates
  const newSignals = [...yieldSignals, ...positionSignals];
  const existingIds = new Set(state.signals.map(s => s.id));

  for (const signal of newSignals) {
    if (!existingIds.has(signal.id)) {
      state.signals.unshift(signal);
    }
  }

  // Keep only last 50 signals
  if (state.signals.length > 50) {
    state.signals = state.signals.slice(0, 50);
  }

  return {
    success: true,
    data: newSignals,
    timestamp: new Date(),
  };
}

export function clearExpiredSignals(): ApiResponse<number> {
  const now = new Date();
  const before = state.signals.length;
  state.signals = state.signals.filter(s => !s.expiresAt || s.expiresAt > now);
  return {
    success: true,
    data: before - state.signals.length,
    timestamp: new Date(),
  };
}

export function getOracleReading(): ApiResponse<{
  thesis: {
    confidence: number;
    status: 'bullish' | 'bearish' | 'neutral';
    signals: Signal[];
  };
  market: {
    regime: string;
    yieldTrend: string;
    description: string;
  };
  recommendation: string;
}> {
  const activeSignals = state.signals.filter(s => !s.expiresAt || s.expiresAt > new Date());
  const entrySignals = activeSignals.filter(s => s.type === 'entry');
  const warningSignals = activeSignals.filter(s => s.type === 'warning');

  let recommendation = '';
  if (state.thesisConfidence > 70 && entrySignals.length > 0 && warningSignals.length === 0) {
    recommendation = 'The Oracle sees favorable conditions. Maintain or increase positions in inverse Treasury ETFs.';
  } else if (warningSignals.length > 0) {
    recommendation = 'The Oracle senses turbulence ahead. Review stop losses and consider defensive adjustments.';
  } else if (state.thesisConfidence < 50) {
    recommendation = 'The Oracle\'s vision is clouded. Reduce exposure and preserve capital until clarity returns.';
  } else {
    recommendation = 'The Oracle counsels patience. Hold current positions and await clearer signals.';
  }

  return {
    success: true,
    data: {
      thesis: {
        confidence: state.thesisConfidence,
        status: state.thesisConfidence > 60 ? 'bullish' : state.thesisConfidence < 40 ? 'bearish' : 'neutral',
        signals: activeSignals,
      },
      market: {
        regime: state.marketRegime,
        yieldTrend: state.yieldTrend,
        description: `Market regime is ${state.marketRegime}. Yields are ${state.yieldTrend}.`,
      },
      recommendation,
    },
    timestamp: new Date(),
  };
}

// ============================================
// EXPORTS
// ============================================

const delphi = {
  // Queries
  getSignals,
  getActiveSignals,
  getThesisStatus,
  getOracleReading,

  // Analysis
  analyzeYields,
  analyzePositions,
  calculateThesisConfidence,
  assessMarketRegime,
  generateSignals,

  // Maintenance
  clearExpiredSignals,
};

// For direct execution (Bun only)
// @ts-ignore - import.meta.main is Bun-specific
if (typeof import.meta !== 'undefined' && (import.meta as any).main) {
  console.log('🔮 DELPHI MCP Server Starting...');
  console.log('Thesis Confidence:', state.thesisConfidence + '%');
  console.log('Active Signals:', state.signals.length);
  console.log('Market Regime:', state.marketRegime);
  console.log('DELPHI is consulting the Oracle... 🏛️');
}

export default delphi;
