import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../lib/storage';
import { requireAdmin } from '../../lib/auth';
import { handleCors, validateMethod, handleError } from '../../lib/utils';

/**
 * POST /api/admin/user-suspend
 * Suspends or unsuspends a user account
 * Requires: Admin authentication
 * 
 * Body:
 * - userId: string (required)
 * - suspended: boolean (required)
 * 
 * Returns:
 * - 200: { message, user }
 * - 400: { message } - Invalid input
 * - 401: { message } - Unauthorized
 * - 403: { message } - Not an admin
 * - 404: { message } - User not found
 * - 500: { message } - Server error
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  if (handleCors(req, res)) return;

  // Validate method
  if (!validateMethod(req, res, 'POST')) return;

  try {
    // Require admin authentication
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const { userId, suspended } = req.body;

    if (!userId || suspended === undefined) {
      return res.status(400).json({ message: 'User ID and suspended status are required' });
    }

    const user = await storage.getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from suspending themselves
    if (userId === admin.userId) {
      return res.status(400).json({ message: 'Cannot suspend your own account' });
    }

    // Update user suspension status
    const updatedUser = await storage.updateUser(userId, { suspended });

    // Remove password from response
    const { password, ...userWithoutPassword } = updatedUser;

    return res.status(200).json({
      message: `User ${suspended ? 'suspended' : 'unsuspended'} successfully`,
      user: userWithoutPassword,
    });
  } catch (error: any) {
    handleError(res, error, 'Suspend user');
  }
}
