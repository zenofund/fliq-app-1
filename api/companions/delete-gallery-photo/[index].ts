/**
 * Delete Gallery Photo Endpoint
 * Deletes a photo from companion's gallery by index
 */

import { storage } from '../../../lib/storage';
import { requireAuth } from '../../../lib/auth';

export default async function handler(req: any, res: any) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Validate HTTP method
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify JWT token
    const authUser = await requireAuth(req, res);
    if (!authUser) return; // requireAuth already sent 401 response

    const { index } = req.query;
    const photoIndex = parseInt(index as string);
    
    const companion = await storage.getCompanionByUserId(authUser.userId);
    if (!companion) {
      return res.status(404).json({ message: 'Companion profile not found' });
    }

    const currentGallery = companion.galleryPhotos || [];
    if (photoIndex < 0 || photoIndex >= currentGallery.length) {
      return res.status(400).json({ message: 'Invalid photo index' });
    }

    const updatedGallery = currentGallery.filter((_, idx) => idx !== photoIndex);
    
    await storage.updateCompanion(companion.id, {
      galleryPhotos: updatedGallery,
    });

    return res.status(200).json({ message: 'Gallery photo deleted successfully', galleryPhotos: updatedGallery });
  } catch (error: any) {
    console.error('Gallery photo delete error:', error);
    return res.status(500).json({ message: error.message || 'Failed to delete gallery photo' });
  }
}
