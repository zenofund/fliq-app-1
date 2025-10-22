import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../../lib/storage';
import { requireAuth } from '../../../lib/auth';
import { handleCors, validateMethod, handleError } from '../../../lib/utils';
import { sendNotification } from '../../../lib/supabase';
import { BOOKING_STATUSES } from '../../../lib/constants';

/**
 * GET /api/bookings/[id]
 * Returns a specific booking's details
 * PUT /api/bookings/[id]
 * Updates a booking's status (confirm, cancel, complete)
 * Requires: Authentication
 * 
 * Query params:
 * - id: booking ID
 * 
 * Body (for PUT):
 * - status: 'confirmed' | 'cancelled' | 'completed'
 * 
 * Returns:
 * - 200: { booking } (GET) or { message, booking } (PUT)
 * - 400: { message } - Invalid input
 * - 401: { message } - Unauthorized
 * - 403: { message } - Not authorized to access this booking
 * - 404: { message } - Booking not found
 * - 500: { message } - Server error
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  if (handleCors(req, res)) return;

  // Validate method
  if (!validateMethod(req, res, ['GET', 'PUT'])) return;

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

    // Check if user has access to this booking
    const hasAccess = 
      user.role === 'admin' ||
      (client && booking.clientId === client.id) ||
      (companion && booking.companionId === companion.id);

    if (!hasAccess) {
      return res.status(403).json({ message: 'Not authorized to access this booking' });
    }

    if (req.method === 'GET') {
      return res.status(200).json({ booking });
    }

    // PUT - Update booking status
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const validStatuses = Object.values(BOOKING_STATUSES);
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    // Validate status transitions
    if (status === BOOKING_STATUSES.CONFIRMED && companion && booking.companionId === companion.id) {
      // Only companion can confirm
    } else if (status === BOOKING_STATUSES.CANCELLED) {
      // Both client and companion can cancel
    } else if (status === BOOKING_STATUSES.COMPLETED && companion && booking.companionId === companion.id) {
      // Only companion can mark as completed
    } else {
      return res.status(403).json({ message: 'Not authorized to perform this action' });
    }

    const updatedBooking = await storage.updateBooking(booking.id, { status });

    // Send notification
    const notificationUserId = companion && booking.companionId === companion.id
      ? booking.clientId
      : booking.companionId;

    const companion_user = await storage.getCompanionById(booking.companionId);
    const client_user = await storage.getClientById(booking.clientId);

    if (companion_user && client_user) {
      await sendNotification(
        companion && booking.companionId === companion.id ? client_user.userId : companion_user.userId,
        `booking_${status}`,
        'Booking Update',
        `Your booking status has been updated to ${status}`,
        booking.id
      );
    }

    return res.status(200).json({
      message: 'Booking updated successfully',
      booking: updatedBooking,
    });
  } catch (error: any) {
    handleError(res, error, 'Manage booking');
  }
}
