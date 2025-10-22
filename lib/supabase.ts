import { createClient } from '@supabase/supabase-js';
import { storage } from './storage';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Helper function to send real-time notifications to users
 * Creates a notification in the database which triggers Supabase Realtime broadcast
 * 
 * @param userId - The ID of the user to notify
 * @param type - The type of notification (e.g., 'booking', 'message', 'payment')
 * @param title - The notification title
 * @param message - The notification message content
 * @param bookingId - Optional booking ID if notification is related to a booking
 * @returns The created notification object
 */
export async function sendNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  bookingId?: string
) {
  try {
    const notification = await storage.createNotification({
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type,
      title,
      message,
      bookingId: bookingId || null,
      isRead: false,
    });

    // Supabase Realtime will automatically broadcast this to subscribed clients
    // No additional code needed - the frontend should subscribe to the notifications table
    
    return notification;
  } catch (error) {
    console.error('Failed to send notification:', error);
    throw error;
  }
}

/**
 * Helper function to broadcast a message in real-time
 * Frontend clients listening to the messages channel will receive this immediately
 */
export async function broadcastMessage(bookingId: string, message: any) {
  try {
    await supabase
      .channel(`booking_${bookingId}`)
      .send({
        type: 'broadcast',
        event: 'new_message',
        payload: message,
      });
  } catch (error) {
    console.error('Failed to broadcast message:', error);
  }
}
