/**
 * Council AI - Real LLM-powered agent discussions
 *
 * Each agent has personality, expertise, and reasoning capabilities
 * They analyze real data and goals to provide thoughtful recommendations
 *
 * ENHANCED: Agents now use memory to learn from:
 * - Historical trades and their outcomes
 * - Past learnings and insights
 * - Successful trader wisdom
 */

import OpenAI from 'openai'
import {
  type InvestmentGoal,
  loadMemory,
  getTradeStats,
  type TradeMemory,
  type AgentLearning,
  getCombinedLearnings,
  saveToOracle,
} from './agent-intelligence'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Agent definitions with detailed personalities
export const AGENT_PERSONAS = {
  PLUTUS: {
    name: 'PLUTUS',
    role: 'Chief Investment Officer',
    avatar: '👔',
    color: '#3B82F6',
    systemPrompt: `You are PLUTUS, the Chief Investment Officer of Wealth Council.

PERSONALITY:
- Strategic, decisive, and focused on portfolio-level decisions
- You synthesize input from your team to make final recommendations
- You're bullish on the 30x bond thesis but disciplined about execution
- You speak with authority but value your team's expertise

YOUR ROLE:
- Lead discussions and make final recommendations
- Balance aggression with risk management
- Ensure the team stays focused on goals
- Make clear BUY/HOLD/SELL recommendations when appropriate

SPEAKING STYLE:
- Direct and professional
- Use "team" or specific agent names when addressing others
- End with clear action items or questions for specific agents`,
  },

  HERMES: {
    name: 'HERMES',
    role: 'Research Analyst',
    avatar: '📊',
    color: '#10B981',
    systemPrompt: `You are HERMES, the Research Analyst of Wealth Council.

PERSONALITY:
- Data-driven and analytical
- You dig into numbers and find patterns others miss
- You track news, Fed statements, and institutional flows
- You're cautiously optimistic but always cite data

YOUR ROLE:
- Provide market data analysis (yields, spreads, prices)
- Track news and macro events affecting bonds
- Identify trends and patterns in the data
- Alert team to significant market movements

SPEAKING STYLE:
- Lead with data points and numbers
- Use phrases like "the data shows", "looking at the numbers"
- Reference specific yields, spreads, and price levels
- Connect data to actionable insights`,
  },

  DELPHI: {
    name: 'DELPHI',
    role: 'Signal Oracle',
    avatar: '🔮',
    color: '#8B5CF6',
    systemPrompt: `You are DELPHI, the Signal Oracle of Wealth Council.

PERSONALITY:
- Technical and pattern-focused
- You see signals in the noise that others miss
- You speak with conviction when signals are strong
- You're honest about uncertainty when signals are weak

YOUR ROLE:
- Generate and interpret trading signals
- Identify entry/exit points based on technical analysis
- Track signal accuracy and adjust thresholds
- Flag high-conviction "homerun" setups

SPEAKING STYLE:
- Use signal terminology (confidence %, trigger zones)
- Reference specific price levels and thresholds
- Give clear BUY/SELL signals with confidence levels
- Explain the technical reasoning behind signals`,
  },

  TYCHE: {
    name: 'TYCHE',
    role: 'Risk Manager',
    avatar: '🛡️',
    color: '#F59E0B',
    systemPrompt: `You are TYCHE, the Risk Manager of Wealth Council.

PERSONALITY:
- Cautious and protective of capital
- You're the voice of reason when others get too aggressive
- You track exposure, drawdowns, and position sizing
- You approve of calculated risks but veto reckless ones

YOUR ROLE:
- Monitor portfolio risk and exposure
- Enforce position limits and stop losses
- Warn about excessive concentration
- Approve/flag risk levels for proposed trades

SPEAKING STYLE:
- Use risk metrics (exposure %, drawdown, position size)
- Frame advice in terms of capital protection
- Say "I'm comfortable with..." or "I'm concerned about..."
- Balance risk warnings with acknowledgment of opportunity`,
  },

  ATHENA: {
    name: 'ATHENA',
    role: 'Strategy Advisor',
    avatar: '🦉',
    color: '#EC4899',
    systemPrompt: `You are ATHENA, the Strategy Advisor of Wealth Council.

PERSONALITY:
- Wise and long-term focused
- You see the big picture and remind team of the thesis
- You're patient - great opportunities require waiting
- You think in terms of months and years, not days

YOUR ROLE:
- Keep team aligned with the 30x bond thesis
- Provide strategic context for tactical decisions
- Identify when to be patient vs. when to act
- Connect daily moves to long-term goals

SPEAKING STYLE:
- Reference the broader thesis and strategy
- Use phrases like "strategically", "in the long run"
- Remind team of goals and priorities
- Provide wisdom without being preachy`,
  },

  ARGUS: {
    name: 'ARGUS',
    role: 'Portfolio Monitor',
    avatar: '👁️',
    color: '#06B6D4',
    systemPrompt: `You are ARGUS, the Portfolio Monitor of Wealth Council.

PERSONALITY:
- Vigilant and detail-oriented
- You track every position and P&L in real-time
- You alert the team to changes and anomalies
- You're precise about numbers and timestamps

YOUR ROLE:
- Monitor current positions and P&L
- Track order execution and fills
- Report on automation system status
- Alert team to significant position changes

SPEAKING STYLE:
- Lead with specific position data
- Use exact numbers and timestamps
- Report status in a clear, concise format
- Flag anything unusual or requiring attention`,
  },
}

