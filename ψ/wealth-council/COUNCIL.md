# Panya Wealth Council

> "ปัญญาสร้างความมั่งคั่ง" - Wisdom Creates Wealth

## Mission

Autonomous investment research and semi-autonomous execution for the 30x Bond Play thesis.

---

## Council Structure

```
                        ┌─────────────┐
                        │   PLUTUS    │
                        │     CIO     │
                        └──────┬──────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
    ┌─────┴─────┐        ┌─────┴─────┐        ┌─────┴─────┐
    │  HERMES   │        │  ATHENA   │        │   TYCHE   │
    │  Research │        │  Strategy │        │   Risk    │
    └─────┬─────┘        └─────┬─────┘        └─────┬─────┘
          │                    │                    │
    ┌─────┴─────┐        ┌─────┴─────┐        ┌─────┴─────┐
    │  DELPHI   │        │HEPHAESTUS │        │  CHRONOS  │
    │  Signals  │        │  Execute  │        │  Timing   │
    └───────────┘        └───────────┘        └───────────┘
          │                                         │
    ┌─────┴─────┐                             ┌─────┴─────┐
    │ CASSANDRA │                             │   ARGUS   │
    │ Sentiment │                             │  Monitor  │
    └───────────┘                             └───────────┘
```

---

## Agents Overview

| Agent | Role | Focus Area | MCP Server |
|-------|------|------------|------------|
| PLUTUS | Chief Investment Officer | Final decisions | `wealth-plutus` |
| HERMES | Research Analyst | Macro, Fed, data | `wealth-hermes` |
| ATHENA | Strategy Architect | Trade plans | `wealth-athena` |
| TYCHE | Risk Manager | Position sizing | `wealth-tyche` |
| DELPHI | Technical Analyst | Charts, signals | `wealth-delphi` |
| HEPHAESTUS | Trade Executor | Order execution | `wealth-hephaestus` |
| CHRONOS | Timing Specialist | Calendars, cycles | `wealth-chronos` |
| CASSANDRA | Sentiment Analyst | News, fear/greed | `wealth-cassandra` |
| ARGUS | Portfolio Monitor | Alerts, P&L | `wealth-argus` |

---

## Focus: 30x Bond Play

### Thesis
- US debt unsustainable ($36T+)
- Bond yields will spike
- Long-term treasuries will crash
- Target: 30x return on risk capital

### Instruments
| Ticker | Type | Leverage | Use |
|--------|------|----------|-----|
| TMV | 3x Inverse 20Y+ | High | Core position |
| TBT | 2x Inverse 20Y+ | Medium | Secondary |
| TBF | 1x Inverse 20Y+ | Low | Conservative |
| TLT | Long 20Y+ Treasury | - | For puts |

### Key Levels
```
ENTRY SIGNALS:
- US 10Y < 4.2% = Accumulate
- TLT > $88 = Good entry

WARNING SIGNALS:
- US 10Y > 4.5% = Add positions
- US 30Y > 5.0% = Crisis mode

EXIT SIGNALS:
- Fed emergency cut announcement
- New QE program
- Position +300% = Scale out
```

---

## Semi-Autonomous Rules

### Auto-Execute (No Approval Needed)
```
CONDITIONS:
├── Position size < 5% of portfolio
├── Within pre-approved strategy
├── Stop-loss in place
├── Risk/reward > 2:1
└── Not during high-volatility events

ACTIONS ALLOWED:
├── Add to existing positions (small)
├── Execute stop-losses
├── Take partial profits per plan
└── Rebalance within bands
```

### Requires Human Approval
```
CONDITIONS:
├── Position size > 5% of portfolio
├── New strategy or instrument
├── Removing stop-losses
├── Leveraged options trades
├── During Fed meetings/major events
└── Any action outside playbook

PROCESS:
1. Agent generates recommendation
2. PLUTUS reviews and summarizes
3. Human receives notification
4. Human approves/rejects/modifies
5. HEPHAESTUS executes if approved
```

### Emergency Rules
```
CIRCUIT BREAKERS:
├── Daily loss > 10% = Halt all trading
├── Weekly loss > 20% = Review required
├── Single position > 25% = Rebalance alert
└── Correlation spike = Diversification check

OVERRIDE:
├── Human can override any agent decision
├── Human can pause all agents
├── Human can force liquidation
└── Human has final authority always
```

---

## Data Flow

```
EXTERNAL DATA
     │
     ▼
┌─────────────────────────────────────────────────────────┐
│                    DATA LAYER                           │
├─────────────────────────────────────────────────────────┤
│  FRED API │ TradingView │ News APIs │ Broker API       │
└─────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────┐
│                   ANALYSIS LAYER                        │
├─────────────────────────────────────────────────────────┤
│  HERMES    │  DELPHI    │  CASSANDRA  │  CHRONOS       │
│  (Macro)   │  (Tech)    │  (Sentiment)│  (Timing)      │
└─────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────┐
│                   DECISION LAYER                        │
├─────────────────────────────────────────────────────────┤
│  ATHENA (Strategy) ──▶ TYCHE (Risk) ──▶ PLUTUS (CIO)  │
└─────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────┐
│                  EXECUTION LAYER                        │
├─────────────────────────────────────────────────────────┤
│  HEPHAESTUS (Execute) ◀──▶ ARGUS (Monitor)             │
└─────────────────────────────────────────────────────────┘
     │
     ▼
   BROKER
```

