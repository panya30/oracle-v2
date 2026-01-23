/**
 * Council API - Multi-Agent Discussion
 *
 * Manages conversations between PLUTUS and team
 * User can view and participate in discussions
 */

import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import {
  fetchAgentContext,
  addLearning,
  recordTrade,
  getGoals,
  getActiveGoals,
  addGoal,
  updateGoal,
  deleteGoal,
  type InvestmentGoal,
} from '@/lib/agent-intelligence'
import {
  generateCouncilDiscussion,
  generateAgentReply,
  type CouncilContext,
} from '@/lib/council-ai'

// Agent definitions
const AGENTS = {
  PLUTUS: {
    name: 'PLUTUS',
    role: 'Chief Investment Officer',
    avatar: '👔',
    color: '#3B82F6',
    personality: 'Strategic, decisive, focuses on portfolio allocation and overall direction',
  },
  HERMES: {
    name: 'HERMES',
    role: 'Research Analyst',
    avatar: '📊',
    color: '#10B981',
    personality: 'Data-driven, analytical, provides market research and news insights',
  },
  DELPHI: {
    name: 'DELPHI',
    role: 'Signal Oracle',
    avatar: '🔮',
    color: '#8B5CF6',
    personality: 'Technical analyst, reads market signals and patterns',
  },
  TYCHE: {
    name: 'TYCHE',
    role: 'Risk Manager',
    avatar: '🛡️',
    color: '#F59E0B',
    personality: 'Cautious, risk-focused, always considers downside protection',
  },
  ATHENA: {
    name: 'ATHENA',
    role: 'Strategy Advisor',
    avatar: '🦉',
    color: '#EC4899',
    personality: 'Wise, tactical, considers long-term implications',
  },
  ARGUS: {
    name: 'ARGUS',
    role: 'Portfolio Monitor',
    avatar: '👁️',
    color: '#06B6D4',
    personality: 'Vigilant, monitors positions and alerts on changes',
  },
}

interface Message {
  id: string
  timestamp: string
  agent: string | 'USER'
  content: string
  replyTo?: string
  metadata?: {
    signal?: any
    market?: any
    recommendation?: string
  }
}

interface Session {
  id: string
  topic: string
  status: 'active' | 'concluded'
  startedAt: string
  messages: Message[]
}

// File storage
const DATA_DIR = join(process.cwd(), 'data')
const COUNCIL_FILE = join(DATA_DIR, 'council-sessions.json')

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true })
  }
}

function loadSessions(): Session[] {
  try {
    ensureDataDir()
    if (existsSync(COUNCIL_FILE)) {
      return JSON.parse(readFileSync(COUNCIL_FILE, 'utf-8'))
    }
  } catch (e) {
    console.error('Failed to load council sessions:', e)
  }
  return []
}

