/**
 * Update Booking Status Endpoint
 * Allows companion to accept/reject bookings
 * Handles refunds for rejected paid bookings
 */

import { storage } from '../../../lib/storage';
import { requireAuth } from '../../../lib/auth';
import { refundPayment } from '../../../lib/paystack';
import { sendNotification } from '../../../lib/notifications';

export default async function handler(req: any, res: any) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Validate HTTP method
  if (req.method !== 'PATCH') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify JWT token
    const authUser = await requireAuth(req, res);
    if (!authUser) return; // requireAuth already sent 401 response

    const { status } = req.body;
    const { id: bookingId } = req.query;

    const companion = await storage.getCompanionByUserId(authUser.userId);
    if (!companion) {
      return res.status(404).json({ message: 'Companion profile not found' });
    }

    const booking = await storage.getBooking(bookingId as string);
    if (!booking || booking.companionId !== companion.id) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if payment is complete before accepting
    if (status === 'accepted' && booking.paymentStatus !== 'paid') {
      return res.status(400).json({ message: 'Payment must be completed before accepting' });
    }

    // Get client info for notifications
    const client = await storage.getClient(booking.clientId);
    const clientUser = client ? await storage.getUserById(client.userId) : null;

    // If declining, process refund first
    if (status === 'rejected' && booking.paymentStatus === 'paid' && booking.paystackReference) {
      try {
        await refundPayment(booking.paystackReference);
        await storage.updateBooking(bookingId as string, { 
          status: 'rejected',
          paymentStatus: 'refunded'
        });

        // Send notification to client about declined booking
        if (clientUser) {
          await sendNotification(
            clientUser.id,
            'booking_declined',
            'Booking Declined',
            `${companion.fullName} has declined your booking request`,
            bookingId as string
          );
        }

        return res.status(200).json({ ...booking, status: 'rejected', paymentStatus: 'refunded' });
      } catch (refundError: any) {
        console.error('Refund failed:', refundError);
        return res.status(500).json({ message: 'Failed to process refund: ' + refundError.message });
      }
    }

    // Update booking status
    const updated = await storage.updateBooking(bookingId as string, { status });

    // If accepted, increment companion's total bookings and send notification
    if (status === 'accepted') {
      await storage.updateCompanion(companion.id, {
        totalBookings: (companion.totalBookings || 0) + 1,
      } as any);

      // Send notification to client about accepted booking
      if (clientUser) {
        await sendNotification(
          clientUser.id,
          'booking_accepted',
          'Booking Confirmed!',
          `Your booking with ${companion.fullName} has been accepted`,
          bookingId as string
        );
      }
    }

    // If rejected (without payment), send notification
    if (status === 'rejected' && clientUser) {
      await sendNotification(
        clientUser.id,
        'booking_declined',
        'Booking Declined',
        `${companion.fullName} has declined your booking request`,
        bookingId as string
      );
    }

    return res.status(200).json(updated);
  } catch (error: any) {
    console.error('Update booking status error:', error);
    return res.status(500).json({ message: error.message || 'Failed to update booking status' });
  }
}
