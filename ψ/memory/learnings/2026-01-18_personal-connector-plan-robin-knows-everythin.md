---
title: ## Personal Connector Plan - Robin Knows Everything
tags: [personal-connector, robin, iphone, location, smart-home, privacy, data-lake]
created: 2026-01-18
source: Session 2026-01-18
---

# ## Personal Connector Plan - Robin Knows Everything

## Personal Connector Plan - Robin Knows Everything

Comprehensive plan for connecting Robin to all personal data sources.

### Architecture
```
Data Sources → Collectors → Raw Data Lake → Processors → Robin's Memory
```

### Phases
1. **iPhone** - Location, Screen Time, Health, Calendar
2. **Social** - Facebook, YouTube, Instagram, Twitter, Line
3. **Media** - Spotify, Netflix, Podcasts, Books
4. **Smart Home** - Home Assistant, Presence, Sensors
5. **Intelligence** - Correlations, Predictions, Anomalies

### Key Components
- API Server (Hono on Bun) - receives data from collectors
- iPhone Shortcuts - sends location, health, screen time
- Daily Summary Generator - processes raw data
- Pattern Detector - finds routines, preferences, correlations

### Privacy Principles
- Local First (no cloud)
- Opt-in per source
- Encrypted sensitive data
- Easy deletion

### File Structure
```
ψ/collectors/   - Data collection scripts
ψ/data/         - Raw data lake
ψ/processors/   - Analysis scripts
ψ/server/       - API server
ψ/memory/you/   - Robin's understanding
```

Document: docs/PLAN-Personal-Connector.md

---
*Added via Oracle Learn*
