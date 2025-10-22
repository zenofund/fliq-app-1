/**
 * Get Booking Details Endpoint
 * Returns booking with enriched companion and client data
 */

import { storage } from '../../../lib/storage';
import { requireAuth } from '../../../lib/auth';

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

    const { id: bookingId } = req.query;
    const booking = await storage.getBooking(bookingId as string);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Enrich with companion and client data
    const companion = await storage.getCompanion(booking.companionId);
    const client = await storage.getClient(booking.clientId);

    return res.status(200).json({
      ...booking,
      companion: companion ? {
        fullName: companion.fullName,
        profilePhoto: companion.profilePhoto,
      } : null,
      client: client ? {
        fullName: client.fullName,
      } : null,
    });
  } catch (error: any) {
    console.error('Get booking error:', error);
    return res.status(500).json({ message: 'Failed to fetch booking' });
  }
}
