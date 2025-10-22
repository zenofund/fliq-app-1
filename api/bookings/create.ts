import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../lib/storage';
import { requireClient } from '../../lib/auth';
import { handleCors, validateMethod, handleError, generateId, getBookingExpiration } from '../../lib/utils';
import { sendNotification } from '../../lib/supabase';
import { BOOKING_STATUSES, PAYMENT_STATUSES, BOOKING_EXPIRATION_MINUTES } from '../../lib/constants';

/**
 * POST /api/bookings/create
 * Creates a new booking request
 * Requires: Client authentication
 * 
 * Body:
 * - companionId: string (required)
 * - date: string (ISO 8601 format, required)
 * - duration: number (hours, required)
 * - location: string (required)
 * - notes?: string
 * 
 * Returns:
 * - 201: { message, booking }
 * - 400: { message } - Invalid input
 * - 401: { message } - Unauthorized
 * - 403: { message } - Not a client
 * - 404: { message } - Companion not found
 * - 500: { message } - Server error
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  if (handleCors(req, res)) return;

  // Validate method
  if (!validateMethod(req, res, 'POST')) return;

  try {
    // Require client authentication
    const user = await requireClient(req, res);
    if (!user) return;

    const client = await storage.getClientByUserId(user.userId);
    if (!client) {
      return res.status(404).json({ message: 'Client profile not found' });
    }

    const { companionId, date, duration, location, notes } = req.body;

    // Validate required fields
    if (!companionId || !date || !duration || !location) {
      return res.status(400).json({ message: 'Companion ID, date, duration, and location are required' });
    }

    // Validate duration
    if (typeof duration !== 'number' || duration < 1) {
      return res.status(400).json({ message: 'Duration must be at least 1 hour' });
    }

    // Verify companion exists and is available
    const companion = await storage.getCompanionById(companionId);
    if (!companion) {
      return res.status(404).json({ message: 'Companion not found' });
    }

    if (companion.availability !== 'available') {
      return res.status(400).json({ message: 'Companion is not available for bookings' });
    }

    // Calculate total amount
    const hourlyRate = parseFloat(companion.hourlyRate as string);
    const totalAmount = (hourlyRate * duration).toFixed(2);

    // Create booking
    const bookingId = generateId('booking');
    const expiresAt = getBookingExpiration(BOOKING_EXPIRATION_MINUTES);

    const booking = await storage.createBooking({
      id: bookingId,
      clientId: client.id,
      companionId: companion.id,
      date: new Date(date),
      duration,
      location,
      notes: notes || null,
      status: BOOKING_STATUSES.PENDING,
      totalAmount,
      paymentStatus: PAYMENT_STATUSES.PENDING,
      expiresAt,
    });

    // Send notification to companion
    await sendNotification(
      companion.userId,
      'booking_created',
      'New Booking Request',
      `You have a new booking request from ${client.name}`,
      booking.id
    );

    return res.status(201).json({
      message: 'Booking created successfully',
      booking,
    });
  } catch (error: any) {
    handleError(res, error, 'Create booking');
  }
}
