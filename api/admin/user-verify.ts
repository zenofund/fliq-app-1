import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../lib/storage';
import { requireAdmin } from '../../lib/auth';
import { handleCors, validateMethod, handleError } from '../../lib/utils';
import { sendNotification } from '../../lib/supabase';

/**
 * POST /api/admin/user-verify
 * Verifies a user account
 * Requires: Admin authentication
 * 
 * Body:
 * - userId: string (required)
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

    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const user = await storage.getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user verification status
    const updatedUser = await storage.updateUser(userId, { verified: true });

    // Send notification to user
    await sendNotification(
      userId,
      'profile_verified',
      'Account Verified',
      'Your account has been verified by an administrator'
    );

    // Remove password from response
    const { password, ...userWithoutPassword } = updatedUser;

    return res.status(200).json({
      message: 'User verified successfully',
      user: userWithoutPassword,
    });
  } catch (error: any) {
    handleError(res, error, 'Verify user');
  }
}
