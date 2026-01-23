/**
 * Notifications API
 * Test and manage real-time notification settings
 */

import { NextRequest, NextResponse } from 'next/server'
import { getNotificationConfig, testNotification } from '@/lib/notifications'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action') || 'status'

  try {
    switch (action) {
      case 'status': {
        const config = getNotificationConfig()
        return NextResponse.json({
          success: true,
          data: {
            emailEnabled: config.emailEnabled,
            emailConfigured: !!config.resendApiKey && !!config.emailTo,
            webhookEnabled: config.webhookEnabled,
            webhookType: config.webhookType,
            notifyLevels: config.notifyLevels,
            instructions: {
              email: 'Set RESEND_API_KEY and NOTIFICATION_EMAIL in .env.local',
              webhook: 'Set NOTIFICATION_WEBHOOK_URL and optionally NOTIFICATION_WEBHOOK_TYPE (discord/slack/custom) in .env.local',
            },
          },
        })
      }

      case 'test': {
        console.log('Testing notifications...')
        const result = await testNotification()
        return NextResponse.json({
          success: true,
          data: {
            ...result,
            message: result.webhook || result.email
              ? 'Test notification sent! Check your configured channels.'
              : 'No notifications configured. Set environment variables to enable.',
          },
        })
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Unknown action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Notifications API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    )
  }
}
