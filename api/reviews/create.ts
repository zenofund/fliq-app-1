import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../lib/storage';
import { requireClient } from '../../lib/auth';
import { handleCors, validateMethod, handleError, generateId, sanitizeInput } from '../../lib/utils';
import { sendNotification } from '../../lib/supabase';
import { BOOKING_STATUSES } from '../../lib/constants';

/**
 * POST /api/reviews/create
 * Creates a review for a completed booking
 * Requires: Client authentication
 * 
 * Body:
 * - bookingId: string (required)
 * - rating: number (1-5, required)
 * - comment?: string
 * 
 * Returns:
 * - 201: { message, review }
 * - 400: { message } - Invalid input or booking not completed
 * - 401: { message } - Unauthorized
 * - 403: { message } - Not authorized
 * - 404: { message } - Booking not found
 * - 409: { message } - Review already exists
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

    const { bookingId, rating, comment } = req.body;

    // Validate required fields
    if (!bookingId || !rating) {
      return res.status(400).json({ message: 'Booking ID and rating are required' });
    }

    // Validate rating
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const booking = await storage.getBookingById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Verify this is the client's booking
    if (booking.clientId !== client.id) {
      return res.status(403).json({ message: 'Not authorized to review this booking' });
    }

    // Check if booking is completed
    if (booking.status !== BOOKING_STATUSES.COMPLETED) {
      return res.status(400).json({ message: 'Can only review completed bookings' });
    }

    // Check if review already exists
    const existingReview = await storage.getReviewByBookingId(bookingId);
    if (existingReview) {
      return res.status(409).json({ message: 'Review already exists for this booking' });
    }

    // Create review
    const reviewId = generateId('review');
    const review = await storage.createReview({
      id: reviewId,
      bookingId,
      companionId: booking.companionId,
      clientId: client.id,
      rating,
      comment: comment ? sanitizeInput(comment) : null,
    });

    // Get companion details
    const companion = await storage.getCompanionById(booking.companionId);

    // Send notification to companion
    if (companion) {
      await sendNotification(
        companion.userId,
        'review_received',
        'New Review',
        `You received a ${rating}-star review`,
        bookingId
      );
    }

    return res.status(201).json({
      message: 'Review created successfully',
      review,
    });
  } catch (error: any) {
    handleError(res, error, 'Create review');
  }
}
