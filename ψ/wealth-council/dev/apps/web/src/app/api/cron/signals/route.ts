/**
 * Cron Endpoint for Signal Processing
 *
 * This endpoint is designed to be called by:
 * 1. System cron (curl http://localhost:3200/api/cron/signals)
 * 2. External cron services (cron-job.org, easycron, etc.)
 * 3. Vercel Cron (if deployed on Vercel)
 *
 * Security: Uses CRON_SECRET env var to authenticate requests
 */

import { NextRequest, NextResponse } from 'next/server'

// Verify cron secret (optional but recommended for production)
function verifyCronSecret(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true // No secret configured = allow all

  const authHeader = request.headers.get('authorization')
  const querySecret = request.nextUrl.searchParams.get('secret')

  return authHeader === `Bearer ${secret}` || querySecret === secret
}

export async function GET(request: NextRequest) {
  // Verify authorization
  if (!verifyCronSecret(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  console.log('🕐 Cron: Running signal processor...')

  try {
    // Get the base URL for internal API calls
    const host = request.headers.get('host') || 'localhost:3200'
    const protocol = host.includes('localhost') ? 'http' : 'https'
    const baseUrl = `${protocol}://${host}`

    // Call the signal processor
    const response = await fetch(`${baseUrl}/api/signals/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ force: false }),
    })

    const result = await response.json()

    if (result.success) {
      console.log(`✅ Cron: Processed ${result.data?.signalsGenerated || 0} signals`)

      return NextResponse.json({
        success: true,
        timestamp: new Date().toISOString(),
        signalsGenerated: result.data?.signalsGenerated || 0,
        results: result.data?.results || [],
      })
    } else {
      console.log(`⚠️ Cron: ${result.error}`)

      return NextResponse.json({
        success: false,
        error: result.error,
        timestamp: new Date().toISOString(),
      })
    }
  } catch (error) {
    console.error('❌ Cron error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

// Also support POST for flexibility
export async function POST(request: NextRequest) {
  return GET(request)
}
