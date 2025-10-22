/**
 * Notifications Helper
 * Creates notifications in database
 * In the FliQCompanion version, this also sent WebSocket messages
 * For serverless, we just create DB records and let client poll
 */

import { storage } from './storage';

export async function sendNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  bookingId?: string
) {
  try {
    // Create notification in database
    const notification = await storage.createNotification({
      userId,
      type,
      title,
      message,
      bookingId: bookingId || null,
      isRead: false,
    });

    // In original FliQCompanion, WebSocket broadcasting happened here
    // In serverless, clients will poll the notifications endpoint
    
    return notification;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
}
