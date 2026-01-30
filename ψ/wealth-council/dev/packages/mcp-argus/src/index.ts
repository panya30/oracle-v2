/**
 * ARGUS - Portfolio Monitor MCP Server
 * "The Giant with 100 Eyes"
 *
 * Provides real-time portfolio monitoring, alerts, and reporting.
 */

import type {
  Portfolio,
  Position,
  Alert,
  AlertLevel,
  RiskMetrics,
  RiskLimit,
  ApiResponse,
} from '@wealth-council/shared';

// ============================================
// STATE MANAGEMENT
// ============================================

interface ArgusState {
  portfolio: Portfolio;
  alerts: Alert[];
  riskMetrics: RiskMetrics;
}

// Initialize with mock data for development
const state: ArgusState = {
  portfolio: {
    totalValue: 10000,
    cash: 3000,
    cashPercent: 30,
    positions: [
      {
        id: 'pos-1',
        ticker: 'TMV',
        name: 'Direxion Daily 20+ Yr Trsy Bear 3X',
        shares: 50,
        avgCost: 42.00,
        currentPrice: 43.50,
        marketValue: 2175,
        unrealizedPnL: 75,
        unrealizedPnLPercent: 3.57,
        weight: 21.75,
        stopLoss: 38.00,
        targetPrice: 55.00,
      },
      {
        id: 'pos-2',
        ticker: 'TBT',
        name: 'ProShares UltraShort 20+ Year Treasury',
        shares: 100,
        avgCost: 28.50,
        currentPrice: 29.25,
        marketValue: 2925,
        unrealizedPnL: 75,
        unrealizedPnLPercent: 2.63,
        weight: 29.25,
        stopLoss: 26.00,
      },
    ],
    dailyPnL: 150,
    dailyPnLPercent: 1.52,
    weeklyPnL: 320,
    weeklyPnLPercent: 3.31,
    monthlyPnL: -180,
    monthlyPnLPercent: -1.77,
    updatedAt: new Date(),
  },
  alerts: [
    {
      id: 'alert-1',
      level: 'info',
      category: 'price',
      title: 'TMV approaching target',
      message: 'TMV is within 10% of first target at $48',
      acknowledged: false,
      agent: 'ARGUS',
      timestamp: new Date(),
    },
  ],
  riskMetrics: {
    portfolioVaR95: 850,
    portfolioVaR99: 1200,
    maxDrawdown: 15,
    currentDrawdown: 1.77,
    sharpeRatio: 1.2,
    exposurePercent: 51,
    largestPosition: 29.25,
    cashPercent: 30,
    correlationRisk: 'medium',
    overallRisk: 'medium',
  },
};

// ============================================
// PORTFOLIO FUNCTIONS
// ============================================

export function getPortfolio(): ApiResponse<Portfolio> {
  // Update timestamp
  state.portfolio.updatedAt = new Date();

  return {
    success: true,
    data: state.portfolio,
    timestamp: new Date(),
  };
}

export function getPositions(): ApiResponse<Position[]> {
  return {
    success: true,
    data: state.portfolio.positions,
    timestamp: new Date(),
  };
}

export function getPosition(ticker: string): ApiResponse<Position | null> {
  const position = state.portfolio.positions.find(p => p.ticker === ticker);
  return {
    success: true,
    data: position || null,
    timestamp: new Date(),
  };
}

export function getPnL(period: 'daily' | 'weekly' | 'monthly'): ApiResponse<{ pnl: number; percent: number }> {
  const data = {
    daily: { pnl: state.portfolio.dailyPnL, percent: state.portfolio.dailyPnLPercent },
    weekly: { pnl: state.portfolio.weeklyPnL, percent: state.portfolio.weeklyPnLPercent },
    monthly: { pnl: state.portfolio.monthlyPnL, percent: state.portfolio.monthlyPnLPercent },
  };

  return {
    success: true,
    data: data[period],
    timestamp: new Date(),
  };
}

// ============================================
// ALERT FUNCTIONS
// ============================================

export function getAlerts(level?: AlertLevel): ApiResponse<Alert[]> {
  let alerts = state.alerts;
  if (level) {
    alerts = alerts.filter(a => a.level === level);
  }

  return {
    success: true,
    data: alerts,
    timestamp: new Date(),
  };
}

export function createAlert(alert: Omit<Alert, 'id' | 'timestamp' | 'acknowledged'>): ApiResponse<Alert> {
  const newAlert: Alert = {
    ...alert,
    id: `alert-${Date.now()}`,
    acknowledged: false,
    timestamp: new Date(),
  };

  state.alerts.unshift(newAlert);

  return {
    success: true,
    data: newAlert,
    timestamp: new Date(),
  };
}

export function acknowledgeAlert(alertId: string): ApiResponse<boolean> {
  const alert = state.alerts.find(a => a.id === alertId);
  if (alert) {
    alert.acknowledged = true;
    return { success: true, data: true, timestamp: new Date() };
  }
  return { success: false, error: 'Alert not found', timestamp: new Date() };
}

export function clearAlert(alertId: string): ApiResponse<boolean> {
  const index = state.alerts.findIndex(a => a.id === alertId);
  if (index >= 0) {
    state.alerts.splice(index, 1);
    return { success: true, data: true, timestamp: new Date() };
  }
  return { success: false, error: 'Alert not found', timestamp: new Date() };
}

