/**
 * Pusher Helper Library
 * Utility functions for Pusher real-time messaging
 */

import Pusher from 'pusher'
import PusherClient from 'pusher-js'

// Server-side Pusher instance
let pusherServer = null

/**
 * Get Pusher server instance
 * Used in API routes to send events
 */
export function getPusherServer() {
  if (!pusherServer) {
    pusherServer = new Pusher({
      appId: process.env.PUSHER_APP_ID,
      key: process.env.NEXT_PUBLIC_PUSHER_KEY,
      secret: process.env.PUSHER_SECRET,
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'us2',
      useTLS: true
    })
  }
  return pusherServer
}

/**
 * Get Pusher client instance
 * Used in React components to subscribe to events
 */
export function getPusherClient() {
  if (typeof window === 'undefined') {
    return null // Don't initialize on server
  }

  return new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY, {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'us2',
    encrypted: true
  })
}

/**
 * Trigger an event on a channel
 * @param {string} channel - Channel name
 * @param {string} event - Event name
 * @param {Object} data - Event data
 */
export async function triggerEvent(channel, event, data) {
  try {
    const pusher = getPusherServer()
    await pusher.trigger(channel, event, data)
  } catch (error) {
    console.error('Pusher trigger error:', error)
    throw new Error('Failed to send real-time event')
  }
}

/**
 * Send a notification to a user
 * @param {string} userId - User ID
 * @param {Object} notification - Notification data
 */
export async function sendUserNotification(userId, notification) {
  try {
    await triggerEvent(
      `private-user-${userId}`,
      'notification',
      notification
    )
  } catch (error) {
    console.error('Failed to send user notification:', error)
  }
}

/**
 * Send a message to a conversation
 * @param {string} conversationId - Conversation ID
 * @param {Object} message - Message data
 */
export async function sendMessageToConversation(conversationId, message) {
  try {
    await triggerEvent(
      `private-conversation-${conversationId}`,
      'new-message',
      message
    )
  } catch (error) {
    console.error('Failed to send message:', error)
  }
}

/**
 * Notify about booking update
 * @param {string} bookingId - Booking ID
 * @param {Object} update - Update data
 */
export async function notifyBookingUpdate(bookingId, update) {
  try {
    await triggerEvent(
      `private-booking-${bookingId}`,
      'booking-update',
      update
    )
  } catch (error) {
    console.error('Failed to notify booking update:', error)
  }
}

/**
 * Authenticate Pusher channel (for private channels)
 * @param {string} socketId - Socket ID from Pusher
 * @param {string} channel - Channel name
 * @param {Object} user - User data
 * @returns {Object} - Authentication data
 */
export function authenticateChannel(socketId, channel, user) {
  try {
    const pusher = getPusherServer()
    
    // Verify user has access to this channel
    // For example, user can only access their own private channel
    if (channel.startsWith('private-user-')) {
      const channelUserId = channel.replace('private-user-', '')
      if (channelUserId !== user.id) {
        throw new Error('Unauthorized channel access')
      }
    }

    const auth = pusher.authenticate(socketId, channel)
    return auth
  } catch (error) {
    console.error('Pusher authentication error:', error)
    throw error
  }
}
