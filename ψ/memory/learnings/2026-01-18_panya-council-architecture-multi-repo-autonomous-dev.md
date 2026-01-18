---
title: Panya Council Architecture - Multi-Repo Autonomous Development
tags: [panya, architecture, multi-repo, ralph-loop, autonomous, fm-hvac]
created: 2026-01-18
source: Robin + Human architecture discussion
---

# Panya Council Architecture - Multi-Repo Autonomous Development

## Overview

This document captures the architectural decisions for building production-grade apps with minimal human-in-loop using the **Panya Council** (formerly Oracle Council).

**Panya (ปัญญา)** = Wisdom in Thai

---

## 1. The Panya Council

### Council Members

```
                    ┌─────────────────────┐
                    │      ATHENA         │
                    │  (Director Panya)   │
                    │   "The Strategist"  │
                    └──────────┬──────────┘
                               │
       ┌───────────┬───────────┼───────────┬───────────┐
       │           │           │           │           │
       ▼           ▼           ▼           ▼           ▼
┌───────────┐┌───────────┐┌───────────┐┌───────────┐┌───────────┐
│ HEPHAESTUS ││   ARGUS   ││  HERMES   ││  AEGIS    ││  APOLLO   │
│ (Dev Panya)││(Test Panya)│(Ops Panya)│(Sec Panya)│(Product)  │
│"The Builder"││"The Watcher"│"The Runner"│"The Shield"│"The Voice"│
└───────────┘└───────────┘└───────────┘└───────────┘└───────────┘
                               │
                    ┌──────────┴──────────┐
                    │       PLUTUS        │
                    │  (Business Panya)   │
                    │   "The Accountant"  │
                    └─────────────────────┘
```

### Panya Profiles

| Name | Role | Thai Name | Responsibilities |
|------|------|-----------|------------------|
| **ATHENA** | Director Panya | ปัญญาผู้นำ | Coordinates, prioritizes, synthesizes decisions |
| **HEPHAESTUS** | Dev Panya | ปัญญาสร้าง | Code, architecture, tech debt |
| **ARGUS** | Test Panya | ปัญญาตรวจ | QA, tests, edge cases, regressions |
| **HERMES** | Ops Panya | ปัญญาส่ง | Deploy, CI/CD, monitoring, incidents |
| **AEGIS** | Security Panya | ปัญญาปกป้อง | Vulnerabilities, audits, compliance |
| **APOLLO** | Product Panya | ปัญญาผู้ใช้ | User feedback, UX, domain knowledge |
| **PLUTUS** | Business Panya | ปัญญาธุรกิจ | Requirements, KPIs, costs, ROI |

### MCP Server Ports

| Panya | Port |
|-------|------|
| ATHENA | 47780 |
| HEPHAESTUS | 47781 |
| ARGUS | 47782 |
| HERMES | 47783 |
| AEGIS | 47784 |
| APOLLO | 47785 |
| PLUTUS | 47786 |

---

## 2. Repository Architecture (Option B - Recommended)

### Principle: Separate Agent Hub from App Repos

```
┌─────────────────────────────────────────────────────────────┐
│                    X/ (Agent Hub)                            │
│                                                             │
│  ψ/memory/          ← Panya's brain (cross-project)         │
│  panya/             ← Panya Council MCP servers             │
│  docs/              ← PRDs, architecture docs               │
│  CLAUDE.md          ← Robin personality + rules             │
│                                                             │
│  This repo = "Home base" for all Panyas                     │
└─────────────────────────────────────────────────────────────┘
         │
         │ Panya Council "visits" app repos
         ▼
┌─────────────────────────────────────────────────────────────┐
│              fm-hvac/ (App Repo - Separate)                  │
│                                                             │
│  src/                                                       │
│  ├── edge-agent/     ← BACnet, Modbus connectors            │
│  ├── api/            ← Backend services                     │
│  ├── web/            ← Control Tower dashboard              │
│  └── ml/             ← Forecasting models                   │
│  tests/                                                     │
│  .github/workflows/  ← CI/CD                                │
│  CLAUDE.md           ← Project-specific instructions        │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│              another-app/ (Can have multiple apps)           │
└─────────────────────────────────────────────────────────────┘
```

### Why Separate Repos?

