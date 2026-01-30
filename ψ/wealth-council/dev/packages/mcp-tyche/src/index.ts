/**
 * TYCHE - Risk Management MCP Server
 * "The Goddess of Fortune"
 *
 * Manages portfolio risk, position sizing, drawdown monitoring,
 * and ensures compliance with risk limits.
 */

import type {
  Portfolio,
  Position,
  RiskMetrics,
  RiskLimit,
  ApiResponse,
  RISK_LIMITS,
} from '@wealth-council/shared';

// ============================================
// RISK CONSTANTS
// ============================================

const LIMITS = {
  maxSinglePosition: 0.25,      // 25% max single position
  maxTotalExposure: 0.70,       // 70% max total exposure
  minCashBuffer: 0.10,          // 10% minimum cash
  maxDailyLoss: 0.07,           // 7% max daily loss
  maxWeeklyLoss: 0.15,          // 15% max weekly loss
  maxMonthlyLoss: 0.25,         // 25% max monthly loss
  maxCorrelatedExposure: 0.50,  // 50% max in correlated assets
  maxLeveragedExposure: 0.40,   // 40% max in 3x leveraged ETFs
};

// Correlation matrix for our instruments
const CORRELATIONS: Record<string, Record<string, number>> = {
  TMV: { TMV: 1.00, TBT: 0.95, TBF: 0.90, TLT: -0.98 },
  TBT: { TMV: 0.95, TBT: 1.00, TBF: 0.92, TLT: -0.96 },
  TBF: { TMV: 0.90, TBT: 0.92, TBF: 1.00, TLT: -0.92 },
  TLT: { TMV: -0.98, TBT: -0.96, TBF: -0.92, TLT: 1.00 },
};

// Leverage factors
const LEVERAGE: Record<string, number> = {
  TMV: 3,
  TBT: 2,
  TBF: 1,
  TLT: 1,
};

// ============================================
// STATE MANAGEMENT
// ============================================

interface TycheState {
  riskMetrics: RiskMetrics;
  riskLimits: RiskLimit[];
  riskScore: number;
  lastAssessment: Date;
  riskAlerts: string[];
}

const state: TycheState = {
  riskMetrics: {
    portfolioVaR95: 850,
    portfolioVaR99: 1200,
    maxDrawdown: 15.5,
    currentDrawdown: 3.2,
    sharpeRatio: 1.2,
    exposurePercent: 70,
    largestPosition: 29.25,
    cashPercent: 30,
    correlationRisk: 'high',
    overallRisk: 'medium',
  },
  riskLimits: [],
  riskScore: 65,
  lastAssessment: new Date(),
  riskAlerts: [],
};

// ============================================
// RISK CALCULATIONS
// ============================================

/**
 * Calculate Value at Risk (simplified historical method)
 */
export function calculateVaR(
  portfolio: Portfolio,
  confidenceLevel: 95 | 99 = 95
): number {
  // Simplified VaR calculation
  // In production, use historical returns and proper statistical methods
  const volatilityMultiplier = confidenceLevel === 99 ? 2.33 : 1.65;

  // Estimate daily volatility based on leveraged exposure
  let totalVolatility = 0;
  for (const position of portfolio.positions) {
    const leverage = LEVERAGE[position.ticker] || 1;
    const baseVolatility = 0.015; // 1.5% base daily vol for treasuries
    const positionVol = baseVolatility * leverage * position.weight / 100;
    totalVolatility += positionVol;
  }

  const dailyVaR = portfolio.totalValue * totalVolatility * volatilityMultiplier;
  return Math.round(dailyVaR);
}

/**
 * Calculate correlation risk
 */
export function calculateCorrelationRisk(positions: Position[]): 'low' | 'medium' | 'high' {
  if (positions.length <= 1) return 'low';

  let totalCorrelatedExposure = 0;
  let totalExposure = 0;

  // Check correlation between positions
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const corr = CORRELATIONS[positions[i].ticker]?.[positions[j].ticker] || 0;
      if (Math.abs(corr) > 0.8) {
        totalCorrelatedExposure += positions[i].weight + positions[j].weight;
      }
    }
    totalExposure += positions[i].weight;
  }

  const correlationRatio = totalCorrelatedExposure / Math.max(1, totalExposure);

  if (correlationRatio > 0.7) return 'high';
  if (correlationRatio > 0.4) return 'medium';
  return 'low';
}

/**
 * Check all risk limits
 */
