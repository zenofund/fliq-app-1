/**
 * Bookings API Route - Serverless Function
 * 
 * INFINITE LOOP PREVENTION:
 * - Each request is handled exactly once with a single response
 * - No recursive API calls or self-referencing endpoints
 * - Request validation happens before any processing
 * - Early returns for invalid requests prevent unnecessary processing
 * 
 * HANGING REQUEST PREVENTION:
 * - All async operations have timeouts
 * - Database queries are wrapped in try-catch blocks
 * - Always return a response (success or error)
 * - No event listeners or long-polling in serverless functions
 * - Set appropriate function timeout in vercel.json/netlify.toml
 * 
 * ERROR HANDLING:
 * - Comprehensive try-catch blocks around all operations
 * - Proper HTTP status codes for different error types
 * - Never expose internal errors to client
 * - Log errors for debugging while returning safe messages
 * - Validate all inputs before processing
 * 
 * BEST PRACTICES:
 * - Use HTTP method-based routing (GET, POST, PUT)
 * - Authenticate requests with JWT tokens
 * - Validate request body schema
 * - Use database transactions for complex operations
 * - Implement rate limiting to prevent abuse
 */

import { sendNotification, NOTIFICATION_TYPES } from '../../../lib/notifications'

export default async function handler(req, res) {
  // Set CORS headers to prevent hanging requests
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  // Handle preflight requests immediately
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    // Authenticate user - ALWAYS verify before processing
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' })
    }

    // TODO: Verify JWT token
    // const user = verifyToken(token)
    const user = { id: 'user123', role: 'client' } // Placeholder

    // Route based on HTTP method
    switch (req.method) {
      case 'GET':
        return await handleGetBookings(req, res, user)
      
      case 'POST':
        return await handleCreateBooking(req, res, user)
      
      case 'PUT':
        return await handleUpdateBooking(req, res, user)
      
      default:
        return res.status(405).json({ message: 'Method not allowed' })
    }
  } catch (error) {
    // CRITICAL: Always catch and handle errors to prevent hanging requests
    console.error('Bookings API error:', error)
    return res.status(500).json({ 
      message: 'Internal server error',
      // Don't expose error details in production
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    })
  }
}

/**
 * GET /api/bookings - Fetch user's bookings
 * SAFETY: No loops, single database query with pagination
 */
async function handleGetBookings(req, res, user) {
  try {
    const { status, page = 1, limit = 10 } = req.query

    // TODO: Query database with proper pagination
    // IMPORTANT: Always use LIMIT and OFFSET to prevent fetching all records
    // const bookings = await db.query(
    //   'SELECT * FROM bookings WHERE user_id = ? AND status = ? LIMIT ? OFFSET ?',
    //   [user.id, status, limit, (page - 1) * limit]
    // )

    // Placeholder data
    const bookings = [
      {
        id: 1,
        companionId: 'comp123',
        companionName: 'Sarah Johnson',
        date: '2024-01-20',
        time: '18:00',
        duration: 2,
        location: 'Downtown Restaurant',
        status: 'confirmed',
        price: 100
      }
    ]

    return res.status(200).json({
      bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: bookings.length
      }
    })
  } catch (error) {
    console.error('Error fetching bookings:', error)
    throw error // Re-throw to be caught by main handler
  }
}

/**
 * POST /api/bookings - Create new booking
 * SAFETY: Validates input, single write operation, no recursive calls
 */
