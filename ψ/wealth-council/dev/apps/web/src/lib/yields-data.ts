/**
 * Treasury Yields Data Service
 * Fetches real-time yield data from multiple sources with fallbacks
 *
 * Data Sources (in order of priority):
 * 1. FRED API (requires API key from https://fred.stlouisfed.org/docs/api/api_key.html)
 * 2. Alpha Vantage (requires free API key from https://www.alphavantage.co/support/#api-key)
 * 3. Mock data (last resort)
 */

interface YieldData {
  tenor: '2Y' | '5Y' | '10Y' | '30Y'
  yield: number
  change: number
  changePercent: number
  previousClose: number
  timestamp: Date
  source: 'fred' | 'alphavantage' | 'mock'
}

interface YieldSnapshot {
  yields: YieldData[]
  spread2Y10Y: number
  spread10Y30Y: number
  curveStatus: 'normal' | 'flat' | 'inverted'
  timestamp: Date
  source: string
}

// FRED Series IDs for Treasury yields
const FRED_SERIES = {
  '2Y': 'DGS2',
  '5Y': 'DGS5',
  '10Y': 'DGS10',
  '30Y': 'DGS30',
}

// Alpha Vantage symbols for Treasury yields
const ALPHA_SYMBOLS = {
  '2Y': 'TREASURY_YIELD',
  '5Y': 'TREASURY_YIELD',
  '10Y': 'TREASURY_YIELD',
  '30Y': 'TREASURY_YIELD',
}

// Get current mock yields based on realistic values
function getMockYields(): Record<string, YieldData> {
  // These should be updated periodically to stay realistic
  // Based on typical 2024-2026 yield environment
  return {
    '2Y': { tenor: '2Y', yield: 4.28, change: 0.02, changePercent: 0.47, previousClose: 4.26, timestamp: new Date(), source: 'mock' },
    '5Y': { tenor: '5Y', yield: 4.35, change: 0.03, changePercent: 0.69, previousClose: 4.32, timestamp: new Date(), source: 'mock' },
    '10Y': { tenor: '10Y', yield: 4.58, change: 0.04, changePercent: 0.88, previousClose: 4.54, timestamp: new Date(), source: 'mock' },
    '30Y': { tenor: '30Y', yield: 4.81, change: 0.03, changePercent: 0.63, previousClose: 4.78, timestamp: new Date(), source: 'mock' },
  }
}

/**
 * Fetch yield from FRED API
 */
