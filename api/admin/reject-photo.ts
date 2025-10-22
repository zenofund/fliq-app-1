import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../lib/storage';
import { requireAdmin } from '../../lib/auth';
import { handleCors, validateMethod, handleError } from '../../lib/utils';
import { sendNotification } from '../../lib/supabase';

/**
 * POST /api/admin/reject-photo
 * Rejects a photo submission
 * Requires: Admin authentication
 * 
 * Body:
 * - photoId: string (required)
 * - reason?: string
 * 
 * Returns:
 * - 200: { message, photo }
 * - 400: { message } - Invalid input
 * - 401: { message } - Unauthorized
 * - 403: { message } - Not an admin
 * - 404: { message } - Photo not found
 * - 500: { message } - Server error
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  if (handleCors(req, res)) return;

  // Validate method
  if (!validateMethod(req, res, 'POST')) return;

  try {
    // Require admin authentication
    const user = await requireAdmin(req, res);
    if (!user) return;

    const { photoId, reason } = req.body;

    if (!photoId) {
      return res.status(400).json({ message: 'Photo ID is required' });
    }

    // Get all pending photos to find the one we're rejecting
    const pendingPhotos = await storage.getUnapprovedPhotos();
    const photo = pendingPhotos.find(p => p.id === photoId);

    if (!photo) {
      return res.status(404).json({ message: 'Photo not found or already processed' });
    }

    // Update photo approval status
    const updatedPhoto = await storage.updatePhotoApproval(photoId, 'rejected');

    // Get companion details
    const companion = await storage.getCompanionById(photo.companionId);

    // Send notification to companion
    if (companion) {
      await sendNotification(
        companion.userId,
        'photo_rejected',
        'Photo Rejected',
        reason || 'Your photo submission has been rejected. Please try uploading a different photo.'
      );
    }

    return res.status(200).json({
      message: 'Photo rejected successfully',
      photo: updatedPhoto,
    });
  } catch (error: any) {
    handleError(res, error, 'Reject photo');
  }
}
