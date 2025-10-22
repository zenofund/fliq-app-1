import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { storage } from '../../lib/storage';
import { createToken } from '../../lib/auth';
import { handleCors, validateMethod, handleError } from '../../lib/utils';

/**
 * POST /api/auth/login
 * Authenticates a user and returns a JWT token
 * 
 * Body:
 * - email: string (required)
 * - password: string (required)
 * 
 * Returns:
 * - 200: { message, token, user }
 * - 400: { message } - Missing credentials
 * - 401: { message } - Invalid credentials
 * - 403: { message } - Account suspended
 * - 500: { message } - Server error
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  if (handleCors(req, res)) return;

  // Validate method
  if (!validateMethod(req, res, 'POST')) return;

  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user by email
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if account is suspended
    if (user.suspended) {
      return res.status(403).json({ message: 'Account has been suspended' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create JWT token
    const token = createToken({
      userId: user.id,
      email: user.email,
      role: user.role as 'client' | 'companion' | 'admin',
    });

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        verified: user.verified,
      },
    });
  } catch (error: any) {
    handleError(res, error, 'Login');
  }
}
