/**
 * Create Review Endpoint
 * Allows clients to submit reviews for completed bookings
 */

import { storage } from '../../lib/storage';
import { requireAuth } from '../../lib/auth';

export default async function handler(req: any, res: any) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Validate HTTP method
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify JWT token
    const authUser = await requireAuth(req, res);
    if (!authUser) return; // requireAuth already sent 401 response

    const userId = authUser.userId;
    const user = await storage.getUserById(userId);
    
    if (!user || user.role !== 'client') {
      return res.status(403).json({ message: 'Only clients can submit reviews' });
    }

    const client = await storage.getClientByUserId(userId);
    if (!client) {
      return res.status(404).json({ message: 'Client profile not found' });
    }

    const { bookingId, companionId, rating, comment } = req.body;

    // Verify booking exists and is completed
    const booking = await storage.getBookingById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status !== 'completed') {
      return res.status(400).json({ message: 'Can only review completed bookings' });
    }

    if (booking.clientId !== client.id) {
      return res.status(403).json({ message: 'You can only review your own bookings' });
    }

    // Check if review already exists for this booking
    const existingReview = await storage.getReviewByBookingId(bookingId);
    if (existingReview) {
      return res.status(400).json({ message: 'Review already submitted for this booking' });
    }

    // Create review
    const review = await storage.createReview({
      bookingId,
      companionId,
      rating,
      comment: comment || null,
      clientId: client.id,
    });

    // Update companion rating
    const allReviews = await storage.getReviewsByCompanionId(companionId);
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    await storage.updateCompanionRating(companionId, avgRating.toFixed(2));

    return res.status(200).json({ message: 'Review submitted successfully', review });
  } catch (error: any) {
    console.error('Review submission error:', error);
    return res.status(500).json({ message: error.message || 'Failed to submit review' });
  }
}
