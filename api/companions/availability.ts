/**
 * Update Companion Availability Endpoint
 * Updates companion's availability schedule
 */

import { storage } from '../../lib/storage';
import { requireAuth } from '../../lib/auth';

export default async function handler(req: any, res: any) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Validate HTTP method
  if (req.method !== 'PATCH') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify JWT token
    const authUser = await requireAuth(req, res);
    if (!authUser) return; // requireAuth already sent 401 response

    const { availability } = req.body;
    const companion = await storage.getCompanionByUserId(authUser.userId);
    if (!companion) {
      return res.status(404).json({ message: 'Companion profile not found' });
    }

    const updated = await storage.updateCompanion(companion.id, { availability });
    return res.status(200).json(updated);
  } catch (error: any) {
    console.error('Update availability error:', error);
    return res.status(500).json({ message: 'Failed to update availability' });
  }
}
