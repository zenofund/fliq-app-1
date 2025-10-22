/**
 * Create Message Endpoint
 * Sends a message in a booking conversation with OpenAI moderation
 */

import { storage } from '../../lib/storage';
import { requireAuth } from '../../lib/auth';
import { moderateText } from '../../lib/openai';

export default async function handler(req: any, res: any) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Validate HTTP method
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify JWT token
    const authUser = await requireAuth(req, res);
    if (!authUser) return; // requireAuth already sent 401 response

    const { bookingId, content } = req.body;

    // Moderate message content
    const moderation = await moderateText(content);
    
    if (!moderation.safe) {
      return res.status(400).json({ 
        message: 'Message contains inappropriate content', 
        categories: moderation.categories 
      });
    }

    const message = await storage.createMessage({
      bookingId,
      senderId: authUser.userId,
      content,
      isFlagged: false,
    });

    return res.status(200).json(message);
  } catch (error: any) {
    console.error('Message creation error:', error);
    return res.status(500).json({ message: error.message || 'Failed to send message' });
  }
}
