/**
 * Initialize Payment Endpoint
 * Initializes Paystack payment for a booking
 */

import { storage } from '../../../lib/storage';
import { requireAuth } from '../../../lib/auth';
import { initializePayment } from '../../../lib/paystack';

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

    const { id } = req.query;
    const booking = await storage.getBooking(id as string);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const client = await storage.getClientByUserId(authUser.userId);
    const user = await storage.getUser(authUser.userId);
    const companion = await storage.getCompanion(booking.companionId);

    if (!client || !user || !companion) {
      return res.status(404).json({ message: 'Required data not found' });
    }

    // Build callback URL
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const callbackUrl = `${protocol}://${host}/payment/callback?booking=${booking.id}`;
    
    const payment = await initializePayment(
      user.email,
      parseFloat(booking.totalAmount),
      {
        bookingId: booking.id,
        clientId: client.id,
        companionId: companion.id,
        platformFee: parseFloat(booking.platformFee),
        callback_url: callbackUrl,
      },
      companion.paystackSubaccountCode || undefined
    );

    await storage.updateBooking(booking.id, {
      paystackReference: payment.reference,
    });

    return res.status(200).json({ authorizationUrl: payment.authorization_url, reference: payment.reference });
  } catch (error: any) {
    console.error('Payment initialization error:', error);
    return res.status(500).json({ message: error.message || 'Failed to initialize payment' });
  }
}
