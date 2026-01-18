# QuantMuse - Architecture

**Explored**: 2026-01-18
**Repo**: https://github.com/0xemmkty/QuantMuse

---

## Overview

QuantMuse is a **production-ready quantitative trading system** combining traditional financial analysis with AI/ML technologies. Designed for professional traders and quants.

---

## Directory Structure

```
QuantMuse/
├── backend/                          # C++ Core Engine
│   ├── include/                      # Header files
│   │   ├── data_loader.hpp
│   │   ├── strategy.hpp
│   │   ├── risk_manager.hpp
│   │   └── order_executor.hpp
│   ├── src/                          # Implementation
│   └── CMakeLists.txt
│
├── data_service/                     # Python Core Module
│   ├── ai/                           # AI & NLP
│   │   ├── llm_integration.py        # OpenAI/LLM
│   │   ├── langchain_agent.py        # LangChain agents
│   │   ├── sentiment_analyzer.py     # Sentiment analysis
│   │   └── news_processor.py         # News processing
│   │
│   ├── fetchers/                     # Data Sources
│   │   ├── binance_fetcher.py        # Crypto
│   │   ├── alpha_vantage_fetcher.py  # Stocks
│   │   └── yahoo_fetcher.py          # Yahoo Finance
│   │
│   ├── factors/                      # Factor Analysis
│   │   ├── factor_calculator.py
│   │   ├── factor_screener.py
│   │   ├── factor_backtest.py
│   │   └── factor_optimizer.py
│   │
│   ├── strategies/                   # Trading Strategies
│   │   ├── strategy_base.py          # Abstract base
│   │   ├── builtin_strategies.py     # 8+ strategies
│   │   ├── strategy_registry.py      # Registry pattern
│   │   └── strategy_runner.py        # Execution
│   │
│   ├── backtest/                     # Backtesting
│   │   ├── backtest_engine.py
│   │   └── performance_analyzer.py
│   │
│   ├── storage/                      # Persistence
│   │   ├── database_manager.py       # SQLite/PostgreSQL
│   │   └── cache_manager.py          # Redis
│   │
│   ├── web/                          # Web Interface
│   │   ├── api_server.py             # FastAPI
│   │   └── dashboard.py
│   │
│   └── ml/                           # Machine Learning
│       ├── feature_engineering.py
│       └── ml_models.py
│
├── examples/                         # Demo Scripts
├── tests/                            # Tests
├── main.py                           # Entry point
├── run_dashboard.py                  # Streamlit
└── run_web_interface.py              # FastAPI
```

---

## Entry Points

| File | Purpose | Port |
|------|---------|------|
| `main.py` | Basic data pipeline | - |
| `run_dashboard.py` | Streamlit dashboard | 8501 |
| `run_web_interface.py` | FastAPI server | 8000 |
| `examples/` | 8+ demo scripts | - |

---

## Core Abstractions

### 1. Strategy Framework
```python
class StrategyBase(ABC):
    @abstractmethod
    def generate_signals(self, factor_data, price_data) -> StrategyResult

@dataclass
class StrategyResult:
    strategy_name: str
    selected_stocks: List[str]
    weights: Dict[str, float]
    performance_metrics: Dict[str, float]
```

### 2. Factor System
```python
FactorCalculator   # Calculate 50+ factors
FactorScreener     # Multi-criteria filtering
FactorBacktest     # Historical testing
FactorOptimizer    # Weight optimization
```

### 3. AI/LLM Layer
```python
LLMIntegration     # OpenAI GPT
SentimentAnalyzer  # Text sentiment
NLPProcessor       # Text processing
VectorStore        # Semantic search
```

---

## Layered Architecture

```
┌─────────────────────────────────────────────┐
│  Presentation Layer                         │
│  (Streamlit, FastAPI, Web UI)               │
├─────────────────────────────────────────────┤
│  Business Logic Layer                       │
│  (Strategies, Factors, AI Analysis)         │
├─────────────────────────────────────────────┤
│  Data Processing Layer                      │
│  (Processors, Features, Cleaning)           │
├─────────────────────────────────────────────┤
│  Data Access Layer                          │
│  (Fetchers, Storage, Cache)                 │
├─────────────────────────────────────────────┤
│  C++ Performance Layer                      │
│  (Core execution, low-latency)              │
└─────────────────────────────────────────────┘
```

---

## Data Pipeline

```
Raw Data (Binance, Yahoo, Alpha Vantage)
    ↓
Factor Calculator (50+ factors)
    ↓
Factor Screener (weighted criteria)
    ↓
Strategy (via StrategyRegistry)
    ↓
LLM Analysis (sentiment, signals)
    ↓
Backtest Engine (simulation)
    ↓
Performance Analysis (metrics)
```

---

## Dependencies

### Core
```
pandas, numpy
python-binance>=1.0.0
websocket-client, websockets, aiohttp
fastapi, uvicorn
redis, requests
```

### AI/ML (optional)
```
openai, langchain
transformers, torch
scikit-learn
spacy, nltk
```

### Visualization (optional)
```
matplotlib, seaborn
plotly, streamlit
```

---

## Design Patterns

1. **Abstract Base Classes** - StrategyBase, LLMProvider
2. **Registry Pattern** - StrategyRegistry
3. **Factory Pattern** - Fetcher creation, screener presets
4. **Template Method** - Strategy with preprocessing hooks
5. **Composite Pattern** - Multi-criteria factor screening
6. **Graceful Degradation** - NLP fallback chain
