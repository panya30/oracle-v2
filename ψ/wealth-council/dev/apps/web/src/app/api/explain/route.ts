/**
 * Explain API Route
 * ATHENA - Strategy explanation service
 */

import { NextRequest, NextResponse } from 'next/server'

// Knowledge base for common terms
const knowledgeBase: Record<string, string> = {
  // Bond terms
  'yield': 'Yield is the annual return on a bond investment, expressed as a percentage. When yields rise, bond prices fall (inverse relationship). For the 30x thesis, rising yields are bullish for inverse Treasury ETFs like TMV and TBT.',

  'duration': 'Duration measures a bond\'s sensitivity to interest rate changes. A duration of 15 means a 1% yield increase causes ~15% price drop. TLT has ~16.5 years duration, making it highly sensitive to rate changes.',

  'yield curve': 'The yield curve plots bond yields across different maturities. A "normal" curve slopes upward (longer = higher yield). An "inverted" curve (short rates > long rates) often signals recession. A "steepening" curve is bullish for the 30x thesis.',

  'spread': 'The spread is the difference between two yields, often 2Y-10Y or 10Y-30Y. A widening spread (steepening curve) suggests investors demand more compensation for holding longer bonds - bullish for the 30x thesis.',

  'basis point': 'A basis point (bp) equals 0.01%. So 100bp = 1%. When yields move 7bp, that\'s a 0.07% change. Small in absolute terms, but significant for leveraged positions.',

  // ETF terms
  'tmv': 'TMV (Direxion Daily 20+ Year Treasury Bear 3X) provides 3x inverse daily returns of 20+ year Treasuries. If TLT falls 1%, TMV should rise ~3%. HIGH RISK due to leverage decay and volatility.',

  'tbt': 'TBT (ProShares UltraShort 20+ Year Treasury) provides 2x inverse daily returns. Less aggressive than TMV but still leveraged. Good for core positions with moderate risk tolerance.',

  'tbf': 'TBF (ProShares Short 20+ Year Treasury) provides 1x inverse returns. No leverage, lowest risk inverse Treasury ETF. Suitable for conservative exposure to the thesis.',

  'tlt': 'TLT (iShares 20+ Year Treasury Bond ETF) tracks long-term US Treasuries. For the 30x thesis, TLT falling is the goal. Can also buy puts on TLT for leveraged bearish exposure.',

  // Market terms
  'bond vigilantes': 'Bond vigilantes are investors who sell bonds to protest fiscal irresponsibility. When governments overspend, vigilantes demand higher yields, forcing rates up. Their return is a key catalyst for the 30x thesis.',

  'fed': 'The Federal Reserve controls short-term interest rates and monetary policy. While the Fed controls the front-end of the curve, bond vigilantes can force long-end yields higher regardless of Fed policy.',

  'fomc': 'The Federal Open Market Committee meets 8x per year to set interest rates. FOMC decisions and Powell\'s press conferences cause significant market volatility. Always reduce leverage before FOMC.',

  'fiscal dominance': 'Fiscal dominance occurs when government debt is so large that the Fed cannot raise rates without causing a debt spiral. This limits Fed\'s ability to fight inflation, potentially bullish for gold and bearish for bonds.',

  // Risk terms
  'stop loss': 'A stop loss is an automatic sell order when price hits a set level. CRITICAL for leveraged positions. TMV stops should be tight (~15% below entry) due to 3x leverage amplifying losses.',

  'var': 'Value at Risk (VaR) estimates maximum portfolio loss at a given confidence level. VaR 95% of $850 means 95% confident daily loss won\'t exceed $850. Used by TYCHE for risk management.',

  'position sizing': 'Position sizing determines how much capital to allocate per trade. Rule: No single position > 25% of portfolio. Scale in gradually (25% → 50% → 75% → 100%) as thesis confirms.',

  'leverage': 'Leverage amplifies both gains AND losses. 3x leverage (TMV) means a 10% move becomes 30%. Use smaller position sizes with higher leverage. Never use leverage without stop losses.',

  // Thesis terms
  '30x': 'The 30x thesis targets 30x returns by betting against long-term US Treasury bonds. The premise: US debt is unsustainable, bond vigilantes will return, yields will spike, and inverse Treasury ETFs will soar.',

  'thesis': 'Our investment thesis: US government debt (~$36T) is unsustainable. When bond markets lose confidence, yields spike and bond prices crash. Positioning in inverse Treasury ETFs (TMV, TBT) captures this move.',

  'crisis mode': 'Crisis mode activates when 10Y yield > 5% or 30Y yield > 5%. This signals bond market stress. In crisis mode: maximum position sizes, tighter stops, high alert for Fed intervention.',

  // Agent terms
  'argus': 'ARGUS ("The Giant with 100 Eyes") is the portfolio monitoring agent. Tracks positions, calculates P&L, triggers alerts, and generates daily summaries. Always watching your portfolio.',

  'hermes': 'HERMES ("Messenger God") is the research agent. Monitors yields, macro data, Fed policy, and news. Provides the daily brief and thesis status analysis.',

  'delphi': 'DELPHI ("Oracle") is the technical analysis agent. Generates entry/exit signals, identifies support/resistance, calculates indicators (RSI, MACD), and sets price targets.',

  'tyche': 'TYCHE ("Goddess of Fortune") is the risk management agent. Enforces position limits, calculates VaR, monitors correlation, and prevents over-concentration.',

  'plutus': 'PLUTUS ("God of Wealth") is the Chief Investment Officer. Makes final trading decisions, coordinates agents, approves large trades, and maintains overall strategy.',

  'athena': 'ATHENA ("Goddess of Wisdom") is the strategy agent. Synthesizes inputs from all agents, explains concepts, and provides strategic guidance. (That\'s me explaining this to you!)',
}

