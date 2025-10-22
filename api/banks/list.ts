/**
 * List Banks Endpoint
 * Returns list of Nigerian banks from Paystack
 */

import { requireAuth } from '../../lib/auth';
import { listBanks } from '../../lib/paystack';

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

    const banks = await listBanks();
    return res.status(200).json(banks);
  } catch (error: any) {
    console.error('List banks error:', error);
    return res.status(500).json({ message: 'Failed to fetch banks' });
  }
}
