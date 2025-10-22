import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { storage } from '../../lib/storage';
import { handleCors, handleError } from '../../lib/utils';
import { sendNotification } from '../../lib/supabase';
import { PAYMENT_STATUSES } from '../../lib/constants';

/**
 * POST /api/bookings/payment-callback
 * Webhook endpoint for Paystack payment notifications
 * No authentication required - verified by Paystack signature
 * 
 * This endpoint receives webhooks from Paystack when payment events occur.
 * It verifies the webhook signature and updates the booking payment status.
 * 
 * Returns:
 * - 200: { message: 'Webhook processed' }
 * - 400: { message } - Invalid signature or payload
 * - 500: { message } - Server error
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify Paystack signature
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY || '')
      .update(JSON.stringify(req.body))
      .digest('hex');

    const signature = req.headers['x-paystack-signature'];

    if (hash !== signature) {
      return res.status(400).json({ message: 'Invalid signature' });
    }

    // Process the webhook event
    const event = req.body;

    if (event.event === 'charge.success') {
      const { reference, metadata } = event.data;

      if (metadata && metadata.booking_id) {
        const booking = await storage.getBookingById(metadata.booking_id);

        if (booking) {
          // Update payment status
          await storage.updateBooking(booking.id, {
            paymentStatus: PAYMENT_STATUSES.PAID,
            paystackReference: reference,
          });

          // Get companion details
          const companion = await storage.getCompanionById(booking.companionId);

          // Send notification to companion
          if (companion) {
            await sendNotification(
              companion.userId,
              'payment_received',
              'Payment Received',
              `Payment received for booking #${booking.id}`,
              booking.id
            );
          }
        }
      }
    }

    return res.status(200).json({ message: 'Webhook processed' });
  } catch (error: any) {
    handleError(res, error, 'Process payment callback');
  }
}
