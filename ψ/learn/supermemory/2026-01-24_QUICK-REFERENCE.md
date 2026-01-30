# Supermemory Quick Reference Guide

## What is Supermemory?

Supermemory is an **AI second brain platform** that enables persistent memory management for AI assistants and applications. It stores conversations, documents, and extracted knowledge, making this information retrievable and actionable across sessions.

The platform works as a unified memory layer that integrates with major AI tools (Claude, ChatGPT, Cursor) through multiple interfaces: web app, browser extensions, Raycast integration, MCP servers, and direct API/SDK access.

---

## Key Features

- **Multi-Source Memory Input**: URLs, PDFs, plain text, Google Drive, Notion, OneDrive
- **Semantic Search**: Hybrid search across memories and document chunks
- **User Profiles**: Auto-generated profiles with static facts and dynamic context
- **MCP Integration**: Connect to Claude, Cursor, Windsurf via Model Context Protocol
- **Browser Extension**: Save from any webpage; ChatGPT, Claude, X integrations
- **Raycast Extension**: Quick memory add and search
- **Automatic Content Processing**: AI summarization, tagging, embedding generation
- **Project Scoping**: Organize memories by project with containerTag system
- **Chat Interface**: Converse with your stored memories naturally

---

## Installation

### SDK (Node.js/JavaScript)

```bash
npm install supermemory
# or
bun add supermemory
```

### MCP Integration (Claude, Cursor)

```bash
npx -y install-mcp@latest https://mcp.supermemory.ai/mcp --client claude --oauth=yes
```

### Browser Extension

Install from [Chrome Web Store](https://chromewebstore.google.com/detail/supermemory/afpgkkipfdpeaflnpoaffkcankadgjfc)

### Raycast Extension

Install from [Raycast Store](https://www.raycast.com/supermemory/supermemory)

---

## Usage Examples

### Search Memories

```typescript
import Supermemory from 'supermemory'

const client = new Supermemory()

const results = await client.search({
  q: "your search query",
  containerTag: "user-id",
  searchMode: 'hybrid',
  limit: 5
})
```

### Add Memory

```typescript
await client.memories.add({
  content: "User prefers dark mode and TypeScript",
  containerTag: "user-id",
  metadata: { type: "preference" }
})
```

### Get User Profile

```typescript
const { profile, searchResults } = await client.profile({
  containerTag: "user-id",
  q: "user preferences"
})
// profile.static = stable facts (name, location)
// profile.dynamic = recent context (projects, interests)
```

### Vercel AI SDK Integration

```typescript
import { streamText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { supermemoryTools } from '@supermemory/tools/ai-sdk'

const result = await streamText({
  model: anthropic('claude-3-5-sonnet-20241022'),
  prompt: userMessage,
  tools: supermemoryTools(process.env.SUPERMEMORY_API_KEY, {
    containerTags: [userId]
  })
})
```

### AI SDK Middleware (Auto Context)

```typescript
import { withSupermemory } from '@supermemory/tools/ai-sdk'
import { openai } from '@ai-sdk/openai'

const modelWithMemory = withSupermemory(openai('gpt-4'), 'user-123', {
  mode: 'full',
  addMemory: 'always',
})
```

---

## Configuration

### Container Tag Strategy

| Use Case | Configuration |
|----------|---|
| Single User | `containerTag: userId` |
| Organizations | `containerTag: orgId` |
| User + Org | `containerTag: "${userId}-${orgId}"` |

### Search Modes

- **`hybrid`** (Recommended) - Searches memories + original chunks
- **`memories`** - Only extracted memories

### API Settings (Required First)

```typescript
fetch('https://api.supermemory.ai/v3/settings', {
  method: 'PATCH',
  headers: { 'x-supermemory-api-key': API_KEY },
  body: JSON.stringify({
    shouldLLMFilter: true,
    filterPrompt: `This is [your app description]...`
  })
})
```

---

## Key Packages

| Package | Purpose |
|---------|---------|
| `supermemory` | Core Node.js SDK |
| `@supermemory/ai-sdk` | Vercel AI SDK utilities |
| `@supermemory/tools` | AI SDK + OpenAI integration |
| `@supermemory/memory-graph` | React visualization component |

---

## Important Links

| Resource | Link |
|----------|------|
| Web App | [app.supermemory.ai](https://app.supermemory.ai) |
| Documentation | [docs.supermemory.ai](https://docs.supermemory.ai) |
| Chrome Extension | [Chrome Web Store](https://chromewebstore.google.com/detail/supermemory/afpgkkipfdpeaflnpoaffkcankadgjfc) |
| Discord | [supermemory.link/discord](https://supermemory.link/discord) |

---

## Quick API Examples

```bash
# Add memory
curl -X POST https://api.supermemory.ai/v3/documents \
  -H "x-supermemory-api-key: $API_KEY" \
  -d '{"content": "memory", "containerTag": "userId"}'

# Search
curl -X POST https://api.supermemory.ai/v4/search \
  -H "x-supermemory-api-key: $API_KEY" \
  -d '{"q": "query", "containerTag": "userId"}'

# Get profile
curl -X POST https://api.supermemory.ai/v4/profile \
  -H "x-supermemory-api-key: $API_KEY" \
  -d '{"containerTag": "userId"}'
```

---

## Development Commands

```bash
bun run dev       # Start all apps
bun run build     # Build all packages
bun run check-types  # TypeScript check
bun run format-lint  # Biome linting
```
