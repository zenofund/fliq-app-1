import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../lib/storage';
import { requireAdmin } from '../../lib/auth';
import { handleCors, validateMethod, handleError } from '../../lib/utils';

/**
 * GET /api/admin/settings
 * Returns a specific setting value
 * PUT /api/admin/settings
 * Updates a setting value
 * Requires: Admin authentication
 * 
 * Query params (for GET):
 * - key: setting key
 * 
 * Body (for PUT):
 * - key: string (required)
 * - value: string (required)
 * 
 * Returns:
 * - 200: { setting } (GET) or { message, setting } (PUT)
 * - 400: { message } - Invalid input
 * - 401: { message } - Unauthorized
 * - 403: { message } - Not an admin
 * - 404: { message } - Setting not found (GET only)
 * - 500: { message } - Server error
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  if (handleCors(req, res)) return;

  // Validate method
  if (!validateMethod(req, res, ['GET', 'PUT'])) return;

  try {
    // Require admin authentication
    const user = await requireAdmin(req, res);
    if (!user) return;

    if (req.method === 'GET') {
      const { key } = req.query;

      if (!key || typeof key !== 'string') {
        return res.status(400).json({ message: 'Setting key is required' });
      }

      const setting = await storage.getSetting(key);
      if (!setting) {
        return res.status(404).json({ message: 'Setting not found' });
      }

      return res.status(200).json({ setting });
    }

    // PUT - Update setting
    const { key, value } = req.body;

    if (!key || !value) {
      return res.status(400).json({ message: 'Key and value are required' });
    }

    const setting = await storage.updateSetting(key, value);

    return res.status(200).json({
      message: 'Setting updated successfully',
      setting,
    });
  } catch (error: any) {
    handleError(res, error, 'Manage settings');
  }
}
