import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../lib/storage';
import { requireAuth } from '../../lib/auth';
import { handleCors, validateMethod, handleError } from '../../lib/utils';

/**
 * GET /api/notifications
 * Returns all notifications for the current user
 * Requires: Authentication
 * 
 * Returns:
 * - 200: { notifications: Notification[] }
 * - 401: { message } - Unauthorized
 * - 500: { message } - Server error
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  if (handleCors(req, res)) return;

  // Validate method
  if (!validateMethod(req, res, 'GET')) return;

  try {
    // Require authentication
    const user = await requireAuth(req, res);
    if (!user) return;

    const notifications = await storage.getNotificationsByUserId(user.userId);

    return res.status(200).json({
      notifications,
    });
  } catch (error: any) {
    handleError(res, error, 'Fetch notifications');
  }
}
