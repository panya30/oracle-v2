/**
 * Alpaca Broker Integration
 * Fetches real portfolio data from Alpaca Trading API
 *
 * Requirements:
 * - ALPACA_API_KEY: Your Alpaca API Key
 * - ALPACA_SECRET_KEY: Your Alpaca Secret Key
 * - ALPACA_PAPER: Set to 'true' for paper trading (recommended for testing)
 *
 * Get your keys at: https://app.alpaca.markets/
 */

interface AlpacaAccount {
  id: string
  account_number: string
  status: string
  currency: string
  cash: string
  portfolio_value: string
  equity: string
  buying_power: string
  last_equity: string
  multiplier: string
  pattern_day_trader: boolean
  trading_blocked: boolean
  transfers_blocked: boolean
}

interface AlpacaPosition {
  asset_id: string
  symbol: string
  exchange: string
  asset_class: string
  qty: string
  avg_entry_price: string
  side: string
  market_value: string
  cost_basis: string
  unrealized_pl: string
  unrealized_plpc: string
  unrealized_intraday_pl: string
  unrealized_intraday_plpc: string
  current_price: string
  lastday_price: string
  change_today: string
}

interface AlpacaPortfolioHistory {
  timestamp: number[]
  equity: number[]
  profit_loss: number[]
  profit_loss_pct: number[]
  base_value: number
  timeframe: string
}

interface AlpacaOrder {
  id: string
  client_order_id: string
  created_at: string
  updated_at: string
  submitted_at: string
  filled_at: string | null
  expired_at: string | null
  canceled_at: string | null
  failed_at: string | null
  asset_id: string
  symbol: string
  asset_class: string
  qty: string
  filled_qty: string
  type: 'market' | 'limit' | 'stop' | 'stop_limit' | 'trailing_stop'
  side: 'buy' | 'sell'
  time_in_force: 'day' | 'gtc' | 'opg' | 'cls' | 'ioc' | 'fok'
  limit_price: string | null
  stop_price: string | null
  filled_avg_price: string | null
  status: 'new' | 'partially_filled' | 'filled' | 'done_for_day' | 'canceled' | 'expired' | 'replaced' | 'pending_cancel' | 'pending_replace' | 'accepted' | 'pending_new' | 'accepted_without_block' | 'stopped' | 'rejected' | 'suspended' | 'calculated'
  extended_hours: boolean
  legs: AlpacaOrder[] | null
}

export interface OrderRequest {
  symbol: string
  qty: number
  side: 'buy' | 'sell'
  type: 'market' | 'limit' | 'stop' | 'stop_limit'
  time_in_force: 'day' | 'gtc' | 'opg' | 'cls' | 'ioc' | 'fok'
  limit_price?: number
  stop_price?: number
  extended_hours?: boolean
}

export interface OrderResult {
  success: boolean
  order?: AlpacaOrder
  error?: string
  message?: string
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
  source: 'alpaca' | 'mock'
}

// Get Alpaca API base URL
function getBaseUrl(): string {
  const isPaper = process.env.ALPACA_PAPER === 'true'
  return isPaper
    ? 'https://paper-api.alpaca.markets'
    : 'https://api.alpaca.markets'
}

// Get Alpaca data API base URL
function getDataUrl(): string {
  return 'https://data.alpaca.markets'
}