export function checkRiskLimits(portfolio: Portfolio): RiskLimit[] {
  const limits: RiskLimit[] = [];

  // Single position limit
  const largestPosition = Math.max(...portfolio.positions.map(p => p.weight), 0);
  limits.push({
    name: 'Single Position Limit',
    current: largestPosition,
    limit: LIMITS.maxSinglePosition * 100,
    status: largestPosition > LIMITS.maxSinglePosition * 100 ? 'breach' :
            largestPosition > LIMITS.maxSinglePosition * 85 ? 'warning' : 'ok',
  });

  // Total exposure limit
  const totalExposure = 100 - portfolio.cashPercent;
  limits.push({
    name: 'Total Exposure Limit',
    current: totalExposure,
    limit: LIMITS.maxTotalExposure * 100,
    status: totalExposure > LIMITS.maxTotalExposure * 100 ? 'breach' :
            totalExposure > LIMITS.maxTotalExposure * 85 ? 'warning' : 'ok',
  });

  // Cash buffer
  limits.push({
    name: 'Minimum Cash Buffer',
    current: portfolio.cashPercent,
    limit: LIMITS.minCashBuffer * 100,
    status: portfolio.cashPercent < LIMITS.minCashBuffer * 100 ? 'breach' :
            portfolio.cashPercent < LIMITS.minCashBuffer * 120 ? 'warning' : 'ok',
  });

  // Daily loss limit
  const dailyLossPct = portfolio.dailyPnLPercent < 0 ? Math.abs(portfolio.dailyPnLPercent) : 0;
  limits.push({
    name: 'Daily Loss Limit',
    current: dailyLossPct,
    limit: LIMITS.maxDailyLoss * 100,
    status: dailyLossPct > LIMITS.maxDailyLoss * 100 ? 'breach' :
            dailyLossPct > LIMITS.maxDailyLoss * 70 ? 'warning' : 'ok',
  });

  // Weekly loss limit
  const weeklyLossPct = portfolio.weeklyPnLPercent < 0 ? Math.abs(portfolio.weeklyPnLPercent) : 0;
  limits.push({
    name: 'Weekly Loss Limit',
    current: weeklyLossPct,
    limit: LIMITS.maxWeeklyLoss * 100,
    status: weeklyLossPct > LIMITS.maxWeeklyLoss * 100 ? 'breach' :
            weeklyLossPct > LIMITS.maxWeeklyLoss * 70 ? 'warning' : 'ok',
  });

  // Leveraged exposure
  const leveragedExposure = portfolio.positions
    .filter(p => (LEVERAGE[p.ticker] || 1) > 1)
    .reduce((sum, p) => sum + p.weight, 0);
  limits.push({
    name: '3x Leveraged Limit',
    current: leveragedExposure,
    limit: LIMITS.maxLeveragedExposure * 100,
    status: leveragedExposure > LIMITS.maxLeveragedExposure * 100 ? 'breach' :
            leveragedExposure > LIMITS.maxLeveragedExposure * 85 ? 'warning' : 'ok',
  });

  return limits;
}

/**
 * Calculate optimal position size
 */
export function calculatePositionSize(
  portfolio: Portfolio,
  ticker: string,
  riskPerTrade: number = 0.02 // 2% risk per trade
): {
  shares: number;
  value: number;
  weight: number;
  stopLoss: number;
  reasoning: string;
} {
  const leverage = LEVERAGE[ticker] || 1;
  const maxPositionValue = portfolio.totalValue * LIMITS.maxSinglePosition;

  // Adjust for leverage - reduce size for higher leverage
  const leverageAdjustedMax = maxPositionValue / Math.sqrt(leverage);

  // Calculate based on risk per trade
  const riskAmount = portfolio.totalValue * riskPerTrade;
  const stopLossDistance = 0.08 / leverage; // Base 8% stop, adjusted for leverage
  const positionValueFromRisk = riskAmount / stopLossDistance;

  // Take the smaller of the two
  const finalValue = Math.min(leverageAdjustedMax, positionValueFromRisk);
  const weight = (finalValue / portfolio.totalValue) * 100;

  // Estimate shares (would need current price in production)
  const estimatedPrice = ticker === 'TMV' ? 43 : ticker === 'TBT' ? 29 : 19;
  const shares = Math.floor(finalValue / estimatedPrice);

  return {
    shares,
    value: shares * estimatedPrice,
    weight,
    stopLoss: estimatedPrice * (1 - stopLossDistance),
    reasoning: `${leverage}x leveraged position. Max ${LIMITS.maxSinglePosition * 100}% allocation, risk-adjusted for volatility.`,
  };
}

