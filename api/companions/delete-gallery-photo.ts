import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../lib/storage';
import { requireCompanion } from '../../lib/auth';
import { handleCors, validateMethod, handleError } from '../../lib/utils';

/**
 * DELETE /api/companions/delete-gallery-photo
 * Removes a photo from the companion's gallery
 * Requires: Companion authentication
 * 
 * Body:
 * - photoUrl: string (URL of the photo to delete)
 * 
 * Returns:
 * - 200: { message, companion }
 * - 400: { message } - Invalid input
 * - 401: { message } - Unauthorized
 * - 403: { message } - Not a companion
 * - 404: { message } - Profile not found or photo not found
 * - 500: { message } - Server error
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  if (handleCors(req, res)) return;

  // Validate method
  if (!validateMethod(req, res, 'DELETE')) return;

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

    // Get current gallery photos
    const currentPhotos = companion.galleryPhotos || [];
    
    // Remove the photo
    const updatedPhotos = currentPhotos.filter(url => url !== photoUrl);

    if (currentPhotos.length === updatedPhotos.length) {
      return res.status(404).json({ message: 'Photo not found in gallery' });
    }

    // Update companion with new gallery
    const updatedCompanion = await storage.updateCompanion(companion.id, {
      galleryPhotos: updatedPhotos,
    });

    return res.status(200).json({
      message: 'Gallery photo deleted successfully',
      companion: updatedCompanion,
    });
  } catch (error: any) {
    handleError(res, error, 'Delete gallery photo');
  }
}
