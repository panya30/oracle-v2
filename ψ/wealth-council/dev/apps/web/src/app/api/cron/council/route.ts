/**
 * Cron Endpoint for Autonomous Council Discussions
 *
 * Triggers the council to discuss:
 * 1. Regular market updates (every 30 mins)
 * 2. After trade executions
 * 3. Significant market movements
 */

import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import {
  fetchAgentContext,
  addLearning,
  getMarketTrend,
} from '@/lib/agent-intelligence'

const DATA_DIR = join(process.cwd(), 'data')
const CRON_STATE_FILE = join(DATA_DIR, 'council-cron-state.json')

interface CronState {
  lastDiscussionTime: string
  lastMarketCheck: string
  lastYield10Y: number
  discussionCount: number
}

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true })
  }
}

function loadCronState(): CronState {
  try {
    ensureDataDir()
    if (existsSync(CRON_STATE_FILE)) {
      return JSON.parse(readFileSync(CRON_STATE_FILE, 'utf-8'))
    }
  } catch (e) {
    console.error('Failed to load cron state:', e)
  }
  return {
    lastDiscussionTime: new Date(0).toISOString(),
    lastMarketCheck: new Date(0).toISOString(),
    lastYield10Y: 0,
    discussionCount: 0,
  }
}

function saveCronState(state: CronState) {
  try {
    ensureDataDir()
    writeFileSync(CRON_STATE_FILE, JSON.stringify(state, null, 2))
  } catch (e) {
    console.error('Failed to save cron state:', e)
  }
}

// Discussion topics based on conditions
function getDiscussionTopic(
  context: Awaited<ReturnType<typeof fetchAgentContext>>,
  trigger: 'scheduled' | 'market_move' | 'trade' | 'signal'
): string {
  const { market, portfolio, trend, stats } = context

  switch (trigger) {
    case 'market_move': {
      const direction = trend.direction === 'up' ? 'rising' : 'falling'
      return `Yields are ${direction} - should we adjust our positions?`
    }

    case 'trade': {
      const lastTrade = context.recentTrades[0]
      if (lastTrade) {
        return `Review: We just ${lastTrade.action} ${lastTrade.qty} ${lastTrade.ticker}. Was this the right call?`
      }
      return 'Review our recent trading activity'
    }

    case 'signal': {
      return 'New signal triggered - discuss execution strategy'
    }

    case 'scheduled':
    default: {
      const topics = [
        'Market conditions update and position review',
        'How is our 30x bond thesis performing?',
        'Risk assessment and portfolio health check',
        'Signal system performance review',
        'Strategy alignment check - are we on track?',
      ]
      // Rotate through topics based on count
      const state = loadCronState()
      return topics[state.discussionCount % topics.length]
    }
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const trigger = (searchParams.get('trigger') || 'scheduled') as 'scheduled' | 'market_move' | 'trade' | 'signal'
  const force = searchParams.get('force') === 'true'

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3200'
  const state = loadCronState()
  const now = new Date()

  // Check if enough time has passed (30 mins minimum between discussions)
  const timeSinceLastDiscussion = now.getTime() - new Date(state.lastDiscussionTime).getTime()
  const minInterval = 30 * 60 * 1000 // 30 minutes

  if (!force && timeSinceLastDiscussion < minInterval) {
    return NextResponse.json({
      success: true,
      skipped: true,
      reason: 'Too soon since last discussion',
      nextDiscussionIn: Math.ceil((minInterval - timeSinceLastDiscussion) / 60000),
    })
  }

  console.log('🗣️ Council Cron: Starting autonomous discussion...')

  try {
    // Fetch context
    const context = await fetchAgentContext(baseUrl)

    // Check for significant market movement
    let actualTrigger = trigger
    if (trigger === 'scheduled') {
      const y10 = context.market?.yields?.yields?.find((y: any) => y.tenor === '10Y')?.yield || 0
      const yieldChange = Math.abs(y10 - state.lastYield10Y)

      if (yieldChange > 0.05 && state.lastYield10Y > 0) {
        actualTrigger = 'market_move'
        // Record learning about market movement
        addLearning({
          agent: 'HERMES',
          type: 'insight',
          content: `Significant yield movement detected: 10Y moved ${yieldChange > 0 ? '+' : ''}${(yieldChange * 100).toFixed(0)}bps`,
          confidence: 90,
        })
      }

      // Update last yield
      state.lastYield10Y = y10
    }

    // Get topic
    const topic = getDiscussionTopic(context, actualTrigger)

    // Start discussion via council API
    const discussionRes = await fetch(`${baseUrl}/api/council`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'start',
        topic,
        isAutonomous: true,
      }),
    })

    const discussionData = await discussionRes.json()

    if (discussionData.success) {
      // Update state
      state.lastDiscussionTime = now.toISOString()
      state.discussionCount++
      saveCronState(state)

      console.log(`✅ Council Cron: Discussion started - "${topic}"`)

      return NextResponse.json({
        success: true,
        topic,
        trigger: actualTrigger,
        sessionId: discussionData.data.id,
        messageCount: discussionData.data.messages.length,
        timestamp: now.toISOString(),
      })
    } else {
      return NextResponse.json({
        success: false,
        error: discussionData.error,
      })
    }
  } catch (error) {
    console.error('❌ Council Cron error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    )
  }
}

// POST for triggering from other services
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const { trigger = 'scheduled', force = false } = body

  // Create a mock URL with the params
  const url = new URL(request.url)
  url.searchParams.set('trigger', trigger)
  url.searchParams.set('force', force.toString())

  const mockRequest = new NextRequest(url)
  return GET(mockRequest)
}
