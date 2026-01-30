# Supermemory Code Snippets & Patterns

## 1. Main Entry Points

### Web Application Root Layout
**File:** `apps/web/app/layout.tsx`

```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${font.variable} antialiased overflow-x-hidden`}>
        <ThemeProvider attribute="class" defaultTheme="dark">
          <AutumnProvider backendUrl={process.env.NEXT_PUBLIC_BACKEND_URL}>
            <QueryProvider>
              <AuthProvider>
                <ViewModeProvider>
                  <MobilePanelProvider>
                    <PostHogProvider>
                      <ErrorTrackingProvider>
                        <NuqsAdapter>
                          <Suspense>{children}</Suspense>
                          <Toaster />
                        </NuqsAdapter>
                      </ErrorTrackingProvider>
                    </PostHogProvider>
                  </MobilePanelProvider>
                </ViewModeProvider>
              </AuthProvider>
            </QueryProvider>
          </AutumnProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
```

### MCP Server Entry Point
**File:** `apps/mcp/src/index.ts`

```ts
const app = new Hono<{ Bindings: Bindings }>()

// OAuth Protected Resource endpoint
app.get("/.well-known/oauth-protected-resource", (c) => {
  return c.json({
    resource: "https://mcp.supermemory.ai",
    authorization_servers: [apiUrl],
    scopes_supported: ["openid", "profile", "email", "offline_access"],
  })
})

// MCP handler with dual auth (OAuth + API Key)
app.all("/mcp/*", async (c) => {
  const token = c.req.header("Authorization")?.replace(/^Bearer\s+/i, "")

  let authUser = isApiKey(token)
    ? await validateApiKey(token, apiUrl)
    : await validateOAuthToken(token, apiUrl)

  if (!authUser) return new Response("Unauthorized", { status: 401 })

  return mcpHandler.fetch(c.req.raw, c.env, ctx)
})
```

---

## 2. Semantic Similarity Engine

**File:** `packages/lib/similarity.ts`

```ts
// Optimized cosine similarity for unit vectors
export const cosineSimilarity = (vectorA: number[], vectorB: number[]): number => {
  let dotProduct = 0
  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i]
  }
  return dotProduct
}

// Similarity to visual properties mapping
export const getConnectionVisualProps = (similarity: number) => {
  const normalizedSimilarity = Math.max(0, Math.min(1, similarity))
  return {
    opacity: normalizedSimilarity,
    thickness: Math.max(1, normalizedSimilarity * 4),
    glow: normalizedSimilarity * 0.6,
    pulseDuration: 2000 + (1 - normalizedSimilarity) * 3000,
  }
}

// HSL color from similarity
export const getMagicalConnectionColor = (similarity: number, hue = 220): string => {
  const saturation = 60 + similarity * 40
  const lightness = 40 + similarity * 30
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}
```

---

## 3. React Query with Optimistic Updates

**File:** `packages/lib/queries.ts`

```ts
export const useDeleteDocument = (selectedProject: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (documentId: string) => {
      const response = await $fetch(`@delete/documents/${documentId}`)
      if (response.error) throw new Error(response.error?.message)
      return response.data
    },
    onMutate: async (documentId: string) => {
      // Cancel and snapshot
      await queryClient.cancelQueries({ queryKey: ["documents-with-memories", selectedProject] })
      const previousData = queryClient.getQueryData(["documents-with-memories", selectedProject])

      // Optimistic update
      queryClient.setQueryData(["documents-with-memories", selectedProject], (old) => ({
        ...old,
        pages: old.pages?.map((page) => ({
          ...page,
          documents: page.documents?.filter((doc) => doc.id !== documentId),
        })),
      }))

      return { previousData }
    },
    onError: (error, _documentId, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(["documents-with-memories", selectedProject], context.previousData)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["documents-with-memories", selectedProject] })
    },
  })
}
```

---

## 4. WebGL Glass Effect Manager (Singleton)

**File:** `packages/lib/glass-effect-manager.ts`

```ts
class GlassEffectManager {
  private static instance: GlassEffectManager | null = null
  private effects: Map<string, EffectInstance> = new Map()

  static getInstance(): GlassEffectManager {
    if (!GlassEffectManager.instance) {
      GlassEffectManager.instance = new GlassEffectManager()
    }
    return GlassEffectManager.instance
  }

