import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import { storage } from '../../../lib/storage';
import { requireClient } from '../../../lib/auth';
import { handleCors, validateMethod, handleError } from '../../../lib/utils';
import { sendNotification } from '../../../lib/supabase';
import { PAYSTACK_BASE_URL, PAYMENT_STATUSES } from '../../../lib/constants';

/**
 * POST /api/bookings/[id]/verify-payment
 * Verifies payment for a booking using Paystack
 * Requires: Client authentication
 * 
 * Query params:
 * - id: booking ID
 * 
 * Body:
 * - reference: string (Paystack payment reference)
 * 
 * Returns:
 * - 200: { message, booking, verified: true }
 * - 400: { message } - Payment verification failed
 * - 401: { message } - Unauthorized
 * - 403: { message } - Not authorized
 * - 404: { message } - Booking not found
 * - 500: { message } - Server error
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  if (handleCors(req, res)) return;

  // Validate method
  if (!validateMethod(req, res, 'POST')) return;

  try {
    // Require client authentication
    const user = await requireClient(req, res);
    if (!user) return;

    const client = await storage.getClientByUserId(user.userId);
    if (!client) {
      return res.status(404).json({ message: 'Client profile not found' });
    }

    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: 'Booking ID is required' });
    }

    const booking = await storage.getBookingById(id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Verify this is the client's booking
    if (booking.clientId !== client.id) {
      return res.status(403).json({ message: 'Not authorized to verify payment for this booking' });
    }

    const { reference } = req.body;

    if (!reference) {
      return res.status(400).json({ message: 'Payment reference is required' });
    }

    // Verify payment with Paystack
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecret) {
      return res.status(500).json({ message: 'Payment provider not configured' });
    }

    const response = await axios.get(
      `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${paystackSecret}`,
        },
      }
    );

    if (response.data.status && response.data.data.status === 'success') {
      // Update booking payment status
      const updatedBooking = await storage.updateBooking(booking.id, {
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

      return res.status(200).json({
        message: 'Payment verified successfully',
        booking: updatedBooking,
        verified: true,
      });
    } else {
      return res.status(400).json({
        message: 'Payment verification failed',
        verified: false,
      });
    }
  } catch (error: any) {
    if (error.response?.data?.message) {
      return res.status(400).json({ message: error.response.data.message });
    }
    handleError(res, error, 'Verify payment');
  }
}
