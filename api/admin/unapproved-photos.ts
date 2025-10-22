/**
 * Admin Unapproved Photos Endpoint
 * Returns companions with unapproved profile photos
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

    const companions = await storage.getUnapprovedCompanions();
    return res.status(200).json(companions);
  } catch (error: any) {
    console.error('Get unapproved photos error:', error);
    return res.status(500).json({ message: 'Failed to fetch unapproved photos' });
  }
}
