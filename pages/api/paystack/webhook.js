/**
 * Paystack Webhook Handler - Serverless Function
 * 
 * INFINITE LOOP PREVENTION:
 * - Process each webhook event exactly once using idempotency
 * - Store processed event IDs to prevent re-processing
 * - Never make API calls back to Paystack from webhook
 * - Don't trigger actions that could create new webhooks
 * 
 * HANGING REQUEST PREVENTION:
 * - Respond to webhook immediately (within 10 seconds)
 * - Process heavy operations asynchronously after response
 * - Set database query timeouts
 * - Use queue system for complex workflows
 * - Paystack will retry if no response received
 * 
 * ERROR HANDLING:
 * - Always return 200 OK to acknowledge receipt
 * - Log errors but don't fail the webhook
 * - Implement retry logic for failed operations
 * - Monitor webhook failures in production
 * 
 * SECURITY:
 * - ALWAYS verify webhook signature
 * - Compare with Paystack secret hash
 * - Reject requests with invalid signatures
 * - Only process from Paystack IPs (optional but recommended)
 * - Never expose internal logic in responses
 * 
 * BEST PRACTICES:
 * - Use raw body parser for signature verification
 * - Validate event structure before processing
 * - Implement idempotency with unique event IDs
 * - Use database transactions for state updates
 * - Send notifications after successful processing
 */

import crypto from 'crypto'

// Disable body parsing to get raw body for signature verification
export const config = {
  api: {
    bodyParser: false
  }
}

export default async function handler(req, res) {
  // Only allow POST from Paystack
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Get raw body for signature verification
    const rawBody = await getRawBody(req)
    const signature = req.headers['x-paystack-signature']

    // CRITICAL: Always verify webhook signature
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY
    if (!paystackSecret) {
      console.error('PAYSTACK_SECRET_KEY not configured')
      return res.status(500).json({ message: 'Configuration error' })
    }

    // Compute expected signature
    const hash = crypto
      .createHmac('sha512', paystackSecret)
      .update(rawBody)
      .digest('hex')

    // Verify signature matches
    if (hash !== signature) {
      console.error('Invalid webhook signature')
      return res.status(401).json({ message: 'Invalid signature' })
    }

    // Parse the verified body
    const event = JSON.parse(rawBody)

    // Check if event was already processed (idempotency)
    // TODO: Check database for existing event ID
    // const exists = await db.query('SELECT id FROM webhook_events WHERE event_id = ?', [event.id])
    // if (exists) {
    //   console.log('Event already processed:', event.id)
    //   return res.status(200).json({ message: 'Event already processed' })
    // }

    // Acknowledge receipt immediately - respond within 10 seconds
    // Process heavy operations after this response
    res.status(200).json({ message: 'Webhook received' })

    // Process event asynchronously
    await processWebhookEvent(event)

  } catch (error) {
    console.error('Webhook processing error:', error)
    
    // Still return 200 to prevent Paystack retries for our errors
    // Log the error for manual review
    return res.status(200).json({ message: 'Error logged for review' })
  }
}

/**
 * Process webhook event based on type
 * This runs after responding to Paystack
 */
async function processWebhookEvent(event) {
  try {
    // Store event to prevent duplicate processing
    // TODO: await db.query('INSERT INTO webhook_events (event_id, type, data) VALUES (?, ?, ?)',
    //   [event.id, event.event, JSON.stringify(event)])

    // Handle different event types
    switch (event.event) {
      case 'charge.success':
        await handleChargeSuccess(event.data)
        break

      case 'charge.failed':
        await handleChargeFailed(event.data)
        break

      case 'transfer.success':
        await handleTransferSuccess(event.data)
        break

      case 'transfer.failed':
        await handleTransferFailed(event.data)
        break

      case 'refund.processed':
        await handleRefundProcessed(event.data)
        break

      case 'refund.failed':
        await handleRefundFailed(event.data)
        break

      default:
        console.log('Unhandled event type:', event.event)
    }
  } catch (error) {
    console.error('Error processing webhook event:', error)
    // TODO: Add to retry queue or alert monitoring system
  }
}

/**
 * Handle successful payment charge
 */
async function handleChargeSuccess(data) {
  try {
    const reference = data.reference
    const bookingId = data.metadata?.bookingId

    if (!bookingId) {
      console.error('No booking ID in payment metadata')
      return
    }

    // TODO: Update payment status in database using transaction
    // await db.transaction(async (trx) => {
    //   await trx.query('UPDATE payments SET status = ?, paid_at = NOW() WHERE reference = ?',
    //     ['success', reference])
    //   await trx.query('UPDATE bookings SET payment_status = ? WHERE id = ?',
    //     ['paid', bookingId])
    // })

    // TODO: Send confirmation notifications
    // await sendNotification(userId, {
    //   type: 'payment_success',
    //   bookingId
    // })

    console.log('Payment processed successfully:', reference)
  } catch (error) {
    console.error('Error handling charge success:', error)
    throw error
  }
}

/**
 * Handle failed payment charge
 */
async function handleChargeFailed(data) {
  try {
    const reference = data.reference
    const bookingId = data.metadata?.bookingId

    // TODO: Update payment status
    // await db.query('UPDATE payments SET status = ? WHERE reference = ?', ['failed', reference])

    // TODO: Notify user of failed payment
    // await sendNotification(userId, {
    //   type: 'payment_failed',
    //   bookingId
    // })

    console.log('Payment failed:', reference)
  } catch (error) {
    console.error('Error handling charge failure:', error)
    throw error
  }
}

/**
 * Handle successful transfer to companion
 */
async function handleTransferSuccess(data) {
  // TODO: Update transfer status and notify companion
  console.log('Transfer successful:', data.reference)
}

/**
 * Handle failed transfer to companion
 */
async function handleTransferFailed(data) {
  // TODO: Update transfer status and alert admin
  console.log('Transfer failed:', data.reference)
}

/**
 * Handle successful refund processing
 */
async function handleRefundProcessed(data) {
  try {
    const transaction = data.transaction
    const bookingId = data.transaction_reference?.split('_')[1] // Extract from reference like "booking_123_timestamp"
    
    if (!bookingId) {
      console.error('No booking ID found in refund transaction')
      return
    }

    // TODO: Update payment and booking status in database
    // await db.transaction(async (trx) => {
    //   await trx.query('UPDATE payments SET status = ?, refunded_at = NOW() WHERE reference = ?',
    //     ['refunded', transaction])
    //   await trx.query('UPDATE bookings SET payment_status = ? WHERE id = ?',
    //     ['refunded', bookingId])
    // })

    // TODO: Send refund confirmation notification to client
    // await sendNotification(userId, {
    //   type: 'refund_processed',
    //   bookingId,
    //   message: 'Your refund has been processed successfully'
    // })

    console.log('Refund processed successfully:', transaction)
  } catch (error) {
    console.error('Error handling refund processed:', error)
    throw error
  }
}

/**
 * Handle failed refund
 */
async function handleRefundFailed(data) {
  try {
    const transaction = data.transaction
    const bookingId = data.transaction_reference?.split('_')[1]

    // TODO: Update refund status and alert admin
    // await db.query('UPDATE payments SET refund_status = ? WHERE reference = ?', ['failed', transaction])

    // TODO: Alert admin about failed refund for manual processing
    // await sendAdminAlert({
    //   type: 'refund_failed',
    //   bookingId,
    //   transaction,
    //   reason: data.message
    // })

    console.log('Refund failed:', transaction)
  } catch (error) {
    console.error('Error handling refund failure:', error)
    throw error
  }
}

/**
 * Get raw request body for signature verification
 */
function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}
