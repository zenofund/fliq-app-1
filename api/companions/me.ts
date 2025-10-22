import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../lib/storage';
import { requireCompanion } from '../../lib/auth';
import { handleCors, validateMethod, handleError } from '../../lib/utils';

/**
 * GET /api/companions/me
 * Returns the current companion's profile
 * Requires: Companion authentication
 * 
 * Returns:
 * - 200: { companion: Companion }
 * - 401: { message } - Unauthorized
 * - 403: { message } - Not a companion
 * - 404: { message } - Profile not found
 * - 500: { message } - Server error
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  if (handleCors(req, res)) return;

  // Validate method
  if (!validateMethod(req, res, 'GET')) return;

  try {
    // Require companion authentication
    const user = await requireCompanion(req, res);
    if (!user) return; // requireCompanion already sent error response

    const companion = await storage.getCompanionByUserId(user.userId);
    if (!companion) {
      return res.status(404).json({ message: 'Companion profile not found' });
    }

    return res.status(200).json({
      companion,
    });
  } catch (error: any) {
    handleError(res, error, 'Fetch companion profile');
  }
}