// Wisdom from successful traders - lessons to guide decisions
const TRADER_WISDOM = [
  // Ray Dalio - Bridgewater
  { trader: 'Ray Dalio', lesson: 'Diversify across asset classes and time horizons. Never bet everything on one outcome.' },
  { trader: 'Ray Dalio', lesson: 'Pain + Reflection = Progress. Every loss is a learning opportunity.' },
  { trader: 'Ray Dalio', lesson: 'The biggest mistake investors make is to believe that what happened recently is likely to persist.' },

  // Paul Tudor Jones
  { trader: 'Paul Tudor Jones', lesson: 'The secret to being successful is to always be learning and adapting.' },
  { trader: 'Paul Tudor Jones', lesson: 'Never average losers. Decrease your trading volume when losing.' },
  { trader: 'Paul Tudor Jones', lesson: 'The most important rule of trading is to play great defense, not great offense.' },

  // Stanley Druckenmiller
  { trader: 'Stanley Druckenmiller', lesson: 'When you see it, bet big. Soros taught me it\'s not whether you\'re right or wrong, but how much you make when right.' },
  { trader: 'Stanley Druckenmiller', lesson: 'The way to build long-term returns is through preservation of capital and home runs.' },
  { trader: 'Stanley Druckenmiller', lesson: 'I never use valuation to time the market. I use liquidity and technical analysis.' },

  // George Soros
  { trader: 'George Soros', lesson: 'It\'s not whether you\'re right or wrong that\'s important, but how much money you make when you\'re right and how much you lose when you\'re wrong.' },
  { trader: 'George Soros', lesson: 'Markets are constantly in a state of uncertainty and flux, and money is made by discounting the obvious and betting on the unexpected.' },

  // Bond Market Specific
  { trader: 'Bill Gross', lesson: 'Bond investors should focus on total return, not just yield. The biggest gains come from capital appreciation during rate cuts.' },
  { trader: 'Bill Gross', lesson: 'When the Fed pivots, move fast. Bond market moves are often violent and quick.' },
  { trader: 'Jeffrey Gundlach', lesson: 'The best bond trades come at inflection points. Watch the yield curve for signals.' },
  { trader: 'Jeffrey Gundlach', lesson: 'In a rising rate environment, short duration. In a falling rate environment, extend duration aggressively.' },

  // Risk Management
  { trader: 'Howard Marks', lesson: 'The biggest investing errors come from being too bullish at the top and too bearish at the bottom.' },
  { trader: 'Howard Marks', lesson: 'Risk means more things can happen than will happen. Always prepare for multiple scenarios.' },
]

// Load agent memory with learnings and trade history
// Now includes Oracle knowledge base integration for continuous learning
export function loadAgentMemory(): {
  learnings: AgentLearning[]
  trades: TradeMemory[]
  winningPatterns: string[]
  losingPatterns: string[]
  traderWisdom: typeof TRADER_WISDOM
  oracleLearnings: AgentLearning[]
} {
  const memory = loadMemory()
  const stats = getTradeStats()

  // Get combined learnings (local + Oracle)
  const combinedLearnings = getCombinedLearnings()

  // Extract patterns from successful and failed trades
  const winningPatterns: string[] = []
  const losingPatterns: string[] = []

  memory.trades.forEach(trade => {
    if (trade.outcome) {
      if (trade.outcome.pnl && trade.outcome.pnl > 0) {
        winningPatterns.push(`WIN: ${trade.action} ${trade.ticker} - ${trade.reason}`)
      } else if (trade.outcome.pnl && trade.outcome.pnl < 0) {
        losingPatterns.push(`LOSS: ${trade.action} ${trade.ticker} - ${trade.reason}`)
      }
    }
  })

  // Separate Oracle learnings for special handling
  const oracleLearnings = combinedLearnings.filter(l => l.id.startsWith('oracle-'))

  return {
    learnings: combinedLearnings.slice(0, 20), // Combined learnings
    trades: memory.trades.slice(0, 10), // Last 10 trades
    winningPatterns: winningPatterns.slice(0, 5),
    losingPatterns: losingPatterns.slice(0, 5),
    traderWisdom: TRADER_WISDOM,
    oracleLearnings: oracleLearnings.slice(0, 10), // Top 10 Oracle insights
  }
}

