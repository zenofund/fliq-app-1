/**
 * Login Endpoint - Serverless Function
 * Converts Express session to JWT authentication
 * 
 * INFINITE LOOP PREVENTION:
 * - Single API call per request
 * - Always returns JSON response
 * - Proper error handling with try/catch
 * - No recursive calls
 */

import bcrypt from 'bcryptjs';
import { storage } from '../../lib/storage';
import { createToken } from '../../lib/auth';

export default async function handler(req: any, res: any) {
  // Set CORS headers to prevent hanging requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Validate HTTP method
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    // Get user from database (same logic as Express version)
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password (same logic as Express version)
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create JWT token (replaces req.session.userId = user.id)
    const token = createToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Return token + user data (same response format as Express)
    return res.status(200).json({
      message: 'Login successful',
      token, // NEW: JWT token for frontend to store
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Login failed' });
  }
}