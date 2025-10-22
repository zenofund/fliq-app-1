/**
 * Admin Bookings List Endpoint
 * Returns all bookings with enriched data
 */

import { storage } from '../../lib/storage';
import { requireAdmin } from '../../lib/auth';

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
    // Verify JWT token and admin role
    const authUser = await requireAdmin(req, res);
    if (!authUser) return; // requireAdmin already sent 401/403 response

    const bookings = await storage.getAllBookings();
    
    const enrichedBookings = await Promise.all(
      bookings.map(async (booking) => {
        const companion = await storage.getCompanion(booking.companionId);
        const client = await storage.getClient(booking.clientId);
        
        return {
          ...booking,
          companion: companion ? {
            id: companion.id,
            fullName: companion.fullName,
          } : null,
          client: client ? {
            id: client.id,
            fullName: client.fullName,
          } : null,
        };
      })
    );
    
    return res.status(200).json(enrichedBookings);
  } catch (error: any) {
    console.error('Get bookings error:', error);
    return res.status(500).json({ message: 'Failed to fetch bookings' });
  }
}
