/**
 * Broker API Route
 * Fetches real portfolio data from multiple brokers
 *
 * Supported Brokers:
 * - Interactive Brokers (IBKR) - via Client Portal Gateway
 * - Alpaca - via REST API
 *
 * Priority: IBKR -> Alpaca -> Mock
 * Or set PREFERRED_BROKER=alpaca|ibkr to override
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  fetchAlpacaPortfolio,
  fetchAccount as fetchAlpacaAccount,
  fetchPositions as fetchAlpacaPositions,
  isAlpacaConfigured,
  submitOrder,
  getOrders,
  getOrder,
  cancelOrder,
  cancelAllOrders,
  closePosition,
  type OrderRequest,
} from '@/lib/alpaca-broker'
import {
  fetchIBKRPortfolio,
  fetchAccounts as fetchIBKRAccounts,
  fetchPositions as fetchIBKRPositions,
  checkAuthStatus as checkIBKRAuth,
  isIBKRConfigured,
} from '@/lib/ibkr-broker'
import { loadPortfolio } from '@/lib/persistence'

type BrokerType = 'ibkr' | 'alpaca' | 'mock'

// Get preferred broker from env
function getPreferredBroker(): BrokerType | null {
  const preferred = process.env.PREFERRED_BROKER?.toLowerCase()
  if (preferred === 'ibkr' || preferred === 'alpaca') {
    return preferred
  }
  return null
}

// Get broker status
function getBrokerStatus() {
  return {
    ibkr: {
      configured: isIBKRConfigured(),
      gatewayUrl: process.env.IBKR_GATEWAY_URL || null,
    },
    alpaca: {
      configured: isAlpacaConfigured(),
      paper: process.env.ALPACA_PAPER === 'true',
    },
    preferred: getPreferredBroker(),
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action') || 'portfolio'
  const broker = searchParams.get('broker') as BrokerType | null

  try {
    switch (action) {
      case 'portfolio': {
        const preferred = broker || getPreferredBroker()

        // If specific broker requested, try only that one
        if (preferred === 'ibkr' && isIBKRConfigured()) {
          const ibkrPortfolio = await fetchIBKRPortfolio()
          if (ibkrPortfolio) {
            return NextResponse.json({
              success: true,
              data: ibkrPortfolio,
              source: 'ibkr',
              timestamp: new Date(),
            })
          }
        }

        if (preferred === 'alpaca' && isAlpacaConfigured()) {
          const alpacaPortfolio = await fetchAlpacaPortfolio()
          if (alpacaPortfolio) {
            return NextResponse.json({
              success: true,
              data: alpacaPortfolio,
              source: 'alpaca',
              timestamp: new Date(),
            })
          }
        }

        // Auto-detect: Try IBKR first, then Alpaca
        if (!preferred) {
          // Try IBKR
          if (isIBKRConfigured()) {
            const ibkrPortfolio = await fetchIBKRPortfolio()
            if (ibkrPortfolio) {
              return NextResponse.json({
                success: true,
                data: ibkrPortfolio,
                source: 'ibkr',
                timestamp: new Date(),
              })
            }
          }

          // Try Alpaca
          if (isAlpacaConfigured()) {
            const alpacaPortfolio = await fetchAlpacaPortfolio()
            if (alpacaPortfolio) {
              return NextResponse.json({
                success: true,
                data: alpacaPortfolio,
                source: 'alpaca',
                timestamp: new Date(),
              })
            }
          }
        }

        // Fallback to local persistence / mock
        const localPortfolio = loadPortfolio()
        return NextResponse.json({
          success: true,
          data: {
            ...localPortfolio,
            source: 'mock',
          },
          source: 'mock',
          timestamp: new Date(),
        })
      }

      case 'account': {
        const targetBroker = broker || getPreferredBroker()

        if (targetBroker === 'ibkr' || (!targetBroker && isIBKRConfigured())) {
          if (!isIBKRConfigured()) {
            return NextResponse.json({
              success: false,
              error: 'IBKR not configured',
              hint: 'Set IBKR_GATEWAY_URL in .env.local and run Client Portal Gateway',
            })
          }

          const accounts = await fetchIBKRAccounts()
          if (accounts && accounts.length > 0) {
            return NextResponse.json({
              success: true,
              data: accounts[0],
              broker: 'ibkr',
              timestamp: new Date(),
            })
          }
        }

        if (targetBroker === 'alpaca' || (!targetBroker && isAlpacaConfigured())) {
          if (!isAlpacaConfigured()) {
            return NextResponse.json({
              success: false,
              error: 'Alpaca not configured',
              hint: 'Set ALPACA_API_KEY and ALPACA_SECRET_KEY in .env.local',
            })
          }

          const account = await fetchAlpacaAccount()
          if (account) {
            return NextResponse.json({
              success: true,
              data: account,
              broker: 'alpaca',
              timestamp: new Date(),
            })
          }
        }

        return NextResponse.json({
          success: false,
          error: 'No broker configured',
          hint: 'Configure IBKR or Alpaca in .env.local',
        })
      }

      case 'positions': {
        const targetBroker = broker || getPreferredBroker()

        if (targetBroker === 'ibkr' || (!targetBroker && isIBKRConfigured())) {
          if (!isIBKRConfigured()) {
            return NextResponse.json({
              success: false,
              error: 'IBKR not configured',
            })
          }

          const accounts = await fetchIBKRAccounts()
          if (accounts && accounts.length > 0) {
            const positions = await fetchIBKRPositions(accounts[0].accountId)
            if (positions) {
              return NextResponse.json({
                success: true,
                data: positions,
                broker: 'ibkr',
                timestamp: new Date(),
              })
            }
          }
        }

        if (targetBroker === 'alpaca' || (!targetBroker && isAlpacaConfigured())) {
          if (!isAlpacaConfigured()) {
            return NextResponse.json({
              success: false,
              error: 'Alpaca not configured',
            })
          }

          const positions = await fetchAlpacaPositions()
          if (positions) {
            return NextResponse.json({
              success: true,
              data: positions,
              broker: 'alpaca',
              timestamp: new Date(),
            })
          }
        }

        return NextResponse.json({
          success: false,
          error: 'No broker configured or failed to fetch positions',
        })
      }

      case 'status': {
        const status = getBrokerStatus()

        // Check IBKR auth if configured
        let ibkrAuth = null
        if (status.ibkr.configured) {
          ibkrAuth = await checkIBKRAuth()
        }

        return NextResponse.json({
          success: true,
          data: {
            ...status,
            ibkr: {
              ...status.ibkr,
              authenticated: ibkrAuth?.authenticated || false,
            },
          },
          timestamp: new Date(),
        })
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Unknown action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Broker API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST handler for trade execution and order management
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...params } = body

    switch (action) {
      case 'submit_order': {
        // Validate order parameters
        const { symbol, qty, side, type, time_in_force, limit_price, stop_price } = params

        if (!symbol || !qty || !side || !type) {
          return NextResponse.json(
            { success: false, error: 'Missing required order parameters: symbol, qty, side, type' },
            { status: 400 }
          )
        }

        if (!isAlpacaConfigured()) {
          return NextResponse.json(
            { success: false, error: 'Alpaca not configured', hint: 'Set API keys in .env.local' },
            { status: 400 }
          )
        }

        const orderRequest: OrderRequest = {
          symbol: symbol.toUpperCase(),
          qty: Number(qty),
          side: side as 'buy' | 'sell',
          type: type as 'market' | 'limit' | 'stop' | 'stop_limit',
          time_in_force: time_in_force || 'day',
          limit_price: limit_price ? Number(limit_price) : undefined,
          stop_price: stop_price ? Number(stop_price) : undefined,
        }

        console.log('📤 Executing trade:', orderRequest)
        const result = await submitOrder(orderRequest)

        if (result.success) {
          return NextResponse.json({
            success: true,
            data: result.order,
            message: result.message,
            timestamp: new Date(),
          })
        } else {
          return NextResponse.json(
            { success: false, error: result.error, message: result.message },
            { status: 400 }
          )
        }
      }

      case 'get_orders': {
        const { status = 'all', limit = 50 } = params

        if (!isAlpacaConfigured()) {
          return NextResponse.json(
            { success: false, error: 'Alpaca not configured' },
            { status: 400 }
          )
        }

        const orders = await getOrders(status, limit)
        return NextResponse.json({
          success: true,
          data: orders || [],
          timestamp: new Date(),
        })
      }

      case 'get_order': {
        const { order_id } = params

        if (!order_id) {
          return NextResponse.json(
            { success: false, error: 'Missing order_id' },
            { status: 400 }
          )
        }

        if (!isAlpacaConfigured()) {
          return NextResponse.json(
            { success: false, error: 'Alpaca not configured' },
            { status: 400 }
          )
        }

        const order = await getOrder(order_id)
        if (order) {
          return NextResponse.json({
            success: true,
            data: order,
            timestamp: new Date(),
          })
        } else {
          return NextResponse.json(
            { success: false, error: 'Order not found' },
            { status: 404 }
          )
        }
      }

      case 'cancel_order': {
        const { order_id } = params

        if (!order_id) {
          return NextResponse.json(
            { success: false, error: 'Missing order_id' },
            { status: 400 }
          )
        }

        if (!isAlpacaConfigured()) {
          return NextResponse.json(
            { success: false, error: 'Alpaca not configured' },
            { status: 400 }
          )
        }

        const cancelled = await cancelOrder(order_id)
        return NextResponse.json({
          success: cancelled,
          message: cancelled ? 'Order cancelled' : 'Failed to cancel order',
          timestamp: new Date(),
        })
      }

      case 'cancel_all_orders': {
        if (!isAlpacaConfigured()) {
          return NextResponse.json(
            { success: false, error: 'Alpaca not configured' },
            { status: 400 }
          )
        }

        const cancelled = await cancelAllOrders()
        return NextResponse.json({
          success: cancelled,
          message: cancelled ? 'All orders cancelled' : 'Failed to cancel orders',
          timestamp: new Date(),
        })
      }

      case 'close_position': {
        const { symbol } = params

        if (!symbol) {
          return NextResponse.json(
            { success: false, error: 'Missing symbol' },
            { status: 400 }
          )
        }

        if (!isAlpacaConfigured()) {
          return NextResponse.json(
            { success: false, error: 'Alpaca not configured' },
            { status: 400 }
          )
        }

        const result = await closePosition(symbol.toUpperCase())
        if (result.success) {
          return NextResponse.json({
            success: true,
            data: result.order,
            message: result.message,
            timestamp: new Date(),
          })
        } else {
          return NextResponse.json(
            { success: false, error: result.error },
            { status: 400 }
          )
        }
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Broker POST Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
