/**
 * Upload Gallery Photo Endpoint
 * Uploads and moderates companion gallery photo
 */

import { storage } from '../../lib/storage';
import { requireAuth } from '../../lib/auth';
import { moderateImage } from '../../lib/openai';

export default async function handler(req: any, res: any) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Validate HTTP method
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify JWT token
    const authUser = await requireAuth(req, res);
    if (!authUser) return; // requireAuth already sent 401 response

    const { base64Image } = req.body;
    const companion = await storage.getCompanionByUserId(authUser.userId);
    if (!companion) {
      return res.status(404).json({ message: 'Companion profile not found' });
    }

    // Moderate image with OpenAI
    const moderation = await moderateImage(base64Image);
    
    if (!moderation.safe) {
      return res.status(400).json({ 
        message: 'Image contains inappropriate content', 
        categories: moderation.categories 
      });
    }

    // In production, upload to cloud storage (S3, Cloudinary, etc.)
    // For now, store as data URL
    const photoUrl = `data:image/jpeg;base64,${base64Image}`;
    
    // Add to gallery photos array
    const currentGallery = companion.galleryPhotos || [];
    const updatedGallery = [...currentGallery, photoUrl];
    
    await storage.updateCompanion(companion.id, {
      galleryPhotos: updatedGallery,
    });

    return res.status(200).json({ message: 'Gallery photo uploaded successfully', photoUrl, galleryPhotos: updatedGallery });
  } catch (error: any) {
    console.error('Gallery photo upload error:', error);
    return res.status(500).json({ message: error.message || 'Failed to upload gallery photo' });
  }
}
