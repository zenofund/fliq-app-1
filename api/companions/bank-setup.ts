import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../lib/storage';
import { requireCompanion } from '../../lib/auth';
import { handleCors, validateMethod, handleError } from '../../lib/utils';

/**
 * POST /api/companions/bank-setup
 * Saves verified bank account details for a companion
 * Requires: Companion authentication
 * 
 * Body:
 * - bankName: string
 * - accountNumber: string
 * - accountName: string
 * 
 * Returns:
 * - 200: { message, companion }
 * - 400: { message } - Invalid input
 * - 401: { message } - Unauthorized
 * - 403: { message } - Not a companion
 * - 404: { message } - Profile not found
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

    const companion = await storage.getCompanionByUserId(user.userId);
    if (!companion) {
      return res.status(404).json({ message: 'Companion profile not found' });
    }

    const { bankName, accountNumber, accountName } = req.body;

    if (!bankName || !accountNumber || !accountName) {
      return res.status(400).json({ message: 'Bank name, account number, and account name are required' });
    }

    if (!/^\d{10}$/.test(accountNumber)) {
      return res.status(400).json({ message: 'Account number must be 10 digits' });
    }

    // Update companion with bank details
    const updatedCompanion = await storage.updateCompanion(companion.id, {
      bankName,
      accountNumber,
      accountName,
      bankVerified: true,
    });

    return res.status(200).json({
      message: 'Bank account setup successful',
      companion: updatedCompanion,
    });
  } catch (error: any) {
    handleError(res, error, 'Setup bank account');
  }
}
