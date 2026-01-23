/**
 * Interactive Brokers (IBKR) Integration
 * Fetches real portfolio data from IBKR Client Portal API
 *
 * Requirements:
 * - IBKR Pro account (funded)
 * - Client Portal Gateway running locally OR OAuth 2.0 setup
 *
 * Setup Options:
 * 1. Client Portal Gateway (recommended for local dev):
 *    - Download from: https://www.interactivebrokers.com/en/trading/ib-api.php
 *    - Run gateway, authenticate via browser
 *    - Set IBKR_GATEWAY_URL=https://localhost:5000
 *
 * 2. OAuth 2.0 (for production):
 *    - Register app at IBKR
 *    - Set IBKR_CLIENT_ID, IBKR_CLIENT_SECRET
 *
 * API Docs: https://www.interactivebrokers.com/campus/ibkr-api-page/cpapi-v1/
 */

interface IBKRAccount {
  id: string
  accountId: string
  accountVan: string
  accountTitle: string
  displayName: string
  accountAlias: string
  accountStatus: number
  currency: string
  type: string
  tradingType: string
  faclient: boolean
  clearingStatus: string
  covestor: boolean
  parent: {
    mmc: string[]
    accountId: string
    isMParent: boolean
    isMChild: boolean
    isMultiplex: boolean
  }
  desc: string
}

interface IBKRPosition {
  acctId: string
  conid: number
  contractDesc: string
  position: number
  mktPrice: number
  mktValue: number
  currency: string
  avgCost: number
  avgPrice: number
  realizedPnl: number
  unrealizedPnl: number
  exchs: string | null
  expiry: string | null
  putOrCall: string | null
  multiplier: number | null
  strike: number
  exerciseStyle: string | null
  conExchMap: string[]
  assetClass: string
  undConid: number
  model: string
  time: number
  chineseName: string | null
  allExchanges: string
  listingExchange: string
  countryCode: string
  name: string
  lastTradingDay: string | null
  group: string
  sector: string
  sectorGroup: string
  ticker: string
  type: string
  undComp: string
  undSym: string
  fullName: string
  pageSize: number
  isEventContract: boolean
}

interface IBKRPnL {
  upnl: {
    [accountId: string]: {
      rowType: number
      dpl: number
      nl: number
      upl: number
      el: number
      mv: number
    }
  }
}

interface Position {
  id: string
  ticker: string
  name: string
  shares: number
  avgCost: number
  currentPrice: number
  marketValue: number
  unrealizedPnL: number
  unrealizedPnLPercent: number
  weight: number
  stopLoss?: number
  targetPrice?: number
}

interface Portfolio {
  totalValue: number
  cash: number
  cashPercent: number
  positions: Position[]
  dailyPnL: number
  dailyPnLPercent: number
  weeklyPnL: number
  weeklyPnLPercent: number
  monthlyPnL: number
  monthlyPnLPercent: number
  updatedAt: Date
  source: 'ibkr' | 'alpaca' | 'mock'
}

// Get IBKR Gateway URL (default is localhost for Client Portal Gateway)
function getGatewayUrl(): string {
  return process.env.IBKR_GATEWAY_URL || 'https://localhost:5000/v1/api'
}

