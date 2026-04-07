# PRD: MaxTrade - AI-Powered Quantitative Trading System

Version: 0.9 (Draft for engineering kick-off)
Owner: Product/Engineering
Target users: Retail traders, Quant enthusiasts, Algo trading learners
Product concept: "QuantMuse-inspired" personal trading assistant with AI superpowers

---

## 1) Executive Summary

MaxTrade is a production-grade quantitative trading platform that combines:

1. **Factor Analysis Engine**
   Multi-factor stock/crypto screening with momentum, value, quality, and technical indicators.

2. **Strategy Framework**
   Extensible plugin architecture with 8+ built-in strategies and custom strategy support.

3. **AI Trading Assistant**
   LLM-powered market analysis, sentiment detection, and trade recommendations.

4. **Backtesting & Simulation**
   Commission-aware historical testing with performance metrics and risk analysis.

The MVP is **paper trading only** (simulation mode). Live trading integration is a later phase with explicit risk controls and user confirmation.

---

## 2) Problem Statement

Retail traders and quant enthusiasts face:

* **Information overload** - Too much data, hard to find actionable signals
* **No systematic approach** - Trading on emotion rather than data
* **Expensive tools** - Professional quant platforms cost thousands per month
* **Steep learning curve** - Factor analysis and backtesting are complex
* **No AI integration** - Missing modern LLM capabilities for market analysis

Result: Poor trading decisions, inconsistent returns, and frustration.

---

## 3) Goals and Success Metrics

### Product Goals

* Democratize quantitative trading for retail users
* Provide **ranked, actionable trade signals** from multi-factor analysis
* Integrate AI for market sentiment and natural language insights
* Enable strategy backtesting without coding

### MVP Success Metrics

| Metric | Target |
|--------|--------|
| **Factor Calculation** | 50+ factors across 6 categories |
| **Strategies** | 8+ built-in, extensible framework |
| **Backtest Accuracy** | Commission-aware, realistic simulation |
| **AI Analysis** | Sentiment scoring with confidence levels |
| **Dashboard Load** | P95 < 2 seconds |
| **Time-to-Value** | First signals within 5 minutes of setup |

### Non-goals (MVP)

* Live trading with real money (Phase 2)
* Options/futures trading
* High-frequency trading (HFT)
* Multi-broker integration

---

## 4) Target Users and Personas

### 1. Retail Trader (Primary)

* **Needs**: Clear buy/sell signals, portfolio tracking, risk metrics
* **Pain**: Information overload, emotional trading, no systematic approach
* **Tech level**: Intermediate (can use web apps, basic terminal)

### 2. Quant Enthusiast

* **Needs**: Factor analysis, custom strategies, backtesting
* **Pain**: Expensive Bloomberg/FactSet, complex Python setup
* **Tech level**: Advanced (comfortable with code, APIs)

### 3. Trading Learner

* **Needs**: Educational content, paper trading, strategy explanations
* **Pain**: No safe way to practice, confusing terminology
* **Tech level**: Beginner (needs guidance)

---

## 5) Key Use Cases and User Journeys

### UC1: Daily Trading Workflow

1. User opens MaxTrade dashboard
2. Sees "Today's Top Signals" ranked by factor scores
3. Drills into a signal: sees factors, AI analysis, historical performance
4. Adds to watchlist or simulates trade
5. Reviews portfolio performance

**Acceptance Criteria**
* Dashboard shows top 10 signals with confidence scores
* Each signal has explainable factors
* One-click add to watchlist

### UC2: Factor Screening

1. User selects screening criteria (e.g., high momentum + low P/E)
2. System screens universe of stocks/crypto
3. Returns ranked list with factor breakdown
4. User can save screen as preset

**Acceptance Criteria**
* Support 50+ factors across 6 categories
* Custom weight assignment
* Save/load screening presets

### UC3: Strategy Backtesting

1. User selects a built-in strategy (e.g., Momentum)
2. Configures parameters (lookback period, rebalance frequency)
3. Runs backtest on historical data
4. Reviews performance: returns, Sharpe, drawdown, win rate

**Acceptance Criteria**
* Commission-aware simulation
* Benchmark comparison (vs. buy-and-hold)
* Downloadable report

### UC4: AI Market Analysis

1. User asks: "What's the sentiment on AAPL?"
2. AI analyzes news, social media, technical indicators
3. Returns sentiment score with explanation
4. Suggests relevant factors to watch

**Acceptance Criteria**
* Sentiment score: -1 to +1 with confidence
* Top 3 reasons for sentiment
* Related news/social links

