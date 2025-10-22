/**
 * Get Client Bookings Endpoint
 * Returns all bookings for authenticated client with enriched companion data
 */

import { storage } from '../../lib/storage';
import { requireAuth } from '../../lib/auth';

export default async function handler(req: any, res: any) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Validate HTTP method
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify JWT token
    const authUser = await requireAuth(req, res);
    if (!authUser) return; // requireAuth already sent 401 response

    const client = await storage.getClientByUserId(authUser.userId);
    if (!client) {
      return res.status(404).json({ message: 'Client profile not found' });
    }

    const bookings = await storage.getClientBookings(client.id);
    
    // Enrich bookings with companion data and review status
    const enrichedBookings = await Promise.all(
      bookings.map(async (booking) => {
        const companion = await storage.getCompanion(booking.companionId);
        const review = await storage.getReviewByBookingId(booking.id);
        return {
          ...booking,
          hasReview: !!review,
          companion: companion ? { 
            id: companion.id, 
            fullName: companion.fullName, 
            profilePhoto: companion.profilePhoto 
          } : null,
        };
      })
    );
    
    return res.status(200).json(enrichedBookings);
  } catch (error: any) {
    console.error('Get client bookings error:', error);
    return res.status(500).json({ message: 'Failed to fetch bookings' });
  }
}