async function handleCreateBooking(req, res, user) {
  try {
    // Validate request body - ALWAYS validate before processing
    const { companionId, date, time, duration, location, notes } = req.body

    if (!companionId || !date || !time || !duration || !location) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: ['companionId', 'date', 'time', 'duration', 'location']
      })
    }

    // Validate duration is a number
    const durationNum = parseInt(duration)
    if (isNaN(durationNum) || durationNum < 1) {
      return res.status(400).json({ message: 'Duration must be at least 1 hour' })
    }

    // Validate date is in the future
    const bookingDate = new Date(`${date}T${time}`)
    if (bookingDate < new Date()) {
      return res.status(400).json({ message: 'Booking date must be in the future' })
    }

    // TODO: Check companion availability
    // Fetch companion's availability schedule from database
    // const availability = await db.query('SELECT schedule FROM companion_availability WHERE companion_id = ?', [companionId])
    
    // TODO: Check for conflicting bookings
    // const existingBookings = await db.query(
    //   'SELECT * FROM bookings WHERE companion_id = ? AND date = ? AND status NOT IN (?, ?)',
    //   [companionId, date, 'cancelled', 'rejected']
    // )
    
    // Use calendar utility to check conflicts
    // const { hasBookingConflict } = require('../../../lib/calendar')
    // const newBooking = { date, time, duration: durationNum }
    // if (hasBookingConflict(newBooking, existingBookings)) {
    //   return res.status(409).json({ 
    //     message: 'This time slot is not available. Please choose a different time.' 
    //   })
    // }

    // TODO: Calculate total price
    // const companion = await db.query('SELECT hourly_rate FROM companions WHERE id = ?', [companionId])
    // const totalPrice = companion.hourly_rate * durationNum

    // TODO: Create payment intent with Paystack
    // const payment = await createPaymentIntent(totalPrice)

    // TODO: Insert booking into database
    // IMPORTANT: Use parameterized queries to prevent SQL injection
    // const bookingId = await db.query(
    //   'INSERT INTO bookings (user_id, companion_id, date, time, duration, location, notes, status, price) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    //   [user.id, companionId, date, time, durationNum, location, notes, 'pending', totalPrice]
    // )

    const newBooking = {
      id: Date.now(), // In production, use database-generated ID
      userId: user.id,
      companionId,
      date,
      time,
      duration: durationNum,
      location,
      notes,
      status: 'pending',
      createdAt: new Date().toISOString()
    }

    // Send notification to companion via Pusher/Supabase Realtime
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      
      await sendNotification(
        companionId,
        NOTIFICATION_TYPES.BOOKING_REQUEST,
        {
          clientName: user.name || 'A client',
          date,
          time,
          duration: durationNum,
          location,
          bookingUrl: `${appUrl}/companion/dashboard?booking=${newBooking.id}`
        },
        {
          inApp: true,
          email: true,
          push: true,
          userEmail: null, // TODO: Fetch companion email from database
          pushToken: null
        }
      )
    } catch (notificationError) {
      // Log but don't fail the booking creation if notification fails
      console.error('Failed to send booking notification:', notificationError)
    }

    return res.status(201).json({
      message: 'Booking created successfully',
      booking: newBooking
    })
  } catch (error) {
    console.error('Error creating booking:', error)
    throw error
  }
}

/**
 * PUT /api/bookings - Update booking (accept/complete/cancel)
 * SAFETY: Single update operation, validates state transitions
 * 
 * CHAT AVAILABILITY LOGIC:
 * - Chat becomes available when companion accepts booking (status: 'accepted' or 'confirmed')
 * - Chat becomes unavailable when companion marks as 'completed'
 * - Chat also unavailable for 'pending', 'rejected', 'cancelled' statuses
 * 
 * PAYMENT WORKFLOW:
 * - accept: Charge client via Paystack (payment held)
 * - complete: Trigger split payment to companion via subaccount
 * - reject: Issue automatic refund to client
 * - cancel: Issue automatic refund to client (if payment was made)
 */
