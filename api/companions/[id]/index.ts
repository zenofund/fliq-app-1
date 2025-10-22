import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../../lib/storage';
import { handleCors, validateMethod, handleError } from '../../../lib/utils';

/**
 * GET /api/companions/[id]
 * Returns a specific companion's public profile
 * No authentication required - public endpoint
 * 
 * Query params:
 * - id: companion ID
 * 
 * Returns:
 * - 200: { companion: Companion }
 * - 404: { message } - Companion not found
 * - 500: { message } - Server error
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  if (handleCors(req, res)) return;

  // Validate method
  if (!validateMethod(req, res, 'GET')) return;

  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: 'Companion ID is required' });
    }

    const companion = await storage.getCompanionById(id);
    if (!companion) {
      return res.status(404).json({ message: 'Companion not found' });
    }

    // Don't expose sensitive information like bank details
    const { accountNumber, accountName, bankName, bankVerified, ...publicProfile } = companion;

    return res.status(200).json({
      companion: publicProfile,
    });
  } catch (error: any) {
    handleError(res, error, 'Fetch companion');
  }
}
