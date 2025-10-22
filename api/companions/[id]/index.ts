/**
 * Get Companion by ID Endpoint
 * Returns companion details by ID
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

    const { id } = req.query;
    const companion = await storage.getCompanion(id as string);
    
    if (!companion) {
      return res.status(404).json({ message: 'Companion not found' });
    }

    return res.status(200).json(companion);
  } catch (error: any) {
    console.error('Get companion error:', error);
    return res.status(500).json({ message: 'Failed to fetch companion' });
  }
}
