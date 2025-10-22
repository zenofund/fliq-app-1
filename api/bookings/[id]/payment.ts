import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import { storage } from '../../../lib/storage';
import { requireClient } from '../../../lib/auth';
import { handleCors, validateMethod, handleError } from '../../../lib/utils';
import { PAYSTACK_BASE_URL } from '../../../lib/constants';

/**
 * POST /api/bookings/[id]/payment
 * Initializes payment for a booking using Paystack
 * Requires: Client authentication
 * 
 * Query params:
 * - id: booking ID
 * 
 * Body:
 * - email: string (client's email for payment)
 * 
 * Returns:
 * - 200: { authorizationUrl, reference }
 * - 400: { message } - Invalid input
 * - 401: { message } - Unauthorized
 * - 403: { message } - Not authorized or booking not pending
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
      return res.status(403).json({ message: 'Not authorized to pay for this booking' });
    }

    // Check if booking is in pending status
    if (booking.status !== 'pending') {
      return res.status(400).json({ message: 'Booking is not in pending status' });
    }

    // Check if payment already made
    if (booking.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'Payment already completed for this booking' });
    }

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Initialize Paystack payment
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecret) {
      return res.status(500).json({ message: 'Payment provider not configured' });
    }

    const amount = parseFloat(booking.totalAmount as string) * 100; // Convert to kobo

    const response = await axios.post(
      `${PAYSTACK_BASE_URL}/transaction/initialize`,
      {
        email,
        amount: Math.round(amount),
        reference: `booking_${booking.id}_${Date.now()}`,
        callback_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/bookings/${booking.id}/payment-success`,
        metadata: {
          booking_id: booking.id,
          client_id: client.id,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${paystackSecret}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.status && response.data.data) {
      // Update booking with payment reference
      await storage.updateBooking(booking.id, {
        paystackReference: response.data.data.reference,
      });

      return res.status(200).json({
        authorizationUrl: response.data.data.authorization_url,
        reference: response.data.data.reference,
      });
    } else {
      return res.status(500).json({ message: 'Failed to initialize payment' });
    }
  } catch (error: any) {
    if (error.response?.data?.message) {
      return res.status(400).json({ message: error.response.data.message });
    }
    handleError(res, error, 'Initialize payment');
  }
}
