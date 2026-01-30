// Panya Wealth Council - Shared Types

// ============================================
// PORTFOLIO TYPES
// ============================================

export interface Position {
  id: string;
  ticker: string;
  name: string;
  shares: number;
  avgCost: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  weight: number;
  stopLoss?: number;
  targetPrice?: number;
}

export interface Portfolio {
  totalValue: number;
  cash: number;
  cashPercent: number;
  positions: Position[];
  dailyPnL: number;
  dailyPnLPercent: number;
  weeklyPnL: number;
  weeklyPnLPercent: number;
  monthlyPnL: number;
  monthlyPnLPercent: number;
  updatedAt: Date;
}

// ============================================
// YIELD & MARKET DATA TYPES
// ============================================

export interface YieldData {
  tenor: '2Y' | '5Y' | '10Y' | '30Y';
  yield: number;
  change: number;
  changePercent: number;
  previousClose: number;
  timestamp: Date;
}

export interface YieldSnapshot {
  yields: YieldData[];
  spread2Y10Y: number;
  spread10Y30Y: number;
  curveStatus: 'normal' | 'flat' | 'inverted';
  timestamp: Date;
}

export interface PriceData {
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  timestamp: Date;
}

// ============================================
// SIGNAL TYPES
// ============================================

export type SignalType = 'entry' | 'exit' | 'warning' | 'info';
export type SignalStrength = 'weak' | 'moderate' | 'strong';
export type SignalDirection = 'bullish' | 'bearish' | 'neutral';

export interface Signal {
  id: string;
  type: SignalType;
  ticker: string;
  direction: SignalDirection;
  strength: SignalStrength;
  price: number;
  stopLoss?: number;
  target?: number;
  confidence: number;
  reason: string;
  agent: 'DELPHI' | 'HERMES' | 'CASSANDRA';
  timestamp: Date;
  expiresAt?: Date;
}

// ============================================
// ALERT TYPES
// ============================================

export type AlertLevel = 'info' | 'notice' | 'warning' | 'critical';
export type AlertCategory = 'price' | 'risk' | 'pnl' | 'system' | 'news';

export interface Alert {
  id: string;
  level: AlertLevel;
  category: AlertCategory;
  title: string;
  message: string;
  data?: Record<string, any>;
  acknowledged: boolean;
  agent: string;
  timestamp: Date;
}

// ============================================
// RISK TYPES
// ============================================

export interface RiskMetrics {
  portfolioVaR95: number;
  portfolioVaR99: number;
  maxDrawdown: number;
  currentDrawdown: number;
  sharpeRatio: number;
  exposurePercent: number;
  largestPosition: number;
  cashPercent: number;
  correlationRisk: 'low' | 'medium' | 'high';
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
}

export interface RiskLimit {
  name: string;
  current: number;
  limit: number;
  status: 'ok' | 'warning' | 'breach';
}

// ============================================
// TRADE TYPES
// ============================================

export type TradeAction = 'buy' | 'sell';
export type TradeStatus = 'pending' | 'approved' | 'executed' | 'rejected' | 'cancelled';

export interface Trade {
  id: string;
  ticker: string;
  action: TradeAction;
  shares: number;
  price: number;
  totalValue: number;
  status: TradeStatus;
  stopLoss?: number;
  target?: number;
  reason: string;
  agent: string;
  approvedBy?: 'auto' | 'human';
  executedAt?: Date;
  createdAt: Date;
}

// ============================================
// RESEARCH TYPES
// ============================================

export interface MacroData {
  fedFundsRate: number;
  cpiYoY: number;
  cpiCore: number;
  unemploymentRate: number;
  gdpGrowth: number;
  nextFedMeeting: Date;
  fedRateExpectation: 'hike' | 'hold' | 'cut';
  updatedAt: Date;
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  relevance: number;
  timestamp: Date;
}

// ============================================
// AGENT TYPES
// ============================================

export type AgentName =
  | 'PLUTUS'
  | 'HERMES'
  | 'ATHENA'
  | 'TYCHE'
  | 'DELPHI'
  | 'HEPHAESTUS'
  | 'CHRONOS'
  | 'CASSANDRA'
  | 'ARGUS';

export type AgentStatus = 'active' | 'idle' | 'error' | 'offline';

export interface AgentState {
  name: AgentName;
  status: AgentStatus;
  lastActivity: Date;
  currentTask?: string;
  messageCount: number;
}

// ============================================
// DECISION TYPES
// ============================================

export type DecisionStatus = 'pending' | 'approved' | 'rejected' | 'escalated';

export interface Decision {
  id: string;
  type: 'trade' | 'rebalance' | 'alert' | 'strategy';
  summary: string;
  details: string;
  recommendation: string;
  confidence: number;
  requiresHuman: boolean;
  status: DecisionStatus;
  agentInputs: Record<AgentName, string>;
  createdAt: Date;
  decidedAt?: Date;
  decidedBy?: 'PLUTUS' | 'human';
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

// ============================================
// CONSTANTS
// ============================================

export const TICKERS = {
  TMV: 'TMV',   // 3x Inverse 20Y+ Treasury
  TBT: 'TBT',   // 2x Inverse 20Y+ Treasury
  TBF: 'TBF',   // 1x Inverse 20Y+ Treasury
  TLT: 'TLT',   // Long 20Y+ Treasury
} as const;

export const YIELD_TENORS = ['2Y', '5Y', '10Y', '30Y'] as const;

export const RISK_LIMITS = {
  maxSinglePosition: 0.25,      // 25%
  maxTotalExposure: 0.60,       // 60%
  minCash: 0.10,                // 10%
  maxDailyLoss: 0.10,           // 10%
  maxWeeklyLoss: 0.20,          // 20%
} as const;

export const YIELD_THRESHOLDS = {
  accumulate: 4.2,    // 10Y below this = accumulate
  warning: 4.5,       // 10Y above this = warning
  crisis: 5.0,        // 10Y above this = crisis
  crisis30Y: 5.0,     // 30Y above this = crisis
} as const;
