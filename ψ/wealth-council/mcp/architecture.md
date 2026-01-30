# Panya Wealth Council - MCP Architecture

## Overview

Each agent runs as an MCP server, providing tools and resources to the Claude Code session.

```
┌─────────────────────────────────────────────────────────┐
│                    CLAUDE CODE                          │
│                  (Orchestrator)                         │
└─────────────────────────────────────────────────────────┘
                          │
    ┌─────────────────────┼─────────────────────┐
    │                     │                     │
    ▼                     ▼                     ▼
┌────────┐          ┌────────┐           ┌────────┐
│PLUTUS  │◀────────▶│HERMES  │◀─────────▶│ TYCHE  │
│ MCP    │          │  MCP   │           │  MCP   │
└────────┘          └────────┘           └────────┘
    │                     │                     │
    ▼                     ▼                     ▼
┌────────┐          ┌────────┐           ┌────────┐
│DELPHI  │          │HEPHAES │           │CHRONOS │
│ MCP    │          │  MCP   │           │  MCP   │
└────────┘          └────────┘           └────────┘
    │                     │                     │
    ▼                     ▼                     ▼
┌────────┐          ┌────────┐           ┌────────┐
│CASSAND │          │ ARGUS  │           │ MIDAS  │
│ MCP    │          │  MCP   │           │  MCP   │
└────────┘          └────────┘           └────────┘
```

---

## MCP Server Specifications

### 1. wealth-plutus (Decision Engine)

```typescript
// Server: wealth-plutus
// Port: 3100

interface PlutusServer {
  tools: {
    // Decision making
    plutus_decide(request: DecisionRequest): Decision;
    plutus_approve(tradeId: string): ApprovalResult;
    plutus_reject(tradeId: string, reason: string): void;
    plutus_escalate(tradeId: string): EscalationResult;

    // Council coordination
    plutus_gather_inputs(): AgentInputs;
    plutus_council_status(): CouncilStatus;
    plutus_halt_trading(reason: string): void;
    plutus_resume_trading(): void;
  };

  resources: {
    "plutus://decisions/pending": Decision[];
    "plutus://decisions/history": Decision[];
    "plutus://config": PlutusConfig;
  };
}
```

### 2. wealth-hermes (Research Engine)

```typescript
// Server: wealth-hermes
// Port: 3101

interface HermesServer {
  tools: {
    // Data retrieval
    hermes_get_yield(tenor: '2Y' | '10Y' | '30Y'): YieldData;
    hermes_get_fed_rate(): FedRateData;
    hermes_get_cpi(): InflationData;
    hermes_get_auction(date: string): AuctionResult;

    // Analysis
    hermes_macro_summary(): MacroSummary;
    hermes_fed_analysis(): FedAnalysis;
    hermes_news_search(query: string): NewsItem[];

    // Reporting
    hermes_daily_brief(): DailyBrief;
    hermes_research_report(topic: string): Report;
  };

  resources: {
    "hermes://yields/current": YieldSnapshot;
    "hermes://fed/calendar": FedCalendar;
    "hermes://research/latest": Research[];
  };
}
```

### 3. wealth-tyche (Risk Engine)

```typescript
// Server: wealth-tyche
// Port: 3102

interface TycheServer {
  tools: {
    // Position sizing
    tyche_calculate_position(params: PositionParams): PositionSize;
    tyche_check_limits(): LimitCheck;
    tyche_set_stop(position: string, level: number): void;

    // Risk analysis
    tyche_portfolio_risk(): RiskMetrics;
    tyche_var(confidence: number): VaRResult;
    tyche_stress_test(scenario: string): StressResult;
    tyche_correlation(): CorrelationMatrix;

    // Monitoring
    tyche_daily_risk_report(): RiskReport;
    tyche_check_breaches(): Breach[];
  };

  resources: {
    "tyche://limits": RiskLimits;
    "tyche://positions": PositionRisk[];
    "tyche://reports/daily": RiskReport;
  };
}
```

### 4. wealth-delphi (Signal Engine)

