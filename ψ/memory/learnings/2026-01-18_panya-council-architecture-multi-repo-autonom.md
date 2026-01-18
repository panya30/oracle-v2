---
title: ## Panya Council Architecture - Multi-Repo Autonomous Development
tags: [panya, architecture, multi-repo, ralph-loop, autonomous, fm-hvac, agent-hub]
created: 2026-01-18
source: Robin + Human architecture discussion 2026-01-18
---

# ## Panya Council Architecture - Multi-Repo Autonomous Development

## Panya Council Architecture - Multi-Repo Autonomous Development

**Key Decision**: Separate Agent Hub (X/) from App Repos (fm-hvac/, etc.)

### Why?
- Clean separation: Agent logic ≠ App code
- Panya "visits" app repos to work, returns to hub to reflect
- Memory (ψ/) stays in hub, shared across all projects
- Each app has own CI/CD, can deploy independently

### Panya Council Members
- ATHENA (Director) - coordinates, prioritizes
- HEPHAESTUS (Dev) - writes code
- ARGUS (Test) - QA, reviews
- HERMES (Ops) - deploys, monitors
- AEGIS (Security) - vulnerabilities
- APOLLO (Product) - user feedback
- PLUTUS (Business) - requirements, costs

### Ralph Loop
Self-referential iteration until complete:
```bash
/ralph-loop "Build feature" --completion-promise 'DONE' --max-iterations 30
```

### Full doc: ψ/memory/learnings/2026-01-18_panya-council-architecture-multi-repo-autonomous-dev.md

---
*Added via Oracle Learn*
