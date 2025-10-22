import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../lib/storage';
import { requireCompanion } from '../../lib/auth';
import { handleCors, validateMethod, handleError } from '../../lib/utils';
import { BOOKING_STATUSES, PAYMENT_STATUSES } from '../../lib/constants';

/**
 * GET /api/companions/earnings
 * Returns earnings summary for the current companion
 * Requires: Companion authentication
 * 
 * Returns:
 * - 200: { totalEarnings, completedBookings, pendingEarnings }
 * - 401: { message } - Unauthorized
 * - 403: { message } - Not a companion
 * - 404: { message } - Profile not found
 * - 500: { message } - Server error
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  if (handleCors(req, res)) return;

  // Validate method
  if (!validateMethod(req, res, 'GET')) return;

  try {
    // Require companion authentication
    const user = await requireCompanion(req, res);
    if (!user) return;

    const companion = await storage.getCompanionByUserId(user.userId);
    if (!companion) {
      return res.status(404).json({ message: 'Companion profile not found' });
    }

    // Get all bookings for this companion
    const bookings = await storage.getBookingsByCompanionId(companion.id);

    // Calculate earnings
    let totalEarnings = 0;
    let completedBookingsCount = 0;
    let pendingEarnings = 0;

    bookings.forEach(booking => {
      if (booking.paymentStatus === PAYMENT_STATUSES.PAID) {
        const amount = parseFloat(booking.totalAmount as string);
        
        if (booking.status === BOOKING_STATUSES.COMPLETED) {
          totalEarnings += amount;
          completedBookingsCount++;
        } else if (booking.status === BOOKING_STATUSES.CONFIRMED) {
          pendingEarnings += amount;
        }
      }
    });

    return res.status(200).json({
      totalEarnings: totalEarnings.toFixed(2),
      completedBookings: completedBookingsCount,
      pendingEarnings: pendingEarnings.toFixed(2),
    });
  } catch (error: any) {
    handleError(res, error, 'Fetch earnings');
  }
}