### UC5: Paper Trading

1. User "buys" 100 shares of AAPL (simulated)
2. Position tracked in portfolio
3. Daily P&L updates
4. Can "sell" anytime

**Acceptance Criteria**
* Realistic fills (no instant execution)
* Commission simulation
* Portfolio analytics (allocation, risk)

---

## 6) Product Scope and Roadmap

### MVP (P0) - 8-12 weeks

* Data fetchers (Binance, Yahoo Finance)
* Factor calculator (50+ factors)
* Factor screener with presets
* Strategy framework + 8 built-in strategies
* Backtest engine (commission-aware)
* AI sentiment analysis (OpenAI)
* Web dashboard (React + Vite)
* Paper trading simulation

### P1 - 4-6 months

* Additional data sources (Alpha Vantage, Polygon)
* Advanced FDD patterns (anomaly detection)
* Custom strategy builder (no-code)
* Mobile-responsive dashboard
* Social features (share strategies)
* Performance leaderboard

### P2 - 6-12 months

* Live trading integration (with safeguards)
* Multi-broker support
* Options strategy support
* Advanced ML models (XGBoost, Neural Networks)
* API for external tools

---

## 7) Functional Requirements

### 7.1 Data Ingestion

**Requirements**

* Support multiple data sources:
  * **P0**: Binance (crypto), Yahoo Finance (stocks)
  * **P1**: Alpha Vantage, Polygon, custom CSV import
* Data types:
  * OHLCV (Open, High, Low, Close, Volume)
  * Real-time quotes (WebSocket)
  * Historical data (daily, hourly, minute)
* Caching:
  * Local cache with configurable TTL
  * Redis support for production

**Acceptance Criteria**

* Data latency: < 5 seconds for real-time quotes
* Historical data: At least 5 years available
* Cache hit rate: > 80% for repeated queries

---

### 7.2 Factor Analysis Engine

**Requirements**

* Factor categories:

| Category | Factors |
|----------|---------|
| **Momentum** | Price momentum (20d, 60d, 252d), volume momentum, RSI, MACD |
| **Value** | P/E ratio, P/B ratio, P/S ratio, dividend yield, EV/EBITDA |
| **Quality** | ROE, ROA, debt-to-equity, current ratio, profit margin |
| **Size** | Market cap, enterprise value, float |
| **Volatility** | Historical volatility, Beta, Sharpe ratio, max drawdown |
| **Technical** | Moving averages (SMA, EMA), Bollinger Bands, ATR, OBV |

* Factor scoring:
  * Normalize factors to percentile ranks (0-100)
  * Support custom weights
  * Composite score calculation

* Factor persistence:
  * Store calculated factors in database
  * Historical factor values for backtesting

**Acceptance Criteria**

* 50+ factors implemented
* Calculation time: < 5 seconds for 500 symbols
* Factor values match industry-standard calculations

---

### 7.3 Strategy Framework

**Requirements**

* Base architecture:
```typescript
interface Strategy {
  name: string;
  description: string;
  parameters: StrategyParams;

  generateSignals(factorData: FactorData, priceData: PriceData): Signal[];
  validate(params: StrategyParams): boolean;
}

interface Signal {
  symbol: string;
  action: 'buy' | 'sell' | 'hold';
  confidence: number;
  factors: FactorContribution[];
  timestamp: Date;
}
```

* Built-in strategies (P0):

| Strategy | Description | Risk Level |
|----------|-------------|------------|
| **Momentum** | Buy winners, sell losers | High |
| **Value** | Buy undervalued stocks | Medium |
| **Quality Growth** | High ROE + revenue growth | Medium-High |
| **Multi-Factor** | Balanced factor weights | Medium |
| **Mean Reversion** | Bet on price reversal | High |
| **Low Volatility** | Defensive, low-beta stocks | Low |
| **Sector Rotation** | Rotate based on macro cycles | High |
| **Risk Parity** | Equal risk contribution | Medium |

* Strategy registry:
  * Register/unregister strategies
  * List available strategies with metadata
  * Create strategy instances with parameters

**Acceptance Criteria**

* All 8 strategies implemented and tested
* Custom strategy can be added in < 50 lines of code
* Strategy parameters are validated before execution

---

### 7.4 Backtesting Engine

**Requirements**

* Simulation features:
  * Commission modeling (fixed + percentage)
  * Slippage modeling (configurable)
  * Position sizing (fixed, percentage, Kelly criterion)
  * Rebalancing (daily, weekly, monthly)

* Performance metrics:

