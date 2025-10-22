import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCors, validateMethod } from '../../lib/utils';

/**
 * POST /api/auth/logout
 * Logs out a user (client-side should delete the token)
 * 
 * In JWT-based auth, logout is primarily handled on the client side
 * by deleting the token from localStorage/cookies.
 * This endpoint exists for compatibility and to clear any server-side state if needed.
 * 
 * Returns:
 * - 200: { message }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  if (handleCors(req, res)) return;

  // Validate method
  if (!validateMethod(req, res, 'POST')) return;

  try {
    // With JWT, logout is handled client-side by removing the token
    // This endpoint just acknowledges the logout request
    return res.status(200).json({
      message: 'Logout successful',
    });
  } catch (error: any) {
    console.error('Logout error:', error);
    return res.status(500).json({ message: 'Logout failed' });
  }
}