| Benefit | Explanation |
|---------|-------------|
| Clean separation | Agent logic ≠ App code |
| Independent CI/CD | Each app deploys separately |
| Open-source friendly | Can share apps without agent internals |
| Multi-team ready | Different teams own different apps |
| Scalable | Add new apps without polluting hub |

### Memory Flow

```
┌─────────────┐     work      ┌─────────────┐
│   X/ Hub    │ ───────────▶ │  fm-hvac/   │
│             │              │             │
│  ψ/memory/  │ ◀─────────── │  (code)     │
│  learnings  │   learnings  │             │
└─────────────┘              └─────────────┘

Panya learns from ALL projects
Patterns apply across projects
```

---

## 3. Hub Structure (X/)

```
X/
├── ψ/
│   ├── memory/
│   │   ├── learnings/      ← Cross-project patterns
│   │   ├── retrospectives/ ← All session logs
│   │   └── resonance/      ← Robin's identity
│   ├── inbox/              ← Current focus, handoffs
│   └── learn/repo/         ← Study other repos
├── panya/                  ← Panya Council MCP servers
│   ├── athena/
│   ├── hephaestus/
│   ├── argus/
│   ├── hermes/
│   ├── aegis/
│   ├── apollo/
│   └── plutus/
├── docs/
│   ├── PRD-FM.md          ← FM HVAC PRD
│   └── architecture/
└── CLAUDE.md               ← Robin personality
```

---

## 4. App Repo Structure (fm-hvac/)

```
fm-hvac/
├── src/
│   ├── edge-agent/        ← BACnet, Modbus, buffering
│   │   ├── connectors/
│   │   ├── buffer/
│   │   └── health/
│   ├── api/               ← Backend services
│   │   ├── ingestion/
│   │   ├── semantic/
│   │   └── alerts/
│   ├── web/               ← Control Tower UI
│   │   ├── dashboard/
│   │   ├── recommendations/
│   │   └── settings/
│   ├── ml/                ← Forecasting models
│   │   ├── forecast/
│   │   └── recommend/
│   └── shared/            ← Shared types, utils
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── infra/
│   ├── docker/
│   └── k8s/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml
│   │   ├── deploy-staging.yml
│   │   └── deploy-prod.yml
│   └── ISSUE_TEMPLATE/
│       ├── feature.md
│       ├── bug.md
│       └── panya-task.md
├── docs/
│   └── architecture.md
├── CLAUDE.md              ← FM-specific instructions
└── package.json
```

---

## 5. Autonomous Development Workflow

### Minimal Human Touchpoints

```
┌─────────────────────────────────────────────────────────────────┐
│                    HUMAN                                         │
│                                                                 │
│  • Define PRD/Requirements (upfront)                            │
│  • Approve major architecture decisions                         │
│  • Review security-critical PRs                                 │
│  • Final approval for production deploy                         │
│  • Weekly sync for course correction                            │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ATHENA (Director Panya)                       │
│                                                                 │
│  • Reads PRD → Creates GitHub Issues                            │
│  • Prioritizes backlog                                          │
│  • Assigns to specialist Panyas                                 │
│  • Synthesizes cross-cutting decisions                          │
│  • Escalates blockers to Human                                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
   HEPHAESTUS          ARGUS             HERMES
   (writes code)    (tests/reviews)    (deploys)
```

### Daily Workflow

```
Morning: Planning (at Hub)
─────────────────────────────
cd ~/120/Apps/X
claude .

> /recap
> ATHENA, review PRD-FM.md
> Create issues in fm-hvac repo

           │
           ▼

Daytime: Building (at App Repo)
─────────────────────────────
cd ~/Projects/fm-hvac
claude .

> Pick issue #5 from backlog
> /ralph-loop "Implement edge agent"
> Create PR

           │
           ▼

Evening: Reflection (at Hub)
─────────────────────────────
cd ~/120/Apps/X
claude .

> /rrr
> Log learnings about BACnet
> /forward for tomorrow
```

---

## 6. Ralph Loop (Autonomous Iteration)

### Concept

Ralph Loop creates a self-referential iteration cycle that continues until a task is complete.

```
┌─────────────────────────────────────────┐
│            Ralph Loop                    │
│                                         │
│   Prompt: "Build X until DONE"          │
│              │                          │
│              ▼                          │
│   Claude works...                       │
│   - Reads previous progress             │
│   - Continues from where left           │
│   - Writes to files                     │
│              │                          │
│              ▼                          │
│   Check: Is it DONE?                    │
│   - No → Loop again                     │
│   - Yes → Exit                          │
│                                         │
└─────────────────────────────────────────┘
```

