/**
 * Notification Service Library
 * 
 * Centralized service for sending notifications through multiple channels:
 * - In-app notifications (stored in database)
 * - Email notifications
 * - Push notifications
 * 
 * SAFETY CONSIDERATIONS:
 * - Notifications are sent asynchronously and failures don't block main flow
 * - Rate limiting should be implemented to prevent spam
 * - Templates prevent dynamic generation loops
 * - Notifications about notification actions are avoided
 */

import { sendMessageToUser } from './pusher'

/**
 * Notification types that can trigger automated notifications
 */
export const NOTIFICATION_TYPES = {
  BOOKING_REQUEST: 'booking_request',
  BOOKING_CONFIRMED: 'booking_confirmed',
  BOOKING_ACCEPTED: 'booking_accepted',
  BOOKING_REJECTED: 'booking_rejected',
  BOOKING_CANCELLED: 'booking_cancelled',
  BOOKING_COMPLETED: 'booking_completed',
  NEW_MESSAGE: 'new_message',
  APPOINTMENT_REMINDER: 'appointment_reminder',
  PAYMENT_RECEIVED: 'payment_received',
  PAYMENT_FAILED: 'payment_failed',
}

/**
 * Notification templates for each event type
 */
const NOTIFICATION_TEMPLATES = {
  [NOTIFICATION_TYPES.BOOKING_REQUEST]: {
    title: 'New Booking Request',
    getMessage: (data) => `You have a new booking request from ${data.clientName} for ${data.date} at ${data.time}`,
    emailSubject: 'New Booking Request',
    getEmailBody: (data) => `
      <h2>New Booking Request</h2>
      <p>You have received a new booking request:</p>
      <ul>
        <li><strong>Client:</strong> ${data.clientName}</li>
        <li><strong>Date:</strong> ${data.date}</li>
        <li><strong>Time:</strong> ${data.time}</li>
        <li><strong>Duration:</strong> ${data.duration} hours</li>
        <li><strong>Location:</strong> ${data.location}</li>
      </ul>
      <p><a href="${data.bookingUrl}">View Booking Details</a></p>
    `,
  },
  [NOTIFICATION_TYPES.BOOKING_CONFIRMED]: {
    title: 'Booking Confirmed',
    getMessage: (data) => `Your booking with ${data.companionName} for ${data.date} at ${data.time} has been confirmed`,
    emailSubject: 'Booking Confirmed',
    getEmailBody: (data) => `
      <h2>Booking Confirmed</h2>
      <p>Your booking has been confirmed:</p>
      <ul>
        <li><strong>Companion:</strong> ${data.companionName}</li>
        <li><strong>Date:</strong> ${data.date}</li>
        <li><strong>Time:</strong> ${data.time}</li>
        <li><strong>Location:</strong> ${data.location}</li>
      </ul>
      <p>You can now chat with your companion!</p>
      <p><a href="${data.bookingUrl}">View Booking Details</a></p>
    `,
  },
  [NOTIFICATION_TYPES.BOOKING_ACCEPTED]: {
    title: 'Booking Accepted',
    getMessage: (data) => `${data.companionName} has accepted your booking request! You can now chat.`,
    emailSubject: 'Booking Accepted',
    getEmailBody: (data) => `
      <h2>Booking Accepted</h2>
      <p>${data.companionName} has accepted your booking request!</p>
      <ul>
        <li><strong>Date:</strong> ${data.date}</li>
        <li><strong>Time:</strong> ${data.time}</li>
        <li><strong>Location:</strong> ${data.location}</li>
      </ul>
      <p>You can now start chatting with your companion!</p>
      <p><a href="${data.chatUrl}">Start Chat</a></p>
    `,
  },
  [NOTIFICATION_TYPES.BOOKING_REJECTED]: {
    title: 'Booking Rejected',
    getMessage: (data) => `Your booking request for ${data.date} at ${data.time} was declined. A refund has been initiated.`,
    emailSubject: 'Booking Request Declined',
    getEmailBody: (data) => `
      <h2>Booking Request Declined</h2>
      <p>Unfortunately, your booking request was declined.</p>
      <p>A full refund has been initiated and should be processed within 3-5 business days.</p>
      <p><a href="${data.searchUrl}">Find Other Companions</a></p>
    `,
  },
  [NOTIFICATION_TYPES.BOOKING_CANCELLED]: {
    title: 'Booking Cancelled',
    getMessage: (data) => `Your booking for ${data.date} at ${data.time} has been cancelled. A refund has been initiated.`,
    emailSubject: 'Booking Cancelled',
    getEmailBody: (data) => `
      <h2>Booking Cancelled</h2>
      <p>Your booking has been cancelled:</p>
      <ul>
        <li><strong>Date:</strong> ${data.date}</li>
        <li><strong>Time:</strong> ${data.time}</li>
      </ul>
      <p>A full refund has been initiated and should be processed within 3-5 business days.</p>
    `,
  },
  [NOTIFICATION_TYPES.BOOKING_COMPLETED]: {
    title: 'Booking Completed',
    getMessage: (data) => `Your booking with ${data.companionName || data.clientName} has been completed. Please leave a review!`,
    emailSubject: 'Booking Completed - Leave a Review',
    getEmailBody: (data) => `
      <h2>Booking Completed</h2>
      <p>Your booking has been completed successfully!</p>
      <p>We'd love to hear about your experience. Please take a moment to leave a review.</p>
      <p><a href="${data.reviewUrl}">Leave a Review</a></p>
    `,
  },
  [NOTIFICATION_TYPES.NEW_MESSAGE]: {
    title: 'New Message',
    getMessage: (data) => `${data.senderName} sent you a message: "${data.messagePreview}"`,
    emailSubject: 'New Message',
    getEmailBody: (data) => `
      <h2>New Message</h2>
      <p><strong>${data.senderName}</strong> sent you a message:</p>
      <blockquote>${data.messagePreview}</blockquote>
      <p><a href="${data.chatUrl}">View Conversation</a></p>
    `,
  },
  [NOTIFICATION_TYPES.APPOINTMENT_REMINDER]: {
    title: 'Appointment Reminder',
    getMessage: (data) => `Reminder: You have an appointment ${data.timeUntil} at ${data.location}`,
    emailSubject: 'Upcoming Appointment Reminder',
    getEmailBody: (data) => `
      <h2>Appointment Reminder</h2>
      <p>This is a reminder about your upcoming appointment:</p>
      <ul>
        <li><strong>Time:</strong> ${data.timeUntil}</li>
        <li><strong>Location:</strong> ${data.location}</li>
        <li><strong>With:</strong> ${data.otherPartyName}</li>
      </ul>
      <p><a href="${data.bookingUrl}">View Details</a></p>
    `,
  },
  [NOTIFICATION_TYPES.PAYMENT_RECEIVED]: {
    title: 'Payment Received',
    getMessage: (data) => `You received ${data.amount} for your completed booking`,
    emailSubject: 'Payment Received',
    getEmailBody: (data) => `
      <h2>Payment Received</h2>
      <p>You have received payment for your completed booking:</p>
      <ul>
        <li><strong>Amount:</strong> ${data.amount}</li>
        <li><strong>Booking Date:</strong> ${data.date}</li>
      </ul>
      <p><a href="${data.dashboardUrl}">View Dashboard</a></p>
    `,
  },
  [NOTIFICATION_TYPES.PAYMENT_FAILED]: {
    title: 'Payment Failed',
    getMessage: (data) => `Payment failed for your booking. Please update your payment method.`,
    emailSubject: 'Payment Failed - Action Required',
    getEmailBody: (data) => `
      <h2>Payment Failed</h2>
      <p>Unfortunately, the payment for your booking failed.</p>
      <p>Please update your payment method to complete the booking.</p>
      <p><a href="${data.paymentUrl}">Update Payment Method</a></p>
    `,
  },
}