| Metric | Description |
|--------|-------------|
| Total Return | Cumulative return over period |
| Annualized Return | CAGR |
| Sharpe Ratio | Risk-adjusted return |
| Sortino Ratio | Downside risk-adjusted |
| Max Drawdown | Largest peak-to-trough |
| Win Rate | % of profitable trades |
| Profit Factor | Gross profit / gross loss |
| Calmar Ratio | Return / max drawdown |

* Benchmark comparison:
  * Compare vs. buy-and-hold
  * Compare vs. index (SPY, BTC)

* Output:
  * Equity curve chart
  * Drawdown chart
  * Trade log
  * Monthly/yearly returns table

**Acceptance Criteria**

* Backtest 5 years of daily data in < 10 seconds
* Results reproducible (same seed = same results)
* Commission impact clearly shown

---

### 7.5 AI Integration

**Requirements**

* LLM provider abstraction:
  * OpenAI (GPT-4, GPT-3.5)
  * Future: Local models, Anthropic

* AI features:

| Feature | Description |
|---------|-------------|
| **Sentiment Analysis** | Score news/social text (-1 to +1) |
| **Market Summary** | Daily market overview |
| **Signal Explanation** | Explain why a signal was generated |
| **Chat Interface** | Ask questions about portfolio/market |
| **News Processing** | Extract key info from financial news |

* Prompt templates:
  * Market analysis prompt
  * Signal explanation prompt
  * Risk assessment prompt

* Cost tracking:
  * Track tokens used per request
  * Daily/monthly cost limits
  * Fallback to cheaper models

**Acceptance Criteria**

* Sentiment accuracy: > 70% agreement with human labels
* Response time: < 5 seconds for analysis
* Cost: < $0.10 per analysis request (average)

---

### 7.6 Web Dashboard

**Requirements**

* Pages:

| Page | Features |
|------|----------|
| **Home/Dashboard** | Top signals, portfolio summary, market overview |
| **Screener** | Factor screening with filters |
| **Strategies** | Strategy list, backtest runner |
| **Portfolio** | Holdings, P&L, allocation |
| **AI Assistant** | Chat interface, sentiment analysis |
| **Settings** | API keys, preferences |

* Components:
  * Real-time price charts (candlestick, line)
  * Factor heatmaps
  * Portfolio allocation pie chart
  * Equity curve chart
  * Signal cards with confidence bars

* Responsiveness:
  * Desktop-first (P0)
  * Mobile-responsive (P1)

**Acceptance Criteria**

* Dashboard load: P95 < 2 seconds
* Real-time updates: < 1 second latency
* All charts interactive (zoom, hover)

---

### 7.7 Paper Trading

**Requirements**

* Account simulation:
  * Starting capital (configurable)
  * Cash + positions tracking
  * Commission deduction

* Order types:
  * Market order (simulated fill)
  * Limit order (fill when price reached)

* Position management:
  * Average cost tracking
  * Unrealized P&L
  * Position history

* Risk controls:
  * Max position size (% of portfolio)
  * Daily loss limit
  * Concentration warnings

**Acceptance Criteria**

* Orders fill realistically (not instant)
* P&L calculations match manual verification
* Risk warnings shown appropriately

---

## 8) Non-Functional Requirements

### Performance

| Metric | Target |
|--------|--------|
| Dashboard load | P95 < 2s |
| Factor calculation | < 5s for 500 symbols |
| Backtest (5 years) | < 10s |
| Real-time quotes | < 1s latency |
| API response | P95 < 500ms |

### Reliability

* Uptime: 99.5% (web dashboard)
* Data accuracy: Match source provider
* Graceful degradation: Show cached data if API fails

### Security

* API keys encrypted at rest
* No plaintext secrets in code/logs
* Rate limiting on API endpoints
* Input validation on all forms

### Data Privacy

* No PII stored beyond email (auth)
* Trading data stored locally by default
* Optional cloud sync (encrypted)

---

## 9) Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Web Dashboard                          │
│                   (React + Vite + TailwindCSS)              │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                       API Server                            │
│                    (Bun + Hono)                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Fetchers  │  │   Factors   │  │  Strategies │        │
│  │  (Data)     │  │  (Analysis) │  │  (Signals)  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  Backtest   │  │     AI      │  │   Storage   │        │
│  │  (Engine)   │  │  (LLM)      │  │  (DB/Cache) │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
    ┌──────────┐   ┌──────────┐    ┌──────────┐
    │  Binance │   │  Yahoo   │    │  OpenAI  │
    │   API    │   │  Finance │    │   API    │
    └──────────┘   └──────────┘    └──────────┘