function saveSessions(sessions: Session[]) {
  try {
    ensureDataDir()
    writeFileSync(COUNCIL_FILE, JSON.stringify(sessions, null, 2))
  } catch (e) {
    console.error('Failed to save council sessions:', e)
  }
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

// Generate agent response based on context
function generateAgentResponse(
  agent: keyof typeof AGENTS,
  topic: string,
  context: Message[],
  marketData?: any
): string {
  const agentInfo = AGENTS[agent]

  // Simple response generation based on agent role
  // In production, this would call an LLM
  const responses: Record<string, string[]> = {
    PLUTUS: [
      `As CIO, I recommend we focus on the current yield environment. With 10Y at ${marketData?.yields?.y10 || '4.26'}%, our bond short thesis remains valid.`,
      `Team, let's review our portfolio allocation. We need to balance aggression with prudent risk management.`,
      `I've reviewed the signals. DELPHI, what's your confidence level on the current setup?`,
    ],
    HERMES: [
      `My research shows bond market stress continues. Institutional flows suggest more selling ahead.`,
      `Latest data: Treasury yields remain elevated. The 30Y is testing resistance levels.`,
      `News analysis indicates Fed remains hawkish. This supports our inverse bond position.`,
    ],
    DELPHI: [
      `Signal analysis: Yield curve steepening detected. 2Y-10Y spread widening is bullish for our TMV/TBT positions.`,
      `Technical levels: TBT support at $34, resistance at $36. Current momentum is positive.`,
      `My oracle reading suggests 75% confidence in continued bond weakness over the next week.`,
    ],
    TYCHE: [
      `Risk assessment: Current exposure is within limits. Daily drawdown at acceptable levels.`,
      `Warning: We should maintain stop losses. I recommend 10% max loss per position.`,
      `Portfolio risk score is moderate. Cash reserve of 20% provides buffer for opportunities.`,
    ],
    ATHENA: [
      `Strategic view: The 30x bond thesis remains our core strategy. Patience is key.`,
      `Long-term perspective: Bond market repricing is a multi-month process. Stay the course.`,
      `Tactical suggestion: Consider scaling into positions on dips rather than all-at-once entries.`,
    ],
    ARGUS: [
      `Position update: TBT holding at 28 shares, current P&L: -$1.40. Monitoring closely.`,
      `Alert: No significant changes detected in overnight sessions.`,
      `Watching: Extended hours trading active. Volume is light but positions stable.`,
    ],
  }

  const agentResponses = responses[agent] || [`${agentInfo.name} is analyzing the situation...`]
  return agentResponses[Math.floor(Math.random() * agentResponses.length)]
}

// Convert fetchAgentContext result to CouncilContext format
function toCouncilContext(ctx: Awaited<ReturnType<typeof fetchAgentContext>>): CouncilContext {
  return {
    market: {
      yields: ctx.market?.yields?.yields || [],
      spread2Y10Y: ctx.market?.yields?.spread2Y10Y,
      spread10Y30Y: ctx.market?.yields?.spread10Y30Y,
      prices: ctx.market?.prices?.map((p: any) => ({
        ticker: p.ticker,
        price: p.price,
        change: p.changePercent,
      })) || [],
    },
    portfolio: {
      totalValue: ctx.portfolio?.totalValue || ctx.portfolio?.portfolio_value,
      cash: ctx.portfolio?.cash,
      positions: ctx.portfolio?.positions?.map((p: any) => ({
        symbol: p.symbol,
        qty: Number(p.qty),
        marketValue: p.market_value || p.marketValue || 0,
        unrealizedPnL: p.unrealized_pl || p.unrealizedPnL || 0,
      })) || [],
    },
    signals: ctx.signals,
    goals: ctx.goals || [],
    stats: ctx.stats,
    trend: ctx.trend,
    recentTrades: ctx.recentTrades?.map(t => ({
      ticker: t.ticker,
      action: t.action,
      price: t.price,
      pnl: t.outcome?.pnl,
    })),
  }
}

// Start a new council discussion with AI reasoning
async function startDiscussion(topic: string, isAutonomous = false): Promise<Session> {
  const sessionId = generateId()
  const now = new Date().toISOString()
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3200'

  // Fetch comprehensive context
  const rawContext = await fetchAgentContext(baseUrl)
  const context = toCouncilContext(rawContext)

  // Generate AI-powered discussion (2 rounds for deeper reasoning)
  const aiMessages = await generateCouncilDiscussion(topic, context, isAutonomous ? 2 : 1)

  // Convert to Message format
  const messages: Message[] = aiMessages.map((msg, idx) => ({
    id: generateId(),
    timestamp: new Date(Date.now() + idx * 100).toISOString(),
    agent: msg.agent,
    content: msg.content,
    metadata: msg.agent === 'HERMES' ? { market: rawContext.market } : undefined,
  }))

  const session: Session = {
    id: sessionId,
    topic,
    status: 'active',
    startedAt: now,
    messages,
  }

  // Save session
  const sessions = loadSessions()
  sessions.unshift(session)
  saveSessions(sessions.slice(0, 50)) // Keep last 50 sessions

  return session
}

// Add user message to session
function addUserMessage(sessionId: string, content: string): Message | null {
  const sessions = loadSessions()
  const session = sessions.find(s => s.id === sessionId)

  if (!session) return null

  const message: Message = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    agent: 'USER',
    content,
  }

  session.messages.push(message)
  saveSessions(sessions)

  return message
}