/**
 * Send a notification to a user through all enabled channels
 * 
 * @param {string} userId - The user to notify
 * @param {string} notificationType - Type of notification (from NOTIFICATION_TYPES)
 * @param {object} data - Data to populate the notification template
 * @param {object} options - Additional options (channels to use)
 * @returns {Promise<object>} Results from each channel
 */
export async function sendNotification(userId, notificationType, data, options = {}) {
  const {
    inApp = true,
    email = false,
    push = false,
    userEmail = null,
    pushToken = null,
  } = options

  const results = {
    inApp: { success: false },
    email: { success: false },
    push: { success: false },
  }

  // Get notification template
  const template = NOTIFICATION_TEMPLATES[notificationType]
  if (!template) {
    console.error(`Unknown notification type: ${notificationType}`)
    return results
  }

  try {
    // 1. Send in-app notification (stored in database)
    if (inApp) {
      results.inApp = await sendInAppNotification(userId, notificationType, template, data)
    }

    // 2. Send email notification
    if (email && userEmail) {
      results.email = await sendEmailNotification(userEmail, template, data)
    }

    // 3. Send push notification
    if (push && pushToken) {
      results.push = await sendPushNotification(pushToken, template, data)
    }

    return results
  } catch (error) {
    console.error('Error sending notification:', error)
    // Don't throw - notification failures shouldn't break main flow
    return results
  }
}

