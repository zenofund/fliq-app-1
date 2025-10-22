/**
 * Paystack Payment Callback Endpoint
 * Webhook endpoint for Paystack payment verification
 * No auth required - this is called by Paystack
 */

import { storage } from '../../lib/storage';
import { verifyPayment } from '../../lib/paystack';

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
    const { reference, booking } = req.query;
    
    if (!reference || !booking) {
      // Redirect to client bookings page with error
      res.writeHead(302, { Location: '/client/bookings?payment=failed' });
      return res.end();
    }

    const verification = await verifyPayment(reference as string);
    
    if (verification.status === 'success') {
      const bookingData = await storage.getBooking(booking as string);
      if (bookingData) {
        // Update payment status to "paid" but keep booking status as "pending"
        // Companion needs to accept
        await storage.updateBooking(bookingData.id, {
          paymentStatus: 'paid',
        });
      }
      
      res.writeHead(302, { Location: `/client/bookings?payment=success&booking=${booking}` });
      return res.end();
    } else {
      res.writeHead(302, { Location: `/client/bookings?payment=failed&booking=${booking}` });
      return res.end();
    }
  } catch (error: any) {
    console.error('Payment callback error:', error);
    res.writeHead(302, { Location: '/client/bookings?payment=error' });
    return res.end();
  }
}