  private setupShaders() {
    const fsSource = `
      precision mediump float;
      uniform vec2 iResolution;
      uniform float iTime;
      uniform vec2 iMouse;

      void main() {
        vec2 uv = gl_FragCoord.xy / iResolution.xy;
        vec2 distortion = vec2(
          sin(iTime * 2.0 + uv.y * 10.0) * 0.0025,
          cos(iTime * 1.5 + uv.x * 10.0) * 0.0025
        );

        vec3 glassColor = mix(
          vec3(0.1, 0.1, 0.12),
          vec3(0.16, 0.16, 0.19),
          1.0 - length(uv - vec2(0.5))
        );

        gl_FragColor = vec4(glassColor, 0.25);
      }
    `
  }

  registerEffect(id: string, targetCanvas: HTMLCanvasElement): () => void {
    this.effects.set(id, { id, targetCanvas })
    return () => this.effects.delete(id)  // Cleanup function
  }
}
```

---

## 5. Force-Directed Graph Layout

**File:** `packages/ui/memory-graph/hooks/use-graph-data.ts`

```ts
export function useGraphData(data, selectedSpace, nodePositions) {
  return useMemo(() => {
    const allNodes: GraphNode[] = []
    const allEdges: GraphEdge[] = []

    // Concentric ring layout
    documentNodes.forEach((doc, docIndex) => {
      const docsPerRing = 6
      let currentRing = 0
      let positionInRing = docIndex

      // Find ring and position
      while (positionInRing >= docsPerRing + currentRing * 4) {
        positionInRing -= docsPerRing + currentRing * 4
        currentRing++
      }

      const angleInRing = (positionInRing / (docsPerRing + currentRing * 4)) * Math.PI * 2
      const radius = baseRadius + currentRing * documentSpacing * 1.2

      allNodes.push({
        id: doc.id,
        x: centerX + Math.cos(angleInRing) * radius,
        y: centerY + Math.sin(angleInRing) * radius,
      })
    })

    // Soft collision avoidance
    for (let iter = 0; iter < 2; iter++) {
      allNodes.forEach((nodeA) => {
        allNodes.forEach((nodeB) => {
          if (nodeA.id >= nodeB.id) return
          const dist = Math.sqrt((nodeB.x - nodeA.x) ** 2 + (nodeB.y - nodeA.y) ** 2)
          if (dist < minDocDist) {
            const push = (minDocDist - dist) / 8 * 0.5
            nodeA.x -= (nodeB.x - nodeA.x) / dist * push
            nodeB.x += (nodeB.x - nodeA.x) / dist * push
          }
        })
      })
    }

    // Similarity-based edges
    for (let i = 0; i < docs.length; i++) {
      for (let j = i + 1; j < docs.length; j++) {
        const sim = cosineSimilarity(docs[i].embedding, docs[j].embedding)
        if (sim > 0.725) {
          allEdges.push({
            source: docs[i].id,
            target: docs[j].id,
            similarity: sim,
            color: getMagicalConnectionColor(sim, 200),
          })
        }
      }
    }

    return { nodes: allNodes, edges: allEdges }
  }, [data, selectedSpace, nodePositions])
}
```

---

## 6. AI SDK Tool Factory

**File:** `packages/tools/src/ai-sdk.ts`

```ts
import { tool } from "ai"
import { z } from "zod"

export const searchMemoriesTool = (apiKey: string, config?: Config) => {
  const client = new Supermemory({ apiKey })

  return tool({
    description: "Search user's memories for relevant information",
    inputSchema: z.object({
      informationToGet: z.string().describe("What to search for"),
      limit: z.number().optional().default(5),
    }),
    execute: async ({ informationToGet, limit }) => {
      const response = await client.search.execute({
        q: informationToGet,
        containerTags: config?.containerTags,
        limit,
      })
      return {
        success: true,
        results: response.results,
        count: response.results?.length || 0,
      }
    },
  })
}
```

---

## 7. Canvas Hit Detection

**File:** `packages/ui/memory-graph/graph-canvas.tsx`

```tsx
const getNodeAtPosition = useCallback((x: number, y: number): string | null => {
  // Reverse iteration for occlusion handling
  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i]
    const screenX = node.x * zoom + panX
    const screenY = node.y * zoom + panY
    const distance = Math.sqrt((x - screenX) ** 2 + (y - screenY) ** 2)

    if (distance <= node.size * zoom / 2) {
      return node.id
    }
  }
  return null
}, [nodes, panX, panY, zoom])
```

---

## Key Patterns Summary

| Pattern | Purpose |
|---------|---------|
| Nested Providers | Layered context composition |
| Optimistic Updates | Fast perceived performance |
| Singleton WebGL | Shared resource management |
| Concentric Layout | Scalable graph visualization |
| Tool Factory | AI SDK integration |
| Reverse Iteration | Occlusion-aware hit detection |