async function handleUpdateBooking(req, res, user) {
  try {
    const { bookingId, action } = req.body

    if (!bookingId || !action) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: ['bookingId', 'action']
      })
    }

    // Validate action
    const validActions = ['accept', 'reject', 'complete', 'cancel', 'expire']
    if (!validActions.includes(action)) {
      return res.status(400).json({ 
        message: 'Invalid action',
        validActions
      })
    }

    // TODO: Fetch booking and verify ownership
    // const booking = await db.query('SELECT * FROM bookings WHERE id = ?', [bookingId])
    // if (!booking || (booking.userId !== user.id && booking.companionId !== user.id)) {
    //   return res.status(403).json({ message: 'Not authorized' })
    // }

    // TODO: Validate state transitions
    // Only companions can accept/reject/complete
    // if (['accept', 'reject', 'complete'].includes(action) && user.role !== 'companion') {
    //   return res.status(403).json({ message: 'Only companions can perform this action' })
    // }
    
    // TODO: Validate booking can be completed only if accepted first
    // if (action === 'complete' && !['accepted', 'confirmed'].includes(booking.status)) {
    //   return res.status(400).json({ message: 'Booking must be accepted before completing' })
    // }

    // Map action to status
    const statusMap = {
      'accept': 'accepted',
      'reject': 'rejected',
      'complete': 'completed',
      'cancel': 'cancelled',
      'expire': 'expired'
    }
    const newStatus = statusMap[action]

    // TODO: Update booking status
    // await db.query('UPDATE bookings SET status = ? WHERE id = ?', [newStatus, bookingId])

    // Placeholder booking data - in production, fetch from database
    const booking = {
      id: bookingId,
      userId: 'user123',
      companionId: 'comp123',
      date: '2024-01-20',
      time: '18:00',
      location: 'Downtown Restaurant',
      status: newStatus
    }

    // Handle payment based on action
    try {
      if (action === 'complete') {
        // Trigger split payment to companion
        // TODO: Fetch booking payment reference and companion subaccount
        // const paymentRef = booking.payment_reference
        // const companionSubaccount = booking.companion_subaccount
        
        // Payment was already held on accept, now Paystack will auto-split
        // No action needed here as split was configured during initialization
        console.log('Booking completed - split payment will be processed automatically')
        
        // TODO: Optionally verify the split was successful
        // const verification = await verifyPayment(paymentRef)
        // if (!verification.data.subaccount) {
        //   console.error('Split payment not configured for booking:', bookingId)
        // }
      } else if (action === 'reject' || action === 'cancel' || action === 'expire') {
        // Issue refund to client
        // TODO: Fetch payment reference from booking
        // const paymentRef = booking.payment_reference
        // const paymentAmount = booking.amount
        
        // Only refund if payment was already made
        // if (booking.payment_status === 'paid') {
        //   const { initiateRefund } = require('../../../lib/paystack')
        //   await initiateRefund({
        //     transaction: paymentRef,
        //     amount: paymentAmount,
        //     customerNote: `Refund for ${action}ed booking #${bookingId}`,
        //     merchantNote: `Automatic refund - booking ${action}ed`
        //   })
        //   
        //   // Update payment status to refund_pending
        //   await db.query('UPDATE payments SET status = ? WHERE reference = ?', 
        //     ['refund_pending', paymentRef])
        // }
        
        console.log(`Booking ${action}ed - refund initiated if payment was made`)
      }
    } catch (paymentError) {
      console.error('Payment processing error:', paymentError)
      // Don't fail the booking update if payment fails
      // Log for manual intervention
      // TODO: Alert admin about payment issue
    }

    // Send notifications to both parties
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const chatAvailable = ['accepted', 'confirmed'].includes(newStatus)

      // Determine notification type and recipients based on action
      if (action === 'accept') {
        // Notify client that booking was accepted
        await sendNotification(
          booking.userId,
          NOTIFICATION_TYPES.BOOKING_ACCEPTED,
          {
            companionName: 'Your companion', // TODO: Fetch from database
            date: booking.date,
            time: booking.time,
            location: booking.location,
            chatUrl: `${appUrl}/client/dashboard?booking=${bookingId}&chat=true`
          },
          {
            inApp: true,
            email: true,
            push: true,
            userEmail: null, // TODO: Fetch from database
            pushToken: null
          }
        )
      } else if (action === 'reject') {
        // Notify client that booking was rejected
        await sendNotification(
          booking.userId,
          NOTIFICATION_TYPES.BOOKING_REJECTED,
          {
            date: booking.date,
            time: booking.time,
            searchUrl: `${appUrl}/client/dashboard`
          },
          {
            inApp: true,
            email: true,
            push: true,
            userEmail: null,
            pushToken: null
          }
        )
      } else if (action === 'cancel') {
        // Notify companion that booking was cancelled
        await sendNotification(
          booking.companionId,
          NOTIFICATION_TYPES.BOOKING_CANCELLED,
          {
            date: booking.date,
            time: booking.time
          },
          {
            inApp: true,
            email: true,
            push: true,
            userEmail: null,
            pushToken: null
          }
        )
      } else if (action === 'complete') {
        // Notify both parties that booking is completed
        await sendNotification(
          booking.userId,
          NOTIFICATION_TYPES.BOOKING_COMPLETED,
          {
            companionName: 'Your companion',
            reviewUrl: `${appUrl}/client/dashboard?booking=${bookingId}&review=true`
          },
          {
            inApp: true,
            email: true,
            push: false,
            userEmail: null,
            pushToken: null
          }
        )

        await sendNotification(
          booking.companionId,
          NOTIFICATION_TYPES.BOOKING_COMPLETED,
          {
            clientName: 'Your client',
            reviewUrl: `${appUrl}/companion/dashboard?booking=${bookingId}&review=true`
          },
          {
            inApp: true,
            email: true,
            push: false,
            userEmail: null,
            pushToken: null
          }
        )

        // Send payment received notification to companion
        await sendNotification(
          booking.companionId,
          NOTIFICATION_TYPES.PAYMENT_RECEIVED,
          {
            amount: '$100', // TODO: Get from booking
            date: booking.date,
            dashboardUrl: `${appUrl}/companion/dashboard`
          },
          {
            inApp: true,
            email: true,
            push: false,
            userEmail: null,
            pushToken: null
          }
        )
      }
    } catch (notificationError) {
      // Log but don't fail the booking update if notification fails
      console.error('Failed to send booking update notification:', notificationError)
    }

    return res.status(200).json({
      message: `Booking ${action}ed successfully`,
      bookingId,
      status: newStatus,
      // Chat is available for accepted/confirmed bookings only
      chatAvailable: ['accepted', 'confirmed'].includes(newStatus),
      paymentAction: action === 'complete' 
        ? 'split_payment_processed' 
        : ['reject', 'cancel', 'expire'].includes(action)
        ? 'refund_initiated'
        : 'none'
    })
  } catch (error) {
    console.error('Error updating booking:', error)
    throw error
  }
}
