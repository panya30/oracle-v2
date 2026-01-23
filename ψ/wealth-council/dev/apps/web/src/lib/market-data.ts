/**
 * Market Data Service
 * Fetches real-time price data from multiple sources with fallbacks
 *
 * Data Sources (in order of priority):
 * 1. Finnhub (requires free API key from https://finnhub.io/)
 * 2. Alpha Vantage (requires free API key from https://www.alphavantage.co/)
 * 3. Mock data (last resort)
 */

interface PriceData {
  ticker: string
  price: number
  change: number
  changePercent: number
  open: number
  high: number
  low: number
  volume: number
  previousClose: number
  timestamp: Date
  source: 'finnhub' | 'alphavantage' | 'mock'
}

// Get realistic mock prices (should be updated periodically)
function getMockPrices(): Record<string, PriceData> {
  // Based on typical 2024-2026 bond ETF prices
  return {
    TLT: {
      ticker: 'TLT',
      price: 88.42,
      change: -0.85,
      changePercent: -0.95,
      open: 89.10,
      high: 89.35,
      low: 88.15,
      volume: 18500000,
      previousClose: 89.27,
      timestamp: new Date(),
      source: 'mock',
    },
    TMV: {
      ticker: 'TMV',
      price: 42.85,
      change: 1.25,
      changePercent: 3.01,
      open: 41.90,
      high: 43.20,
      low: 41.65,
      volume: 920000,
      previousClose: 41.60,
      timestamp: new Date(),
      source: 'mock',
    },
    TBT: {
      ticker: 'TBT',
      price: 28.75,
      change: 0.48,
      changePercent: 1.70,
      open: 28.40,
      high: 28.95,
      low: 28.25,
      volume: 1450000,
      previousClose: 28.27,
      timestamp: new Date(),
      source: 'mock',
    },
    TBF: {
      ticker: 'TBF',
      price: 18.65,
      change: 0.18,
      changePercent: 0.97,
      open: 18.52,
      high: 18.78,
      low: 18.45,
      volume: 520000,
      previousClose: 18.47,
      timestamp: new Date(),
      source: 'mock',
    },
  }
}

/**
 * Fetch price from Finnhub API
 */
async function fetchFromFinnhub(ticker: string): Promise<PriceData | null> {
  const apiKey = process.env.FINNHUB_API_KEY

  if (!apiKey) {
    return null
  }

  try {
    const response = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${apiKey}`,
      { next: { revalidate: 60 } }
    )

    if (!response.ok) {
      console.error(`Finnhub API error: ${response.status}`)
      return null
    }

    const data = await response.json()

    // Finnhub returns: c (current), o (open), h (high), l (low), pc (prev close), d (change), dp (change %)
    if (!data.c || data.c === 0) {
      return null
    }

    return {
      ticker,
      price: data.c,
      change: data.d || 0,
      changePercent: data.dp || 0,
      open: data.o || data.c,
      high: data.h || data.c,
      low: data.l || data.c,
      volume: 0, // Finnhub basic doesn't include volume
      previousClose: data.pc || data.c,
      timestamp: new Date(),
      source: 'finnhub',
    }
  } catch (error) {
    console.error(`Finnhub fetch error for ${ticker}:`, error)
    return null
  }
}

/**
 * Fetch price from Alpha Vantage API
 */
async function fetchFromAlphaVantage(ticker: string): Promise<PriceData | null> {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY

  if (!apiKey) {
    return null
  }

  try {
    const response = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${apiKey}`,
      { next: { revalidate: 60 } }
    )

    if (!response.ok) {
      return null
    }

    const data = await response.json()

    if (data['Error Message'] || data['Note']) {
      console.error('Alpha Vantage API limit or error:', data)
      return null
    }

    const quote = data['Global Quote']
    if (!quote || !quote['05. price']) {
      return null
    }

    const price = parseFloat(quote['05. price'])
    const open = parseFloat(quote['02. open']) || price
    const high = parseFloat(quote['03. high']) || price
    const low = parseFloat(quote['04. low']) || price
    const volume = parseInt(quote['06. volume']) || 0
    const previousClose = parseFloat(quote['08. previous close']) || price
    const change = parseFloat(quote['09. change']) || 0
    const changePercent = parseFloat(quote['10. change percent']?.replace('%', '')) || 0

    return {
      ticker,
      price,
      change,
      changePercent,
      open,
      high,
      low,
      volume,
      previousClose,
      timestamp: new Date(),
      source: 'alphavantage',
    }
  } catch (error) {
    console.error(`Alpha Vantage fetch error for ${ticker}:`, error)
    return null
  }
}

/**
 * Fetch price with fallbacks
 */
async function fetchPriceWithFallback(ticker: string): Promise<PriceData> {
  // Try Finnhub first
  const finnhubResult = await fetchFromFinnhub(ticker)
  if (finnhubResult) {
    console.log(`✓ ${ticker} price from Finnhub: $${finnhubResult.price.toFixed(2)}`)
    return finnhubResult
  }

  // Try Alpha Vantage
  const alphaResult = await fetchFromAlphaVantage(ticker)
  if (alphaResult) {
    console.log(`✓ ${ticker} price from Alpha Vantage: $${alphaResult.price.toFixed(2)}`)
    return alphaResult
  }

  // Fallback to mock
  console.log(`⚠ ${ticker} price using mock data`)
  const mockPrices = getMockPrices()
  return mockPrices[ticker] || {
    ticker,
    price: 0,
    change: 0,
    changePercent: 0,
    open: 0,
    high: 0,
    low: 0,
    volume: 0,
    previousClose: 0,
    timestamp: new Date(),
    source: 'mock',
  }
}

/**
 * Fetch price data for a single ticker
 */
export async function fetchPrice(ticker: string): Promise<PriceData> {
  return fetchPriceWithFallback(ticker)
}

/**
 * Fetch price data for multiple tickers
 */
export async function fetchPrices(tickers: string[]): Promise<PriceData[]> {
  console.log(`Fetching prices for: ${tickers.join(', ')}...`)

  // Check for API keys
  const hasFinnhub = !!process.env.FINNHUB_API_KEY
  const hasAlpha = !!process.env.ALPHA_VANTAGE_API_KEY

  if (!hasFinnhub && !hasAlpha) {
    console.warn('⚠ No API keys configured. Set FINNHUB_API_KEY or ALPHA_VANTAGE_API_KEY for real data.')
    console.warn('  Get free Finnhub API key: https://finnhub.io/')
  }

  // Fetch all prices in parallel
  const results = await Promise.all(tickers.map(fetchPriceWithFallback))

  // Log summary
  const sources = results.map(r => r.source)
  const realCount = sources.filter(s => s !== 'mock').length
  console.log(`Prices fetched: ${realCount}/${tickers.length} from real sources`)

  return results
}

/**
 * Get all tracked ETF prices
 */
export async function getAllETFPrices(): Promise<PriceData[]> {
  const etfs = ['TLT', 'TMV', 'TBT', 'TBF']
  return fetchPrices(etfs)
}

export type { PriceData }
