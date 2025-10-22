import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../lib/storage';
import { requireAuth } from '../../lib/auth';
import { handleCors, validateMethod, handleError } from '../../lib/utils';

/**
 * GET /api/auth/me
 * Returns the current authenticated user's information
 * Requires: Authorization header with Bearer token
 * 
 * Returns:
 * - 200: { user: { id, email, role, verified, suspended, profile } }
 * - 401: { message } - Unauthorized
 * - 404: { message } - User not found
 * - 500: { message } - Server error
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  if (handleCors(req, res)) return;

  // Validate method
  if (!validateMethod(req, res, 'GET')) return;

  try {
    // Require authentication
    const authUser = await requireAuth(req, res);
    if (!authUser) return; // requireAuth already sent error response

    // Get full user details
    const user = await storage.getUserById(authUser.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get role-specific profile
    let profile = null;
    if (user.role === 'companion') {
      profile = await storage.getCompanionByUserId(user.id);
    } else if (user.role === 'client') {
      profile = await storage.getClientByUserId(user.id);
    }

    // Return user info (excluding password)
    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        verified: user.verified,
        suspended: user.suspended,
        createdAt: user.createdAt,
        profile,
      },
    });
  } catch (error: any) {
    handleError(res, error, 'Fetch user');
  }
}
