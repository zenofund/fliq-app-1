/**
 * Companion Earnings Dashboard Endpoint
 * Returns earnings summary and booking history
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
    
    // Enrich bookings with client info
    const enrichedBookings = await Promise.all(
      bookings.map(async (booking) => {
        const client = await storage.getClient(booking.clientId);
        return {
          ...booking,
          client: client ? {
            id: client.id,
            fullName: client.fullName,
            phone: client.phone,
          } : null,
        };
      })
    );

    const completedBookings = enrichedBookings.filter(b => b.status === "completed");
    const totalEarnings = completedBookings.reduce((sum, b) => sum + parseFloat(b.companionEarnings || "0"), 0);
    const pendingEarnings = enrichedBookings
      .filter(b => b.status === "accepted" && b.paymentStatus === "paid")
      .reduce((sum, b) => sum + parseFloat(b.companionEarnings || "0"), 0);

    return res.status(200).json({
      totalEarnings: totalEarnings.toFixed(2),
      pendingEarnings: pendingEarnings.toFixed(2),
      totalBookings: completedBookings.length,
      bookings: enrichedBookings.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    });
  } catch (error: any) {
    console.error('Earnings fetch error:', error);
    return res.status(500).json({ message: 'Failed to fetch earnings' });
  }
}
