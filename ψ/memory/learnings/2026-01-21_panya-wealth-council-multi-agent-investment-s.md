---
title: ## Panya Wealth Council - Multi-Agent Investment System
tags: [wealth-council, multi-agent, investment, mcp, bonds, autonomous, trading]
created: 2026-01-21
source: Panya Wealth Council Design
---

# ## Panya Wealth Council - Multi-Agent Investment System

## Panya Wealth Council - Multi-Agent Investment System

### Overview
9-agent autonomous investment council focused on 30x Bond Play thesis.

### Agents
| Agent | Role | Greek | Responsibility |
|-------|------|-------|----------------|
| PLUTUS | CIO | Wealth | Final decisions |
| HERMES | Research | Commerce | Macro data, Fed analysis |
| ATHENA | Strategy | Wisdom | Trade plans |
| TYCHE | Risk | Fortune | Position sizing, stops |
| DELPHI | Technical | Oracle | Charts, signals |
| HEPHAESTUS | Execution | Craft | Trade execution |
| CHRONOS | Timing | Time | Calendars, cycles |
| CASSANDRA | Sentiment | Prophetess | News, fear/greed |
| ARGUS | Monitor | 100 Eyes | 24/7 portfolio watch |

### Semi-Autonomous Rules
**Auto-Execute (No Approval):**
- Position < 5% portfolio
- Within approved strategy
- Stop-loss in place
- R:R > 2:1

**Requires Human:**
- Position > 5% portfolio
- New instruments
- Removing stops
- Options trades

### Architecture
- Each agent = MCP server
- Data flow: HERMES/DELPHI → ATHENA → TYCHE → PLUTUS → HEPHAESTUS
- ARGUS monitors everything

### Files
- Council overview: ψ/wealth-council/COUNCIL.md
- Agent prompts: ψ/wealth-council/agents/*/system-prompt.md
- MCP spec: ψ/wealth-council/mcp/architecture.md

### Development Timeline
- Week 1-2: ARGUS + HERMES (monitoring + data)
- Week 2-3: DELPHI + TYCHE (signals + risk)
- Week 3-4: ATHENA + PLUTUS (strategy + decisions)
- Week 4+: HEPHAESTUS (execution)

---
*Added via Oracle Learn*
