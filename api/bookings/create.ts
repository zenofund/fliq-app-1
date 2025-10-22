/**
 * Create Booking Endpoint
 * Creates a new booking with Paystack payment initialization
 */

import { storage } from '../../lib/storage';
import { requireAuth } from '../../lib/auth';
import { initializePayment } from '../../lib/paystack';
import { sendNotification } from '../../lib/notifications';

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

    const client = await storage.getClientByUserId(authUser.userId);
    const user = await storage.getUser(authUser.userId);
    if (!client || !user) {
      return res.status(404).json({ message: 'Client profile not found' });
    }

    const { companionId, bookingDate, duration, location, specialRequests } = req.body;
    
    const companion = await storage.getCompanion(companionId);
    if (!companion) {
      return res.status(404).json({ message: 'Companion not found' });
    }

    // Check for existing pending/accepted bookings with this companion
    const existingBookings = await storage.getClientBookings(client.id);
    const hasPendingBooking = existingBookings.some(
      booking => booking.companionId === companionId && 
      (booking.status === 'pending' || booking.status === 'accepted')
    );
    
    if (hasPendingBooking) {
      return res.status(400).json({ 
        message: 'Please wait for your current booking to fulfil' 
      });
    }

    // Get platform commission settings
    const settings = await storage.getPlatformSettings();
    const commissionRate = parseFloat(settings.commissionPercentage) / 100;
    
    const hourlyRate = parseFloat(companion.hourlyRate);
    const totalAmount = hourlyRate * duration;
    const platformFee = totalAmount * commissionRate;
    const companionEarnings = totalAmount - platformFee;

    // Create booking
    const booking = await storage.createBooking({
      clientId: client.id,
      companionId,
      startTime: new Date(bookingDate),
      endTime: new Date(new Date(bookingDate).getTime() + duration * 60 * 60 * 1000),
      totalAmount: totalAmount.toFixed(2),
      platformFee: platformFee.toFixed(2),
      companionEarnings: companionEarnings.toFixed(2),
      status: 'pending',
      paymentStatus: 'pending',
    });

    // Initialize payment
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

    // Store payment reference
    await storage.updateBooking(booking.id, {
      paystackReference: payment.reference,
    });

    // Send notification to companion about new booking request
    const companionUser = await storage.getUserById(companion.userId);
    if (companionUser) {
      const bookingDateFormatted = new Date(bookingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      await sendNotification(
        companionUser.id,
        'booking_created',
        'New Booking Request',
        `${client.fullName} wants to book you for ${duration} hours on ${bookingDateFormatted}`,
        booking.id
      );
    }

    // Return booking and payment URL
    return res.status(200).json({ 
      booking: { ...booking, paystackReference: payment.reference },
      paymentUrl: payment.authorization_url,
      reference: payment.reference,
    });
  } catch (error: any) {
    console.error('Booking creation error:', error);
    return res.status(500).json({ message: error.message || 'Failed to create booking' });
  }
}
