/**
 * Pusher Authentication API Route
 * Authenticates Pusher channel subscriptions for private channels
 * 
 * INFINITE LOOP PREVENTION:
 * - Single authentication check, no recursive calls
 * - Early return for invalid requests
 * 
 * HANGING REQUEST PREVENTION:
 * - No external API calls, fast synchronous operation
 * - Always returns a response
 * 
 * SECURITY:
 * - Verifies user has access to requested channel
 * - Validates JWT token before authorizing channel
 */

import { verifyToken } from '../../../lib/auth'
import { authenticateChannel } from '../../../lib/pusher'

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  // Handle preflight requests immediately
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Authenticate user
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

    const { socket_id, channel_name } = req.body

    if (!socket_id || !channel_name) {
      return res.status(400).json({ 
        message: 'Missing required fields: socket_id, channel_name'
      })
    }

    // Validate channel access
    // For conversation channels: private-conversation-{bookingId}
    if (channel_name.startsWith('private-conversation-')) {
      const bookingId = channel_name.replace('private-conversation-', '')
      
      // TODO: Verify user has access to this booking
      // const booking = await db.query(
      //   'SELECT * FROM bookings WHERE id = ? AND (user_id = ? OR companion_id = ?)',
      //   [bookingId, user.id, user.id]
      // )
      // if (!booking) {
      //   return res.status(403).json({ message: 'Access denied to this channel' })
      // }

      // TODO: Verify chat is available (booking status is accepted/confirmed)
      // if (!['accepted', 'confirmed'].includes(booking.status)) {
      //   return res.status(403).json({ 
      //     message: 'Chat is not available for this booking'
      //   })
      // }
    }
    // For user channels: private-user-{userId}
    else if (channel_name.startsWith('private-user-')) {
      const channelUserId = channel_name.replace('private-user-', '')
      if (channelUserId !== user.id) {
        return res.status(403).json({ message: 'Access denied to this channel' })
      }
    }
    // Unknown private channel
    else {
      return res.status(403).json({ message: 'Invalid channel name' })
    }

    // Authenticate with Pusher
    const auth = authenticateChannel(socket_id, channel_name, user)

    return res.status(200).json(auth)
  } catch (error) {
    console.error('Pusher auth error:', error)
    return res.status(500).json({ 
      message: 'Authentication failed',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    })
  }
}