// Make authenticated request to IBKR API
async function ibkrRequest<T>(endpoint: string): Promise<T | null> {
  const gatewayUrl = process.env.IBKR_GATEWAY_URL

  if (!gatewayUrl) {
    return null
  }

  try {
    const baseUrl = getGatewayUrl()
    const response = await fetch(`${baseUrl}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'WealthCouncil/1.0',
      },
      // IBKR Gateway uses self-signed certs in dev
      // @ts-ignore - Next.js specific option
      rejectUnauthorized: false,
    })

    if (!response.ok) {
      console.error(`IBKR API error: ${response.status} ${response.statusText}`)
      return null
    }

    return response.json()
  } catch (error) {
    console.error('IBKR request error:', error)
    return null
  }
}

/**
 * Check authentication status
 */
export async function checkAuthStatus(): Promise<{ authenticated: boolean; competing: boolean; connected: boolean } | null> {
  return ibkrRequest('/iserver/auth/status')
}

/**
 * Get list of accounts
 */
export async function fetchAccounts(): Promise<IBKRAccount[] | null> {
  return ibkrRequest<IBKRAccount[]>('/portfolio/accounts')
}

/**
 * Get positions for an account
 */
export async function fetchPositions(accountId: string): Promise<IBKRPosition[] | null> {
  // pageId=0 returns all positions
  return ibkrRequest<IBKRPosition[]>(`/portfolio/${accountId}/positions/0`)
}

/**
 * Get P&L summary
 */
export async function fetchPnL(): Promise<IBKRPnL | null> {
  return ibkrRequest<IBKRPnL>('/iserver/account/pnl/partitioned')
}

/**
 * Keep session alive (call periodically)
 */
export async function tickle(): Promise<boolean> {
  const result = await ibkrRequest('/tickle')
  return result !== null
}

/**
 * Check if IBKR is configured
 */
export function isIBKRConfigured(): boolean {
  return !!process.env.IBKR_GATEWAY_URL
}

/**
 * ETF name mapping (same as Alpaca)
 */
const ETF_NAMES: Record<string, string> = {
  TLT: 'iShares 20+ Year Treasury Bond ETF',
  TMV: 'Direxion Daily 20+ Yr Trsy Bear 3X',
  TBT: 'ProShares UltraShort 20+ Year Treasury',
  TBF: 'ProShares Short 20+ Year Treasury',
  TMF: 'Direxion Daily 20+ Yr Trsy Bull 3X',
  IEF: 'iShares 7-10 Year Treasury Bond ETF',
  SHY: 'iShares 1-3 Year Treasury Bond ETF',
  ZROZ: 'PIMCO 25+ Year Zero Coupon US Treasury',
}

/**
 * Fetch complete portfolio from IBKR
 */
export async function fetchIBKRPortfolio(): Promise<Portfolio | null> {
  if (!isIBKRConfigured()) {
    console.log('IBKR not configured, skipping')
    return null
  }

  console.log('Fetching portfolio from IBKR...')

  try {
    // Check auth status first
    const authStatus = await checkAuthStatus()
    if (!authStatus?.authenticated) {
      console.error('IBKR not authenticated. Please login via Client Portal Gateway.')
      return null
    }

    // Get accounts
    const accounts = await fetchAccounts()
    if (!accounts || accounts.length === 0) {
      console.error('No IBKR accounts found')
      return null
    }

    const primaryAccount = accounts[0]
    const accountId = primaryAccount.accountId

    // Fetch positions and P&L in parallel
    const [ibkrPositions, pnlData] = await Promise.all([
      fetchPositions(accountId),
      fetchPnL(),
    ])

    if (!ibkrPositions) {
      console.error('Failed to fetch IBKR positions')
      return null
    }

    // Calculate totals
    let totalMarketValue = 0
    const positions: Position[] = ibkrPositions.map((p, index) => {
      totalMarketValue += p.mktValue
      const costBasis = p.avgCost * p.position
      const unrealizedPnLPercent = costBasis > 0 ? (p.unrealizedPnl / costBasis) * 100 : 0

      return {
        id: `ibkr-${p.conid}`,
        ticker: p.ticker || p.contractDesc,
        name: ETF_NAMES[p.ticker] || p.fullName || p.contractDesc,
        shares: p.position,
        avgCost: p.avgCost,
        currentPrice: p.mktPrice,
        marketValue: p.mktValue,
        unrealizedPnL: p.unrealizedPnl,
        unrealizedPnLPercent,
        weight: 0, // Will be calculated after we know total
      }
    })

    // Get P&L data for the account
    const accountPnL = pnlData?.upnl?.[accountId]
    const dailyPnL = accountPnL?.dpl || 0
    const netLiquidity = accountPnL?.nl || totalMarketValue

    // Estimate cash (net liquidity minus market value of positions)
    const cash = netLiquidity - totalMarketValue
    const totalValue = netLiquidity
    const cashPercent = totalValue > 0 ? (cash / totalValue) * 100 : 0

    // Calculate weights
    positions.forEach(p => {
      p.weight = totalValue > 0 ? (p.marketValue / totalValue) * 100 : 0
    })

    // Calculate daily P&L percent
    const previousValue = totalValue - dailyPnL
    const dailyPnLPercent = previousValue > 0 ? (dailyPnL / previousValue) * 100 : 0

    console.log(`✓ IBKR portfolio fetched: $${totalValue.toFixed(2)} with ${positions.length} positions`)

    return {
      totalValue,
      cash,
      cashPercent,
      positions,
      dailyPnL,
      dailyPnLPercent,
      weeklyPnL: 0, // IBKR doesn't provide this directly
      weeklyPnLPercent: 0,
      monthlyPnL: 0,
      monthlyPnLPercent: 0,
      updatedAt: new Date(),
      source: 'ibkr',
    }
  } catch (error) {
    console.error('Error fetching IBKR portfolio:', error)
    return null
  }
}

export type { IBKRAccount, IBKRPosition, Portfolio, Position }
