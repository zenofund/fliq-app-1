/**
 * Paystack Helper Library
 * Utility functions for Paystack payment integration
 */

import axios from 'axios'

const PAYSTACK_BASE_URL = 'https://api.paystack.co'

/**
 * Initialize a payment transaction
 * @param {Object} params - Payment parameters
 * @returns {Promise<Object>} - Payment initialization response
 */
export async function initializePayment({
  email,
  amount,
  currency = 'NGN',
  reference,
  metadata = {}
}) {
  try {
    const response = await axios.post(
      `${PAYSTACK_BASE_URL}/transaction/initialize`,
      {
        email,
        amount,
        currency,
        reference,
        metadata
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    )

    return response.data
  } catch (error) {
    console.error('Paystack initialization error:', error.response?.data || error.message)
    throw new Error('Failed to initialize payment')
  }
}

/**
 * Verify a transaction
 * @param {string} reference - Transaction reference
 * @returns {Promise<Object>} - Verification response
 */
export async function verifyPayment(reference) {
  try {
    const response = await axios.get(
      `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
        },
        timeout: 10000
      }
    )

    return response.data
  } catch (error) {
    console.error('Paystack verification error:', error.response?.data || error.message)
    throw new Error('Failed to verify payment')
  }
}

/**
 * Create a transfer recipient
 * @param {Object} params - Recipient parameters
 * @returns {Promise<Object>} - Recipient creation response
 */
export async function createTransferRecipient({
  type = 'nuban',
  name,
  accountNumber,
  bankCode,
  currency = 'NGN'
}) {
  try {
    const response = await axios.post(
      `${PAYSTACK_BASE_URL}/transferrecipient`,
      {
        type,
        name,
        account_number: accountNumber,
        bank_code: bankCode,
        currency
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    )

    return response.data
  } catch (error) {
    console.error('Paystack recipient creation error:', error.response?.data || error.message)
    throw new Error('Failed to create transfer recipient')
  }
}

/**
 * Initiate a transfer
 * @param {Object} params - Transfer parameters
 * @returns {Promise<Object>} - Transfer response
 */
export async function initiateTransfer({
  amount,
  recipient,
  reason,
  reference
}) {
  try {
    const response = await axios.post(
      `${PAYSTACK_BASE_URL}/transfer`,
      {
        source: 'balance',
        amount,
        recipient,
        reason,
        reference
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    )

    return response.data
  } catch (error) {
    console.error('Paystack transfer error:', error.response?.data || error.message)
    throw new Error('Failed to initiate transfer')
  }
}

/**
 * Verify webhook signature
 * @param {string} signature - Webhook signature from headers
 * @param {string} body - Raw request body
 * @returns {boolean} - True if signature is valid
 */
export function verifyWebhookSignature(signature, body) {
  const crypto = require('crypto')
  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
    .update(body)
    .digest('hex')
  
  return hash === signature
}
