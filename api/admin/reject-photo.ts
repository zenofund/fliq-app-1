/**
 * Admin Reject Photo Endpoint
 * Rejects a companion's profile photo
 */

import { storage } from '../../lib/storage';
import { requireAdmin } from '../../lib/auth';

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
    // Verify JWT token and admin role
    const authUser = await requireAdmin(req, res);
    if (!authUser) return; // requireAdmin already sent 401/403 response

    const { companionId } = req.body;
    await storage.rejectCompanionPhoto(companionId);
    
    return res.status(200).json({ message: 'Photo rejected successfully' });
  } catch (error: any) {
    console.error('Reject photo error:', error);
    return res.status(500).json({ message: 'Failed to reject photo' });
  }
}
