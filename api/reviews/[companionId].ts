/**
 * Get Companion Reviews Endpoint
 * Returns all reviews for a specific companion
 * Public endpoint - no auth required
 */

import { storage } from '../../lib/storage';

export default async function handler(req: any, res: any) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Validate HTTP method
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { companionId } = req.query;
    const reviews = await storage.getReviewsByCompanionId(companionId as string);
    
    // Enrich with client info
    const enrichedReviews = await Promise.all(
      reviews.map(async (review) => {
        const client = await storage.getClientById(review.clientId);
        return {
          ...review,
          clientName: client?.fullName || 'Anonymous',
        };
      })
    );

    return res.status(200).json(enrichedReviews);
  } catch (error: any) {
    console.error('Reviews fetch error:', error);
    return res.status(500).json({ message: 'Failed to fetch reviews' });
  }
}
