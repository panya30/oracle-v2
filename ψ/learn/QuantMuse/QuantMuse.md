# QuantMuse Learning Index

> Production-ready quantitative trading system with AI/ML

**Repo**: https://github.com/0xemmkty/QuantMuse
**Local**: `ψ/learn/repo/github.com/0xemmkty/QuantMuse/`

---

## Latest Exploration

**Date**: 2026-01-18

**Files**:
- [[2026-01-18_ARCHITECTURE|Architecture]] - System design, layers, patterns
- [[2026-01-18_CODE-SNIPPETS|Code Snippets]] - Key implementations
- [[2026-01-18_QUICK-REFERENCE|Quick Reference]] - Usage guide

---

## Key Insights

### 1. Layered Architecture
```
Presentation (Streamlit, FastAPI)
    ↓
Business Logic (Strategies, Factors, AI)
    ↓
Data Processing (Processors, Features)
    ↓
Data Access (Fetchers, Storage, Cache)
    ↓
C++ Performance (Low-latency core)
```

### 2. Strategy Plugin System
- `StrategyBase` abstract class
- `StrategyRegistry` for registration
- 8 built-in strategies
- Easy to extend

### 3. Multi-Factor Model
- 50+ factors across 6 categories
- Weighted screening
- Factor optimization
- Backtesting integration

### 4. AI Integration
- OpenAI GPT for market analysis
- Sentiment from news/social media
- LangChain agents
- Vector database for semantic search

---

## Relevance to FM HVAC Project

| QuantMuse Pattern | FM Application |
|-------------------|----------------|
| Strategy Registry | Recommendation registry |
| Factor Calculator | HVAC factor analysis |
| Backtest Engine | Savings simulation |
| AI Sentiment | Occupant comfort analysis |
| Multi-provider LLM | Multiple AI backends |
| Graceful degradation | Sensor fallback logic |

---

## Timeline

### 2026-01-18 (First exploration)
- Initial discovery
- Core: Strategy framework + Factor analysis + AI integration
- Useful patterns for Panya Council architecture

---

## Quick Commands

```bash
# View repo
cd ψ/learn/repo/github.com/0xemmkty/QuantMuse

# Run demos
python examples/factor_analysis_demo.py
python examples/ai_sentiment_analysis.py

# Launch dashboard
python run_dashboard.py
```