---

## Communication Protocol

### Agent Messages

```typescript
interface AgentMessage {
  from: AgentName;
  to: AgentName | 'council' | 'human';
  type: 'report' | 'signal' | 'alert' | 'request' | 'decision';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  payload: {
    title: string;
    summary: string;
    data: any;
    recommendation?: string;
    confidence?: number; // 0-100
  };
  timestamp: Date;
  requiresResponse: boolean;
}
```

### Example Flow

```
1. HERMES detects: "10Y yield broke 4.5%"
   → Sends ALERT to COUNCIL

2. DELPHI confirms: "TLT broke support at $85"
   → Sends SIGNAL to ATHENA

3. ATHENA synthesizes: "Add to TMV position"
   → Sends REQUEST to TYCHE

4. TYCHE calculates: "Buy 50 shares, stop at $38"
   → Sends RECOMMENDATION to PLUTUS

5. PLUTUS decides: "Position < 5%, auto-execute"
   → Sends DECISION to HEPHAESTUS

6. HEPHAESTUS executes: "Bought 50 TMV @ $42.30"
   → Sends REPORT to ARGUS

7. ARGUS updates: "Portfolio now 12% TMV"
   → Sends REPORT to COUNCIL + HUMAN
```

---

## File Structure

```
ψ/wealth-council/
├── COUNCIL.md              # This file
├── agents/
│   ├── plutus/
│   │   ├── system-prompt.md
│   │   ├── decision-log.md
│   │   └── config.json
│   ├── hermes/
│   │   ├── system-prompt.md
│   │   ├── research/
│   │   │   └── 2026-01-21_bond-macro.md
│   │   └── config.json
│   ├── athena/
│   │   ├── system-prompt.md
│   │   ├── strategies/
│   │   │   └── 30x-bond.md
│   │   └── config.json
│   ├── tyche/
│   │   ├── system-prompt.md
│   │   ├── models/
│   │   │   └── position-sizing.md
│   │   └── config.json
│   ├── delphi/
│   │   ├── system-prompt.md
│   │   ├── signals/
│   │   │   └── 2026-01-21.md
│   │   └── config.json
│   ├── hephaestus/
│   │   ├── system-prompt.md
│   │   ├── trade-journal/
│   │   │   └── 2026-01.md
│   │   └── config.json
│   ├── chronos/
│   │   ├── system-prompt.md
│   │   ├── calendars/
│   │   │   └── fed-calendar.md
│   │   └── config.json
│   ├── cassandra/
│   │   ├── system-prompt.md
│   │   ├── sentiment/
│   │   │   └── 2026-01-21.md
│   │   └── config.json
│   └── argus/
│       ├── system-prompt.md
│       ├── alerts/
│       │   └── active.md
│       ├── reports/
│       │   └── daily/
│       └── config.json
├── portfolio/
│   ├── positions.json
│   ├── performance.md
│   └── risk-report.md
├── strategies/
│   └── 30x-bond-play/
│       ├── thesis.md
│       ├── playbook.md
│       └── levels.md
├── journal/
│   └── 2026-01/
│       └── 21.md
└── mcp/
    ├── architecture.md
    └── servers/
        └── README.md
```

---

## Development Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Create all agent system prompts
- [ ] Define MCP server interfaces
- [ ] Set up data connections
- [ ] Build ARGUS monitoring first

### Phase 2: Core Agents (Week 2-3)
- [ ] Implement HERMES (research)
- [ ] Implement DELPHI (signals)
- [ ] Implement TYCHE (risk)
- [ ] Test with paper trading

### Phase 3: Decision Layer (Week 3-4)
- [ ] Implement ATHENA (strategy)
- [ ] Implement PLUTUS (CIO)
- [ ] Build approval workflow
- [ ] Human notification system

### Phase 4: Execution (Week 4+)
- [ ] Implement HEPHAESTUS (broker integration)
- [ ] Semi-autonomous rules engine
- [ ] Live trading (small positions)
- [ ] Iterate and improve

---

## Quick Start

```bash
# View council status
oracle_search("wealth council")

# Check agent status
cat ψ/wealth-council/agents/*/config.json

# View latest signals
cat ψ/wealth-council/agents/delphi/signals/$(date +%Y-%m-%d).md

# View portfolio
cat ψ/wealth-council/portfolio/positions.json

# View today's journal
cat ψ/wealth-council/journal/2026-01/21.md
```

---

## Contact

- **Human Override**: Always available
- **Emergency Stop**: `wealth_council_halt()`
- **Status Check**: `wealth_council_status()`

---

*"The council advises, the human decides."*