// Get relevant wisdom based on current market situation
function getRelevantWisdom(context: CouncilContext): string[] {
  const wisdom: string[] = []
  const memory = loadAgentMemory()

  // Always include some general wisdom
  const generalWisdom = memory.traderWisdom
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map(w => `${w.trader}: "${w.lesson}"`)

  wisdom.push(...generalWisdom)

  // Add context-specific wisdom
  if (context.trend.direction === 'down' && context.trend.volatility === 'high') {
    wisdom.push('Paul Tudor Jones: "The most important rule of trading is to play great defense, not great offense."')
  }

  if (context.stats.winRate < 50) {
    wisdom.push('Ray Dalio: "Pain + Reflection = Progress. Every loss is a learning opportunity."')
  }

  return wisdom
}

export interface CouncilContext {
  market: {
    yields?: { tenor: string; yield: number }[]
    spread2Y10Y?: number
    spread10Y30Y?: number
    prices?: { ticker: string; price: number; change?: number }[]
  }
  portfolio: {
    totalValue?: number
    cash?: number
    positions?: { symbol: string; qty: number; marketValue: number; unrealizedPnL: number }[]
  }
  signals?: {
    active?: { ticker: string; action: string; confidence: number }[]
    recentSignals?: any[]
  }
  goals: InvestmentGoal[]
  stats: {
    totalTrades: number
    winRate: number
    avgPnL: number
  }
  trend: {
    direction: 'up' | 'down' | 'flat'
    volatility: 'low' | 'medium' | 'high'
  }
  recentTrades?: { ticker: string; action: string; price: number; pnl?: number }[]
}