// Make authenticated request to Alpaca API
async function alpacaRequest<T>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'DELETE' | 'PATCH'
    body?: object
    dataApi?: boolean
  } = {}
): Promise<T | null> {
  const { method = 'GET', body, dataApi = false } = options
  const apiKey = process.env.ALPACA_API_KEY
  const secretKey = process.env.ALPACA_SECRET_KEY

  if (!apiKey || !secretKey) {
    return null
  }

  try {
    const baseUrl = dataApi ? getDataUrl() : getBaseUrl()
    const fetchOptions: RequestInit = {
      method,
      headers: {
        'APCA-API-KEY-ID': apiKey,
        'APCA-API-SECRET-KEY': secretKey,
        'Content-Type': 'application/json',
      },
    }

    if (body) {
      fetchOptions.body = JSON.stringify(body)
    }

    // Don't cache POST requests
    if (method === 'GET') {
      ;(fetchOptions as any).next = { revalidate: 60 }
    }

    const response = await fetch(`${baseUrl}${endpoint}`, fetchOptions)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Alpaca API error: ${response.status} ${response.statusText}`, errorText)
      return null
    }

    return response.json()
  } catch (error) {
    console.error('Alpaca request error:', error)
    return null
  }
}

/**
 * Fetch account information
 */
export async function fetchAccount(): Promise<AlpacaAccount | null> {
  return alpacaRequest<AlpacaAccount>('/v2/account', {})
}

/**
 * Fetch all positions
 */
export async function fetchPositions(): Promise<AlpacaPosition[] | null> {
  return alpacaRequest<AlpacaPosition[]>('/v2/positions', {})
}

/**
 * Fetch portfolio history
 */
export async function fetchPortfolioHistory(
  period: '1D' | '1W' | '1M' | '3M' | 'A'
): Promise<AlpacaPortfolioHistory | null> {
  return alpacaRequest<AlpacaPortfolioHistory>(
    `/v2/account/portfolio/history?period=${period}&timeframe=1D`,
    {}
  )
}

/**
 * Submit a new order to Alpaca
 */
export async function submitOrder(order: OrderRequest): Promise<OrderResult> {
  const apiKey = process.env.ALPACA_API_KEY
  const secretKey = process.env.ALPACA_SECRET_KEY

  if (!apiKey || !secretKey) {
    return {
      success: false,
      error: 'Alpaca not configured',
      message: 'Set ALPACA_API_KEY and ALPACA_SECRET_KEY in .env.local',
    }
  }

  console.log(`📤 Submitting ${order.side} order: ${order.qty} ${order.symbol} @ ${order.type}`)

  try {
    const baseUrl = getBaseUrl()
    const response = await fetch(`${baseUrl}/v2/orders`, {
      method: 'POST',
      headers: {
        'APCA-API-KEY-ID': apiKey,
        'APCA-API-SECRET-KEY': secretKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        symbol: order.symbol,
        qty: order.qty.toString(),
        side: order.side,
        type: order.type,
        time_in_force: order.time_in_force,
        limit_price: order.limit_price?.toString(),
        stop_price: order.stop_price?.toString(),
        extended_hours: order.extended_hours || false,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Order submission failed:', response.status, errorData)
      return {
        success: false,
        error: errorData.message || `Order failed: ${response.status}`,
        message: errorData.code || response.statusText,
      }
    }

    const alpacaOrder = await response.json() as AlpacaOrder
    console.log(`✅ Order submitted: ${alpacaOrder.id} - ${alpacaOrder.status}`)

    return {
      success: true,
      order: alpacaOrder,
      message: `Order ${alpacaOrder.id} submitted successfully`,
    }
  } catch (error) {
    console.error('Order submission error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to submit order to Alpaca',
    }
  }
}

/**
 * Get all orders (open or recent)
 */
export async function getOrders(status: 'open' | 'closed' | 'all' = 'all', limit = 50): Promise<AlpacaOrder[] | null> {
  return alpacaRequest<AlpacaOrder[]>(`/v2/orders?status=${status}&limit=${limit}`, {})
}

/**
 * Get a specific order by ID
 */
export async function getOrder(orderId: string): Promise<AlpacaOrder | null> {
  return alpacaRequest<AlpacaOrder>(`/v2/orders/${orderId}`, {})
}

/**
 * Cancel an order
 */
export async function cancelOrder(orderId: string): Promise<boolean> {
  const apiKey = process.env.ALPACA_API_KEY
  const secretKey = process.env.ALPACA_SECRET_KEY

  if (!apiKey || !secretKey) {
    return false
  }

  try {
    const baseUrl = getBaseUrl()
    const response = await fetch(`${baseUrl}/v2/orders/${orderId}`, {
      method: 'DELETE',
      headers: {
        'APCA-API-KEY-ID': apiKey,
        'APCA-API-SECRET-KEY': secretKey,
      },
    })

    return response.status === 204 || response.ok
  } catch (error) {
    console.error('Cancel order error:', error)
    return false
  }
}

/**
 * Cancel all open orders
 */
export async function cancelAllOrders(): Promise<boolean> {
  const apiKey = process.env.ALPACA_API_KEY
  const secretKey = process.env.ALPACA_SECRET_KEY

  if (!apiKey || !secretKey) {
    return false
  }

  try {
    const baseUrl = getBaseUrl()
    const response = await fetch(`${baseUrl}/v2/orders`, {
      method: 'DELETE',
      headers: {
        'APCA-API-KEY-ID': apiKey,
        'APCA-API-SECRET-KEY': secretKey,
      },
    })

    return response.ok
  } catch (error) {
    console.error('Cancel all orders error:', error)
    return false
  }
}

/**
 * Close a position (sell all shares)
 */
export async function closePosition(symbol: string): Promise<OrderResult> {
  const apiKey = process.env.ALPACA_API_KEY
  const secretKey = process.env.ALPACA_SECRET_KEY

  if (!apiKey || !secretKey) {
    return {
      success: false,
      error: 'Alpaca not configured',
    }
  }

  try {
    const baseUrl = getBaseUrl()
    const response = await fetch(`${baseUrl}/v2/positions/${symbol}`, {
      method: 'DELETE',
      headers: {
        'APCA-API-KEY-ID': apiKey,
        'APCA-API-SECRET-KEY': secretKey,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        error: errorData.message || `Close position failed: ${response.status}`,
      }
    }

    const order = await response.json() as AlpacaOrder
    return {
      success: true,
      order,
      message: `Position ${symbol} closed`,
    }
  } catch (error) {
    console.error('Close position error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Check if Alpaca is configured
 */
export function isAlpacaConfigured(): boolean {
  return !!(process.env.ALPACA_API_KEY && process.env.ALPACA_SECRET_KEY)
}

/**
 * ETF name mapping
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
 * Fetch complete portfolio from Alpaca
 */
export async function fetchAlpacaPortfolio(): Promise<Portfolio | null> {
  const apiKey = process.env.ALPACA_API_KEY
  const secretKey = process.env.ALPACA_SECRET_KEY

  if (!apiKey || !secretKey) {
    console.log('Alpaca not configured, using mock data')
    return null
  }

  console.log('Fetching portfolio from Alpaca...')

  try {
    // Fetch account and positions in parallel
    const [account, alpacaPositions, dailyHistory, weeklyHistory, monthlyHistory] =
      await Promise.all([
        fetchAccount(),
        fetchPositions(),
        fetchPortfolioHistory('1D'),
        fetchPortfolioHistory('1W'),
        fetchPortfolioHistory('1M'),
      ])

    if (!account) {
      console.error('Failed to fetch Alpaca account')
      return null
    }

    const totalValue = parseFloat(account.portfolio_value)
    const cash = parseFloat(account.cash)
    const cashPercent = (cash / totalValue) * 100

    // Convert Alpaca positions to our format
    const positions: Position[] = (alpacaPositions || []).map((p, index) => ({
      id: `alpaca-${p.asset_id}`,
      ticker: p.symbol,
      name: ETF_NAMES[p.symbol] || p.symbol,
      shares: parseFloat(p.qty),
      avgCost: parseFloat(p.avg_entry_price),
      currentPrice: parseFloat(p.current_price),
      marketValue: parseFloat(p.market_value),
      unrealizedPnL: parseFloat(p.unrealized_pl),
      unrealizedPnLPercent: parseFloat(p.unrealized_plpc) * 100,
      weight: (parseFloat(p.market_value) / totalValue) * 100,
    }))

    // Calculate P&L from history
    const lastEquity = parseFloat(account.last_equity)
    const dailyPnL = totalValue - lastEquity
    const dailyPnLPercent = (dailyPnL / lastEquity) * 100

    // Get weekly/monthly P&L from history if available
    let weeklyPnL = 0
    let weeklyPnLPercent = 0
    let monthlyPnL = 0
    let monthlyPnLPercent = 0

    if (weeklyHistory && weeklyHistory.profit_loss.length > 0) {
      weeklyPnL = weeklyHistory.profit_loss.reduce((sum, pl) => sum + pl, 0)
      weeklyPnLPercent = weeklyHistory.profit_loss_pct.reduce((sum, pct) => sum + pct, 0) * 100
    }

    if (monthlyHistory && monthlyHistory.profit_loss.length > 0) {
      monthlyPnL = monthlyHistory.profit_loss.reduce((sum, pl) => sum + pl, 0)
      monthlyPnLPercent = monthlyHistory.profit_loss_pct.reduce((sum, pct) => sum + pct, 0) * 100
    }

    console.log(`✓ Alpaca portfolio fetched: $${totalValue.toFixed(2)} with ${positions.length} positions`)

    return {
      totalValue,
      cash,
      cashPercent,
      positions,
      dailyPnL,
      dailyPnLPercent,
      weeklyPnL,
      weeklyPnLPercent,
      monthlyPnL,
      monthlyPnLPercent,
      updatedAt: new Date(),
      source: 'alpaca',
    }
  } catch (error) {
    console.error('Error fetching Alpaca portfolio:', error)
    return null
  }
}

/**
 * Submit a bracket order (entry + stop loss + take profit)
 * This creates an OCO (one-cancels-other) order set
 */
export async function submitBracketOrder(params: {
  symbol: string
  qty: number
  side: 'buy' | 'sell'
  entryPrice?: number // Limit price for entry (market if not provided)
  stopLossPrice: number
  takeProfitPrice: number
  extended_hours?: boolean
}): Promise<OrderResult> {
  const apiKey = process.env.ALPACA_API_KEY
  const secretKey = process.env.ALPACA_SECRET_KEY

  if (!apiKey || !secretKey) {
    return {
      success: false,
      error: 'Alpaca not configured',
    }
  }

  console.log(`📤 Submitting bracket order: ${params.side} ${params.qty} ${params.symbol}`)
  console.log(`   Entry: ${params.entryPrice ? `$${params.entryPrice}` : 'market'}, SL: $${params.stopLossPrice}, TP: $${params.takeProfitPrice}`)

  try {
    const baseUrl = getBaseUrl()
    const orderBody: any = {
      symbol: params.symbol,
      qty: params.qty.toString(),
      side: params.side,
      type: params.entryPrice ? 'limit' : 'market',
      time_in_force: 'gtc', // Good til cancelled for bracket orders
      order_class: 'bracket',
      stop_loss: {
        stop_price: params.stopLossPrice.toString(),
      },
      take_profit: {
        limit_price: params.takeProfitPrice.toString(),
      },
    }

    if (params.entryPrice) {
      orderBody.limit_price = params.entryPrice.toString()
    }
    if (params.extended_hours) {
      orderBody.extended_hours = true
    }

    const response = await fetch(`${baseUrl}/v2/orders`, {
      method: 'POST',
      headers: {
        'APCA-API-KEY-ID': apiKey,
        'APCA-API-SECRET-KEY': secretKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderBody),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Bracket order failed:', response.status, errorData)
      return {
        success: false,
        error: errorData.message || `Bracket order failed: ${response.status}`,
      }
    }

    const order = await response.json() as AlpacaOrder
    console.log(`✅ Bracket order submitted: ${order.id}`)

    return {
      success: true,
      order,
      message: `Bracket order ${order.id} submitted with SL at $${params.stopLossPrice} and TP at $${params.takeProfitPrice}`,
    }
  } catch (error) {
    console.error('Bracket order error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Submit a stop loss order for an existing position
 */
export async function submitStopLossOrder(params: {
  symbol: string
  qty: number
  stopPrice: number
  limitPrice?: number // If provided, creates stop_limit order
}): Promise<OrderResult> {
  const orderType = params.limitPrice ? 'stop_limit' : 'stop'

  return submitOrder({
    symbol: params.symbol,
    qty: params.qty,
    side: 'sell', // Stop loss is always a sell
    type: orderType,
    time_in_force: 'gtc', // Good til cancelled
    stop_price: params.stopPrice,
    limit_price: params.limitPrice,
  })
}

/**
 * Submit a trailing stop order
 */
export async function submitTrailingStopOrder(params: {
  symbol: string
  qty: number
  trailPercent?: number // e.g., 5 for 5% trailing stop
  trailPrice?: number // Dollar amount to trail
}): Promise<OrderResult> {
  const apiKey = process.env.ALPACA_API_KEY
  const secretKey = process.env.ALPACA_SECRET_KEY

  if (!apiKey || !secretKey) {
    return {
      success: false,
      error: 'Alpaca not configured',
    }
  }

  if (!params.trailPercent && !params.trailPrice) {
    return {
      success: false,
      error: 'Must specify either trailPercent or trailPrice',
    }
  }

  console.log(`📤 Submitting trailing stop: ${params.qty} ${params.symbol}, trail: ${params.trailPercent ? params.trailPercent + '%' : '$' + params.trailPrice}`)

  try {
    const baseUrl = getBaseUrl()
    const orderBody: any = {
      symbol: params.symbol,
      qty: params.qty.toString(),
      side: 'sell',
      type: 'trailing_stop',
      time_in_force: 'gtc',
    }

    if (params.trailPercent) {
      orderBody.trail_percent = params.trailPercent.toString()
    } else if (params.trailPrice) {
      orderBody.trail_price = params.trailPrice.toString()
    }

    const response = await fetch(`${baseUrl}/v2/orders`, {
      method: 'POST',
      headers: {
        'APCA-API-KEY-ID': apiKey,
        'APCA-API-SECRET-KEY': secretKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderBody),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Trailing stop order failed:', response.status, errorData)
      return {
        success: false,
        error: errorData.message || `Trailing stop failed: ${response.status}`,
      }
    }

    const order = await response.json() as AlpacaOrder
    console.log(`✅ Trailing stop submitted: ${order.id}`)

    return {
      success: true,
      order,
      message: `Trailing stop ${order.id} submitted`,
    }
  } catch (error) {
    console.error('Trailing stop error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get open stop loss orders for a symbol
 */
export async function getStopOrdersForSymbol(symbol: string): Promise<AlpacaOrder[]> {
  const orders = await getOrders('open')
  if (!orders) return []

  return orders.filter(o =>
    o.symbol === symbol &&
    (o.type === 'stop' || o.type === 'stop_limit' || o.type === 'trailing_stop')
  )
}

export type { AlpacaAccount, AlpacaPosition, AlpacaOrder, Portfolio, Position }
