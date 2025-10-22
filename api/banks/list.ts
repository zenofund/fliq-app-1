import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCors, validateMethod, handleError } from '../../lib/utils';
import { NIGERIAN_BANKS } from '../../lib/constants';

/**
 * GET /api/banks/list
 * Returns list of Nigerian banks for bank account setup
 * No authentication required - public endpoint
 * 
 * Returns:
 * - 200: { banks: Array<{ code: string, name: string }> }
 * - 500: { message } - Server error
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  if (handleCors(req, res)) return;

  // Validate method
  if (!validateMethod(req, res, 'GET')) return;

  try {
    return res.status(200).json({
      banks: NIGERIAN_BANKS,
    });
  } catch (error: any) {
    handleError(res, error, 'Fetch banks list');
  }
}