function formatContextForAgent(context: CouncilContext, sessionStartTime?: string): string {
  const { market, portfolio, goals, stats, trend, recentTrades } = context
  const memory = loadAgentMemory()

  // Add temporal context
  const now = new Date()
  const currentTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  const currentDate = now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

  let contextStr = `## CURRENT TIME\n`
  contextStr += `Now: ${currentTime} on ${currentDate}\n`

  if (sessionStartTime) {
    const sessionStart = new Date(sessionStartTime)
    const sameDay = sessionStart.toDateString() === now.toDateString()
    const minutesAgo = Math.floor((now.getTime() - sessionStart.getTime()) / 60000)

    if (sameDay && minutesAgo < 60) {
      contextStr += `Session started: ${minutesAgo} minutes ago (same conversation)\n`
    } else if (sameDay) {
      contextStr += `Session started: earlier today at ${sessionStart.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}\n`
    } else {
      contextStr += `Session started: ${sessionStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}\n`
    }
    contextStr += `IMPORTANT: This is a CONTINUED conversation. Don't say "today" as if starting fresh unless it's actually a new day.\n`
  }

  contextStr += `\n## CURRENT MARKET DATA\n`

  if (market?.yields?.length) {
    contextStr += `Treasury Yields:\n`
    market.yields.forEach(y => {
      contextStr += `- ${y.tenor}: ${y.yield?.toFixed(2) || 'N/A'}%\n`
    })
    if (market.spread2Y10Y) contextStr += `- 2Y-10Y Spread: ${market.spread2Y10Y.toFixed(2)}%\n`
    if (market.spread10Y30Y) contextStr += `- 10Y-30Y Spread: ${market.spread10Y30Y.toFixed(2)}%\n`
  }

  if (market?.prices?.length) {
    contextStr += `\nETF Prices:\n`
    market.prices.forEach(p => {
      contextStr += `- ${p.ticker}: $${p.price?.toFixed(2) || 'N/A'}${p.change ? ` (${p.change > 0 ? '+' : ''}${p.change.toFixed(2)}%)` : ''}\n`
    })
  }

  contextStr += `\nMarket Trend: ${trend.direction.toUpperCase()} with ${trend.volatility} volatility\n`

  contextStr += `\n## PORTFOLIO STATUS\n`
  if (portfolio?.totalValue) {
    contextStr += `Total Value: $${portfolio.totalValue.toLocaleString()}\n`
    if (portfolio.cash) contextStr += `Cash: $${portfolio.cash.toLocaleString()} (${((portfolio.cash / portfolio.totalValue) * 100).toFixed(1)}%)\n`
  }

  if (portfolio?.positions?.length) {
    contextStr += `\nPositions:\n`
    portfolio.positions.forEach(p => {
      contextStr += `- ${p.symbol}: ${p.qty} shares, Value: $${p.marketValue?.toLocaleString() || 'N/A'}, P&L: $${p.unrealizedPnL?.toFixed(2) || 'N/A'}\n`
    })
  } else {
    contextStr += `No open positions (100% cash)\n`
  }

  contextStr += `\n## TRADING PERFORMANCE\n`
  contextStr += `Total Trades: ${stats.totalTrades}\n`
  contextStr += `Win Rate: ${stats.winRate.toFixed(0)}%\n`
  contextStr += `Avg P&L: $${stats.avgPnL.toFixed(2)}\n`

  // Add historical learnings from memory
  if (memory.learnings.length > 0) {
    contextStr += `\n## LESSONS FROM PAST TRADES\n`
    memory.learnings.slice(0, 5).forEach(l => {
      contextStr += `- [${l.type.toUpperCase()}] ${l.content}\n`
    })
  }

  // Add winning patterns
  if (memory.winningPatterns.length > 0) {
    contextStr += `\n## WHAT HAS WORKED (Copy these!)\n`
    memory.winningPatterns.forEach(p => {
      contextStr += `- ${p}\n`
    })
  }

  // Add losing patterns to avoid
  if (memory.losingPatterns.length > 0) {
    contextStr += `\n## WHAT TO AVOID (Don't repeat!)\n`
    memory.losingPatterns.forEach(p => {
      contextStr += `- ${p}\n`
    })
  }

  // Add Oracle knowledge base insights
  if (memory.oracleLearnings && memory.oracleLearnings.length > 0) {
    contextStr += `\n## ORACLE KNOWLEDGE BASE (Long-term learnings)\n`
    memory.oracleLearnings.slice(0, 5).forEach(l => {
      const content = l.content.slice(0, 200) + (l.content.length > 200 ? '...' : '')
      contextStr += `- [${l.context?.marketCondition || 'insight'}] ${content}\n`
    })
  }

  if (goals.length > 0) {
    contextStr += `\n## ACTIVE INVESTMENT GOALS\n`
    goals.filter(g => g.active).forEach(g => {
      contextStr += `- [${g.priority.toUpperCase()}] ${g.type}: ${g.content}\n`
    })
  }

  if (recentTrades?.length) {
    contextStr += `\n## RECENT TRADES\n`
    recentTrades.slice(0, 5).forEach(t => {
      contextStr += `- ${t.action.toUpperCase()} ${t.ticker} at $${t.price}${t.pnl ? ` (P&L: $${t.pnl.toFixed(2)})` : ''}\n`
    })
  }

  // Add wisdom from successful traders
  const wisdom = getRelevantWisdom(context)
  if (wisdom.length > 0) {
    contextStr += `\n## WISDOM FROM SUCCESSFUL TRADERS\n`
    wisdom.forEach(w => {
      contextStr += `- ${w}\n`
    })
  }

  return contextStr
}

export async function generateAgentResponse(
  agent: keyof typeof AGENT_PERSONAS,
  topic: string,
  context: CouncilContext,
  conversationHistory: { agent: string; content: string }[],
  isOpener = false,
  sessionStartTime?: string
): Promise<string> {
  const persona = AGENT_PERSONAS[agent]
  const contextStr = formatContextForAgent(context, sessionStartTime)

  const messages: OpenAI.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: `${persona.systemPrompt}

${contextStr}

DISCUSSION TOPIC: "${topic}"

INSTRUCTIONS:
- Provide thoughtful analysis based on the data above
- LEARN FROM HISTORY: Reference past wins/losses and apply those lessons
- Reference specific numbers and goals
- Apply wisdom from successful traders when relevant
- Keep response focused (2-4 sentences)
- If you have a strong opinion, state it clearly
- If you need input from another agent, ask them directly
- NEVER repeat past mistakes - if something lost money before, flag it

CONVERSATION CONTINUITY:
- Check the CURRENT TIME section to know if this is a continued conversation
- If session started recently (same day), DON'T say "today" or "this morning" as if starting fresh
- Reference what was discussed earlier if continuing a conversation
- Only use time-based greetings for genuinely NEW sessions`,
    },
  ]

  // Add conversation history
  if (conversationHistory.length > 0) {
    conversationHistory.forEach(msg => {
      messages.push({
        role: 'user',
        content: `[${msg.agent}]: ${msg.content}`,
      })
    })
  }

  if (isOpener) {
    messages.push({
      role: 'user',
      content: `You are opening this discussion. Introduce the topic and ask for your team's input. Be specific about what you want to know.`,
    })
  } else {
    messages.push({
      role: 'user',
      content: `Respond to the discussion above from your perspective as ${persona.name} (${persona.role}). Add your unique expertise and analysis.`,
    })
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 300,
      temperature: 0.3, // Lower temperature for more consistent trading decisions
    })

    return response.choices[0]?.message?.content || `${persona.name} is analyzing the situation...`
  } catch (error) {
    console.error(`Error generating ${agent} response:`, error)
    // Fallback to basic response
    return `${persona.name} is reviewing the data...`
  }
}

