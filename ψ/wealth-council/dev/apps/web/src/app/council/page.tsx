'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  MessageSquare,
  Send,
  Plus,
  Users,
  Loader2,
  ChevronRight,
  Sparkles,
  Target,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Sun,
} from 'lucide-react'
import { MorningBriefCard } from '@/components/council/MorningBriefCard'

interface Agent {
  name: string
  role: string
  avatar: string
  color: string
  personality: string
}

interface Message {
  id: string
  timestamp: string
  agent: string | 'USER'
  content: string
  replyTo?: string
  metadata?: any
}

interface Session {
  id: string
  topic: string
  status: 'active' | 'concluded'
  startedAt: string
  messages: Message[]
}

interface InvestmentGoal {
  id: string
  priority: 'high' | 'medium' | 'low'
  type: 'strategy' | 'risk' | 'target' | 'constraint' | 'opportunity'
  content: string
  active: boolean
  createdAt: string
  updatedAt: string
}

const AGENTS: Record<string, Agent> = {
  PLUTUS: { name: 'PLUTUS', role: 'Chief Investment Officer', avatar: '👔', color: '#3B82F6', personality: '' },
  HERMES: { name: 'HERMES', role: 'Research Analyst', avatar: '📊', color: '#10B981', personality: '' },
  DELPHI: { name: 'DELPHI', role: 'Signal Oracle', avatar: '🔮', color: '#8B5CF6', personality: '' },
  TYCHE: { name: 'TYCHE', role: 'Risk Manager', avatar: '🛡️', color: '#F59E0B', personality: '' },
  ATHENA: { name: 'ATHENA', role: 'Strategy Advisor', avatar: '🦉', color: '#EC4899', personality: '' },
  ARGUS: { name: 'ARGUS', role: 'Portfolio Monitor', avatar: '👁️', color: '#06B6D4', personality: '' },
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(timestamp: string): string {
  const date = new Date(timestamp)
  return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function CouncilPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [currentSession, setCurrentSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [newTopic, setNewTopic] = useState('')
  const [userMessage, setUserMessage] = useState('')
  const [showNewSession, setShowNewSession] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Goals state
  const [goals, setGoals] = useState<InvestmentGoal[]>([])
  const [showGoals, setShowGoals] = useState(false)
  const [newGoalContent, setNewGoalContent] = useState('')
  const [newGoalType, setNewGoalType] = useState<InvestmentGoal['type']>('opportunity')
  const [newGoalPriority, setNewGoalPriority] = useState<InvestmentGoal['priority']>('high')

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [currentSession?.messages])

  // Load sessions
  const loadSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/council?action=sessions')
      const data = await res.json()
      if (data.success) {
        setSessions(data.data)
      }
    } catch (e) {
      console.error('Failed to load sessions:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  // Load goals
  const loadGoals = useCallback(async () => {
    try {
      const res = await fetch('/api/council?action=goals')
      const data = await res.json()
      if (data.success) {
        setGoals(data.data)
      }
    } catch (e) {
      console.error('Failed to load goals:', e)
    }
  }, [])

  // Add goal
  const addGoal = async () => {
    if (!newGoalContent.trim()) return
    try {
      const res = await fetch('/api/council', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add-goal',
          content: newGoalContent,
          type: newGoalType,
          priority: newGoalPriority,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setGoals(prev => [data.data, ...prev])
        setNewGoalContent('')
      }
    } catch (e) {
      console.error('Failed to add goal:', e)
    }
  }

  // Toggle goal active status
  const toggleGoal = async (id: string, active: boolean) => {
    try {
      const res = await fetch('/api/council', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update-goal', id, active: !active }),
      })
      const data = await res.json()
      if (data.success) {
        setGoals(prev => prev.map(g => g.id === id ? { ...g, active: !active } : g))
      }
    } catch (e) {
      console.error('Failed to toggle goal:', e)
    }
  }

  // Delete goal
  const removeGoal = async (id: string) => {
    try {
      const res = await fetch('/api/council', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete-goal', id }),
      })
      const data = await res.json()
      if (data.success) {
        setGoals(prev => prev.filter(g => g.id !== id))
      }
    } catch (e) {
      console.error('Failed to delete goal:', e)
    }
  }

  useEffect(() => {
    loadSessions()
    loadGoals()
  }, [loadSessions, loadGoals])

  // Load specific session
  const loadSession = async (sessionId: string) => {
    try {
      setLoading(true)
      const res = await fetch(`/api/council?action=session&id=${sessionId}`)
      const data = await res.json()
      if (data.success) {
        setCurrentSession(data.data)
      }
    } catch (e) {
      console.error('Failed to load session:', e)
    } finally {
      setLoading(false)
    }
  }

  // Start new discussion
  const startNewDiscussion = async () => {
    if (!newTopic.trim()) return

    try {
      setSending(true)
      const res = await fetch('/api/council', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', topic: newTopic }),
      })
      const data = await res.json()
      if (data.success) {
        setCurrentSession(data.data)
        setNewTopic('')
        setShowNewSession(false)
        loadSessions()
      }
    } catch (e) {
      console.error('Failed to start discussion:', e)
    } finally {
      setSending(false)
    }
  }

  // Send user message
  const sendMessage = async () => {
    if (!userMessage.trim() || !currentSession) return

    try {
      setSending(true)
      const res = await fetch('/api/council', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'message',
          sessionId: currentSession.id,
          content: userMessage,
        }),
      })
      const data = await res.json()
      if (data.success) {
        // Add messages to current session
        setCurrentSession(prev => {
          if (!prev) return prev
          return {
            ...prev,
            messages: [...prev.messages, data.data.userMessage, ...data.data.responses],
          }
        })
        setUserMessage('')
      }
    } catch (e) {
      console.error('Failed to send message:', e)
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (showNewSession) {
        startNewDiscussion()
      } else {
        sendMessage()
      }
    }
  }

  return (
    <div className="h-[calc(100vh-120px)] flex gap-4">
      {/* Sessions & Goals Sidebar */}
      <div className="w-72 bg-surface-primary rounded-xl border border-palantir-border flex flex-col">
        {/* Tab switcher */}
        <div className="flex border-b border-palantir-border">
          <button
            onClick={() => setShowGoals(false)}
            className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              !showGoals ? 'text-accent-cyan border-b-2 border-accent-cyan' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Users className="w-4 h-4" />
            Sessions
          </button>
          <button
            onClick={() => setShowGoals(true)}
            className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              showGoals ? 'text-accent-cyan border-b-2 border-accent-cyan' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Target className="w-4 h-4" />
            Goals
            {goals.filter(g => g.active).length > 0 && (
              <span className="px-1.5 py-0.5 text-xs bg-accent-cyan/20 text-accent-cyan rounded-full">
                {goals.filter(g => g.active).length}
              </span>
            )}
          </button>
        </div>

        {showGoals ? (
          /* Goals Panel */
          <div className="flex-1 flex flex-col">
            <div className="p-3 border-b border-palantir-border">
              <p className="text-xs text-text-muted mb-2">
                Set directives for the Council to follow
              </p>
              <div className="space-y-2">
                <input
                  type="text"
                  value={newGoalContent}
                  onChange={(e) => setNewGoalContent(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addGoal()}
                  placeholder="e.g., Look for homerun opportunities"
                  className="w-full px-3 py-2 text-sm bg-surface-secondary border border-palantir-border rounded-lg focus:outline-none focus:border-accent-cyan"
                />
                <div className="flex gap-2">
                  <select
                    value={newGoalType}
                    onChange={(e) => setNewGoalType(e.target.value as InvestmentGoal['type'])}
                    className="flex-1 px-2 py-1 text-xs bg-surface-secondary border border-palantir-border rounded focus:outline-none"
                  >
                    <option value="opportunity">Opportunity</option>
                    <option value="strategy">Strategy</option>
                    <option value="risk">Risk</option>
                    <option value="target">Target</option>
                    <option value="constraint">Constraint</option>
                  </select>
                  <select
                    value={newGoalPriority}
                    onChange={(e) => setNewGoalPriority(e.target.value as InvestmentGoal['priority'])}
                    className="flex-1 px-2 py-1 text-xs bg-surface-secondary border border-palantir-border rounded focus:outline-none"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                  <button
                    onClick={addGoal}
                    disabled={!newGoalContent.trim()}
                    className="px-3 py-1 bg-accent-cyan text-white text-xs rounded hover:bg-accent-cyan/90 disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Goals list */}
            <div className="flex-1 overflow-y-auto p-2">
              {goals.length === 0 ? (
                <div className="text-center text-text-muted p-4">
                  <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No goals set</p>
                  <p className="text-xs mt-1">Add directives above</p>
                </div>
              ) : (
                goals.map((goal) => (
                  <div
                    key={goal.id}
                    className={`p-3 rounded-lg mb-2 transition-colors ${
                      goal.active ? 'bg-surface-secondary' : 'bg-surface-secondary/50 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{goal.content}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            goal.type === 'opportunity' ? 'bg-green-500/20 text-green-400' :
                            goal.type === 'risk' ? 'bg-red-500/20 text-red-400' :
                            goal.type === 'strategy' ? 'bg-blue-500/20 text-blue-400' :
                            goal.type === 'target' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {goal.type}
                          </span>
                          <span className={`text-xs ${
                            goal.priority === 'high' ? 'text-red-400' :
                            goal.priority === 'medium' ? 'text-yellow-400' :
                            'text-gray-400'
                          }`}>
                            {goal.priority}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleGoal(goal.id, goal.active)}
                          className="p-1 hover:bg-surface-tertiary rounded transition-colors"
                          title={goal.active ? 'Deactivate' : 'Activate'}
                        >
                          {goal.active ? (
                            <ToggleRight className="w-4 h-4 text-accent-cyan" />
                          ) : (
                            <ToggleLeft className="w-4 h-4 text-text-muted" />
                          )}
                        </button>
                        <button
                          onClick={() => removeGoal(goal.id)}
                          className="p-1 hover:bg-red-500/20 rounded transition-colors text-text-muted hover:text-red-400"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Quick goal suggestions */}
            <div className="p-3 border-t border-palantir-border">
              <p className="text-xs text-text-muted mb-2">Quick add:</p>
              <div className="flex flex-wrap gap-1">
                {[
                  { content: 'Look for homerun opportunities', type: 'opportunity' as const },
                  { content: 'Be aggressive on high-conviction signals', type: 'strategy' as const },
                  { content: 'Max 10% per position', type: 'risk' as const },
                  { content: 'Target 30x on bond thesis', type: 'target' as const },
                ].map((preset) => (
                  <button
                    key={preset.content}
                    onClick={() => {
                      setNewGoalContent(preset.content)
                      setNewGoalType(preset.type)
                    }}
                    className="text-xs px-2 py-1 bg-surface-tertiary rounded hover:bg-surface-secondary transition-colors"
                  >
                    {preset.content.slice(0, 20)}...
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Sessions Panel */
          <>
            <div className="p-4 border-b border-palantir-border">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-text-muted">Discussions</span>
                <button
                  onClick={() => setShowNewSession(true)}
                  className="p-2 hover:bg-surface-secondary rounded-lg transition-colors"
                  title="New Discussion"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Agent avatars */}
              <div className="flex -space-x-2">
                {Object.values(AGENTS).map((agent) => (
                  <div
                    key={agent.name}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 border-surface-primary"
                    style={{ backgroundColor: agent.color + '30' }}
                    title={`${agent.name} - ${agent.role}`}
                  >
                    {agent.avatar}
                  </div>
                ))}
              </div>
            </div>

            {/* Session list */}
            <div className="flex-1 overflow-y-auto p-2">
          {loading && sessions.length === 0 ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="w-5 h-5 animate-spin text-text-muted" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center text-text-muted p-4">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No discussions yet</p>
              <button
                onClick={() => setShowNewSession(true)}
                className="mt-2 text-accent-cyan text-sm hover:underline"
              >
                Start one
              </button>
            </div>
          ) : (
            sessions.map((session: any) => (
              <button
                key={session.id}
                onClick={() => loadSession(session.id)}
                className={`w-full text-left p-3 rounded-lg mb-1 transition-colors ${
                  currentSession?.id === session.id
                    ? 'bg-accent-cyan/20 border border-accent-cyan/30'
                    : 'hover:bg-surface-secondary'
                }`}
              >
                <div className="font-medium text-sm truncate">{session.topic}</div>
                <div className="text-xs text-text-muted mt-1 flex items-center justify-between">
                  <span>{formatDate(session.startedAt)}</span>
                  <span>{session.messageCount} msgs</span>
                </div>
              </button>
            ))
          )}
        </div>
          </>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-surface-primary rounded-xl border border-palantir-border flex flex-col">
        {showNewSession ? (
          /* New Discussion Form */
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="max-w-md w-full">
              <div className="text-center mb-6">
                <Sparkles className="w-12 h-12 text-accent-cyan mx-auto mb-3" />
                <h2 className="text-xl font-semibold">Start a Council Discussion</h2>
                <p className="text-text-secondary mt-2">
                  PLUTUS will gather the team to discuss your topic
                </p>
              </div>

              <div className="space-y-4">
                <textarea
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="What should the council discuss? e.g., 'Should we increase our TMV position?'"
                  className="w-full px-4 py-3 bg-surface-secondary border border-palantir-border rounded-lg focus:outline-none focus:border-accent-cyan resize-none"
                  rows={3}
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowNewSession(false)}
                    className="flex-1 py-2 px-4 border border-palantir-border rounded-lg hover:bg-surface-secondary transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={startNewDiscussion}
                    disabled={!newTopic.trim() || sending}
                    className="flex-1 py-2 px-4 bg-accent-cyan text-white rounded-lg hover:bg-accent-cyan/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    Start Discussion
                  </button>
                </div>
              </div>

              {/* Quick topics */}
              <div className="mt-6">
                <p className="text-sm text-text-muted mb-2">Quick topics:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Market outlook for this week',
                    'Should we adjust position sizes?',
                    'Review current risk levels',
                    'Analyze recent signals',
                  ].map((topic) => (
                    <button
                      key={topic}
                      onClick={() => setNewTopic(topic)}
                      className="text-xs px-3 py-1.5 bg-surface-secondary rounded-full hover:bg-surface-tertiary transition-colors"
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : currentSession ? (
          /* Active Session */
          <>
            {/* Header */}
            <div className="p-4 border-b border-palantir-border">
              <h2 className="font-semibold">{currentSession.topic}</h2>
              <p className="text-xs text-text-muted mt-1">
                Started {formatDate(currentSession.startedAt)} • {currentSession.messages.length} messages
              </p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {currentSession.messages.map((msg) => {
                const isUser = msg.agent === 'USER'
                const agent = !isUser ? AGENTS[msg.agent] : null

                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isUser ? 'bg-accent-cyan/20' : ''
                      }`}
                      style={agent ? { backgroundColor: agent.color + '20' } : undefined}
                    >
                      {isUser ? '👤' : agent?.avatar}
                    </div>

                    {/* Message */}
                    <div className={`max-w-[70%] ${isUser ? 'text-right' : ''}`}>
                      <div className={`flex items-center gap-2 mb-1 ${isUser ? 'justify-end' : ''}`}>
                        <span
                          className="font-medium text-sm"
                          style={agent ? { color: agent.color } : undefined}
                        >
                          {isUser ? 'You' : agent?.name}
                        </span>
                        {agent && (
                          <span className="text-xs text-text-muted">{agent.role}</span>
                        )}
                        <span className="text-xs text-text-muted">{formatTime(msg.timestamp)}</span>
                      </div>
                      <div
                        className={`p-3 rounded-xl ${
                          isUser
                            ? 'bg-accent-cyan text-white rounded-tr-sm'
                            : 'bg-surface-secondary rounded-tl-sm'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        {msg.metadata?.recommendation && (
                          <div className="mt-2 pt-2 border-t border-white/20">
                            <span className="text-xs font-medium">
                              Recommendation: {msg.metadata.recommendation}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-palantir-border">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={userMessage}
                  onChange={(e) => setUserMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Ask the council a question..."
                  className="flex-1 px-4 py-2 bg-surface-secondary border border-palantir-border rounded-lg focus:outline-none focus:border-accent-cyan"
                  disabled={sending}
                />
                <button
                  onClick={sendMessage}
                  disabled={!userMessage.trim() || sending}
                  className="px-4 py-2 bg-accent-cyan text-white rounded-lg hover:bg-accent-cyan/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-text-muted mt-2">
                Press Enter to send • The council will respond based on your question
              </p>
            </div>
          </>
        ) : (
          /* No session selected - Show Morning Brief */
          <div className="flex-1 flex flex-col overflow-y-auto">
            {/* Morning Brief Card */}
            <div className="p-4">
              <MorningBriefCard />
            </div>

            {/* Welcome Section */}
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div>
                <Users className="w-16 h-16 text-text-muted mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium text-text-secondary mb-2">
                  Welcome to Wealth Council
                </h3>
                <p className="text-text-muted mb-4 max-w-md">
                  Watch PLUTUS and the team discuss trading strategy, or join the conversation to ask questions.
                </p>
                <button
                  onClick={() => setShowNewSession(true)}
                  className="px-6 py-2 bg-accent-cyan text-white rounded-lg hover:bg-accent-cyan/90 transition-colors flex items-center gap-2 mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  Start a Discussion
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
