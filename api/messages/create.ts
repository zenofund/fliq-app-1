import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../lib/storage';
import { requireAuth } from '../../lib/auth';
import { handleCors, validateMethod, handleError, generateId, sanitizeInput } from '../../lib/utils';
import { sendNotification, broadcastMessage } from '../../lib/supabase';

/**
 * POST /api/messages/create
 * Creates a new message in a booking conversation
 * Requires: Authentication
 * 
 * Body:
 * - bookingId: string (required)
 * - content: string (required)
 * 
 * Returns:
 * - 201: { message: Message }
 * - 400: { message } - Invalid input
 * - 401: { message } - Unauthorized
 * - 403: { message } - Not authorized
 * - 404: { message } - Booking not found
 * - 500: { message } - Server error
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  if (handleCors(req, res)) return;

  // Validate method
  if (!validateMethod(req, res, 'POST')) return;

  try {
    // Require authentication
    const user = await requireAuth(req, res);
    if (!user) return;

    const { bookingId, content } = req.body;

    // Validate required fields
    if (!bookingId || !content) {
      return res.status(400).json({ message: 'Booking ID and content are required' });
    }

    // Validate content length
    if (content.trim().length === 0) {
      return res.status(400).json({ message: 'Message content cannot be empty' });
    }

    if (content.length > 1000) {
      return res.status(400).json({ message: 'Message content is too long (max 1000 characters)' });
    }

    const booking = await storage.getBookingById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Get user's client/companion profile to verify access
    const client = await storage.getClientByUserId(user.userId);
    const companion = await storage.getCompanionByUserId(user.userId);

    // Check if user has access to this booking
    const hasAccess = 
      (client && booking.clientId === client.id) ||
      (companion && booking.companionId === companion.id);

    if (!hasAccess) {
      return res.status(403).json({ message: 'Not authorized to message in this booking' });
    }

    // Create message
    const messageId = generateId('message');
    const message = await storage.createMessage({
      id: messageId,
      bookingId,
      senderId: user.userId,
      content: sanitizeInput(content),
      flagged: false,
      dismissed: false,
    });

    // Broadcast message in real-time
    await broadcastMessage(bookingId, message);

    // Send notification to the other party
    const recipientUserId = companion && booking.companionId === companion.id
      ? (await storage.getClientById(booking.clientId))?.userId
      : (await storage.getCompanionById(booking.companionId))?.userId;

    if (recipientUserId) {
      await sendNotification(
        recipientUserId,
        'message_received',
        'New Message',
        'You have a new message',
        bookingId
      );
    }

    return res.status(201).json({
      message,
    });
  } catch (error: any) {
    handleError(res, error, 'Create message');
  }
}
