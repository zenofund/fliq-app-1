import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../lib/storage';
import { requireCompanion } from '../../lib/auth';
import { handleCors, validateMethod, handleError } from '../../lib/utils';
import { AVAILABILITY_STATUSES } from '../../lib/constants';

/**
 * POST /api/companions/toggle-availability
 * Toggles the companion's availability status
 * Requires: Companion authentication
 * 
 * Body:
 * - availability: 'available' | 'unavailable' | 'busy'
 * 
 * Returns:
 * - 200: { message, availability }
 * - 400: { message } - Invalid availability status
 * - 401: { message } - Unauthorized
 * - 403: { message } - Not a companion
 * - 404: { message } - Profile not found
 * - 500: { message } - Server error
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  if (handleCors(req, res)) return;

  // Validate method
  if (!validateMethod(req, res, 'POST')) return;

  try {
    // Require companion authentication
    const user = await requireCompanion(req, res);
    if (!user) return;

    const companion = await storage.getCompanionByUserId(user.userId);
    if (!companion) {
      return res.status(404).json({ message: 'Companion profile not found' });
    }

    const { availability } = req.body;

    // Validate availability status
    const validStatuses = Object.values(AVAILABILITY_STATUSES);
    if (!availability || !validStatuses.includes(availability)) {
      return res.status(400).json({
        message: `Invalid availability status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    // Update availability
    const updatedCompanion = await storage.updateCompanion(companion.id, { availability });

    return res.status(200).json({
      message: 'Availability updated successfully',
      availability: updatedCompanion.availability,
    });
  } catch (error: any) {
    handleError(res, error, 'Toggle availability');
  }
}
