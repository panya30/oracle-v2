/**
 * Real-Time Notification Service
 * Sends alerts via email (Resend) and webhooks (Discord/Slack/Custom)
 */

interface NotificationConfig {
  // Email settings
  emailEnabled: boolean
  emailTo: string
  resendApiKey: string

  // Webhook settings
  webhookEnabled: boolean
  webhookUrl: string
  webhookType: 'discord' | 'slack' | 'custom'

  // Filter settings - which alert levels to notify
  notifyLevels: ('info' | 'warning' | 'danger' | 'success')[]
  notifyCategories: string[] // Empty = all categories
}

interface Alert {
  id: string
  level: 'info' | 'warning' | 'danger' | 'success'
  category: string
  title: string
  message: string
  agent: string
  timestamp: string
}

// Load notification config from environment
export function getNotificationConfig(): NotificationConfig {
  return {
    emailEnabled: !!process.env.RESEND_API_KEY && !!process.env.NOTIFICATION_EMAIL,
    emailTo: process.env.NOTIFICATION_EMAIL || '',
    resendApiKey: process.env.RESEND_API_KEY || '',

    webhookEnabled: !!process.env.NOTIFICATION_WEBHOOK_URL,
    webhookUrl: process.env.NOTIFICATION_WEBHOOK_URL || '',
    webhookType: (process.env.NOTIFICATION_WEBHOOK_TYPE as 'discord' | 'slack' | 'custom') || 'custom',

    // By default, notify on danger and warning
    notifyLevels: ['danger', 'warning'],
    notifyCategories: [], // All categories
  }
}

// Level to emoji mapping
const levelEmoji = {
  info: 'i',
  warning: '',
  danger: '',
  success: '',
}

// Level to color (for Discord/Slack)
const levelColor = {
  info: 0x3498db,     // Blue
  warning: 0xf39c12,  // Orange
  danger: 0xe74c3c,   // Red
  success: 0x27ae60,  // Green
}

/**
 * Send notification via webhook (Discord/Slack/Custom)
 */
async function sendWebhookNotification(config: NotificationConfig, alert: Alert): Promise<boolean> {
  if (!config.webhookEnabled || !config.webhookUrl) {
    return false
  }

  try {
    let payload: object

    if (config.webhookType === 'discord') {
      // Discord webhook format
      payload = {
        embeds: [{
          title: `${levelEmoji[alert.level]} ${alert.title}`,
          description: alert.message,
          color: levelColor[alert.level],
          fields: [
            { name: 'Agent', value: alert.agent, inline: true },
            { name: 'Category', value: alert.category, inline: true },
          ],
          timestamp: alert.timestamp,
          footer: { text: 'Wealth Council' },
        }],
      }
    } else if (config.webhookType === 'slack') {
      // Slack webhook format
      const colorMap = {
        info: '#3498db',
        warning: '#f39c12',
        danger: '#e74c3c',
        success: '#27ae60',
      }
      payload = {
        attachments: [{
          color: colorMap[alert.level],
          title: `${levelEmoji[alert.level]} ${alert.title}`,
          text: alert.message,
          fields: [
            { title: 'Agent', value: alert.agent, short: true },
            { title: 'Category', value: alert.category, short: true },
          ],
          footer: 'Wealth Council',
          ts: Math.floor(new Date(alert.timestamp).getTime() / 1000),
        }],
      }
    } else {
      // Custom webhook - send raw alert data
      payload = {
        type: 'wealth_council_alert',
        alert: {
          ...alert,
          emoji: levelEmoji[alert.level],
        },
      }
    }

    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      console.error(`Webhook notification failed: ${response.status} ${response.statusText}`)
      return false
    }

    console.log(`Webhook notification sent for alert: ${alert.title}`)
    return true
  } catch (error) {
    console.error('Webhook notification error:', error)
    return false
  }
}

/**
 * Send notification via email (Resend)
 */
async function sendEmailNotification(config: NotificationConfig, alert: Alert): Promise<boolean> {
  if (!config.emailEnabled || !config.resendApiKey || !config.emailTo) {
    return false
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Wealth Council <alerts@wealth-council.app>',
        to: config.emailTo,
        subject: `${levelEmoji[alert.level]} [${alert.level.toUpperCase()}] ${alert.title}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: ${alert.level === 'danger' ? '#e74c3c' : alert.level === 'warning' ? '#f39c12' : '#3498db'};">
              ${levelEmoji[alert.level]} ${alert.title}
            </h2>
            <p style="font-size: 16px; line-height: 1.5;">${alert.message}</p>
            <table style="margin-top: 20px; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd;"><strong>Agent</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd;">${alert.agent}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd;"><strong>Category</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd;">${alert.category}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd;"><strong>Time</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd;">${new Date(alert.timestamp).toLocaleString()}</td>
              </tr>
            </table>
            <p style="margin-top: 30px; color: #666; font-size: 12px;">
              This alert was sent by Wealth Council automated trading system.
            </p>
          </div>
        `,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error(`Email notification failed: ${response.status}`, errorData)
      return false
    }

    console.log(`Email notification sent for alert: ${alert.title}`)
    return true
  } catch (error) {
    console.error('Email notification error:', error)
    return false
  }
}

/**
 * Send real-time notification for an alert
 * This should be called after addAlert()
 */
export async function sendNotification(alert: Alert): Promise<{
  webhook: boolean
  email: boolean
}> {
  const config = getNotificationConfig()

  // Check if this alert level should be notified
  if (!config.notifyLevels.includes(alert.level)) {
    return { webhook: false, email: false }
  }

  // Check if this category should be notified (empty = all)
  if (config.notifyCategories.length > 0 && !config.notifyCategories.includes(alert.category)) {
    return { webhook: false, email: false }
  }

  // Send notifications in parallel
  const [webhookResult, emailResult] = await Promise.all([
    sendWebhookNotification(config, alert),
    sendEmailNotification(config, alert),
  ])

  return {
    webhook: webhookResult,
    email: emailResult,
  }
}

/**
 * Test notification settings by sending a test alert
 */
export async function testNotification(): Promise<{
  webhook: boolean
  email: boolean
  config: {
    emailEnabled: boolean
    webhookEnabled: boolean
  }
}> {
  const config = getNotificationConfig()

  const testAlert: Alert = {
    id: 'test-notification',
    level: 'info',
    category: 'system',
    title: 'Test Notification',
    message: 'This is a test notification from Wealth Council. If you received this, your notifications are configured correctly!',
    agent: 'SYSTEM',
    timestamp: new Date().toISOString(),
  }

  // For test, bypass level filter
  const [webhookResult, emailResult] = await Promise.all([
    config.webhookEnabled ? sendWebhookNotification(config, testAlert) : false,
    config.emailEnabled ? sendEmailNotification(config, testAlert) : false,
  ])

  return {
    webhook: webhookResult,
    email: emailResult,
    config: {
      emailEnabled: config.emailEnabled,
      webhookEnabled: config.webhookEnabled,
    },
  }
}

export type { NotificationConfig, Alert }
