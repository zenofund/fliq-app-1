import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../lib/storage';
import { requireAdmin } from '../../lib/auth';
import { handleCors, validateMethod, handleError } from '../../lib/utils';
import { sendNotification } from '../../lib/supabase';
import { PHOTO_TYPES } from '../../lib/constants';

/**
 * POST /api/admin/approve-photo
 * Approves a photo and adds it to the companion's profile
 * Requires: Admin authentication
 * 
 * Body:
 * - photoId: string (required)
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

    const { photoId } = req.body;

    if (!photoId) {
      return res.status(400).json({ message: 'Photo ID is required' });
    }

    // Get all pending photos to find the one we're approving
    const pendingPhotos = await storage.getUnapprovedPhotos();
    const photo = pendingPhotos.find(p => p.id === photoId);

    if (!photo) {
      return res.status(404).json({ message: 'Photo not found or already processed' });
    }

    // Update photo approval status
    const updatedPhoto = await storage.updatePhotoApproval(photoId, 'approved');

    // Update companion profile with the photo
    const companion = await storage.getCompanionById(photo.companionId);
    if (companion) {
      if (photo.photoType === PHOTO_TYPES.PROFILE) {
        await storage.updateCompanion(companion.id, {
          profilePhoto: photo.photoUrl,
        });
      } else if (photo.photoType === PHOTO_TYPES.GALLERY) {
        const currentPhotos = companion.galleryPhotos || [];
        await storage.updateCompanion(companion.id, {
          galleryPhotos: [...currentPhotos, photo.photoUrl],
        });
      }

      // Send notification to companion
      await sendNotification(
        companion.userId,
        'photo_approved',
        'Photo Approved',
        'Your photo has been approved and added to your profile'
      );
    }

    return res.status(200).json({
      message: 'Photo approved successfully',
      photo: updatedPhoto,
    });
  } catch (error: any) {
    handleError(res, error, 'Approve photo');
  }
}
