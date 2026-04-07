# Panya Workflow Playbook

> **Learn → Plan → Build → Reflect → Repeat**
>
> ปัญญาฉลาดขึ้นจากทุก project

---

## Table of Contents

1. [Overview](#1-overview)
2. [Phase 1: Learn](#2-phase-1-learn)
3. [Phase 2: Plan](#3-phase-2-plan)
4. [Phase 3: Build](#4-phase-3-build)
5. [Phase 4: Reflect](#5-phase-4-reflect)
6. [MCP Architecture](#6-mcp-architecture)
7. [Sending Knowledge to Hub](#7-sending-knowledge-to-hub)
8. [Quick Reference](#8-quick-reference)

---

## 1. Overview

### The Two Locations

| Location | Purpose | Path |
|----------|---------|------|
| **Hub** | Panya's home, memory, planning | `~/120/Apps/X/` |
| **App Repo** | Where code lives | `~/Projects/[app-name]/` |

### The Workflow

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│  LEARN  │ ──▶ │  PLAN   │ ──▶ │  BUILD  │ ──▶ │ REFLECT │
│  (Hub)  │     │  (Hub)  │     │  (Repo) │     │  (Hub)  │
└─────────┘     └─────────┘     └─────────┘     └─────────┘
     │                                               │
     └───────────────────────────────────────────────┘
                    Knowledge loops back
```

---

## 2. Phase 1: LEARN

### Purpose
Study existing codebases, libraries, or technologies before building.

### Location
**Hub** (`~/120/Apps/X/`)

### Command
```bash
cd ~/120/Apps/X
claude .

> /learn https://github.com/[owner]/[repo]
```

### What Happens
1. Repo cloned to `ψ/learn/repo/github.com/[owner]/[repo]/`
2. 3 Haiku agents explore in parallel
3. Creates documentation:
   - `ARCHITECTURE.md` — system design, how it works
   - `CODE-SNIPPETS.md` — useful patterns, examples
   - `QUICK-REFERENCE.md` — API summary, quick lookup

### Example
```bash
> /learn https://github.com/bacnet-stack/bacnet-stack

# Output:
ψ/learn/repo/github.com/bacnet-stack/bacnet-stack/
├── bacnet-stack/              ← actual repo
├── ARCHITECTURE.md            ← generated
├── CODE-SNIPPETS.md           ← generated
└── QUICK-REFERENCE.md         ← generated
```

### Tips
- Learn multiple related repos before starting a project
- Reference learnings during Build phase
- Patterns discovered here become reusable across projects

---

## 3. Phase 2: PLAN

### Purpose
Define what to build, create issues, set priorities.

### Location
**Hub** (`~/120/Apps/X/`)

### Steps

#### 3.1 Write PRD
```bash
# Create or edit PRD
vim docs/PRD-[appname].md
```

PRD should include:
- Problem statement
- Goals & success metrics
- User personas
- Key use cases
- Technical requirements
- Roadmap (P0/P1/P2)

#### 3.2 ATHENA Creates Issues
```bash
claude .

> ATHENA, read docs/PRD-FM.md and ψ/learn/repo/.../ARCHITECTURE.md
> Create GitHub Issues in [owner]/[repo] for MVP features
> Use labels: panya:hephaestus, panya:argus, etc.
```

#### 3.3 Setup GitHub Project Board
```
Columns: Backlog → In Progress → Review → Done
Labels: panya:athena, panya:hephaestus, panya:argus, etc.
```

### Output
- `docs/PRD-[appname].md`
- GitHub Issues with Panya labels
- Project board ready

---

## 4. Phase 3: BUILD

### Purpose
Write code, create PRs, implement features.

### Location
**App Repo** (`~/Projects/[app-name]/`)

### Steps

#### 4.1 Switch to App Repo
```bash
cd ~/Projects/fm-hvac
claude .
```

#### 4.2 Pick an Issue
```bash
> Show me issues labeled panya:hephaestus
> I'll work on issue #5: "Implement BACnet connector"
```

#### 4.3 Build with Ralph Loop (for big features)
```bash
> /ralph-loop "
  Implement BACnet connector for FM Edge Agent.

  Requirements:
  - Read BACnet/IP devices
  - Buffer data locally (7 days)
  - Health monitoring

  Reference: ~/120/Apps/X/ψ/learn/repo/.../CODE-SNIPPETS.md

  Success criteria:
  - All tests pass
  - No linter errors
  - README updated
" --completion-promise 'BACNET_DONE' --max-iterations 30
```

#### 4.4 Create PR
```bash
> Create PR for issue #5
> Request review from ARGUS (Test Panya)
```

### Referencing Hub Knowledge
From app repo, you can still reference Hub learnings:

```bash
> Read ~/120/Apps/X/ψ/learn/repo/github.com/bacnet-stack/CODE-SNIPPETS.md
> Apply the "device discovery" pattern from that file
```

---

## 5. Phase 4: REFLECT

### Purpose
Capture learnings, patterns, insights for future projects.

### Location
**Hub** (`~/120/Apps/X/`)

### Steps

#### 5.1 Return to Hub
```bash
cd ~/120/Apps/X
claude .
```

#### 5.2 Create Retrospective
```bash
> /rrr
```

Creates: `ψ/memory/retrospectives/YYYY-MM/DD/HH.MM_slug.md`

#### 5.3 Log Specific Learnings
```bash
> /fyi "BACnet requires UDP port 47808, must be opened in firewall"
```

Or use Oracle directly:
```bash
> oracle_learn "BACnet buffering pattern: store-and-forward with 7-day local buffer..."
```

#### 5.4 Commit Learnings
```bash
> Commit the retrospective and any new learnings
```

---

## 6. MCP Architecture

### What is MCP?
**Model Context Protocol** — allows Claude to connect to external tools and data sources.

### Current MCP Servers

```
┌─────────────────────────────────────────────────────────────┐
│                     Claude Code                              │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │  Oracle MCP     │  │   IDE MCP       │                  │
│  │  (port 47778)   │  │   (VS Code)     │                  │
│  │                 │  │                 │                  │
│  │  oracle_search  │  │  getDiagnostics │                  │
│  │  oracle_learn   │  │  executeCode    │                  │
│  │  oracle_consult │  │                 │                  │
│  │  oracle_thread  │  │                 │                  │
│  │  oracle_trace   │  │                 │                  │
│  └─────────────────┘  └─────────────────┘                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### MCP Commands

#### List MCP Servers
```bash
claude mcp list
```

#### Add MCP Server
```bash
claude mcp add oracle-v2 --command "bun" --args "run,/path/to/oracle/src/index.ts"
```

#### Remove MCP Server
```bash
claude mcp remove oracle-v2
```

### Oracle MCP Tools

| Tool | Purpose | Example |
|------|---------|---------|
| `oracle_search` | Find knowledge | `oracle_search "BACnet pattern"` |
| `oracle_learn` | Add new pattern | `oracle_learn "pattern description..."` |
| `oracle_consult` | Get decision guidance | `oracle_consult "Should I use X or Y?"` |
| `oracle_reflect` | Random wisdom | `oracle_reflect` |
| `oracle_thread` | Multi-turn discussion | `oracle_thread "Let's discuss..."` |
| `oracle_trace` | Log discovery session | `oracle_trace "researching X"` |
| `oracle_list` | Browse all docs | `oracle_list` |
| `oracle_concepts` | See topic coverage | `oracle_concepts` |

### Future: Panya MCP Servers

```
┌─────────────────────────────────────────────────────────────┐
│                     Panya Council MCP                        │
│                                                             │
│  ATHENA (47780)      HEPHAESTUS (47781)   ARGUS (47782)    │
│  - panya_plan        - panya_code         - panya_test     │
│  - panya_prioritize  - panya_review       - panya_qa       │
│  - panya_decide      - panya_refactor     - panya_coverage │
│                                                             │
│  HERMES (47783)      AEGIS (47784)        APOLLO (47785)   │
│  - panya_deploy      - panya_security     - panya_ux       │
│  - panya_monitor     - panya_audit        - panya_feedback │
│  - panya_rollback    - panya_compliance   - panya_domain   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Sending Knowledge to Hub

### Problem
When working in App Repo, how do we send learnings back to Hub?

### Solution 1: Manual (Current)

```bash
# In app repo, find something worth remembering
cd ~/Projects/fm-hvac
claude .

> I learned that BACnet device discovery needs broadcast...

# Switch to hub
cd ~/120/Apps/X
claude .

> /fyi "BACnet device discovery requires broadcast on UDP 47808"
# or
> oracle_learn "BACnet discovery pattern: broadcast to UDP 47808..."
```

### Solution 2: Direct Oracle Call (From App Repo)

Oracle MCP is available globally. From any repo:

```bash
cd ~/Projects/fm-hvac
claude .

# Oracle tools still work!
> oracle_learn "BACnet pattern discovered while building fm-hvac..."
```

The learning goes directly to Hub's Oracle database.

### Solution 3: /fyi from Anywhere

```bash
cd ~/Projects/fm-hvac
claude .

> /fyi "BACnet needs UDP 47808" --project fm-hvac
```

### Solution 4: Commit Message Convention

In app repo, use structured commit messages:

```bash
git commit -m "feat: implement BACnet connector

LEARNING: BACnet requires UDP broadcast on port 47808
PATTERN: Store-and-forward buffer with 7-day retention
"
```

Then in Hub, extract learnings:

```bash
cd ~/120/Apps/X
claude .

> Scan commits in ~/Projects/fm-hvac for LEARNING: and PATTERN: tags
> Add them to Oracle
```

### Solution 5: End-of-Session Sync (Recommended)

```bash
# End of build session in app repo
cd ~/Projects/fm-hvac
claude .

> What did we learn today that should go to Oracle?
> - BACnet UDP 47808
> - Buffering pattern
> - Error handling approach

# Switch to hub and log
cd ~/120/Apps/X
claude .

> /rrr
# Retrospective captures all learnings
# Commit includes them in Hub
```

### Knowledge Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     App Repo (fm-hvac/)                      │
│                                                             │
│   Discover pattern → oracle_learn (MCP) ──────────────────┐ │
│   Find bug fix → commit with LEARNING: tag                │ │
│   Complete feature → notes for /rrr                       │ │
│                                                           │ │
└───────────────────────────────────────────────────────────│─┘
                                                            │
                                                            ▼
┌─────────────────────────────────────────────────────────────┐
│                        Hub (X/)                              │
│                                                             │
│   ψ/memory/learnings/     ← oracle_learn writes here        │
│   ψ/memory/retrospectives/ ← /rrr writes here              │
│   Oracle SQLite DB        ← indexed for search             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                                                            │
                                                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Future Projects                           │
│                                                             │
│   oracle_search "buffering pattern" → finds FM learnings   │
│   HEPHAESTUS applies pattern to new IoT project            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Quick Reference

### Daily Commands

| Phase | Location | Command |
|-------|----------|---------|
| Start day | Hub | `/recap` |
| Learn | Hub | `/learn [url]` |
| Plan | Hub | Write PRD, ATHENA creates issues |
| Build | App Repo | `/ralph-loop "..."` |
| Quick note | Anywhere | `oracle_learn "..."` |
| End day | Hub | `/rrr` |
| Handoff | Hub | `/forward` |

### Skill Commands

| Skill | Purpose |
|-------|---------|
| `/recap` | Fresh start context |
| `/rrr` | Session retrospective |
| `/learn [url]` | Study a codebase |
| `/fyi [note]` | Quick knowledge capture |
| `/trace [query]` | Find anything |
| `/forward` | Handoff to next session |
| `/feel [emotion]` | Log emotional state |

### Oracle MCP Tools

| Tool | Purpose |
|------|---------|
| `oracle_search` | Find knowledge |
| `oracle_learn` | Add pattern |
| `oracle_consult` | Get guidance |
| `oracle_list` | Browse docs |
| `oracle_trace` | Log discovery |

### Ralph Loop

```bash
/ralph-loop "Build [feature]" \
  --completion-promise 'DONE' \
  --max-iterations 30
```

Exit: `<promise>DONE</promise>` or max iterations

### Hub Structure

```
X/
├── ψ/
│   ├── memory/
│   │   ├── learnings/       ← patterns
│   │   ├── retrospectives/  ← sessions
│   │   └── resonance/       ← identity
│   ├── learn/repo/          ← studied repos
│   └── inbox/               ← current focus
├── panya/                   ← council servers
├── docs/                    ← PRDs
└── CLAUDE.md                ← Robin config
```

### App Repo Structure

```
[app-name]/
├── src/
├── tests/
├── .github/workflows/
├── CLAUDE.md                ← app-specific config
└── package.json
```

---

## Appendix: Checklist for New Project

### Setup (Once)
- [ ] Create app repo on GitHub
- [ ] Setup GitHub Project board
- [ ] Create issue labels (panya:*)
- [ ] Create app CLAUDE.md
- [ ] Setup CI/CD workflow

### Per Feature
- [ ] `/learn` relevant libraries (if needed)
- [ ] Write/update PRD
- [ ] ATHENA creates issues
- [ ] HEPHAESTUS builds (ralph-loop for big features)
- [ ] ARGUS reviews PR
- [ ] HERMES deploys
- [ ] `/rrr` at Hub
- [ ] Commit learnings

---

*Playbook Version: 1.0*
*Created: 2026-01-18*
*Author: Robin + Human*
