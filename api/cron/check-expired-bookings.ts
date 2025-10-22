/**
 * Check Expired Bookings Cron Job Endpoint
 * Checks for pending bookings that have expired and updates their status
 * Protected by cron secret key
 */

import { storage } from '../../lib/storage';
import { refundPayment } from '../../lib/paystack';
import { sendNotification } from '../../lib/notifications';

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
    // Verify cron secret
    const authHeader = req.headers.authorization;
    const cronSecret = process.env.CRON_SECRET;
    
    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Get all bookings
    const bookings = await storage.getAllBookings();
    const now = new Date();
    let expiredCount = 0;
    
    // Check for expired bookings
    for (const booking of bookings) {
      // Only check pending bookings with payment and expiry time
      if (booking.status === 'pending' && booking.paymentStatus === 'paid') {
        // If booking has been pending for more than 24 hours (or has explicit expiry)
        const createdAt = new Date(booking.createdAt);
        const hoursSinceCreated = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceCreated > 24) {
          expiredCount++;
          
          // Process refund if payment was made
          if (booking.paystackReference) {
            try {
              await refundPayment(booking.paystackReference);
              await storage.updateBooking(booking.id, {
                status: 'expired',
                paymentStatus: 'refunded',
              });
            } catch (refundError: any) {
              console.error(`Failed to refund booking ${booking.id}:`, refundError);
              // Update status even if refund fails - manual intervention needed
              await storage.updateBooking(booking.id, {
                status: 'expired',
              });
            }
          } else {
            // No payment, just expire
            await storage.updateBooking(booking.id, {
              status: 'expired',
            });
          }

          // Notify client
          const client = await storage.getClient(booking.clientId);
          if (client) {
            const clientUser = await storage.getUserById(client.userId);
            if (clientUser) {
              await sendNotification(
                clientUser.id,
                'booking_expired',
                'Booking Expired',
                'Your booking request has expired and payment has been refunded',
                booking.id
              );
            }
          }
        }
      }
    }

    return res.status(200).json({ 
      message: 'Cron job completed', 
      expiredBookings: expiredCount,
      timestamp: now.toISOString()
    });
  } catch (error: any) {
    console.error('Cron job error:', error);
    return res.status(500).json({ message: error.message || 'Cron job failed' });
  }
}
