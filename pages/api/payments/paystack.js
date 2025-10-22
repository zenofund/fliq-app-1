/**
 * Paystack Payment API Route - Serverless Function
 * 
 * INFINITE LOOP PREVENTION:
 * - No recursive payment initialization
 * - Single payment intent per request
 * - Idempotency keys prevent duplicate charges
 * - Never call this endpoint from itself
 * 
 * HANGING REQUEST PREVENTION:
 * - Set timeout for Paystack API calls (use axios timeout)
 * - Return immediately if payment intent creation fails
 * - Don't wait for webhook confirmation in this endpoint
 * - Webhook handles async payment status updates separately
 * 
 * ERROR HANDLING:
 * - Validate amount and currency before API call
 * - Handle Paystack API errors gracefully
 * - Log payment failures for audit trail
 * - Never expose Paystack secret key in responses
 * - Return safe error messages to client
 * 
 * SECURITY:
 * - Verify webhook signatures in webhook.js
 * - Store Paystack secret in environment variables
 * - Never trust client-provided amounts - recalculate server-side
 * - Use HTTPS only for payment operations
 * - Implement rate limiting to prevent abuse
 */

import axios from 'axios'

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Authenticate user
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' })
    }

    // TODO: Verify JWT token
    const user = { id: 'user123', email: 'user@example.com' } // Placeholder

    // Validate request body
    const { bookingId, amount, currency = 'NGN' } = req.body

    if (!bookingId) {
      return res.status(400).json({ message: 'Booking ID is required' })
    }

    // CRITICAL: Always recalculate amount server-side, never trust client
    // TODO: Fetch booking and calculate actual price
    // const booking = await db.query('SELECT * FROM bookings WHERE id = ?', [bookingId])
    // const calculatedAmount = booking.duration * booking.hourlyRate * 100 // in kobo

    // For now, validate provided amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' })
    }

    // Prepare Paystack payment initialization
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY
    if (!paystackSecret) {
      console.error('PAYSTACK_SECRET_KEY not configured')
      return res.status(500).json({ message: 'Payment configuration error' })
    }

    // Initialize payment with Paystack
    // IMPORTANT: Set timeout to prevent hanging requests
    const paystackResponse = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email: user.email,
        amount: amount, // Amount in smallest currency unit (kobo for NGN)
        currency: currency,
        reference: `booking_${bookingId}_${Date.now()}`, // Unique reference
        metadata: {
          bookingId,
          userId: user.id,
          custom_fields: [
            {
              display_name: 'Booking ID',
              variable_name: 'booking_id',
              value: bookingId
            }
          ]
        },
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/payments/callback`
      },
      {
        headers: {
          Authorization: `Bearer ${paystackSecret}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout to prevent hanging
      }
    )

    // Check if initialization was successful
    if (!paystackResponse.data.status) {
      throw new Error('Payment initialization failed')
    }

    // TODO: Store payment reference in database
    // await db.query(
    //   'INSERT INTO payments (booking_id, reference, amount, status) VALUES (?, ?, ?, ?)',
    //   [bookingId, paystackResponse.data.data.reference, amount, 'pending']
    // )

    // Return authorization URL for client to complete payment
    return res.status(200).json({
      message: 'Payment initialized',
      authorizationUrl: paystackResponse.data.data.authorization_url,
      reference: paystackResponse.data.data.reference,
      accessCode: paystackResponse.data.data.access_code
    })

  } catch (error) {
    console.error('Paystack payment error:', error)

    // Handle Paystack-specific errors
    if (error.response?.data) {
      return res.status(400).json({
        message: 'Payment initialization failed',
        error: error.response.data.message || 'Unknown payment error'
      })
    }

    // Handle timeout errors
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({
        message: 'Payment service timeout. Please try again.'
      })
    }

    // Generic error response
    return res.status(500).json({
      message: 'Payment processing error',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    })
  }
}
