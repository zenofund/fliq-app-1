import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../lib/storage';
import { handleCors, validateMethod, handleError } from '../../lib/utils';

/**
 * GET /api/companions/featured
 * Returns list of featured companions
 * No authentication required - public endpoint
 * 
 * Returns:
 * - 200: { companions: Companion[] }
 * - 500: { message } - Server error
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  if (handleCors(req, res)) return;

  // Validate method
  if (!validateMethod(req, res, 'GET')) return;

  try {
    const companions = await storage.getFeaturedCompanions();

    return res.status(200).json({
      companions,
    });
  } catch (error: any) {
    handleError(res, error, 'Fetch featured companions');
  }
}