```

### Key Services

| Service | Responsibility |
|---------|---------------|
| Fetcher Service | Data ingestion, caching |
| Factor Service | Factor calculation, scoring |
| Strategy Service | Signal generation, registry |
| Backtest Service | Historical simulation |
| AI Service | LLM integration, sentiment |
| Storage Service | Database, cache management |
| Portfolio Service | Paper trading, positions |

---

## 10) Tech Stack

### Backend

| Component | Technology |
|-----------|------------|
| Runtime | Bun |
| Framework | Hono |
| Language | TypeScript |
| Database | SQLite (dev), PostgreSQL (prod) |
| Cache | Redis |
| Queue | BullMQ (for background jobs) |

### Frontend

| Component | Technology |
|-----------|------------|
| Framework | React 18 |
| Build | Vite |
| Styling | TailwindCSS |
| Charts | Lightweight Charts, Recharts |
| State | Zustand |
| API | TanStack Query |

### Infrastructure

| Component | Technology |
|-----------|------------|
| Hosting | Vercel (frontend), Railway (backend) |
| CI/CD | GitHub Actions |
| Monitoring | Sentry |
| Analytics | PostHog |

---

## 11) Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| **API rate limits** | Data gaps | Caching, multiple providers |
| **LLM costs** | Budget overrun | Cost tracking, fallback models |
| **Bad signals** | User loses money | Paper trading only in MVP |
| **Data accuracy** | Wrong decisions | Cross-validate with multiple sources |
| **Scope creep** | Delayed launch | Strict P0 scope, defer features |

---

## 12) Open Questions (Week 1-2)

* [ ] Which crypto exchanges to prioritize?
* [ ] Free vs. paid data providers (Alpha Vantage limits)
* [ ] Self-hosted LLM vs. OpenAI only?
* [ ] User auth: Email-only or social login?
* [ ] Monetization: Free tier limits?

---

## 13) MVP Definition of Done

* ✅ Data fetchers working (Binance, Yahoo)
* ✅ 50+ factors calculated and tested
* ✅ 8 built-in strategies implemented
* ✅ Backtest engine with performance metrics
* ✅ AI sentiment analysis functional
* ✅ Web dashboard with all core pages
* ✅ Paper trading simulation
* ✅ < 2 second dashboard load time
* ✅ Documentation and examples
* ✅ CI/CD pipeline passing

---

## 14) Appendix: Factor Definitions

### Momentum Factors

| Factor | Calculation |
|--------|-------------|
| `momentum_20d` | (Price / Price_20d_ago - 1) × 100 |
| `momentum_60d` | (Price / Price_60d_ago - 1) × 100 |
| `momentum_252d` | (Price / Price_252d_ago - 1) × 100 |
| `rsi_14` | 100 - (100 / (1 + RS)), RS = Avg Gain / Avg Loss |
| `macd` | EMA_12 - EMA_26 |
| `macd_signal` | EMA_9 of MACD |

### Value Factors

| Factor | Calculation |
|--------|-------------|
| `pe_ratio` | Price / EPS |
| `pb_ratio` | Price / Book Value per Share |
| `ps_ratio` | Price / Revenue per Share |
| `dividend_yield` | Annual Dividend / Price × 100 |
| `ev_ebitda` | Enterprise Value / EBITDA |

### Quality Factors

| Factor | Calculation |
|--------|-------------|
| `roe` | Net Income / Shareholders Equity × 100 |
| `roa` | Net Income / Total Assets × 100 |
| `debt_to_equity` | Total Debt / Shareholders Equity |
| `current_ratio` | Current Assets / Current Liabilities |
| `profit_margin` | Net Income / Revenue × 100 |

### Volatility Factors

| Factor | Calculation |
|--------|-------------|
| `volatility_20d` | Std Dev of 20-day returns × √252 |
| `beta` | Cov(Stock, Market) / Var(Market) |
| `sharpe_ratio` | (Return - Rf) / Volatility |
| `max_drawdown` | Max (Peak - Trough) / Peak |

### Technical Factors

| Factor | Calculation |
|--------|-------------|
| `sma_50` | 50-day Simple Moving Average |
| `sma_200` | 200-day Simple Moving Average |
| `ema_20` | 20-day Exponential Moving Average |
| `bollinger_upper` | SMA_20 + 2 × Std Dev |
| `bollinger_lower` | SMA_20 - 2 × Std Dev |
| `atr_14` | Average True Range (14-day) |

---

*PRD Version: 0.9*
*Created: 2026-01-18*
*Author: Robin + Human*
*Reference: QuantMuse patterns*
