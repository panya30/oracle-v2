// ARGUS hooks (portfolio monitoring)
export {
  usePortfolio,
  usePositions,
  useAlerts,
  useRiskMetrics,
  useDashboard,
} from './useArgus'

// HERMES hooks (research & data)
export {
  useYields,
  usePrices,
  usePrice,
  useMacro,
  useNews,
  useThesis,
  useFed,
  useResearch,
} from './useHermes'

// Real market data hooks (Yahoo Finance + FRED)
export {
  useMarketData,
  useRealPrices,
  useRealYields,
} from './useMarketData'
export type {
  PriceData,
  YieldData,
  YieldSnapshot,
  Portfolio,
  Position,
  Alert,
  MarketData,
} from './useMarketData'

// DELPHI hooks (signals/oracle)
export {
  useSignals,
  useActiveSignals,
  useThesisStatus,
  useOracleReading,
  useGenerateSignals,
} from './useDelphi'
export type {
  Signal,
  ThesisStatus,
  OracleReading,
} from './useDelphi'

// TYCHE hooks (risk management)
export {
  useRiskMetrics as useTycheRiskMetrics,
  useRiskLimits,
  useRiskScore,
  useScenarioAnalysis,
  usePortfolioRiskAnalysis,
  usePositionSizeRecommendation,
} from './useTyche'
export type {
  RiskMetrics as TycheRiskMetrics,
  RiskLimits,
  RiskScore,
  ScenarioResult,
  PortfolioRiskAnalysis,
  PositionSizeRecommendation,
} from './useTyche'

// CHRONOS hooks (calendar/timing)
export {
  useUpcomingEvents,
  useTodayEvents,
  useWeekEvents,
  useHighImpactEvents,
  useFOMCSchedule,
  useNextFOMC,
  useAuctionCalendar,
  useTimingGuidance,
  useMarketHours,
} from './useChronos'
export type {
  CalendarEvent,
  FOMCMeeting,
  AuctionEvent,
  TimingGuidance,
  MarketHours,
} from './useChronos'

// Local storage persistence
export {
  useLocalStorage,
  usePersistedPortfolio,
  usePersistedAlertRules,
  usePersistedAlerts,
} from './useLocalStorage'
export type {
  StoredPosition,
  StoredPortfolio,
  StoredAlertRule,
  StoredAlert,
} from './useLocalStorage'

// Order management (Alpaca)
export { useOrders } from './useOrders'
export type { Order } from './useOrders'

// Trading automation
export { useAutomation, useAutomationSettings, useTradeProposals } from './useAutomation'

// Signal processor (autonomous trading)
export { useSignalProcessor } from './useSignalProcessor'

// Speech synthesis (text-to-speech)
export { useSpeech } from './useSpeech'
export type { SpeechLanguage, SpeechRate } from './useSpeech'
