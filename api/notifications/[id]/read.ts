import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../../lib/storage';
import { requireAuth } from '../../../lib/auth';
import { handleCors, validateMethod, handleError } from '../../../lib/utils';

/**
 * PUT /api/notifications/[id]/read
 * Marks a notification as read
 * Requires: Authentication
 * 
 * Query params:
 * - id: notification ID
 * 
 * Returns:
 * - 200: { message, notification }
 * - 400: { message } - Invalid notification ID
 * - 401: { message } - Unauthorized
 * - 403: { message } - Not authorized
 * - 404: { message } - Notification not found
 * - 500: { message } - Server error
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  if (handleCors(req, res)) return;

  // Validate method
  if (!validateMethod(req, res, 'PUT')) return;

  try {
    // Require authentication
    const user = await requireAuth(req, res);
    if (!user) return;

    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: 'Notification ID is required' });
    }

    // Get all user notifications to verify ownership
    const userNotifications = await storage.getNotificationsByUserId(user.userId);
    const notification = userNotifications.find(n => n.id === id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Mark as read
    const updatedNotification = await storage.markNotificationAsRead(id);

    return res.status(200).json({
      message: 'Notification marked as read',
      notification: updatedNotification,
    });
  } catch (error: any) {
    handleError(res, error, 'Mark notification as read');
  }
}