/**
 * Generate risk assessment
 */
export function assessRisk(portfolio: Portfolio): RiskMetrics {
  const var95 = calculateVaR(portfolio, 95);
  const var99 = calculateVaR(portfolio, 99);
  const correlationRisk = calculateCorrelationRisk(portfolio.positions);

  const largestPosition = Math.max(...portfolio.positions.map(p => p.weight), 0);
  const totalExposure = 100 - portfolio.cashPercent;

  // Calculate current drawdown
  const currentDrawdown = portfolio.monthlyPnLPercent < 0 ? Math.abs(portfolio.monthlyPnLPercent) : 0;

  // Simple max drawdown tracking (would be historical in production)
  const maxDrawdown = Math.max(currentDrawdown, 15.5);

  // Calculate Sharpe ratio (simplified)
  const avgReturn = portfolio.monthlyPnLPercent / 100;
  const riskFreeRate = 0.0035; // ~4.2% annual
  const estimatedVol = 0.05; // 5% monthly vol estimate
  const sharpeRatio = (avgReturn - riskFreeRate) / estimatedVol;

  // Overall risk assessment
  let overallRisk: 'low' | 'medium' | 'high' | 'critical' = 'low';
  if (currentDrawdown > 20 || largestPosition > 30) {
    overallRisk = 'critical';
  } else if (currentDrawdown > 10 || largestPosition > 25 || correlationRisk === 'high') {
    overallRisk = 'high';
  } else if (totalExposure > 60 || correlationRisk === 'medium') {
    overallRisk = 'medium';
  }

  return {
    portfolioVaR95: var95,
    portfolioVaR99: var99,
    maxDrawdown,
    currentDrawdown,
    sharpeRatio: Math.round(sharpeRatio * 100) / 100,
    exposurePercent: totalExposure,
    largestPosition,
    cashPercent: portfolio.cashPercent,
    correlationRisk,
    overallRisk,
  };
}

/**
 * Generate rebalancing recommendations
 */
export function getRebalanceRecommendations(portfolio: Portfolio): {
  action: 'none' | 'reduce' | 'rebalance' | 'urgent';
  recommendations: string[];
} {
  const limits = checkRiskLimits(portfolio);
  const breaches = limits.filter(l => l.status === 'breach');
  const warnings = limits.filter(l => l.status === 'warning');
  const recommendations: string[] = [];

  if (breaches.length > 0) {
    for (const breach of breaches) {
      if (breach.name === 'Single Position Limit') {
        const largest = portfolio.positions.reduce((a, b) =>
          a.weight > b.weight ? a : b
        );
        recommendations.push(
          `URGENT: ${largest.ticker} at ${largest.weight.toFixed(1)}% exceeds ${breach.limit}% limit. Reduce by ${(largest.weight - breach.limit).toFixed(1)}%.`
        );
      } else if (breach.name === 'Minimum Cash Buffer') {
        recommendations.push(
          `URGENT: Cash at ${portfolio.cashPercent.toFixed(1)}% below ${breach.limit}% minimum. Reduce positions to restore buffer.`
        );
      } else if (breach.name.includes('Loss Limit')) {
        recommendations.push(
          `CRITICAL: ${breach.name} breached at ${breach.current.toFixed(1)}%. Consider halting trading until recovery.`
        );
      }
    }
    return { action: 'urgent', recommendations };
  }

  if (warnings.length > 0) {
    for (const warning of warnings) {
      recommendations.push(
        `WARNING: ${warning.name} approaching limit (${warning.current.toFixed(1)}% / ${warning.limit}%).`
      );
    }
    return { action: 'reduce', recommendations };
  }

  // Check for rebalancing opportunities
  const targetWeight = 25; // Target equal weight among positions
  for (const position of portfolio.positions) {
    const deviation = Math.abs(position.weight - targetWeight);
    if (deviation > 5) {
      recommendations.push(
        `Consider rebalancing ${position.ticker}: ${position.weight.toFixed(1)}% vs ${targetWeight}% target.`
      );
    }
  }

  if (recommendations.length > 0) {
    return { action: 'rebalance', recommendations };
  }

  return { action: 'none', recommendations: ['Portfolio is within all risk limits. No action required.'] };
}

// ============================================
// API FUNCTIONS
// ============================================

