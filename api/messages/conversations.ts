/**
 * Get User Conversations Endpoint
 * Returns all conversations (bookings with messages) for authenticated user
 */

import { storage } from '../../lib/storage';
import { requireAuth } from '../../lib/auth';

export default async function handler(req: any, res: any) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Validate HTTP method
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify JWT token
    const authUser = await requireAuth(req, res);
    if (!authUser) return; // requireAuth already sent 401 response

    const userId = authUser.userId;
    const user = await storage.getUserById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log(`[Conversations] User ${userId} (${user.role}) fetching conversations`);

    let bookings: any[] = [];
    let userProfile: any = null;

    // Fetch bookings based on user role
    if (user.role === 'client') {
      userProfile = await storage.getClientByUserId(userId);
      console.log(`[Conversations] Client profile:`, userProfile?.id || 'NOT FOUND');
      if (userProfile) {
        bookings = await storage.getClientBookings(userProfile.id);
        console.log(`[Conversations] Found ${bookings.length} client bookings`);
      }
    } else if (user.role === 'companion') {
      userProfile = await storage.getCompanionByUserId(userId);
      if (userProfile) {
        bookings = await storage.getCompanionBookings(userProfile.id);
      }
    }
    
    // Also check if there are any bookings where the user has sent messages
    const allBookings = await storage.getAllBookings();
    const bookingsWithUserMessages = await Promise.all(
      allBookings.map(async (booking) => {
        const messages = await storage.getBookingMessages(booking.id);
        const hasUserMessage = messages.some(m => m.senderId === userId);
        return hasUserMessage ? booking : null;
      })
    );
    
    // Combine both sets of bookings and remove duplicates
    const bookingIds = new Set(bookings.map(b => b.id));
    bookingsWithUserMessages.forEach(booking => {
      if (booking && !bookingIds.has(booking.id)) {
        bookings.push(booking);
        console.log(`[Conversations] Added booking ${booking.id} where user sent messages`);
      }
    });

    // Filter bookings that have messages and enrich with conversation data
    const conversations = await Promise.all(
      bookings.map(async (booking) => {
        const messages = await storage.getBookingMessages(booking.id);
        console.log(`[Conversations] Booking ${booking.id}: Found ${messages.length} messages`);
        
        // Only return bookings with at least one message
        if (messages.length === 0) {
          return null;
        }

        const lastMessage = messages[messages.length - 1];
        
        // Get the other participant's info
        let otherParticipant = null;
        if (user.role === 'client') {
          const companion = await storage.getCompanion(booking.companionId);
          if (companion) {
            otherParticipant = {
              id: companion.id,
              name: companion.fullName,
              photo: companion.profilePhoto,
              role: 'companion',
            };
          }
        } else {
          const client = await storage.getClient(booking.clientId);
          if (client) {
            otherParticipant = {
              id: client.id,
              name: client.fullName,
              photo: null,
              role: 'client',
            };
          }
        }

        return {
          bookingId: booking.id,
          status: booking.status,
          messageCount: messages.length,
          lastMessage: {
            content: lastMessage.content,
            createdAt: lastMessage.createdAt,
            senderId: lastMessage.senderId,
          },
          otherParticipant,
        };
      })
    );

    // Filter out nulls and sort by last message time
    const validConversations = conversations
      .filter((c) => c !== null)
      .sort((a, b) => 
        new Date(b!.lastMessage.createdAt).getTime() - new Date(a!.lastMessage.createdAt).getTime()
      );

    return res.status(200).json(validConversations);
  } catch (error: any) {
    console.error('Conversations fetch error:', error);
    return res.status(500).json({ message: 'Failed to fetch conversations' });
  }
}