```typescript
// Server: wealth-delphi
// Port: 3103

interface DelphiServer {
  tools: {
    // Price data
    delphi_get_price(ticker: string): Price;
    delphi_get_ohlcv(ticker: string, tf: string): OHLCV[];

    // Technical analysis
    delphi_indicators(ticker: string): Indicators;
    delphi_support_resistance(ticker: string): Levels;
    delphi_trend(ticker: string): TrendAnalysis;
    delphi_patterns(ticker: string): Pattern[];

    // Signals
    delphi_generate_signal(ticker: string): Signal;
    delphi_daily_signals(): SignalReport;
  };

  resources: {
    "delphi://signals/active": Signal[];
    "delphi://levels": KeyLevels;
    "delphi://charts/daily": ChartAnalysis;
  };
}
```

### 5. wealth-hephaestus (Execution Engine)

```typescript
// Server: wealth-hephaestus
// Port: 3104

interface HephaestusServer {
  tools: {
    // Order management
    hephaestus_place_order(order: Order): OrderResult;
    hephaestus_cancel_order(orderId: string): void;
    hephaestus_modify_order(orderId: string, changes: OrderChanges): void;

    // Execution
    hephaestus_execute(decision: Decision): ExecutionResult;
    hephaestus_status(orderId: string): OrderStatus;

    // Journal
    hephaestus_log_trade(trade: Trade): void;
    hephaestus_trade_history(): Trade[];
  };

  resources: {
    "hephaestus://orders/open": Order[];
    "hephaestus://orders/filled": Order[];
    "hephaestus://journal": TradeJournal;
  };
}
```

### 6. wealth-argus (Monitoring Engine)

```typescript
// Server: wealth-argus
// Port: 3105

interface ArgusServer {
  tools: {
    // Portfolio
    argus_portfolio_value(): PortfolioValue;
    argus_positions(): Position[];
    argus_pnl(period: string): PnL;

    // Alerts
    argus_set_alert(alert: AlertConfig): void;
    argus_clear_alert(alertId: string): void;
    argus_active_alerts(): Alert[];

    // Reports
    argus_daily_summary(): DailySummary;
    argus_weekly_report(): WeeklyReport;
    argus_morning_brief(): MorningBrief;
  };

  resources: {
    "argus://portfolio": PortfolioSnapshot;
    "argus://alerts": Alert[];
    "argus://reports/daily": Report;
  };
}
```

### 7. wealth-chronos (Timing Engine)

```typescript
// Server: wealth-chronos
// Port: 3106

interface ChronosServer {
  tools: {
    // Calendars
    chronos_fed_calendar(): FedEvent[];
    chronos_earnings_calendar(): EarningsEvent[];
    chronos_economic_calendar(): EconEvent[];

    // Timing
    chronos_optimal_entry(ticker: string): TimingAdvice;
    chronos_seasonality(ticker: string): SeasonalPattern;
    chronos_cycle_position(): CycleAnalysis;

    // Events
    chronos_upcoming_events(days: number): Event[];
    chronos_event_impact(event: Event): ImpactAnalysis;
  };

  resources: {
    "chronos://calendar/fed": FedCalendar;
    "chronos://calendar/economic": EconCalendar;
    "chronos://timing": TimingWindows;
  };
}
```

---

## Data Flow Architecture

```
                    EXTERNAL DATA
                         │
    ┌────────────────────┼────────────────────┐
    │                    │                    │
    ▼                    ▼                    ▼
┌────────┐         ┌──────────┐         ┌────────┐
│ FRED   │         │TradingView│        │ Broker │
│  API   │         │   API    │         │  API   │
└───┬────┘         └────┬─────┘         └───┬────┘
    │                   │                   │
    └─────────┬─────────┴─────────┬─────────┘
              │                   │
              ▼                   ▼
        ┌──────────┐        ┌──────────┐
        │ HERMES   │        │ DELPHI   │
        │ (Macro)  │        │ (Tech)   │
        └────┬─────┘        └────┬─────┘
             │                   │
             └─────────┬─────────┘
                       │
                       ▼
        ┌──────────────────────────┐
        │        ATHENA            │
        │  (Strategy Synthesis)    │
        └────────────┬─────────────┘
                     │
            ┌────────┼────────┐
            │        │        │
            ▼        ▼        ▼
        ┌──────┐ ┌──────┐ ┌──────┐
        │TYCHE │ │CHRONOS││CASSAND│
        │(Risk)│ │(Time) ││(Sent) │
        └──┬───┘ └──┬───┘ └──┬───┘
           │        │        │
           └────────┼────────┘
                    │
                    ▼
        ┌──────────────────────────┐
        │        PLUTUS            │
        │    (Final Decision)      │
        └────────────┬─────────────┘
                     │
         ┌───────────┼───────────┐
         │                       │
         ▼                       ▼
    ┌──────────┐           ┌──────────┐
    │HEPHAESTUS│◀─────────▶│  ARGUS   │
    │(Execute) │           │(Monitor) │
    └────┬─────┘           └────┬─────┘
         │                      │
         └──────────┬───────────┘
                    │
                    ▼
              ┌──────────┐
              │  BROKER  │
              └──────────┘
```