async function fetchFromFRED(seriesId: string, tenor: '2Y' | '5Y' | '10Y' | '30Y'): Promise<YieldData | null> {
  const apiKey = process.env.FRED_API_KEY

  if (!apiKey) {
    console.log('FRED_API_KEY not set, skipping FRED source')
    return null
  }

  try {
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&limit=5&sort_order=desc`

    const response = await fetch(url, {
      next: { revalidate: 300 }, // Cache for 5 minutes
    })

    if (!response.ok) {
      console.error(`FRED API error: ${response.status}`)
      return null
    }

    const data = await response.json()
    const observations = data.observations || []

    // Find first valid observation (sometimes latest is ".")
    let current: number | null = null
    let previous: number | null = null

    for (const obs of observations) {
      const val = parseFloat(obs.value)
      if (!isNaN(val) && val > 0) {
        if (current === null) {
          current = val
        } else if (previous === null) {
          previous = val
          break
        }
      }
    }

    if (current === null || previous === null) {
      return null
    }

    const change = current - previous
    const changePercent = (change / previous) * 100

    return {
      tenor,
      yield: current,
      change: parseFloat(change.toFixed(3)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      previousClose: previous,
      timestamp: new Date(),
      source: 'fred',
    }
  } catch (error) {
    console.error(`FRED fetch error for ${tenor}:`, error)
    return null
  }
}

/**
 * Fetch yield from Alpha Vantage API
 */
async function fetchFromAlphaVantage(tenor: '2Y' | '5Y' | '10Y' | '30Y'): Promise<YieldData | null> {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY

  if (!apiKey) {
    console.log('ALPHA_VANTAGE_API_KEY not set, skipping Alpha Vantage source')
    return null
  }

  try {
    const maturity = tenor === '2Y' ? '2year' : tenor === '5Y' ? '5year' : tenor === '10Y' ? '10year' : '30year'
    const url = `https://www.alphavantage.co/query?function=TREASURY_YIELD&interval=daily&maturity=${maturity}&apikey=${apiKey}`

    const response = await fetch(url, {
      next: { revalidate: 300 },
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()

    if (data['Error Message'] || data['Note']) {
      console.error('Alpha Vantage API limit or error:', data)
      return null
    }

    const timeSeries = data['data'] || []

    if (timeSeries.length < 2) {
      return null
    }

    const current = parseFloat(timeSeries[0].value)
    const previous = parseFloat(timeSeries[1].value)

    if (isNaN(current) || isNaN(previous)) {
      return null
    }

    const change = current - previous
    const changePercent = (change / previous) * 100

    return {
      tenor,
      yield: current,
      change: parseFloat(change.toFixed(3)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      previousClose: previous,
      timestamp: new Date(),
      source: 'alphavantage',
    }
  } catch (error) {
    console.error(`Alpha Vantage fetch error for ${tenor}:`, error)
    return null
  }
}

/**
 * Fetch single yield with fallbacks
 */
async function fetchYieldWithFallback(tenor: '2Y' | '5Y' | '10Y' | '30Y'): Promise<YieldData> {
  // Try FRED first
  const fredResult = await fetchFromFRED(FRED_SERIES[tenor], tenor)
  if (fredResult) {
    console.log(`✓ ${tenor} yield from FRED: ${fredResult.yield}%`)
    return fredResult
  }

  // Try Alpha Vantage
  const alphaResult = await fetchFromAlphaVantage(tenor)
  if (alphaResult) {
    console.log(`✓ ${tenor} yield from Alpha Vantage: ${alphaResult.yield}%`)
    return alphaResult
  }

  // Fallback to mock
  console.log(`⚠ ${tenor} yield using mock data`)
  return getMockYields()[tenor]
}

/**
 * Validate yield data for sanity
 */
function validateYields(yields: YieldData[]): { valid: boolean; warnings: string[] } {
  const warnings: string[] = []

  for (const y of yields) {
    // Check for reasonable yield range (0.5% to 15%)
    if (y.yield < 0.5 || y.yield > 15) {
      warnings.push(`${y.tenor} yield ${y.yield}% is outside normal range (0.5-15%)`)
    }

    // Check for extreme daily changes (>0.5% absolute change is unusual)
    if (Math.abs(y.change) > 0.5) {
      warnings.push(`${y.tenor} yield changed ${y.change}% today - unusually large move`)
    }
  }

  // Check yield curve sanity (normally 2Y < 30Y, but inversions happen)
  const y2 = yields.find(y => y.tenor === '2Y')?.yield || 0
  const y10 = yields.find(y => y.tenor === '10Y')?.yield || 0
  const y30 = yields.find(y => y.tenor === '30Y')?.yield || 0

  if (y30 < y2 - 1) {
    warnings.push(`Deep yield curve inversion: 2Y (${y2}%) > 30Y (${y30}%)`)
  }

  return {
    valid: warnings.length === 0,
    warnings,
  }
}

/**
 * Fetch all Treasury yields
 */
export async function fetchYields(): Promise<YieldSnapshot & { validation?: { valid: boolean; warnings: string[] }; usingMockData?: boolean }> {
  console.log('Fetching Treasury yields...')

  // Check for API keys
  const hasFRED = !!process.env.FRED_API_KEY
  const hasAlpha = !!process.env.ALPHA_VANTAGE_API_KEY

  if (!hasFRED && !hasAlpha) {
    console.warn('⚠ No API keys configured. Set FRED_API_KEY or ALPHA_VANTAGE_API_KEY for real data.')
    console.warn('  Get free FRED API key: https://fred.stlouisfed.org/docs/api/api_key.html')
  }

  try {
    // Fetch all yields in parallel
    const [y2, y5, y10, y30] = await Promise.all([
      fetchYieldWithFallback('2Y'),
      fetchYieldWithFallback('5Y'),
      fetchYieldWithFallback('10Y'),
      fetchYieldWithFallback('30Y'),
    ])

    const yields = [y2, y5, y10, y30]

    // Validate the data
    const validation = validateYields(yields)
    if (!validation.valid) {
      console.warn('⚠️ Yield data validation warnings:')
      validation.warnings.forEach(w => console.warn(`   - ${w}`))
    }

    // Calculate spreads
    const spread2Y10Y = parseFloat((y10.yield - y2.yield).toFixed(3))
    const spread10Y30Y = parseFloat((y30.yield - y10.yield).toFixed(3))

    // Determine curve status
    let curveStatus: 'normal' | 'flat' | 'inverted' = 'normal'
    if (spread2Y10Y < -0.1) {
      curveStatus = 'inverted'
    } else if (Math.abs(spread2Y10Y) < 0.1) {
      curveStatus = 'flat'
    }

    // Determine primary source and check for mock data
    const sources = yields.map(y => y.source)
    const usingMockData = sources.some(s => s === 'mock')
    const primarySource = sources.includes('fred') ? 'FRED' :
                          sources.includes('alphavantage') ? 'Alpha Vantage' : 'Mock'

    if (usingMockData) {
      console.warn('⚠️ WARNING: Using MOCK DATA for some yields. Trading decisions may be based on fake data!')
      console.warn('   Configure FRED_API_KEY for real Treasury yield data.')
    }

    return {
      yields,
      spread2Y10Y,
      spread10Y30Y,
      curveStatus,
      timestamp: new Date(),
      source: primarySource,
      validation,
      usingMockData,
    }
  } catch (error) {
    console.error('Error fetching yields:', error)

    // Return mock data as fallback
    const mockYields = getMockYields()
    console.error('❌ CRITICAL: Falling back to MOCK DATA due to error. DO NOT TRADE on this data!')

    return {
      yields: Object.values(mockYields),
      spread2Y10Y: 0.30,
      spread10Y30Y: 0.23,
      curveStatus: 'normal',
      timestamp: new Date(),
      source: 'Mock (Error)',
      usingMockData: true,
      validation: {
        valid: false,
        warnings: ['Using mock data due to fetch error - DO NOT TRADE'],
      },
    }
  }
}

/**
 * Fetch single yield
 */
export async function fetchYield(tenor: '2Y' | '5Y' | '10Y' | '30Y'): Promise<YieldData> {
  return fetchYieldWithFallback(tenor)
}

export type { YieldData, YieldSnapshot }