export function getRiskMetrics(): ApiResponse<RiskMetrics> {
  return {
    success: true,
    data: state.riskMetrics,
    timestamp: new Date(),
  };
}

export function getRiskLimits(): ApiResponse<RiskLimit[]> {
  return {
    success: true,
    data: state.riskLimits,
    timestamp: new Date(),
  };
}

export function getRiskScore(): ApiResponse<{
  score: number;
  level: 'low' | 'medium' | 'high' | 'critical';
  factors: string[];
}> {
  const factors: string[] = [];
  let score = state.riskScore;

  if (state.riskMetrics.correlationRisk === 'high') {
    factors.push('High correlation between positions');
  }
  if (state.riskMetrics.largestPosition > 25) {
    factors.push('Concentrated position risk');
  }
  if (state.riskMetrics.currentDrawdown > 5) {
    factors.push('Active drawdown');
  }

  const level = score < 40 ? 'low' :
                score < 60 ? 'medium' :
                score < 80 ? 'high' : 'critical';

  return {
    success: true,
    data: { score, level, factors },
    timestamp: new Date(),
  };
}

export function analyzePortfolioRisk(portfolio: Portfolio): ApiResponse<{
  metrics: RiskMetrics;
  limits: RiskLimit[];
  rebalance: {
    action: string;
    recommendations: string[];
  };
}> {
  const metrics = assessRisk(portfolio);
  const limits = checkRiskLimits(portfolio);
  const rebalance = getRebalanceRecommendations(portfolio);

  // Update state
  state.riskMetrics = metrics;
  state.riskLimits = limits;
  state.riskScore = metrics.overallRisk === 'critical' ? 90 :
                    metrics.overallRisk === 'high' ? 70 :
                    metrics.overallRisk === 'medium' ? 50 : 30;
  state.lastAssessment = new Date();

  return {
    success: true,
    data: { metrics, limits, rebalance },
    timestamp: new Date(),
  };
}

export function getPositionSizeRecommendation(
  portfolio: Portfolio,
  ticker: string
): ApiResponse<{
  shares: number;
  value: number;
  weight: number;
  stopLoss: number;
  reasoning: string;
}> {
  const recommendation = calculatePositionSize(portfolio, ticker);
  return {
    success: true,
    data: recommendation,
    timestamp: new Date(),
  };
}

export function getScenarioAnalysis(): ApiResponse<{
  scenarios: Array<{
    name: string;
    description: string;
    portfolioImpact: number;
    probability: number;
  }>;
}> {
  return {
    success: true,
    data: {
      scenarios: [
        {
          name: 'Yield Spike (+50bps)',
          description: '10Y yield rises 50bps in a week',
          portfolioImpact: 15.5,
          probability: 0.20,
        },
        {
          name: 'Bond Rally (-30bps)',
          description: '10Y yield falls 30bps on risk-off',
          portfolioImpact: -12.0,
          probability: 0.25,
        },
        {
          name: 'Sideways Chop',
          description: 'Yields range-bound, theta decay',
          portfolioImpact: -3.0,
          probability: 0.40,
        },
        {
          name: 'Crisis Spike (+100bps)',
          description: 'Bond vigilantes force yields higher',
          portfolioImpact: 35.0,
          probability: 0.10,
        },
        {
          name: 'Fed Pivot',
          description: 'Unexpected dovish turn',
          portfolioImpact: -25.0,
          probability: 0.05,
        },
      ],
    },
    timestamp: new Date(),
  };
}

// ============================================
// EXPORTS
// ============================================

const tyche = {
  // Queries
  getRiskMetrics,
  getRiskLimits,
  getRiskScore,
  getScenarioAnalysis,

  // Analysis
  analyzePortfolioRisk,
  calculateVaR,
  checkRiskLimits,
  assessRisk,
  getRebalanceRecommendations,

  // Position Sizing
  getPositionSizeRecommendation,
  calculatePositionSize,
};

// For direct execution (Bun only)
// @ts-ignore - import.meta.main is Bun-specific
if (typeof import.meta !== 'undefined' && (import.meta as any).main) {
  console.log('🎲 TYCHE MCP Server Starting...');
  console.log('Risk Score:', state.riskScore);
  console.log('Overall Risk:', state.riskMetrics.overallRisk);
  console.log('VaR (95%):', state.riskMetrics.portfolioVaR95);
  console.log('TYCHE is managing fortune... 🍀');
}

export default tyche;
