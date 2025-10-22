/**
 * Verify Payment Endpoint
 * Verifies Paystack payment and updates booking status
 */

import { storage } from '../../../lib/storage';
import { requireAuth } from '../../../lib/auth';
import { verifyPayment } from '../../../lib/paystack';

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

    const { reference } = req.body;
    const { id } = req.query;
    const booking = await storage.getBooking(id as string);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const verification = await verifyPayment(reference);
    
    if (verification.status === 'success') {
      await storage.updateBooking(booking.id, {
        paymentStatus: 'paid',
        status: 'accepted',
      });

      // Update companion booking count
      const companion = await storage.getCompanion(booking.companionId);
      if (companion) {
        await storage.updateCompanion(companion.id, {
          totalBookings: (companion.totalBookings || 0) + 1,
        } as any);
      }
    }

    return res.status(200).json({ success: verification.status === 'success', verification });
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return res.status(500).json({ message: error.message || 'Failed to verify payment' });
  }
}
