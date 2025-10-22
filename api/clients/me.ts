import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../lib/storage';
import { requireClient } from '../../lib/auth';
import { handleCors, validateMethod, handleError } from '../../lib/utils';

/**
 * GET /api/clients/me
 * Returns the current client's profile
 * Requires: Client authentication
 * 
 * Returns:
 * - 200: { client: Client }
 * - 401: { message } - Unauthorized
 * - 403: { message } - Not a client
 * - 404: { message } - Profile not found
 * - 500: { message } - Server error
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  if (handleCors(req, res)) return;

  // Validate method
  if (!validateMethod(req, res, 'GET')) return;

  try {
    // Require client authentication
    const user = await requireClient(req, res);
    if (!user) return; // requireClient already sent error response

    const client = await storage.getClientByUserId(user.userId);
    if (!client) {
      return res.status(404).json({ message: 'Client profile not found' });
    }

    return res.status(200).json({
      client,
    });
  } catch (error: any) {
    handleError(res, error, 'Fetch client profile');
  }
}
