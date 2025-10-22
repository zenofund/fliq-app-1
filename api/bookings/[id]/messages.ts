/**
 * Booking Messages Endpoint
 * GET: Retrieve messages for a booking
 * POST: Send a message in a booking
 */

import { storage } from '../../../lib/storage';
import { requireAuth } from '../../../lib/auth';
import { moderateText } from '../../../lib/openai';

export default async function handler(req: any, res: any) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Validate HTTP method
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify JWT token
    const authUser = await requireAuth(req, res);
    if (!authUser) return; // requireAuth already sent 401 response

    const { id: bookingId } = req.query;

    // GET: Retrieve messages
    if (req.method === 'GET') {
      const messages = await storage.getBookingMessages(bookingId as string);
      
      // Enrich messages with sender info
      const enrichedMessages = await Promise.all(
        messages.map(async (msg) => {
          const sender = await storage.getUser(msg.senderId);
          return {
            ...msg,
            sender: sender ? {
              id: sender.id,
              email: sender.email,
              role: sender.role,
            } : null,
          };
        })
      );
      
      return res.status(200).json(enrichedMessages);
    }

    // POST: Send a message
    if (req.method === 'POST') {
      const { content } = req.body;
      const user = await storage.getUser(authUser.userId);

      if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const booking = await storage.getBooking(bookingId as string);
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      // Moderate message content
      const moderation = await moderateText(content);
      const isFlagged = !moderation.safe;

      const message = await storage.createMessage({
        bookingId: bookingId as string,
        senderId: user.id,
        content,
        isFlagged,
      });

      return res.status(200).json(message);
    }
  } catch (error: any) {
    console.error('Booking messages error:', error);
    return res.status(500).json({ message: error.message || 'Failed to process messages' });
  }
}
