import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../lib/storage';
import { requireAdmin } from '../../lib/auth';
import { handleCors, validateMethod, handleError } from '../../lib/utils';

/**
 * GET /api/admin/stats
 * Returns platform statistics
 * Requires: Admin authentication
 * 
 * Returns:
 * - 200: { stats: { totalUsers, totalCompanions, totalClients, totalBookings, activeBookings } }
 * - 401: { message } - Unauthorized
 * - 403: { message } - Not an admin
 * - 500: { message } - Server error
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  if (handleCors(req, res)) return;

  // Validate method
  if (!validateMethod(req, res, 'GET')) return;

  try {
    // Require admin authentication
    const user = await requireAdmin(req, res);
    if (!user) return;

    const stats = await storage.getAdminStats();

    return res.status(200).json({
      stats,
    });
  } catch (error: any) {
    handleError(res, error, 'Fetch admin stats');
  }
}
