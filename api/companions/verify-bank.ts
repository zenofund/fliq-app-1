import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import { storage } from '../../lib/storage';
import { requireCompanion } from '../../lib/auth';
import { handleCors, validateMethod, handleError } from '../../lib/utils';
import { PAYSTACK_BASE_URL } from '../../lib/constants';

/**
 * POST /api/companions/verify-bank
 * Verifies a bank account using Paystack
 * Requires: Companion authentication
 * 
 * Body:
 * - accountNumber: string (10 digits)
 * - bankCode: string
 * 
 * Returns:
 * - 200: { accountName, accountNumber, bankCode }
 * - 400: { message } - Invalid input
 * - 401: { message } - Unauthorized
 * - 403: { message } - Not a companion
 * - 500: { message } - Server error
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  if (handleCors(req, res)) return;

  // Validate method
  if (!validateMethod(req, res, 'POST')) return;

  try {
    // Require companion authentication
    const user = await requireCompanion(req, res);
    if (!user) return;

    const { accountNumber, bankCode } = req.body;

    if (!accountNumber || !bankCode) {
      return res.status(400).json({ message: 'Account number and bank code are required' });
    }

    if (!/^\d{10}$/.test(accountNumber)) {
      return res.status(400).json({ message: 'Account number must be 10 digits' });
    }

    // Verify account with Paystack
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecret) {
      return res.status(500).json({ message: 'Payment provider not configured' });
    }

    const response = await axios.get(
      `${PAYSTACK_BASE_URL}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
      {
        headers: {
          Authorization: `Bearer ${paystackSecret}`,
        },
      }
    );

    if (response.data.status && response.data.data) {
      const accountName = response.data.data.account_name;

      return res.status(200).json({
        accountName,
        accountNumber,
        bankCode,
      });
    } else {
      return res.status(400).json({ message: 'Unable to verify bank account' });
    }
  } catch (error: any) {
    if (error.response?.data?.message) {
      return res.status(400).json({ message: error.response.data.message });
    }
    handleError(res, error, 'Verify bank account');
  }
}
