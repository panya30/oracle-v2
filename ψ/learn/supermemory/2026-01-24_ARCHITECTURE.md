# Supermemory Architecture Discovery Report

## Overview
**Supermemory** is an AI-powered personal knowledge/memory management system. It's a **Turbo monorepo** built with TypeScript, featuring multiple client applications and reusable packages serving a distributed architecture.

---

## Directory Tree Overview

```
supermemory/
├── apps/                          # Client applications
│   ├── web/                       # Next.js web application (primary UI)
│   ├── browser-extension/         # Chrome/Edge browser extension (WXT)
│   ├── mcp/                       # Model Context Protocol server (Cloudflare Workers)
│   ├── raycast-extension/         # Raycast extension
│   ├── memory-graph-playground/   # Interactive graph visualization demo
│   └── docs/                      # Documentation site
│
├── packages/                      # Shared libraries & SDKs
│   ├── ai-sdk/                    # AI SDK tools for integrating Supermemory with AI models
│   ├── tools/                     # Memory tools for AI SDK, OpenAI, Claude
│   ├── memory-graph/              # Interactive graph visualization component (React)
│   ├── lib/                       # Shared library code (AI SDK integrations)
│   ├── ui/                        # Reusable UI components & patterns
│   ├── hooks/                     # Shared React hooks
│   ├── validation/                # Schema validation utilities
│   ├── openai-sdk-python/         # Python SDK for OpenAI integration
│   ├── pipecat-sdk-python/        # Python SDK for Pipecat (voice AI)
│   └── docs-test/                 # Documentation testing
│
├── package.json                   # Root monorepo config (Bun/Turbo)
├── turbo.json                     # Turbo build pipeline configuration
└── biome.json                     # Code linting & formatting config
```

---

## Entry Points

### Web Application (`apps/web/`)
- **Framework**: Next.js 16 (React 19.2)
- **Entry**: `apps/web/app/layout.tsx` (root layout)
- **Key Routes**:
  - `(auth)/login/` - Authentication
  - `(navigation)/` - Main app with chat/memories
  - `new/` - New memory creation
  - `onboarding/` - User onboarding flow
  - `api/` - API routes for server-side operations

### MCP Server (`apps/mcp/`)
- **Framework**: Cloudflare Workers (Hono)
- **Entry**: `apps/mcp/src/index.ts`
- **Protocol**: Model Context Protocol v1.25.2
- **Bindings**: Durable Objects, OAuth, Hyperdrive (DB)

### Browser Extension (`apps/browser-extension/`)
- **Framework**: WXT (Wxt dev framework)
- **Targets**: Chrome, Firefox, Edge
- **Entry Points**: Content scripts, popups, background services

---

## Core Modules & Abstractions

### 1. Memory Management System
- **Supermemory Client SDK** (`packages/tools/`)
  - `searchMemories()` - Semantic search with container tags
  - `addMemory()` - Add new memories with metadata
  - `updateMemory()` - Update existing memories
  - `deleteMemory()` - Remove memories

### 2. Visualization Layer
- **Memory Graph Component** (`packages/memory-graph/`)
  - D3-Force physics simulation
  - WebGL canvas for rendering
  - Node detail panel
  - Interactive legend

### 3. State Management (`apps/web/stores/`)
- `chat.ts` - Chat state (Zustand)
- `quick-note-draft.ts` - Temporary note storage
- `highlights.ts` - Text highlights storage
- `indexeddb-storage.ts` - Local IndexedDB persistence

### 4. Data Fetching & Sync (`apps/web/hooks/`)
- React Query for server state
- Optimistic updates with rollback
- Infinite scroll pagination

---

## Key Dependencies

### Runtime & Build
- **Bun** (1.2.17) - Package manager & runtime
- **Turbo** (2.5.4) - Monorepo orchestration
- **TypeScript** (5.8.3) - Type system
- **Biome** (2.2.0) - Linting & formatting

### Web Framework & UI
- **Next.js** (16.0.9) - React framework with SSR/SSG
- **React** (19.2.2) - UI library
- **Radix UI** (^1.x) - Headless UI components
- **Tailwind CSS** (4.1.11) - Utility CSS framework

### Data & State
- **TanStack React Query** (5.90) - Server state management
- **Zustand** (5.0.7) - Client state management
- **Drizzle ORM** (0.44) - Database ORM
- **Zod** (3.25) - Schema validation

### AI & ML Integration
- **Vercel AI SDK** (5.0+ & 6.0+) - Unified AI interface
- **@modelcontextprotocol/sdk** (1.25) - MCP specification

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌────────────────┐  ┌─────────────┐         │
│  │   Web App    │  │ Browser Ext    │  │  Raycast    │         │
│  │  (Next.js)   │  │  (WXT)         │  │  Extension  │         │
│  └──────┬───────┘  └────────┬───────┘  └──────┬──────┘         │
│         └───────────────────┼──────────────────┘                 │
│                    ┌────────▼─────────┐                         │
│                    │  Memory Graph    │                         │
│                    │  Visualization   │                         │
│                    └────────┬─────────┘                         │
└─────────────────────────────┼──────────────────────────────────┘
                              │
                ┌─────────────▼──────────────┐
                │     API Layer (Hono)       │
                │  Backend: Cloudflare       │
                └─────────────┬──────────────┘
                              │
                ┌─────────────▼──────────────┐
                │   MCP Server               │
                │  Model Context Protocol    │
                └────────────┬───────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   ┌────▼─────┐         ┌────▼─────┐         ┌───▼────┐
   │  Postgres │         │ Cloudflare│         │   AI   │
   │  Database │         │   KV/D.O. │         │ Models │
   └──────────┘         └───────────┘         └────────┘
```

---

## Technology Stack Summary

| Category | Technology |
|----------|-----------|
| **Language** | TypeScript |
| **Package Manager** | Bun |
| **Monorepo** | Turbo |
| **Frontend** | React 19, Next.js 16 |
| **UI** | Radix UI, Tailwind CSS |
| **State** | Zustand, React Query |
| **Backend** | Hono (Cloudflare Workers) |
| **Database** | Postgres + Drizzle ORM |
| **Auth** | Better Auth |
| **Search** | Vector embeddings (Cloudflare AI) |
| **Visualization** | D3, Canvas, WebGL |
| **AI Integration** | Vercel AI SDK, MCP |
