/**
 * Paystack Bank Verification API Route
 * 
 * Verifies bank account details before adding to companion profile
 * 
 * SECURITY:
 * - Requires authentication
 * - Only companions can verify bank accounts
 * - Rate limiting should be implemented in production
 * 
 * ERROR HANDLING:
 * - Validates bank code and account number format
 * - Returns safe error messages
 * - Logs errors for debugging
 */

import { verifyBankAccount } from '../../../lib/paystack'

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
    const user = { id: 'user123', role: 'companion' } // Placeholder

    // Only companions can verify bank accounts
    if (user.role !== 'companion') {
      return res.status(403).json({ message: 'Only companions can verify bank accounts' })
    }

    // Validate request body
    const { accountNumber, bankCode } = req.body

    if (!accountNumber || !bankCode) {
      return res.status(400).json({
        message: 'Missing required fields',
        required: ['accountNumber', 'bankCode']
      })
    }

    // Validate account number format (10 digits for Nigerian banks)
    if (!/^\d{10}$/.test(accountNumber)) {
      return res.status(400).json({
        message: 'Invalid account number. Must be 10 digits.'
      })
    }

    // Verify bank account with Paystack
    const verification = await verifyBankAccount({
      accountNumber,
      bankCode
    })

    if (!verification.status) {
      return res.status(400).json({
        message: 'Bank account verification failed',
        error: verification.message || 'Invalid account details'
      })
    }

    // Return verified account details
    return res.status(200).json({
      message: 'Bank account verified successfully',
      accountName: verification.data.account_name,
      accountNumber: verification.data.account_number,
      bankId: bankCode
    })

  } catch (error) {
    console.error('Bank verification error:', error)

    // Handle Paystack-specific errors
    if (error.message.includes('verify')) {
      return res.status(400).json({
        message: 'Unable to verify bank account. Please check the details and try again.'
      })
    }

    // Generic error response
    return res.status(500).json({
      message: 'Bank verification error',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    })
  }
}