/**
 * Send in-app notification (save to database and send real-time via Pusher)
 */
async function sendInAppNotification(userId, notificationType, template, data) {
  try {
    const notification = {
      userId,
      type: notificationType,
      title: template.title,
      message: template.getMessage(data),
      data,
      read: false,
      createdAt: new Date().toISOString(),
    }

    // TODO: Save to database
    // await db.query(
    //   'INSERT INTO notifications (user_id, type, title, message, data, read, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    //   [userId, notificationType, notification.title, notification.message, JSON.stringify(data), false, notification.createdAt]
    // )

    // Send real-time notification via Pusher
    try {
      await sendMessageToUser(userId, 'notification', notification)
    } catch (pusherError) {
      console.error('Failed to send real-time notification via Pusher:', pusherError)
      // Don't fail if Pusher fails
    }

    return { success: true, notification }
  } catch (error) {
    console.error('Error sending in-app notification:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Send email notification
 */
async function sendEmailNotification(email, template, data) {
  try {
    const subject = template.emailSubject
    const htmlBody = template.getEmailBody(data)

    // TODO: Integrate with email service (SendGrid, Mailgun, AWS SES, etc.)
    // Example with a generic approach:
    // const response = await fetch(process.env.EMAIL_SERVICE_URL, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${process.env.EMAIL_SERVICE_API_KEY}`
    //   },
    //   body: JSON.stringify({
    //     to: email,
    //     from: process.env.EMAIL_FROM || 'notifications@fliq.app',
    //     subject,
    //     html: htmlBody
    //   })
    // })
    // 
    // if (!response.ok) {
    //   throw new Error('Email service returned error')
    // }

    console.log(`[EMAIL] To: ${email}, Subject: ${subject}`)
    console.log('[EMAIL] Body:', htmlBody.substring(0, 100) + '...')

    return { success: true, email }
  } catch (error) {
    console.error('Error sending email notification:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Send push notification
 */
async function sendPushNotification(pushToken, template, data) {
  try {
    const title = template.title
    const body = template.getMessage(data)

    // TODO: Integrate with push notification service (Firebase Cloud Messaging, OneSignal, etc.)
    // Example with FCM:
    // const response = await fetch('https://fcm.googleapis.com/fcm/send', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `key=${process.env.FCM_SERVER_KEY}`
    //   },
    //   body: JSON.stringify({
    //     to: pushToken,
    //     notification: { title, body },
    //     data
    //   })
    // })
    // 
    // if (!response.ok) {
    //   throw new Error('Push service returned error')
    // }

    console.log(`[PUSH] Token: ${pushToken}, Title: ${title}`)
    console.log('[PUSH] Body:', body)

    return { success: true, pushToken }
  } catch (error) {
    console.error('Error sending push notification:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get notification preferences for a user
 * This would typically query the database for user preferences
 */
export async function getUserNotificationPreferences(userId) {
  // TODO: Fetch from database
  // const prefs = await db.query('SELECT * FROM notification_preferences WHERE user_id = ?', [userId])
  
  // Default preferences
  return {
    inApp: true,
    email: true,
    push: true,
    emailAddress: null, // Should be fetched from user profile
    pushToken: null, // Should be fetched from user devices
  }
}

/**
 * Helper to send notification with user preferences
 */
export async function sendNotificationWithPreferences(userId, notificationType, data) {
  try {
    // Get user preferences
    const prefs = await getUserNotificationPreferences(userId)

    // Send notification through preferred channels
    return await sendNotification(userId, notificationType, data, {
      inApp: prefs.inApp,
      email: prefs.email,
      push: prefs.push,
      userEmail: prefs.emailAddress,
      pushToken: prefs.pushToken,
    })
  } catch (error) {
    console.error('Error sending notification with preferences:', error)
    return { success: false, error: error.message }
  }
}
