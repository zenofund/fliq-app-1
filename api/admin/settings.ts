/**
 * Admin Platform Settings Endpoint
 * GET: Retrieve platform settings
 * PATCH: Update platform settings
 */

import { storage } from '../../lib/storage';
import { requireAdmin } from '../../lib/auth';

export default async function handler(req: any, res: any) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Validate HTTP method
  if (req.method !== 'GET' && req.method !== 'PATCH') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify JWT token and admin role
    const authUser = await requireAdmin(req, res);
    if (!authUser) return; // requireAdmin already sent 401/403 response

    // GET: Retrieve settings
    if (req.method === 'GET') {
      const settings = await storage.getPlatformSettings();
      return res.status(200).json(settings);
    }

    // PATCH: Update settings
    if (req.method === 'PATCH') {
      const { commissionPercentage } = req.body;
      
      if (commissionPercentage === undefined || commissionPercentage < 0 || commissionPercentage > 100) {
        return res.status(400).json({ message: 'Invalid commission percentage' });
      }
      
      const updated = await storage.updatePlatformSettings(commissionPercentage);
      return res.status(200).json(updated);
    }
  } catch (error: any) {
    console.error('Platform settings error:', error);
    return res.status(500).json({ message: error.message || 'Failed to process settings' });
  }
}
