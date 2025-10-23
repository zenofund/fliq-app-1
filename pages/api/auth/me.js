/**
 * Get Current User API Route - Serverless Function
 * Verifies JWT token and returns current user information
 * 
 * INFINITE LOOP PREVENTION:
 * - Single API call per request
 * - No recursive calls or self-referencing endpoints
 * - Request validation before processing
 * - Early returns for invalid requests
 * 
 * HANGING REQUEST PREVENTION:
 * - All async operations have error handling
 * - Always return a response (success or error)
 * - No event listeners or long-polling
 * - Token verification has built-in timeout
 * 
 * ERROR HANDLING:
 * - Comprehensive try-catch blocks
 * - Proper HTTP status codes
 * - Safe error messages (no internal details exposed)
 * - Token validation errors handled gracefully
 * 
 * SECURITY:
 * - JWT token verification with secret key
 * - No sensitive data exposed in response
 * - Rate limiting should be implemented in production
 * - Token expiration enforced
 */

import { verifyToken } from '../../../lib/auth';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests immediately
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET method
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ 
        message: 'No authorization header provided' 
      });
    }

    // Extract Bearer token
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ 
        message: 'Invalid authorization header format. Expected: Bearer <token>' 
      });
    }

    const token = parts[1];

    if (!token) {
      return res.status(401).json({ 
        message: 'No token provided' 
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      // Token is invalid or expired
      return res.status(401).json({ 
        message: 'Invalid or expired token' 
      });
    }

    // TODO: Optionally fetch fresh user data from database
    // In a real implementation:
    // const user = await db.query('SELECT id, name, email, role FROM users WHERE id = ?', [decoded.id])
    // if (!user) {
    //   return res.status(404).json({ message: 'User not found' })
    // }

    // Return user data from token (in production, fetch from database for fresh data)
    return res.status(200).json({
      user: {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role
      }
    });

  } catch (error) {
    // CRITICAL: Always catch and handle errors to prevent hanging requests
    console.error('Get current user error:', error);
    
    // Return safe error message without exposing internals
    return res.status(500).json({ 
      message: 'Internal server error',
      // Only expose error details in development
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
}
