'use client'

import { useState } from 'react'
import {
  BookOpen,
  Target,
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  Newspaper,
  Activity,
  Shield,
  Bell,
  ChevronRight,
  ChevronDown,
  Zap,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Lightbulb,
  BarChart3,
  Clock,
  Compass,
} from 'lucide-react'

// Sections data
const sections = [
  {
    id: 'overview',
    title: 'Platform Overview',
    icon: Compass,
    content: `
The **Panya Wealth Council** is your AI-powered investment command center, specifically designed for the **30x Bond Play** strategy.

### What is the 30x Bond Play?

The thesis is simple: **US government debt is unsustainable**. When bond markets crack, yields spike and bond prices crash. By positioning in inverse Treasury ETFs, we can potentially capture 20-30x returns during this inevitable crisis.

### Key Instruments

| Ticker | Name | Leverage | Use Case |
|--------|------|----------|----------|
| **TMV** | Direxion 20+ Yr Treasury Bear 3X | 3x | Maximum conviction plays |
| **TBT** | ProShares UltraShort 20+ Year | 2x | Core position |
| **TBF** | ProShares Short 20+ Year | 1x | Conservative exposure |
| **TLT** | iShares 20+ Year Treasury | Long | Watch for shorts/puts |

### The Golden Rule

> **Yield ↑ = Bond Price ↓ = Inverse ETF ↑**

When the 10Y yield rises from 4% to 5%, that's a 25% move. With 3x leverage (TMV), that becomes a potential 75%+ gain.
    `,
  },
  {
    id: 'agents',
    title: 'Meet Your Agents',
    icon: Users,
    content: `
The Wealth Council consists of specialized AI agents, each with a specific role:

### 🏛️ PLUTUS - Chief Investment Officer
*"God of Wealth"*
- Makes final trading decisions
- Coordinates all other agents
- Approves position changes

### 📊 HERMES - Research Analyst
*"Messenger of the Gods"*
- Monitors Treasury yields in real-time
- Tracks macro economic data
- Aggregates market news
- Analyzes Fed policy

### 🔮 DELPHI - Technical Analyst
*"Oracle of Delphi"*
- Generates entry/exit signals
- Identifies support & resistance levels
- Calculates RSI, MACD, moving averages
- Sets price targets and stop losses

### ⚖️ TYCHE - Risk Manager
*"Goddess of Fortune"*
- Monitors portfolio risk exposure
- Enforces position limits
- Calculates Value at Risk (VaR)
- Prevents overconcentration

### 👁️ ARGUS - Portfolio Monitor
*"The Giant with 100 Eyes"*
- Tracks all positions in real-time
- Calculates P&L continuously
- Triggers alerts for price moves
- Generates daily summaries

### Agent Communication Flow

\`\`\`
HERMES (Data) → DELPHI (Signals) → PLUTUS (Decisions)
                                         ↓
ARGUS (Monitor) ← TYCHE (Risk Check) ←──┘
\`\`\`
    `,
  },
  {
    id: 'dashboard',
    title: 'Using the Dashboard',
    icon: BarChart3,
    content: `
The **Dashboard** is your mission control. Here's what to watch:

### Top Metrics Bar (Header)
- **10Y / 30Y Yields** - The most important numbers. Rising = bullish for thesis
- **TLT Price** - Bond ETF price. Falling = bullish for thesis
- **TMV Price** - Your main instrument. Rising = profit
- **Market Status** - Open/Closed indicator

### Portfolio Value Cards
- **Total Value** - Your entire portfolio worth
- **Invested** - Capital deployed in positions
- **Cash** - Dry powder for opportunities
- **Weekly P&L** - Performance this week

### Positions Table
Shows all active positions with:
- Current price and unrealized P&L
- Portfolio weight (aim for <25% per position)
- Stop loss levels (CRITICAL - never ignore)

### Thesis Status Panel
- **BULLISH** (Green) - Thesis is playing out, yields rising
- **NEUTRAL** (Yellow) - Mixed signals, be patient
- **BEARISH** (Red) - Thesis challenged, reduce exposure

### Treasury Yields Panel
Visual representation of the yield curve:
- Watch for **curve steepening** (bullish for thesis)
- **2Y-10Y spread** turning positive = recession signal

### Alerts Panel
Real-time notifications from ARGUS:
- ⚠️ Warning - Price approaching key levels
- ✅ Success - Targets achieved
- ℹ️ Info - General updates
    `,
  },
  {
    id: 'signals',
    title: 'Reading Signals',
    icon: Activity,
    content: `
The **Signals** page shows DELPHI's technical analysis. Here's how to interpret it:

### Signal Types

| Type | Icon | Meaning |
|------|------|---------|
| **Entry** | 🟢 | Good time to open/add position |
| **Exit** | 🟡 | Consider taking profits |
| **Warning** | 🔵 | Monitor closely, setup forming |

### Signal Strength

- **Strong** - High conviction, multiple confirmations
- **Moderate** - Decent setup, some risk
- **Weak** - Speculative, small position only

### Key Levels to Watch

For each instrument, DELPHI tracks:
- **Resistance Levels (R1, R2, R3)** - Price ceilings, potential sell zones
- **Support Levels (S1, S2, S3)** - Price floors, potential buy zones

### Technical Indicators

| Indicator | Bullish Signal | Bearish Signal |
|-----------|----------------|----------------|
| **RSI** | Below 30 (oversold) | Above 70 (overbought) |
| **MACD** | Crossing above signal | Crossing below signal |
| **Price vs 50 SMA** | Above = uptrend | Below = downtrend |
| **Price vs 200 SMA** | Above = bull market | Below = bear market |

### Yield Triggers

These are the key yield levels that trigger action:
- **10Y > 4.50%** - Add to positions
- **10Y > 5.00%** - Crisis mode, maximum position
- **30Y > 5.00%** - Bond vigilantes active
- **TLT < $85** - Strong confirmation
    `,
  },
  {
    id: 'research',
    title: 'Research & Analysis',
    icon: Newspaper,
    content: `
The **Research** page is HERMES's domain. It provides macro context for your trades.

### Daily Brief
Start every session by reading the daily brief. It summarizes:
- Overnight yield movements
- Key news affecting bonds
- Current thesis status
- Trading recommendation

### Macro Economic Data

| Metric | Why It Matters |
|--------|----------------|
| **Fed Funds Rate** | Higher = bearish for bonds |
| **CPI (Inflation)** | Higher = Fed stays hawkish |
| **Unemployment** | Lower = Fed can stay tight |
| **GDP Growth** | Higher = less need for cuts |
| **Debt/GDP** | Higher = more bond supply |

### Yield Curve Analysis

The shape of the yield curve tells a story:
- **Normal (upward)** - Economy healthy, long rates higher
- **Flat** - Uncertainty, possible transition
- **Inverted** - Recession signal, short rates higher

For the 30x thesis, we want a **bear steepener**:
- Long-term yields rising faster than short-term
- This means investors demanding more compensation for holding long bonds
- Classic sign of fiscal concerns

### News Sentiment

Each news item is tagged:
- 🔴 **Negative** (for bonds) - Bullish for thesis
- 🟢 **Positive** (for bonds) - Bearish for thesis
- 🟡 **Neutral** - No immediate impact

**High relevance** news items should be read carefully.
    `,
  },
  {
    id: 'workflow',
    title: 'Daily Workflow',
    icon: Clock,
    content: `
Follow this routine for optimal results:

### Morning Check (Before Market Open)

1. **Check overnight yields** - Header shows latest 10Y/30Y
2. **Read Daily Brief** - Research page summary
3. **Review alerts** - Any overnight notifications
4. **Check thesis status** - Still bullish?

### During Market Hours

1. **Monitor positions** - Dashboard positions table
2. **Watch for signals** - Signals page for entry/exit
3. **Track yield moves** - Any significant spikes?
4. **News check** - Research page for breaking news

### End of Day

1. **Review P&L** - How did positions perform?
2. **Check stop losses** - Any need adjustment?
3. **Note key levels** - What's the setup for tomorrow?

### Weekly Review

1. **Performance analysis** - Weekly P&L trend
2. **Position sizing** - Rebalance if needed
3. **Thesis check** - Has anything changed?
4. **Risk review** - Are limits being respected?

### Key Rules

✅ **DO:**
- Scale in slowly (25% → 50% → 75% → 100%)
- Use stop losses religiously
- Take partial profits at targets
- Keep 30%+ in cash

❌ **DON'T:**
- Go all-in at once
- Remove stop losses "just this once"
- Chase after big moves
- Use money you can't afford to lose
    `,
  },
  {
    id: 'risk',
    title: 'Risk Management',
    icon: Shield,
    content: `
Risk management is how we survive to win. TYCHE enforces these rules:

### Position Limits

| Rule | Limit | Why |
|------|-------|-----|
| Max single position | 25% | No single bet can kill you |
| Max total exposure | 60% | Always keep dry powder |
| Min cash reserve | 10% | Emergency fund |
| Max daily loss | 10% | Live to fight another day |

### Stop Loss Strategy

Every position MUST have a stop loss:

| Position Type | Stop Loss | Rationale |
|---------------|-----------|-----------|
| TMV (3x) | -15% from entry | Leveraged = tighter stops |
| TBT (2x) | -12% from entry | Medium leverage |
| TBF (1x) | -10% from entry | Lower leverage = wider |

### Scaling Rules

**Entry Scaling:**
1. Initial: 25% of planned position
2. Confirmation: Add 25% on thesis confirmation
3. Momentum: Add 25% on breakout
4. Full: Final 25% on strong signal

**Exit Scaling:**
1. First target: Sell 33% (lock in profits)
2. Second target: Sell 33% (reduce risk)
3. Final: Trail stop on remaining 34%

### Semi-Autonomous Execution

The system can auto-execute if ALL conditions met:
- Position size < 5% of portfolio
- Stop loss defined
- Risk/Reward > 2:1
- TYCHE approval

Larger trades always require human approval.
    `,
  },
  {
    id: 'alerts',
    title: 'Understanding Alerts',
    icon: Bell,
    content: `
ARGUS monitors everything and sends alerts when action is needed:

### Alert Levels

| Level | Color | Action Required |
|-------|-------|-----------------|
| **Danger** | 🔴 Red | Immediate attention |
| **Warning** | 🟡 Yellow | Review soon |
| **Info** | 🔵 Blue | FYI, no action needed |
| **Success** | 🟢 Green | Good news |

### Common Alerts

**Price Alerts:**
- "TMV approaching first target" → Consider partial profit
- "TLT broke support at $88" → Thesis confirmation
- "Stop loss triggered on TBT" → Position closed automatically

**Yield Alerts:**
- "10Y yield above 4.50%" → Add to positions
- "30Y approaching 5.00%" → Crisis zone, max alert
- "Yield curve steepening" → Bullish signal

**Risk Alerts:**
- "Position size exceeds 25% limit" → Rebalance needed
- "Daily loss approaching 7%" → Reduce exposure
- "Cash below 15% threshold" → Stop new entries

### Alert Actions

When you see an alert:
1. **Read carefully** - Understand what triggered it
2. **Check context** - Look at related data
3. **Decide action** - Trade, wait, or dismiss
4. **Acknowledge** - Clear the alert

Never ignore danger alerts. They exist to protect you.
    `,
  },
  {
    id: 'glossary',
    title: 'Glossary',
    icon: BookOpen,
    content: `
### Bond Market Terms

| Term | Definition |
|------|------------|
| **Yield** | Annual return on a bond, expressed as % |
| **Duration** | Sensitivity to interest rate changes |
| **Yield Curve** | Graph of yields across maturities |
| **Spread** | Difference between two yields |
| **Basis Point (bp)** | 0.01%, so 100bp = 1% |

### Trading Terms

| Term | Definition |
|------|------------|
| **Long** | Betting price will rise |
| **Short** | Betting price will fall |
| **Inverse ETF** | Rises when underlying falls |
| **Leverage** | Multiplied exposure (2x, 3x) |
| **Stop Loss** | Auto-sell to limit losses |

### Technical Terms

| Term | Definition |
|------|------------|
| **RSI** | Relative Strength Index (0-100) |
| **MACD** | Trend momentum indicator |
| **SMA** | Simple Moving Average |
| **Support** | Price level where buying emerges |
| **Resistance** | Price level where selling emerges |

### Thesis-Specific Terms

| Term | Definition |
|------|------------|
| **Bond Vigilantes** | Investors who sell bonds to protest fiscal policy |
| **Bear Steepener** | Long yields rising faster than short |
| **Fiscal Dominance** | When debt forces Fed's hand |
| **Term Premium** | Extra yield for holding long bonds |
| **Flight to Quality** | Rush to safe assets (usually bullish for bonds) |

### Agent Terms

| Term | Definition |
|------|------------|
| **MCP** | Model Context Protocol - how agents communicate |
| **Semi-Autonomous** | Auto-executes small trades, asks for big ones |
| **Confidence Score** | Agent's certainty level (0-100%) |
| **Thesis Status** | Current assessment of the 30x play |
    `,
  },
]

