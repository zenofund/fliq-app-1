import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../lib/storage';
import { requireAdmin } from '../../lib/auth';
import { handleCors, validateMethod, handleError } from '../../lib/utils';

/**
 * POST /api/admin/dismiss-message
 * Dismisses a flagged message
 * Requires: Admin authentication
 * 
 * Body:
 * - messageId: string (required)
 * 
 * Returns:
 * - 200: { message, updatedMessage }
 * - 400: { message } - Invalid input
 * - 401: { message } - Unauthorized
 * - 403: { message } - Not an admin
 * - 500: { message } - Server error
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  if (handleCors(req, res)) return;

  // Validate method
  if (!validateMethod(req, res, 'POST')) return;

  try {
    // Require admin authentication
    const user = await requireAdmin(req, res);
    if (!user) return;

    const { messageId } = req.body;

    if (!messageId) {
      return res.status(400).json({ message: 'Message ID is required' });
    }

    const updatedMessage = await storage.updateMessage(messageId, { dismissed: true });

    return res.status(200).json({
      message: 'Message dismissed successfully',
      updatedMessage,
    });
  } catch (error: any) {
    handleError(res, error, 'Dismiss message');
  }
}
