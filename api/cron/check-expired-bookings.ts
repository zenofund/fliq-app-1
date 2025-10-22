import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import { storage } from '../../lib/storage';
import { handleError } from '../../lib/utils';
import { BOOKING_STATUSES, PAYMENT_STATUSES, PAYSTACK_BASE_URL } from '../../lib/constants';

/**
 * GET /api/cron/check-expired-bookings
 * Checks for expired pending bookings and processes refunds if necessary
 * This is a cron job that runs every minute via Vercel Cron
 * 
 * Security: Protected by CRON_SECRET environment variable
 * 
 * Returns:
 * - 200: { message, count, processed }
 * - 401: { message } - Invalid cron secret
 * - 500: { message } - Server error
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = req.headers.authorization;
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Find all pending bookings that have expired
    const expiredBookings = await storage.getExpiredPendingBookings();

    const processedBookings = [];

    for (const booking of expiredBookings) {
      try {
        // Update booking status to expired
        await storage.updateBooking(booking.id, {
          status: BOOKING_STATUSES.EXPIRED,
        });

        // If payment was made, process refund
        if (booking.paymentStatus === PAYMENT_STATUSES.PAID && booking.paystackReference) {
          const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
          
          if (paystackSecret) {
            try {
              // Initiate refund via Paystack
              await axios.post(
                `${PAYSTACK_BASE_URL}/refund`,
                {
                  transaction: booking.paystackReference,
                  amount: Math.round(parseFloat(booking.totalAmount as string) * 100),
                },
                {
                  headers: {
                    Authorization: `Bearer ${paystackSecret}`,
                    'Content-Type': 'application/json',
                  },
                }
              );

              // Update booking payment status
              await storage.updateBooking(booking.id, {
                paymentStatus: PAYMENT_STATUSES.REFUNDED,
              });

              processedBookings.push({
                bookingId: booking.id,
                action: 'expired_and_refunded',
              });
            } catch (refundError) {
              console.error(`Failed to refund booking ${booking.id}:`, refundError);
              processedBookings.push({
                bookingId: booking.id,
                action: 'expired_refund_failed',
                error: refundError instanceof Error ? refundError.message : 'Unknown error',
              });
            }
          } else {
            processedBookings.push({
              bookingId: booking.id,
              action: 'expired_no_paystack_config',
            });
          }
        } else {
          processedBookings.push({
            bookingId: booking.id,
            action: 'expired_no_payment',
          });
        }
      } catch (bookingError) {
        console.error(`Failed to process booking ${booking.id}:`, bookingError);
        processedBookings.push({
          bookingId: booking.id,
          action: 'processing_failed',
          error: bookingError instanceof Error ? bookingError.message : 'Unknown error',
        });
      }
    }

    return res.status(200).json({
      message: 'Expired bookings processed',
      count: expiredBookings.length,
      processed: processedBookings,
    });
  } catch (error: any) {
    handleError(res, error, 'Cron job');
  }
}