// ============================================
// RISK FUNCTIONS
// ============================================

export function getRiskMetrics(): ApiResponse<RiskMetrics> {
  return {
    success: true,
    data: state.riskMetrics,
    timestamp: new Date(),
  };
}

export function checkRiskLimits(): ApiResponse<RiskLimit[]> {
  const limits: RiskLimit[] = [
    {
      name: 'Max Single Position',
      current: state.riskMetrics.largestPosition / 100,
      limit: 0.25,
      status: state.riskMetrics.largestPosition > 25 ? 'breach' :
              state.riskMetrics.largestPosition > 20 ? 'warning' : 'ok',
    },
    {
      name: 'Max Total Exposure',
      current: state.riskMetrics.exposurePercent / 100,
      limit: 0.60,
      status: state.riskMetrics.exposurePercent > 60 ? 'breach' :
              state.riskMetrics.exposurePercent > 50 ? 'warning' : 'ok',
    },
    {
      name: 'Min Cash',
      current: state.riskMetrics.cashPercent / 100,
      limit: 0.10,
      status: state.riskMetrics.cashPercent < 10 ? 'breach' :
              state.riskMetrics.cashPercent < 15 ? 'warning' : 'ok',
    },
    {
      name: 'Max Daily Loss',
      current: Math.abs(state.portfolio.dailyPnLPercent) / 100,
      limit: 0.10,
      status: Math.abs(state.portfolio.dailyPnLPercent) > 10 ? 'breach' :
              Math.abs(state.portfolio.dailyPnLPercent) > 7 ? 'warning' : 'ok',
    },
  ];

  return {
    success: true,
    data: limits,
    timestamp: new Date(),
  };
}

// ============================================
// REPORT FUNCTIONS
// ============================================

export function generateDailySummary(): ApiResponse<string> {
  const { portfolio, riskMetrics, alerts } = state;
  const activeAlerts = alerts.filter(a => !a.acknowledged);

  const summary = `
## ARGUS Daily Summary
**Date**: ${new Date().toISOString().split('T')[0]}
**Time**: ${new Date().toLocaleTimeString()}

### Portfolio Status
- **Total Value**: $${portfolio.totalValue.toLocaleString()}
- **Cash**: $${portfolio.cash.toLocaleString()} (${portfolio.cashPercent}%)
- **Daily P&L**: $${portfolio.dailyPnL.toLocaleString()} (${portfolio.dailyPnLPercent > 0 ? '+' : ''}${portfolio.dailyPnLPercent}%)

### Positions
${portfolio.positions.map(p =>
  `- **${p.ticker}**: ${p.shares} shares @ $${p.currentPrice} = $${p.marketValue.toLocaleString()} (${p.unrealizedPnLPercent > 0 ? '+' : ''}${p.unrealizedPnLPercent}%)`
).join('\n')}

### Risk Status
- **Exposure**: ${riskMetrics.exposurePercent}%
- **Largest Position**: ${riskMetrics.largestPosition}%
- **Overall Risk**: ${riskMetrics.overallRisk.toUpperCase()}

### Active Alerts
${activeAlerts.length > 0
  ? activeAlerts.map(a => `- [${a.level.toUpperCase()}] ${a.title}`).join('\n')
  : '- No active alerts'}
`;

  return {
    success: true,
    data: summary.trim(),
    timestamp: new Date(),
  };
}

// ============================================
// UPDATE FUNCTIONS (for WebUI)
// ============================================

export function updatePrice(ticker: string, price: number): ApiResponse<Position | null> {
  const position = state.portfolio.positions.find(p => p.ticker === ticker);
  if (position) {
    position.currentPrice = price;
    position.marketValue = position.shares * price;
    position.unrealizedPnL = position.marketValue - (position.shares * position.avgCost);
    position.unrealizedPnLPercent = (position.unrealizedPnL / (position.shares * position.avgCost)) * 100;

    // Recalculate portfolio totals
    const totalInvested = state.portfolio.positions.reduce((sum, p) => sum + p.marketValue, 0);
    state.portfolio.totalValue = totalInvested + state.portfolio.cash;

    // Update weights
    state.portfolio.positions.forEach(p => {
      p.weight = (p.marketValue / state.portfolio.totalValue) * 100;
    });

    return { success: true, data: position, timestamp: new Date() };
  }
  return { success: false, error: 'Position not found', timestamp: new Date() };
}

// ============================================
// EXPORT ALL FUNCTIONS
// ============================================

export const argus = {
  // Portfolio
  getPortfolio,
  getPositions,
  getPosition,
  getPnL,

  // Alerts
  getAlerts,
  createAlert,
  acknowledgeAlert,
  clearAlert,

  // Risk
  getRiskMetrics,
  checkRiskLimits,

  // Reports
  generateDailySummary,

  // Updates
  updatePrice,
};

// For direct execution (Bun only)
// @ts-ignore - import.meta.main is Bun-specific
if (typeof import.meta !== 'undefined' && (import.meta as any).main) {
  console.log('🔭 ARGUS MCP Server Starting...');
  console.log('Portfolio Value:', state.portfolio.totalValue);
  console.log('Positions:', state.portfolio.positions.length);
  console.log('Active Alerts:', state.alerts.filter(a => !a.acknowledged).length);
  console.log('ARGUS is watching... 👁️');
}

export default argus;