// Generate explanation
function generateExplanation(text: string): string {
  const lowerText = text.toLowerCase()

  // Direct match in knowledge base
  for (const [term, explanation] of Object.entries(knowledgeBase)) {
    if (lowerText.includes(term.toLowerCase())) {
      return explanation
    }
  }

  // Context-aware explanations
  if (lowerText.includes('%') && (lowerText.includes('yield') || lowerText.includes('rate'))) {
    return `This appears to be a yield or rate value. In bond markets, yields move inversely to prices. A yield of ${text} means investors earn that annual return on the bond. For 10Y Treasury, yields above 4.5% are considered elevated and supportive of the 30x thesis.`
  }

  if (lowerText.includes('$') || lowerText.match(/\d+[,.]?\d*/)) {
    return `This appears to be a price or monetary value. In portfolio management, tracking exact values helps calculate P&L, position weights, and risk exposure. Always compare current values to your cost basis and stop loss levels.`
  }

  if (lowerText.includes('bullish') || lowerText.includes('bearish')) {
    const direction = lowerText.includes('bullish') ? 'bullish' : 'bearish'
    return `"${direction.charAt(0).toUpperCase() + direction.slice(1)}" indicates market direction expectation. For the 30x thesis, "bullish" means we expect inverse Treasury ETFs (TMV, TBT) to rise, which happens when bond yields increase and bond prices fall.`
  }

  if (lowerText.includes('signal') || lowerText.includes('alert')) {
    return `Signals and alerts are notifications from the Wealth Council agents. DELPHI generates trading signals (entry/exit points), while ARGUS monitors for price alerts and risk warnings. Always review signals in context of the overall thesis.`
  }

  if (lowerText.includes('risk') || lowerText.includes('limit')) {
    return `Risk management is crucial for leveraged trading. TYCHE enforces limits: max 25% single position, max 60% total exposure, min 10% cash. These rules prevent catastrophic losses and ensure you can capitalize on opportunities.`
  }

  // Default explanation
  return `"${text}" is a term or phrase used in the Wealth Council platform.

In the context of the 30x Bond Play thesis:
• If it relates to yields/bonds: Higher yields = bullish for our thesis
• If it relates to positions: Always check against stop losses
• If it relates to risk: Follow TYCHE's guidelines strictly

For more context, check the Guide page or consult the glossary.`
}

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Text is required' },
        { status: 400 }
      )
    }

    // Clean and truncate text
    const cleanText = text.trim().slice(0, 500)

    // Generate explanation
    const explanation = generateExplanation(cleanText)

    return NextResponse.json({
      success: true,
      explanation,
      term: cleanText,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Explain API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate explanation' },
      { status: 500 }
    )
  }
}