export async function generateCouncilDiscussion(
  topic: string,
  context: CouncilContext,
  rounds = 2,
  sessionStartTime?: string
): Promise<{ agent: string; content: string }[]> {
  const messages: { agent: string; content: string }[] = []
  const agentOrder: (keyof typeof AGENT_PERSONAS)[] = ['HERMES', 'DELPHI', 'TYCHE', 'ATHENA', 'ARGUS']
  const startTime = sessionStartTime || new Date().toISOString()

  // PLUTUS opens
  const plutusOpener = await generateAgentResponse('PLUTUS', topic, context, [], true, startTime)
  messages.push({ agent: 'PLUTUS', content: plutusOpener })

  // Each agent contributes
  for (const agent of agentOrder) {
    const response = await generateAgentResponse(agent, topic, context, messages, false, startTime)
    messages.push({ agent, content: response })
  }

  // Additional rounds if requested
  for (let round = 1; round < rounds; round++) {
    // PLUTUS synthesizes and asks follow-up
    const plutusFollowup = await generateAgentResponse('PLUTUS', topic, context, messages, false, startTime)
    messages.push({ agent: 'PLUTUS', content: plutusFollowup })

    // Key agents respond to follow-up (shorter round)
    for (const agent of ['DELPHI', 'TYCHE'] as const) {
      const response = await generateAgentResponse(agent, topic, context, messages, false, startTime)
      messages.push({ agent, content: response })
    }
  }

  // PLUTUS concludes with recommendation
  const plutusConclusion = await generateAgentResponse('PLUTUS', `Conclude: ${topic}`, context, messages, false, startTime)
  messages.push({ agent: 'PLUTUS', content: plutusConclusion })

  return messages
}

export async function generateAgentReply(
  userQuestion: string,
  context: CouncilContext,
  conversationHistory: { agent: string; content: string }[],
  sessionStartTime?: string
): Promise<{ agent: string; content: string }[]> {
  const messages: { agent: string; content: string }[] = []

  // Determine which agents should respond based on question
  const questionLower = userQuestion.toLowerCase()
  const respondingAgents: (keyof typeof AGENT_PERSONAS)[] = []

  if (questionLower.match(/risk|safe|stop|loss|protect/)) respondingAgents.push('TYCHE')
  if (questionLower.match(/signal|buy|sell|trigger|entry|exit/)) respondingAgents.push('DELPHI')
  if (questionLower.match(/market|yield|data|news|price/)) respondingAgents.push('HERMES')
  if (questionLower.match(/position|portfolio|holding|status/)) respondingAgents.push('ARGUS')
  if (questionLower.match(/strategy|plan|thesis|long.?term/)) respondingAgents.push('ATHENA')

  // Default: HERMES and DELPHI respond
  if (respondingAgents.length === 0) {
    respondingAgents.push('HERMES', 'DELPHI')
  }

  // PLUTUS acknowledges
  const plutusAck = await generateAgentResponse(
    'PLUTUS',
    userQuestion,
    context,
    [...conversationHistory, { agent: 'USER', content: userQuestion }],
    false,
    sessionStartTime
  )
  messages.push({ agent: 'PLUTUS', content: plutusAck })

  // Selected agents respond
  for (const agent of respondingAgents) {
    const response = await generateAgentResponse(
      agent,
      userQuestion,
      context,
      [...conversationHistory, { agent: 'USER', content: userQuestion }, ...messages],
      false,
      sessionStartTime
    )
    messages.push({ agent, content: response })
  }

  return messages
}
