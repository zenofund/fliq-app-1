import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../lib/storage';
import { handleCors, validateMethod, handleError } from '../../lib/utils';

/**
 * GET /api/companions/search
 * Searches for companions based on filters
 * No authentication required - public endpoint
 * 
 * Query params:
 * - location?: string
 * - category?: string
 * - minRate?: number
 * - maxRate?: number
 * - availability?: string
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
    const { location, category, minRate, maxRate, availability } = req.query;

    const filters: any = {};
    if (location && typeof location === 'string') filters.location = location;
    if (category && typeof category === 'string') filters.category = category;
    if (minRate && typeof minRate === 'string') filters.minRate = parseFloat(minRate);
    if (maxRate && typeof maxRate === 'string') filters.maxRate = parseFloat(maxRate);
    if (availability && typeof availability === 'string') filters.availability = availability;

    const companions = await storage.searchCompanions(filters);

    return res.status(200).json({
      companions,
    });
  } catch (error: any) {
    handleError(res, error, 'Search companions');
  }
}
