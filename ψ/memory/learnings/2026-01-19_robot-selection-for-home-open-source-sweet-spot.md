# Robot Selection for Home: Open Source Sweet Spot

**Date**: 2026-01-19
**Source**: Intelligence Home Robot Exploration Session
**Concepts**: [robotics, home-automation, open-source, budget-optimization]

## Pattern

When selecting robots for home automation, open source options often provide the best value:

| Category | Expensive | Open Source Alternative |
|----------|-----------|------------------------|
| Quadruped | Go2 EDU ($3,500) | Petoi Bittle ($340) |
| Companion | Commercial ($500+) | Doly ($300) |
| Desktop | Proprietary | ElectronBot ($150 DIY) |
| Voice | HomePod ($99) | ESP32-S3-BOX ($45) |

## Key Insight

**Don't buy capabilities you don't need.** For home use:
- Fixed sensors (SenseCAP, mmWave) cover 90% of perception needs
- Mini robots (Bittle) sufficient for patrol - don't need Go2's 5m/s speed
- 3D printable robots (Doly, ElectronBot) = customize + repair yourself

## The Dream Team Formula

```
Budget Companion ($640):
  Doly ($300) + Petoi Bittle ($340)
  = Desktop friend + Floor patrol

Full Setup (~$1,500):
  + ESP32-S3-BOX-3 × 3 ($135) - Voice terminals
  + SenseCAP Watcher ($80) - Vision AI
  + mmWave × 2 ($60) - Presence
  + RPi 5 ($150) - Brain
```

## Why This Works

1. **Modularity** - Each robot has one job, does it well
2. **Repairability** - Open source = fix yourself, upgrade parts
3. **Community** - Active development, shared behaviors
4. **Privacy** - Local processing, no cloud dependency
5. **Cost** - 5-10x cheaper than commercial equivalents