function SectionContent({ content }: { content: string }) {
  // Simple markdown-like rendering
  const lines = content.trim().split('\n')
  const elements: JSX.Element[] = []
  let inTable = false
  let tableRows: string[][] = []
  let inCodeBlock = false
  let codeContent: string[] = []

  lines.forEach((line, i) => {
    // Code blocks
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre key={i} className="bg-palantir-bg p-4 rounded-lg overflow-x-auto text-sm font-mono my-4">
            {codeContent.join('\n')}
          </pre>
        )
        codeContent = []
        inCodeBlock = false
      } else {
        inCodeBlock = true
      }
      return
    }

    if (inCodeBlock) {
      codeContent.push(line)
      return
    }

    // Tables
    if (line.startsWith('|')) {
      if (!inTable) {
        inTable = true
        tableRows = []
      }
      if (!line.includes('---')) {
        tableRows.push(line.split('|').filter(cell => cell.trim()).map(cell => cell.trim()))
      }
      return
    } else if (inTable) {
      // End of table
      elements.push(
        <div key={i} className="overflow-x-auto my-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-palantir-border">
                {tableRows[0]?.map((cell, j) => (
                  <th key={j} className="text-left py-2 px-3 text-text-muted font-medium">{cell}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.slice(1).map((row, ri) => (
                <tr key={ri} className="border-b border-palantir-border/50">
                  {row.map((cell, ci) => (
                    <td key={ci} className="py-2 px-3">
                      <span dangerouslySetInnerHTML={{ __html: cell.replace(/\*\*(.*?)\*\*/g, '<strong class="text-accent-cyan">$1</strong>') }} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
      inTable = false
      tableRows = []
    }

    // Headers
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={i} className="text-lg font-semibold text-text-primary mt-6 mb-3 flex items-center gap-2">
          {line.replace('### ', '')}
        </h3>
      )
      return
    }

    // Blockquotes
    if (line.startsWith('> ')) {
      elements.push(
        <blockquote key={i} className="border-l-2 border-accent-cyan pl-4 py-2 my-4 bg-accent-cyan/5 rounded-r-lg">
          <p className="text-text-primary italic" dangerouslySetInnerHTML={{
            __html: line.replace('> ', '').replace(/\*\*(.*?)\*\*/g, '<strong class="text-accent-cyan">$1</strong>')
          }} />
        </blockquote>
      )
      return
    }

    // List items
    if (line.startsWith('- ') || line.match(/^\d+\. /)) {
      const content = line.replace(/^[-\d.]\s*/, '')
      elements.push(
        <li key={i} className="ml-4 text-text-secondary py-1" dangerouslySetInnerHTML={{
          __html: content
            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-text-primary">$1</strong>')
            .replace(/`(.*?)`/g, '<code class="bg-palantir-bg px-1 rounded text-accent-cyan">$1</code>')
        }} />
      )
      return
    }

    // Checkboxes
    if (line.startsWith('✅') || line.startsWith('❌')) {
      elements.push(
        <div key={i} className={`flex items-start gap-2 py-1 ${line.startsWith('✅') ? 'text-status-success' : 'text-status-danger'}`}>
          <span>{line.slice(0, 2)}</span>
          <span className="text-text-secondary" dangerouslySetInnerHTML={{
            __html: line.slice(2).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          }} />
        </div>
      )
      return
    }

    // Regular paragraphs
    if (line.trim()) {
      elements.push(
        <p key={i} className="text-text-secondary my-3 leading-relaxed" dangerouslySetInnerHTML={{
          __html: line
            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-text-primary">$1</strong>')
            .replace(/`(.*?)`/g, '<code class="bg-palantir-bg px-1 rounded text-accent-cyan text-sm">$1</code>')
        }} />
      )
    }
  })

  // Handle remaining table
  if (inTable && tableRows.length > 0) {
    elements.push(
      <div key="final-table" className="overflow-x-auto my-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-palantir-border">
              {tableRows[0]?.map((cell, j) => (
                <th key={j} className="text-left py-2 px-3 text-text-muted font-medium">{cell}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableRows.slice(1).map((row, ri) => (
              <tr key={ri} className="border-b border-palantir-border/50">
                {row.map((cell, ci) => (
                  <td key={ci} className="py-2 px-3">
                    <span dangerouslySetInnerHTML={{ __html: cell.replace(/\*\*(.*?)\*\*/g, '<strong class="text-accent-cyan">$1</strong>') }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return <div>{elements}</div>
}

export default function GuidePage() {
  const [activeSection, setActiveSection] = useState('overview')
  const [expandedSections, setExpandedSections] = useState<string[]>(['overview'])

  const toggleSection = (id: string) => {
    setActiveSection(id)
    setExpandedSections(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  const currentSection = sections.find(s => s.id === activeSection)

  return (
    <div className="space-y-6 animate-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary flex items-center gap-3">
            <BookOpen className="w-7 h-7 text-accent-cyan" />
            How to Use Wealth Council
          </h1>
          <p className="text-sm text-text-secondary mt-1">Your guide to mastering the 30x Bond Play</p>
        </div>
      </div>

      {/* Quick Start Banner */}
      <div className="card p-6 glow-border">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-gradient-to-br from-accent-cyan/20 to-accent-blue/20">
            <Lightbulb className="w-6 h-6 text-accent-cyan" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-lg mb-2">Quick Start Guide</h2>
            <div className="grid grid-cols-4 gap-4 mt-4">
              <div className="flex items-center gap-3 p-3 bg-palantir-bg rounded-lg">
                <div className="w-8 h-8 rounded-full bg-accent-cyan/20 flex items-center justify-center text-accent-cyan font-bold">1</div>
                <div>
                  <p className="text-sm font-medium">Read Daily Brief</p>
                  <p className="text-xs text-text-muted">Research page</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-palantir-bg rounded-lg">
                <div className="w-8 h-8 rounded-full bg-accent-cyan/20 flex items-center justify-center text-accent-cyan font-bold">2</div>
                <div>
                  <p className="text-sm font-medium">Check Signals</p>
                  <p className="text-xs text-text-muted">Entry/Exit points</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-palantir-bg rounded-lg">
                <div className="w-8 h-8 rounded-full bg-accent-cyan/20 flex items-center justify-center text-accent-cyan font-bold">3</div>
                <div>
                  <p className="text-sm font-medium">Monitor Dashboard</p>
                  <p className="text-xs text-text-muted">Track positions</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-palantir-bg rounded-lg">
                <div className="w-8 h-8 rounded-full bg-accent-cyan/20 flex items-center justify-center text-accent-cyan font-bold">4</div>
                <div>
                  <p className="text-sm font-medium">Review Alerts</p>
                  <p className="text-xs text-text-muted">Act on signals</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <div className="col-span-1">
          <div className="card p-0 sticky top-6">
            <div className="p-4 border-b border-palantir-border">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-text-muted">Contents</h3>
            </div>
            <nav className="p-2">
              {sections.map((section) => {
                const Icon = section.icon
                const isActive = activeSection === section.id
                return (
                  <button
                    key={section.id}
                    onClick={() => toggleSection(section.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      isActive
                        ? 'bg-accent-cyan/10 text-accent-cyan'
                        : 'text-text-secondary hover:bg-palantir-bg-hover hover:text-text-primary'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">{section.title}</span>
                    {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="col-span-3">
          <div className="card p-6">
            {currentSection && (
              <>
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-palantir-border">
                  <div className="p-2 rounded-lg bg-accent-cyan/20">
                    <currentSection.icon className="w-6 h-6 text-accent-cyan" />
                  </div>
                  <h2 className="text-xl font-semibold">{currentSection.title}</h2>
                </div>
                <SectionContent content={currentSection.content} />
              </>
            )}

            {/* Navigation Footer */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-palantir-border">
              {sections.findIndex(s => s.id === activeSection) > 0 && (
                <button
                  onClick={() => {
                    const currentIndex = sections.findIndex(s => s.id === activeSection)
                    if (currentIndex > 0) {
                      setActiveSection(sections[currentIndex - 1].id)
                    }
                  }}
                  className="flex items-center gap-2 text-text-secondary hover:text-accent-cyan transition-colors"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                  Previous: {sections[sections.findIndex(s => s.id === activeSection) - 1]?.title}
                </button>
              )}
              <div className="flex-1" />
              {sections.findIndex(s => s.id === activeSection) < sections.length - 1 && (
                <button
                  onClick={() => {
                    const currentIndex = sections.findIndex(s => s.id === activeSection)
                    if (currentIndex < sections.length - 1) {
                      setActiveSection(sections[currentIndex + 1].id)
                    }
                  }}
                  className="flex items-center gap-2 text-accent-cyan hover:text-accent-cyan/80 transition-colors"
                >
                  Next: {sections[sections.findIndex(s => s.id === activeSection) + 1]?.title}
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
