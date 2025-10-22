import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../../lib/storage';
import { requireAdmin } from '../../../lib/auth';
import { handleCors, validateMethod, handleError } from '../../../lib/utils';

/**
 * PUT /api/companions/[id]/status
 * Updates a companion's verification or featured status
 * Requires: Admin authentication
 * 
 * Body:
 * - verified?: boolean
 * - featured?: boolean
 * 
 * Returns:
 * - 200: { message, companion }
 * - 400: { message } - No updates provided
 * - 401: { message } - Unauthorized
 * - 403: { message } - Not an admin
 * - 404: { message } - Companion not found
 * - 500: { message } - Server error
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  if (handleCors(req, res)) return;

  // Validate method
  if (!validateMethod(req, res, 'PUT')) return;

  try {
    // Require admin authentication
    const user = await requireAdmin(req, res);
    if (!user) return;

    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: 'Companion ID is required' });
    }

    const companion = await storage.getCompanionById(id);
    if (!companion) {
      return res.status(404).json({ message: 'Companion not found' });
    }

    const { verified, featured } = req.body;

    if (verified === undefined && featured === undefined) {
      return res.status(400).json({ message: 'No updates provided' });
    }

    const updateData: any = {};
    if (verified !== undefined) updateData.verified = verified;
    if (featured !== undefined) updateData.featured = featured;

    const updatedCompanion = await storage.updateCompanion(companion.id, updateData);

    return res.status(200).json({
      message: 'Companion status updated successfully',
      companion: updatedCompanion,
    });
  } catch (error: any) {
    handleError(res, error, 'Update companion status');
  }
}
