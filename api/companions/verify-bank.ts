/**
 * Verify Bank Account Endpoint
 * Verifies bank account details with Paystack
 */

import { requireAuth } from '../../lib/auth';
import { verifyBankAccount } from '../../lib/paystack';

export default async function handler(req: any, res: any) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Validate HTTP method
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify JWT token
    const authUser = await requireAuth(req, res);
    if (!authUser) return; // requireAuth already sent 401 response

    const { accountNumber, bankCode } = req.query;
    
    console.log('Bank verification request:', { accountNumber, bankCode, userId: authUser.userId });

    if (!accountNumber || !bankCode) {
      console.log('Missing parameters');
      return res.status(400).json({ message: 'Account number and bank code are required' });
    }

    console.log('Calling Paystack API...');
    const verification = await verifyBankAccount(
      accountNumber as string,
      bankCode as string
    );
    
    console.log('Verification successful:', verification);

    return res.status(200).json({
      account_name: verification.account_name,
      account_number: verification.account_number,
    });
  } catch (error: any) {
    console.error('Bank verification error:', error);
    console.error('Error details:', { message: error.message, response: error.response?.data });
    return res.status(400).json({ message: error.message || 'Failed to verify bank account' });
  }
}
