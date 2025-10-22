/**
 * Bank Setup Endpoint
 * Creates Paystack subaccount for companion
 */

import { storage } from '../../lib/storage';
import { requireAuth } from '../../lib/auth';
import { createSubaccount } from '../../lib/paystack';

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

    const { accountNumber, bankCode, accountName, businessName } = req.body;
    const companion = await storage.getCompanionByUserId(authUser.userId);
    if (!companion) {
      return res.status(404).json({ message: 'Companion profile not found' });
    }

    // Create Paystack subaccount
    const subaccount = await createSubaccount({
      business_name: businessName || companion.fullName,
      settlement_bank: bankCode,
      account_number: accountNumber,
      percentage_charge: 15, // Companion gets 85%, platform gets 15%
    });

    await storage.updateCompanion(companion.id, {
      bankAccountName: accountName,
      bankAccountNumber: accountNumber,
      bankCode,
      paystackSubaccountCode: subaccount.subaccount_code,
    });

    return res.status(200).json({ 
      message: 'Bank account setup successful', 
      accountName: accountName,
      subaccountCode: subaccount.subaccount_code 
    });
  } catch (error: any) {
    console.error('Bank setup error:', error);
    return res.status(500).json({ message: error.message || 'Failed to setup bank account' });
  }
}
