/**
 * Council AI - Real LLM-powered agent discussions
 *
 * Each agent has personality, expertise, and reasoning capabilities
 * They analyze real data and goals to provide thoughtful recommendations
 */

import OpenAI from 'openai'
import { type InvestmentGoal } from './agent-intelligence'

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

function formatContextForAgent(context: CouncilContext): string {
  const { market, portfolio, goals, stats, trend, recentTrades } = context

  let contextStr = `## CURRENT MARKET DATA\n`

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

  contextStr += `\n## TRADING STATS\n`
  contextStr += `Total Trades: ${stats.totalTrades}\n`
  contextStr += `Win Rate: ${stats.winRate.toFixed(0)}%\n`
  contextStr += `Avg P&L: $${stats.avgPnL.toFixed(2)}\n`

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

  return contextStr
}

export async function generateAgentResponse(
  agent: keyof typeof AGENT_PERSONAS,
  topic: string,
  context: CouncilContext,
  conversationHistory: { agent: string; content: string }[],
  isOpener = false
): Promise<string> {
  const persona = AGENT_PERSONAS[agent]
  const contextStr = formatContextForAgent(context)

  const messages: OpenAI.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: `${persona.systemPrompt}

${contextStr}

DISCUSSION TOPIC: "${topic}"

INSTRUCTIONS:
- Provide thoughtful analysis based on the data above
- Reference specific numbers and goals
- Keep response focused (2-4 sentences)
- If you have a strong opinion, state it clearly
- If you need input from another agent, ask them directly`,
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
      temperature: 0.7,
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
  rounds = 2
): Promise<{ agent: string; content: string }[]> {
  const messages: { agent: string; content: string }[] = []
  const agentOrder: (keyof typeof AGENT_PERSONAS)[] = ['HERMES', 'DELPHI', 'TYCHE', 'ATHENA', 'ARGUS']

  // PLUTUS opens
  const plutusOpener = await generateAgentResponse('PLUTUS', topic, context, [], true)
  messages.push({ agent: 'PLUTUS', content: plutusOpener })

  // Each agent contributes
  for (const agent of agentOrder) {
    const response = await generateAgentResponse(agent, topic, context, messages)
    messages.push({ agent, content: response })
  }

  // Additional rounds if requested
  for (let round = 1; round < rounds; round++) {
    // PLUTUS synthesizes and asks follow-up
    const plutusFollowup = await generateAgentResponse('PLUTUS', topic, context, messages)
    messages.push({ agent: 'PLUTUS', content: plutusFollowup })

    // Key agents respond to follow-up (shorter round)
    for (const agent of ['DELPHI', 'TYCHE'] as const) {
      const response = await generateAgentResponse(agent, topic, context, messages)
      messages.push({ agent, content: response })
    }
  }

  // PLUTUS concludes with recommendation
  const plutusConclusion = await generateAgentResponse('PLUTUS', `Conclude: ${topic}`, context, messages)
  messages.push({ agent: 'PLUTUS', content: plutusConclusion })

  return messages
}

export async function generateAgentReply(
  userQuestion: string,
  context: CouncilContext,
  conversationHistory: { agent: string; content: string }[]
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
    [...conversationHistory, { agent: 'USER', content: userQuestion }]
  )
  messages.push({ agent: 'PLUTUS', content: plutusAck })

  // Selected agents respond
  for (const agent of respondingAgents) {
    const response = await generateAgentResponse(
      agent,
      userQuestion,
      context,
      [...conversationHistory, { agent: 'USER', content: userQuestion }, ...messages]
    )
    messages.push({ agent, content: response })
  }

  return messages
}
