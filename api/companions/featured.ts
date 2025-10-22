/**
 * Featured Companions Endpoint
 * Returns top 4 companions by rating and total bookings
 * Public endpoint - no auth required
 */

import { storage } from '../../lib/storage';

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
    const companions = await storage.getAllCompanions();
    
    // Get top 4 companions by rating and bookings
    const featured = companions
      .filter((c) => c.isPhotoApproved)
      .sort((a, b) => {
        const ratingDiff = parseFloat(b.rating || "0") - parseFloat(a.rating || "0");
        if (ratingDiff !== 0) return ratingDiff;
        return (b.totalBookings || 0) - (a.totalBookings || 0);
      })
      .slice(0, 4);

    return res.status(200).json(featured);
  } catch (error: any) {
    console.error('Featured companions error:', error);
    return res.status(500).json({ message: 'Failed to fetch featured companions' });
  }
}
