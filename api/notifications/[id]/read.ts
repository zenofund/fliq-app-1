/**
 * Mark Notification as Read Endpoint
 * Marks a specific notification as read
 */

import { storage } from '../../../lib/storage';
import { requireAuth } from '../../../lib/auth';

export default async function handler(req: any, res: any) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Validate HTTP method
  if (req.method !== 'PATCH') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify JWT token
    const authUser = await requireAuth(req, res);
    if (!authUser) return; // requireAuth already sent 401 response

    const { id } = req.query;
    const notification = await storage.markNotificationAsRead(id as string);
    
    return res.status(200).json(notification);
  } catch (error: any) {
    console.error('Mark notification as read error:', error);
    return res.status(500).json({ message: 'Failed to mark notification as read' });
  }
}
