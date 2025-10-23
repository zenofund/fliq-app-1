/**
 * Paystack Subaccount API Route
 * 
 * Creates a subaccount for companions to receive split payments
 * 
 * SECURITY:
 * - Requires authentication
 * - Only companions can create subaccounts
 * - Bank account must be verified first
 * 
 * WORKFLOW:
 * 1. Companion verifies bank account via /api/paystack/verify-bank
 * 2. Companion creates subaccount with verified details
 * 3. Subaccount code is stored in companion profile
 * 4. Used for split payments when bookings are completed
 */

import { createSubaccount } from '../../../lib/paystack'

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

    // TODO: Verify JWT token and check user role
    const user = { id: 'comp123', role: 'companion', name: 'Jane Doe' } // Placeholder

    // Only companions can create subaccounts
    if (user.role !== 'companion') {
      return res.status(403).json({ message: 'Only companions can create subaccounts' })
    }

    // Validate request body
    const { businessName, settlementBank, accountNumber, percentageCharge, description } = req.body

    if (!businessName || !settlementBank || !accountNumber) {
      return res.status(400).json({
        message: 'Missing required fields',
        required: ['businessName', 'settlementBank', 'accountNumber']
      })
    }

    // Validate percentage charge
    const charge = parseFloat(percentageCharge || 0)
    if (isNaN(charge) || charge < 0 || charge > 100) {
      return res.status(400).json({
        message: 'Invalid percentage charge. Must be between 0 and 100.'
      })
    }

    // TODO: Check if companion already has a subaccount
    // const existingSubaccount = await db.query(
    //   'SELECT subaccount_code FROM companions WHERE id = ?',
    //   [user.id]
    // )
    // if (existingSubaccount?.subaccount_code) {
    //   return res.status(400).json({
    //     message: 'Companion already has a subaccount',
    //     subaccountCode: existingSubaccount.subaccount_code
    //   })
    // }

    // Create subaccount with Paystack
    const subaccountResult = await createSubaccount({
      businessName: businessName || user.name,
      settlementBank,
      accountNumber,
      percentageCharge: charge,
      description: description || `Subaccount for companion ${user.name}`
    })

    if (!subaccountResult.status) {
      return res.status(400).json({
        message: 'Subaccount creation failed',
        error: subaccountResult.message || 'Unknown error'
      })
    }

    const subaccountCode = subaccountResult.data.subaccount_code

    // TODO: Store subaccount code in companion profile
    // await db.query(
    //   'UPDATE companions SET subaccount_code = ?, settlement_bank = ?, account_number = ? WHERE id = ?',
    //   [subaccountCode, settlementBank, accountNumber, user.id]
    // )

    // Return success
    return res.status(201).json({
      message: 'Subaccount created successfully',
      subaccountCode,
      percentageCharge: charge
    })

  } catch (error) {
    console.error('Subaccount creation error:', error)

    // Handle Paystack-specific errors
    if (error.message.includes('create')) {
      return res.status(400).json({
        message: 'Unable to create subaccount. Please check the details and try again.'
      })
    }

    // Generic error response
    return res.status(500).json({
      message: 'Subaccount creation error',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    })
  }
}
