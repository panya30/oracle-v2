# QuantMuse - Quick Reference

**Explored**: 2026-01-18
**Repo**: https://github.com/0xemmkty/QuantMuse

---

## What It Does

Production-ready **quantitative trading system** combining:
- Traditional factor analysis
- AI/ML sentiment analysis
- Backtesting engine
- Real-time data streaming
- Web dashboards

---

## Installation

```bash
# Clone
git clone https://github.com/0xemmkty/QuantMuse.git
cd QuantMuse

# Install (choose features)
pip install -e .                              # Basic
pip install -e .[ai]                          # + AI/ML
pip install -e .[visualization]               # + Charts
pip install -e .[ai,visualization,realtime,web]  # Full

# Configure
cp config.example.json config.json
# Add API keys: Binance, OpenAI, Alpha Vantage
```

---

## Quick Start

```bash
# Fetch data
python examples/fetch_public_data.py

# Launch dashboard
python run_dashboard.py      # Streamlit → localhost:8501
python run_web_interface.py  # FastAPI → localhost:8000

# Run demos
python examples/factor_analysis_demo.py
python examples/quantitative_strategies.py
python examples/ai_sentiment_analysis.py
```

---

## Built-in Strategies (8)

| Strategy | Style | Risk |
|----------|-------|------|
| Momentum | Trend following | High |
| Value | Contrarian | Medium |
| Quality Growth | Growth investing | Med-High |
| Multi-Factor | Balanced | Medium |
| Mean Reversion | Counter-trend | High |
| Low Volatility | Defensive | Low |
| Sector Rotation | Macro | High |
| Risk Parity | Risk control | Medium |

---

## Factor Categories

| Category | Factors |
|----------|---------|
| **Momentum** | 20d, 60d, 252d price momentum |
| **Value** | P/E, P/B, P/S, dividend yield |
| **Quality** | ROE, ROA, debt ratio |
| **Size** | Market cap, enterprise value |
| **Volatility** | Beta, Sharpe ratio |
| **Technical** | RSI, MACD, Bollinger Bands |

---

## Key APIs

### Data Fetching
```python
from data_service.fetchers import BinanceFetcher

fetcher = BinanceFetcher()
price = fetcher.get_current_price("BTCUSD")
data = fetcher.get_historical_data("ETHUSDT", "1d")
```

### Factor Analysis
```python
from data_service.factors import FactorCalculator, FactorScreener

calculator = FactorCalculator()
factors = calculator.calculate_all_factors(symbol, prices, volumes)

screener = FactorScreener()
results = screener.create_momentum_screener().screen_stocks(factor_data)
```

### Backtesting
```python
from data_service.backtest import BacktestEngine
from data_service.strategies import MomentumStrategy

engine = BacktestEngine(initial_capital=100000)
strategy = MomentumStrategy()
results = engine.run_backtest(strategy, historical_data)
```

### AI Sentiment
```python
from data_service.ai import SentimentAnalyzer

analyzer = SentimentAnalyzer(openai_api_key="...")
sentiment = analyzer.analyze_text_sentiment(text, symbol)
signal = analyzer.generate_sentiment_signal(market_sentiment)
```

---

## Web API Endpoints

```
GET  /api/strategies              # List strategies
POST /api/strategies              # Create strategy
POST /api/strategies/{id}/start   # Start
POST /api/strategies/{id}/stop    # Stop
POST /api/backtest/run            # Run backtest
GET  /api/market/data/{symbol}    # Market data
POST /api/ai/analyze              # AI analysis
```

---

## Project Structure

```
QuantMuse/
├── data_service/
│   ├── fetchers/      # Data sources
│   ├── factors/       # Factor analysis
│   ├── strategies/    # Trading strategies
│   ├── backtest/      # Backtesting
│   ├── ai/            # AI/ML
│   ├── storage/       # Persistence
│   └── web/           # Web interface
├── backend/           # C++ core
├── examples/          # Demos
└── tests/             # Tests
```

---

## Configuration

### Environment Variables
```env
OPENAI_API_KEY=your-key
ALPHA_VANTAGE_API_KEY=your-key
REDIS_HOST=localhost
DATABASE_URL=sqlite:///trading_data.db
```

### config.json
```json
{
  "binance": {"api_key": "...", "secret_key": "..."},
  "openai": {"api_key": "..."},
  "web": {"host": "0.0.0.0", "port": 8000}
}
```

---

## Testing

```bash
pytest tests/ -v
pytest tests/ --cov=data_service
```

---

## Key Features

- **Multi-source data**: Binance, Yahoo, Alpha Vantage
- **50+ factors**: Momentum, value, quality, technical
- **8 strategies**: Ready to use or extend
- **AI integration**: OpenAI, LangChain, sentiment
- **Backtesting**: Commission-aware simulation
- **Risk management**: VaR, drawdown limits
- **Web UI**: Streamlit + FastAPI dashboards
- **Real-time**: WebSocket streaming

---

## Disclaimer

- Educational/research purposes only
- Past performance ≠ future results
- Trading involves risk of loss
- Consult financial advisors

---

## Resources

| Doc | Content |
|-----|---------|
| README.md | Main docs |
| README_Factor_Analysis.md | Factor guide |
| README_AI_Modules.md | AI features |
| README_Quantitative_Strategies.md | Strategy guide |
| examples/ | Demo scripts |
