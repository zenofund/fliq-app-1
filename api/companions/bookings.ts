/**
 * Get Companion Bookings Endpoint
 * Returns all bookings for authenticated companion with enriched client data
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

    const companion = await storage.getCompanionByUserId(authUser.userId);
    if (!companion) {
      return res.status(404).json({ message: 'Companion profile not found' });
    }

    const bookings = await storage.getCompanionBookings(companion.id);
    
    // Enrich bookings with client data and add computed fields
    const enrichedBookings = await Promise.all(
      bookings.map(async (booking) => {
        const client = await storage.getClient(booking.clientId);
        return {
          ...booking,
          client: client ? { id: client.id, fullName: client.fullName, phone: client.phone } : null,
        };
      })
    );
    
    return res.status(200).json(enrichedBookings);
  } catch (error: any) {
    console.error('Get companion bookings error:', error);
    return res.status(500).json({ message: 'Failed to fetch bookings' });
  }
}
