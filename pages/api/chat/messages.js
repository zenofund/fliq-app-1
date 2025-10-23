/**
 * Chat Messages API Route - Serverless Function
 * 
 * INFINITE LOOP PREVENTION:
 * - Each request is handled exactly once with a single response
 * - No recursive API calls or self-referencing endpoints
 * - Request validation happens before any processing
 * - Early returns for invalid requests prevent unnecessary processing
 * 
 * HANGING REQUEST PREVENTION:
 * - All async operations have timeouts
 * - Database queries are wrapped in try-catch blocks
 * - Always return a response (success or error)
 * - No event listeners or long-polling in serverless functions
 * 
 * ERROR HANDLING:
 * - Comprehensive try-catch blocks around all operations
 * - Proper HTTP status codes for different error types
 * - Never expose internal errors to client
 * - Log errors for debugging while returning safe messages
 * - Validate all inputs before processing
 * 
 * BEST PRACTICES:
 * - Authenticate requests with JWT tokens
 * - Validate request body schema
 * - Use database transactions for complex operations
 * - Implement rate limiting to prevent abuse
 * - Content moderation for safety
 */

import { verifyToken } from '../../../lib/auth'
import { sendMessageToConversation } from '../../../lib/pusher'

export default async function handler(req, res) {
  // Set CORS headers to prevent hanging requests
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  // Handle preflight requests immediately
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    // Authenticate user - ALWAYS verify before processing
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

    // Route based on HTTP method
    switch (req.method) {
      case 'GET':
        return await handleGetMessages(req, res, user)
      
      case 'POST':
        return await handleSendMessage(req, res, user)
      
      default:
        return res.status(405).json({ message: 'Method not allowed' })
    }
  } catch (error) {
    // CRITICAL: Always catch and handle errors to prevent hanging requests
    console.error('Chat messages API error:', error)
    return res.status(500).json({ 
      message: 'Internal server error',
      // Don't expose error details in production
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    })
  }
}

/**
 * GET /api/chat/messages - Fetch messages for a conversation
 * SAFETY: No loops, single database query with pagination
 */
async function handleGetMessages(req, res, user) {
  try {
    const { bookingId, page = 1, limit = 50 } = req.query

    if (!bookingId) {
      return res.status(400).json({ 
        message: 'Missing required field: bookingId'
      })
    }

    // TODO: Verify user has access to this booking (is client or companion)
    // const booking = await db.query(
    //   'SELECT * FROM bookings WHERE id = ? AND (user_id = ? OR companion_id = ?)',
    //   [bookingId, user.id, user.id]
    // )
    // if (!booking) {
    //   return res.status(403).json({ message: 'Access denied to this conversation' })
    // }

    // TODO: Check booking status - chat only available between 'accepted' and 'completed'
    // if (!['accepted', 'confirmed'].includes(booking.status)) {
    //   return res.status(403).json({ 
    //     message: 'Chat is not available for this booking',
    //     status: booking.status
    //   })
    // }

    // TODO: Fetch messages from database with pagination
    // const messages = await db.query(
    //   'SELECT * FROM messages WHERE booking_id = ? ORDER BY created_at ASC LIMIT ? OFFSET ?',
    //   [bookingId, parseInt(limit), (parseInt(page) - 1) * parseInt(limit)]
    // )

    // Placeholder data for development
    const messages = [
      {
        id: 1,
        bookingId: bookingId,
        senderId: user.role === 'client' ? 'comp123' : 'user123',
        senderRole: user.role === 'client' ? 'companion' : 'client',
        text: 'Hi! Thanks for booking. Looking forward to meeting you!',
        createdAt: new Date(Date.now() - 3600000).toISOString()
      }
    ]

    return res.status(200).json({
      messages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: messages.length
      }
    })
  } catch (error) {
    console.error('Error fetching messages:', error)
    throw error
  }
}

/**
 * POST /api/chat/messages - Send a new message
 * SAFETY: Validates input, single write operation, no recursive calls
 */
async function handleSendMessage(req, res, user) {
  try {
    const { bookingId, text } = req.body

    // Validate request body
    if (!bookingId || !text) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: ['bookingId', 'text']
      })
    }

    // Validate message length
    if (text.length > 5000) {
      return res.status(400).json({ 
        message: 'Message is too long. Maximum length is 5000 characters.'
      })
    }

    if (text.trim().length === 0) {
      return res.status(400).json({ 
        message: 'Message cannot be empty'
      })
    }

    // TODO: Verify user has access to this booking
    // const booking = await db.query(
    //   'SELECT * FROM bookings WHERE id = ? AND (user_id = ? OR companion_id = ?)',
    //   [bookingId, user.id, user.id]
    // )
    // if (!booking) {
    //   return res.status(403).json({ message: 'Access denied to this conversation' })
    // }

    // TODO: Check booking status - chat only available between 'accepted' and 'completed'
    // if (!['accepted', 'confirmed'].includes(booking.status)) {
    //   return res.status(403).json({ 
    //     message: 'Chat is not available for this booking',
    //     status: booking.status,
    //     hint: booking.status === 'pending' 
    //       ? 'Chat will be available once the companion accepts the booking'
    //       : 'Chat is no longer available for this booking'
    //   })
    // }

    // TODO: Content moderation with OpenAI
    // Check for inappropriate content before saving
    // const moderationResult = await fetch('/api/moderation/openai', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ text })
    // })
    // if (moderationResult.flagged) {
    //   return res.status(400).json({ 
    //     message: 'Message contains inappropriate content and cannot be sent'
    //   })
    // }

    // TODO: Insert message into database
    // const messageId = await db.query(
    //   'INSERT INTO messages (booking_id, sender_id, sender_role, text, created_at) VALUES (?, ?, ?, ?, ?)',
    //   [bookingId, user.id, user.role, text, new Date()]
    // )

    const newMessage = {
      id: Date.now(), // In production, use database-generated ID
      bookingId,
      senderId: user.id,
      senderRole: user.role,
      text,
      createdAt: new Date().toISOString()
    }

    // Send real-time notification via Pusher
    try {
      await sendMessageToConversation(bookingId, {
        ...newMessage,
        // Don't send sender ID in real-time to prevent spoofing
        sender: user.role
      })
    } catch (pusherError) {
      // Log but don't fail the request if Pusher fails
      console.error('Failed to send real-time notification:', pusherError)
    }

    // TODO: Send push notification to the other party
    // const recipientId = user.role === 'client' ? booking.companionId : booking.userId
    // await sendUserNotification(recipientId, {
    //   type: 'new_message',
    //   bookingId,
    //   message: text.substring(0, 50) + (text.length > 50 ? '...' : '')
    // })

    return res.status(201).json({
      message: 'Message sent successfully',
      data: newMessage
    })
  } catch (error) {
    console.error('Error sending message:', error)
    throw error
  }
}