---

## Installation & Configuration

### Claude MCP Settings

```json
// ~/.claude/settings.json
{
  "mcpServers": {
    "wealth-plutus": {
      "type": "stdio",
      "command": "node",
      "args": ["~/wealth-council/mcp/servers/plutus/dist/index.js"],
      "env": {}
    },
    "wealth-hermes": {
      "type": "stdio",
      "command": "node",
      "args": ["~/wealth-council/mcp/servers/hermes/dist/index.js"],
      "env": {
        "FRED_API_KEY": "${FRED_API_KEY}"
      }
    },
    "wealth-tyche": {
      "type": "stdio",
      "command": "node",
      "args": ["~/wealth-council/mcp/servers/tyche/dist/index.js"],
      "env": {}
    },
    "wealth-delphi": {
      "type": "stdio",
      "command": "node",
      "args": ["~/wealth-council/mcp/servers/delphi/dist/index.js"],
      "env": {
        "TRADINGVIEW_API": "${TRADINGVIEW_API}"
      }
    },
    "wealth-hephaestus": {
      "type": "stdio",
      "command": "node",
      "args": ["~/wealth-council/mcp/servers/hephaestus/dist/index.js"],
      "env": {
        "BROKER_API_KEY": "${BROKER_API_KEY}",
        "BROKER_SECRET": "${BROKER_SECRET}"
      }
    },
    "wealth-argus": {
      "type": "stdio",
      "command": "node",
      "args": ["~/wealth-council/mcp/servers/argus/dist/index.js"],
      "env": {}
    },
    "wealth-chronos": {
      "type": "stdio",
      "command": "node",
      "args": ["~/wealth-council/mcp/servers/chronos/dist/index.js"],
      "env": {}
    }
  }
}
```

---

## Development Phases

### Phase 1: Core Infrastructure (Week 1-2)
```
[x] Define agent system prompts
[ ] Create MCP server templates
[ ] Implement ARGUS (monitoring - start here)
[ ] Implement HERMES (data feeds)
[ ] Test basic data flow
```

### Phase 2: Analysis Layer (Week 2-3)
```
[ ] Implement DELPHI (technical)
[ ] Implement TYCHE (risk)
[ ] Implement CHRONOS (timing)
[ ] Connect to external APIs
[ ] Test analysis pipeline
```

### Phase 3: Decision Layer (Week 3-4)
```
[ ] Implement ATHENA (strategy)
[ ] Implement PLUTUS (decisions)
[ ] Build approval workflow
[ ] Human notification system
[ ] Test decision pipeline
```

### Phase 4: Execution (Week 4+)
```
[ ] Implement HEPHAESTUS (broker)
[ ] Semi-autonomous rules
[ ] Paper trading test
[ ] Live trading (small)
[ ] Iterate and improve
```

---

## API Keys Required

| Service | Purpose | Agent |
|---------|---------|-------|
| FRED | Economic data | HERMES |
| TradingView | Charts, prices | DELPHI |
| News API | News feeds | CASSANDRA |
| Broker API | Trading | HEPHAESTUS |
| Alpha Vantage | Backup data | HERMES |

---

## Security Considerations

```
1. API keys in environment variables only
2. Broker API with IP whitelist
3. Trading limits enforced in code
4. Human approval for large trades
5. Audit log for all decisions
6. Circuit breakers for losses
7. No production credentials in code
```

---

## Next Steps

1. Set up MCP server boilerplate
2. Implement ARGUS first (simplest, highest value)
3. Add HERMES for data
4. Connect DELPHI for signals
5. Build TYCHE for risk
6. Integrate PLUTUS for decisions
7. Paper trade for 2 weeks
8. Go live with small capital