// Generate agent responses to user question with AI
async function respondToUser(sessionId: string, userMessage: string): Promise<Message[]> {
  const sessions = loadSessions()
  const session = sessions.find(s => s.id === sessionId)

  if (!session) return []

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3200'
  const rawContext = await fetchAgentContext(baseUrl)
  const context = toCouncilContext(rawContext)
  const conversationHistory = session.messages.slice(-10).map(m => ({ agent: m.agent, content: m.content }))

  // Generate AI responses
  const aiResponses = await generateAgentReply(userMessage, context, conversationHistory)

  // Convert to Message format
  const responses: Message[] = aiResponses.map((msg, idx) => ({
    id: generateId(),
    timestamp: new Date(Date.now() + idx * 100).toISOString(),
    agent: msg.agent,
    content: msg.content,
    replyTo: idx === 0 ? userMessage : undefined,
  }))

  // Save responses to session
  session.messages.push(...responses)
  saveSessions(sessions)

  // Record learning if user provides feedback
  const messageLower = userMessage.toLowerCase()
  if (messageLower.includes('good') || messageLower.includes('great') || messageLower.includes('correct')) {
    addLearning({
      agent: 'PLUTUS',
      type: 'success',
      content: `User confirmed positive outcome for discussion: ${session.topic}`,
      confidence: 80,
    })
  }

  return responses
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action') || 'sessions'

  switch (action) {
    case 'sessions': {
      const sessions = loadSessions()
      return NextResponse.json({
        success: true,
        data: sessions.map(s => ({
          id: s.id,
          topic: s.topic,
          status: s.status,
          startedAt: s.startedAt,
          messageCount: s.messages.length,
          lastMessage: s.messages[s.messages.length - 1],
        })),
      })
    }

    case 'session': {
      const sessionId = searchParams.get('id')
      if (!sessionId) {
        return NextResponse.json({ success: false, error: 'Session ID required' }, { status: 400 })
      }
      const sessions = loadSessions()
      const session = sessions.find(s => s.id === sessionId)
      if (!session) {
        return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, data: session })
    }

    case 'agents': {
      return NextResponse.json({ success: true, data: AGENTS })
    }

    case 'goals': {
      const goals = getGoals()
      return NextResponse.json({ success: true, data: goals })
    }

    case 'active-goals': {
      const goals = getActiveGoals()
      return NextResponse.json({ success: true, data: goals })
    }

    default:
      return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 })
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { action, ...params } = body

  switch (action) {
    case 'start': {
      const { topic } = params
      if (!topic) {
        return NextResponse.json({ success: false, error: 'Topic required' }, { status: 400 })
      }
      const session = await startDiscussion(topic)
      return NextResponse.json({ success: true, data: session })
    }

    case 'message': {
      const { sessionId, content } = params
      if (!sessionId || !content) {
        return NextResponse.json({ success: false, error: 'Session ID and content required' }, { status: 400 })
      }

      // Add user message
      const userMsg = addUserMessage(sessionId, content)
      if (!userMsg) {
        return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 })
      }

      // Generate agent responses
      const responses = await respondToUser(sessionId, content)

      return NextResponse.json({
        success: true,
        data: {
          userMessage: userMsg,
          responses,
        },
      })
    }

    case 'add-goal': {
      const { priority = 'medium', type = 'strategy', content, active = true } = params
      if (!content) {
        return NextResponse.json({ success: false, error: 'Goal content required' }, { status: 400 })
      }
      const goal = addGoal({ priority, type, content, active })
      return NextResponse.json({ success: true, data: goal })
    }

    case 'update-goal': {
      const { id, ...updates } = params
      if (!id) {
        return NextResponse.json({ success: false, error: 'Goal ID required' }, { status: 400 })
      }
      const goal = updateGoal(id, updates)
      if (!goal) {
        return NextResponse.json({ success: false, error: 'Goal not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, data: goal })
    }

    case 'delete-goal': {
      const { id } = params
      if (!id) {
        return NextResponse.json({ success: false, error: 'Goal ID required' }, { status: 400 })
      }
      const deleted = deleteGoal(id)
      if (!deleted) {
        return NextResponse.json({ success: false, error: 'Goal not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true })
    }

    default:
      return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 })
  }
}
