import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../lib/storage';
import { requireCompanion } from '../../lib/auth';
import { handleCors, validateMethod, handleError } from '../../lib/utils';

/**
 * GET /api/companions/bookings
 * Returns all bookings for the current companion
 * Requires: Companion authentication
 * 
 * Returns:
 * - 200: { bookings: Booking[] }
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
    if (!user) return;

    const companion = await storage.getCompanionByUserId(user.userId);
    if (!companion) {
      return res.status(404).json({ message: 'Companion profile not found' });
    }

    const bookings = await storage.getBookingsByCompanionId(companion.id);

    return res.status(200).json({
      bookings,
    });
  } catch (error: any) {
    handleError(res, error, 'Fetch companion bookings');
  }
}