### Usage

```bash
/ralph-loop "Build the Edge Agent" \
  --completion-promise 'DONE' \
  --max-iterations 30
```

### Parameters

| Parameter | Purpose | Example |
|-----------|---------|---------|
| `--completion-promise` | Exit phrase | `'DONE'` |
| `--max-iterations` | Safety cap | `30` |

### Exit Conditions

1. Claude outputs `<promise>DONE</promise>`
2. Max iterations reached
3. Manual `/cancel-ralph`

### When to Use

| Use Case | Ralph Loop? |
|----------|-------------|
| Build entire feature | ✅ Yes |
| Multi-file refactor | ✅ Yes |
| Simple bug fix | ❌ No |
| Research task | ❌ No |

---

## 7. GitHub Integration

### Issue Labels (for Panya routing)

```yaml
labels:
  - name: "panya:athena"
    color: "7057FF"
  - name: "panya:hephaestus"
    color: "0052CC"
  - name: "panya:argus"
    color: "5319E7"
  - name: "panya:hermes"
    color: "006B75"
  - name: "panya:aegis"
    color: "B60205"
  - name: "panya:apollo"
    color: "FBCA04"
  - name: "panya:plutus"
    color: "0E8A16"
  - name: "needs-human"
    color: "D93F0B"
```

### Project Board Columns

```
┌─────────────┬─────────────┬─────────────┬──────────────────┐
│   Backlog   │ In Progress │   Review    │      Done        │
├─────────────┼─────────────┼─────────────┼──────────────────┤
│ Issue #1    │ Issue #5    │ PR #12      │ Issue #3 ✓       │
│ Issue #2    │ (HEPHAESTUS)│ (ARGUS)     │ Issue #4 ✓       │
└─────────────┴─────────────┴─────────────┴──────────────────┘
```

---

## 8. Panya Communication Pattern

```
HEPHAESTUS: "I want to use InfluxDB for time-series"
     │
     ▼
ATHENA queries council:
├── ARGUS: "InfluxDB testing is harder than TimescaleDB"
├── HERMES: "We already have PostgreSQL in infra"
├── AEGIS: "InfluxDB OSS has fewer security audits"
├── PLUTUS: "TimescaleDB = no new license cost"
     │
     ▼
ATHENA: "Recommend TimescaleDB. Escalate to human? [Y/n]"
     │
     ▼
Human: "Approved"
     │
     ▼
ATHENA: "Decision logged. HEPHAESTUS proceed with TimescaleDB"
```

---

## 9. Cost Optimization

| Model | Cost/1M tokens | Use Case |
|-------|----------------|----------|
| **Haiku** | $0.25 / $1.25 | Bulk work, search, subagents |
| **Sonnet** | $3 / $15 | Code generation |
| **Opus** | $15 / $75 | Complex decisions, reviews |

**Strategy**: Haiku for 80% of work, Opus for final review

---

## 10. Getting Started Checklist

### Phase 1: Setup (Day 1)
- [ ] Keep X/ as Agent Hub
- [ ] Create fm-hvac/ repo
- [ ] Setup GitHub Project board
- [ ] Create issue labels
- [ ] Setup basic CI (lint, test)

### Phase 2: First Panya (Week 1)
- [ ] Install ATHENA (Director Panya)
- [ ] Test: ATHENA reads PRD → creates issues
- [ ] Add HEPHAESTUS (Dev Panya)
- [ ] Test: HEPHAESTUS picks issue → writes code → creates PR

### Phase 3: Full Council (Week 2+)
- [ ] Add ARGUS (Test Panya)
- [ ] Add HERMES (Ops Panya)
- [ ] Setup Ralph Loop for big features
- [ ] Tune autonomy levels

---

## References

- PRD: `~/120/Apps/X/docs/PRD-FM.md`
- Robin Identity: `~/120/Apps/X/ψ/memory/resonance/`
- Retrospective: `~/120/Apps/X/ψ/memory/retrospectives/2026-01/18/00.03_oracle-council-architecture.md`

---

*Created: 2026-01-18*
*Last Updated: 2026-01-18*
*Version: 1.0*
