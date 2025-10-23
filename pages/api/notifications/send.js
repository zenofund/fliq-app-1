/**
 * Send Notification API Route - Serverless Function
 * 
 * This endpoint is used by other API routes to send notifications
 * It's a centralized point for notification delivery
 * 
 * INFINITE LOOP PREVENTION:
 * - Never send notifications about notification actions
 * - Single notification per event
 * - No recursive notification chains
 * 
 * HANGING REQUEST PREVENTION:
 * - Quick response after queuing notification
 * - Timeout on external service calls
 * - Async processing for email/push
 * 
 * ERROR HANDLING:
 * - Notification failures logged but don't fail the request
 * - Partial success is acceptable (in-app works, email fails)
 * - Proper validation of inputs
 * 
 * SECURITY:
 * - Internal API - should only be called by server-side code
 * - Optional: Add API key authentication for internal calls
 */

import { sendNotification, sendNotificationWithPreferences, NOTIFICATION_TYPES } from '../../../lib/notifications'
import { verifyToken } from '../../../lib/auth'

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Authenticate request
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' })
    }

    let user
    try {
      user = verifyToken(token)
    } catch (error) {
      return res.status(401).json({ message: 'Invalid or expired token' })
    }

    // Validate request body
    const { 
      userId, 
      notificationType, 
      data,
      usePreferences = true,
      channels = { inApp: true, email: false, push: false }
    } = req.body

    if (!userId || !notificationType || !data) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: ['userId', 'notificationType', 'data']
      })
    }

    // Validate notification type
    if (!Object.values(NOTIFICATION_TYPES).includes(notificationType)) {
      return res.status(400).json({ 
        message: 'Invalid notification type',
        validTypes: Object.values(NOTIFICATION_TYPES)
      })
    }

    // Send notification
    let results
    if (usePreferences) {
      results = await sendNotificationWithPreferences(userId, notificationType, data)
    } else {
      results = await sendNotification(userId, notificationType, data, channels)
    }

    return res.status(200).json({
      message: 'Notification sent',
      results
    })
  } catch (error) {
    console.error('Send notification API error:', error)
    return res.status(500).json({
      message: 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    })
  }
}
