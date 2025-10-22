import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../../lib/storage';
import { requireAuth } from '../../../lib/auth';
import { handleCors, validateMethod, handleError } from '../../../lib/utils';

/**
 * GET /api/bookings/[id]/messages
 * Returns all messages for a specific booking
 * Requires: Authentication (client or companion involved in the booking)
 * 
 * Query params:
 * - id: booking ID
 * 
 * Returns:
 * - 200: { messages: Message[] }
 * - 400: { message } - Invalid booking ID
 * - 401: { message } - Unauthorized
 * - 403: { message } - Not authorized to view these messages
 * - 404: { message } - Booking not found
 * - 500: { message } - Server error
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  if (handleCors(req, res)) return;

  // Validate method
  if (!validateMethod(req, res, 'GET')) return;

  try {
    // Require authentication
    const user = await requireAuth(req, res);
    if (!user) return;

    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: 'Booking ID is required' });
    }

    const booking = await storage.getBookingById(id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Get user's client/companion profile to verify access
    const client = await storage.getClientByUserId(user.userId);
    const companion = await storage.getCompanionByUserId(user.userId);

    // Check if user has access to this booking's messages
    const hasAccess = 
      user.role === 'admin' ||
      (client && booking.clientId === client.id) ||
      (companion && booking.companionId === companion.id);

    if (!hasAccess) {
      return res.status(403).json({ message: 'Not authorized to view these messages' });
    }

    const messages = await storage.getMessagesByBookingId(id);

    return res.status(200).json({
      messages,
    });
  } catch (error: any) {
    handleError(res, error, 'Fetch booking messages');
  }
}
