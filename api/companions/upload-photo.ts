import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../lib/storage';
import { requireCompanion } from '../../lib/auth';
import { handleCors, validateMethod, handleError, generateId } from '../../lib/utils';
import { PHOTO_TYPES } from '../../lib/constants';

/**
 * POST /api/companions/upload-photo
 * Uploads a profile photo for review
 * Requires: Companion authentication
 * 
 * Note: In a production environment, this would handle file uploads to a cloud storage service
 * like Cloudinary, AWS S3, or Vercel Blob. For now, we'll accept a photo URL.
 * 
 * Body:
 * - photoUrl: string (URL of the uploaded photo)
 * 
 * Returns:
 * - 200: { message, photoApproval }
 * - 400: { message } - Invalid input
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

    const { photoUrl } = req.body;

    if (!photoUrl) {
      return res.status(400).json({ message: 'Photo URL is required' });
    }

    // Create photo approval request
    const photoApproval = await storage.createPhotoApproval({
      id: generateId('photo'),
      companionId: companion.id,
      photoUrl,
      photoType: PHOTO_TYPES.PROFILE,
      status: 'pending',
    });

    return res.status(200).json({
      message: 'Photo submitted for approval',
      photoApproval,
    });
  } catch (error: any) {
    handleError(res, error, 'Upload profile photo');
  }
}
