import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../lib/storage';
import { requireAdmin } from '../../lib/auth';
import { handleCors, validateMethod, handleError } from '../../lib/utils';

/**
 * GET /api/admin/unapproved-photos
 * Returns all pending photo approvals
 * Requires: Admin authentication
 * 
 * Returns:
 * - 200: { photos: PhotoApproval[] }
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

    const photos = await storage.getUnapprovedPhotos();

    return res.status(200).json({
      photos,
    });
  } catch (error: any) {
    handleError(res, error, 'Fetch unapproved photos');
  }
}
