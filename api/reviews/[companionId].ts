import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../lib/storage';
import { handleCors, validateMethod, handleError } from '../../lib/utils';

/**
 * GET /api/reviews/[companionId]
 * Returns all reviews for a specific companion
 * No authentication required - public endpoint
 * 
 * Query params:
 * - companionId: companion ID
 * 
 * Returns:
 * - 200: { reviews: Review[] }
 * - 400: { message } - Invalid companion ID
 * - 404: { message } - Companion not found
 * - 500: { message } - Server error
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  if (handleCors(req, res)) return;

  // Validate method
  if (!validateMethod(req, res, 'GET')) return;

  try {
    const { companionId } = req.query;

    if (!companionId || typeof companionId !== 'string') {
      return res.status(400).json({ message: 'Companion ID is required' });
    }

    // Verify companion exists
    const companion = await storage.getCompanionById(companionId);
    if (!companion) {
      return res.status(404).json({ message: 'Companion not found' });
    }

    const reviews = await storage.getReviewsByCompanionId(companionId);

    return res.status(200).json({
      reviews,
    });
  } catch (error: any) {
    handleError(res, error, 'Fetch reviews');
  }
}
