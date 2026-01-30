# Supermemory Learning Index

> AI second brain platform - persistent memory management for AI assistants

## Latest Exploration

**Date**: 2026-01-24
**Source**: https://github.com/supermemoryai/supermemory.git
**Agents**: 3 parallel Haiku explorers

## Files

- [[2026-01-24_ARCHITECTURE|Architecture]] - Turbo monorepo structure, entry points, core modules
- [[2026-01-24_CODE-SNIPPETS|Code Snippets]] - Key patterns: similarity engine, optimistic updates, WebGL
- [[2026-01-24_QUICK-REFERENCE|Quick Reference]] - Installation, usage examples, API

## Key Insights

### Architecture
- **Turbo monorepo** with Bun package manager
- **Next.js 16** + **React 19** web app
- **Cloudflare Workers** for MCP server (Hono framework)
- **WXT** browser extension (Chrome, Firefox, Edge)

### Tech Stack
| Layer | Technology |
|-------|------------|
| Frontend | React 19, Next.js 16, Radix UI, Tailwind CSS 4 |
| State | Zustand, React Query |
| Backend | Hono on Cloudflare Workers |
| Database | Postgres + Drizzle ORM |
| Search | Vector embeddings (Cloudflare AI) |
| Visualization | D3, Canvas, WebGL |

### Notable Patterns
1. **Hybrid Search** - FTS5 keywords + vector similarity
2. **Optimistic Updates** - React Query with rollback
3. **Singleton WebGL** - Glass effect manager
4. **Force-Directed Graph** - Concentric ring layout with collision avoidance
5. **AI SDK Tool Factory** - Composable tool creation

### Integration Points
- **MCP Server** - Model Context Protocol for Claude/Cursor
- **AI SDK Tools** - `@supermemory/tools` for Vercel AI SDK
- **Browser Extension** - Save from any webpage
- **Raycast** - Quick memory add/search

## Quick Start

```bash
# SDK
bun add supermemory

# MCP (Claude/Cursor)
npx -y install-mcp@latest https://mcp.supermemory.ai/mcp --client claude --oauth=yes
```

## Links

- Web: [app.supermemory.ai](https://app.supermemory.ai)
- Docs: [docs.supermemory.ai](https://docs.supermemory.ai)
- Discord: [supermemory.link/discord](https://supermemory.link/discord)

---

*Explored by Robin Oracle's Learn System*
