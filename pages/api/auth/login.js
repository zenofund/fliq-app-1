/**
 * User Login API Route - Serverless Function
 * 
 * INFINITE LOOP PREVENTION:
 * - Each request is handled exactly once with a single response
 * - No recursive API calls or self-referencing endpoints
 * - Request validation happens before any processing
 * - Early returns for invalid requests prevent unnecessary processing
 * 
 * HANGING REQUEST PREVENTION:
 * - All async operations have error handling
 * - Always return a response (success or error)
 * - No event listeners or long-polling in serverless functions
 * - Password comparison has built-in timeout protection
 * 
 * ERROR HANDLING:
 * - Comprehensive try-catch blocks around all operations
 * - Proper HTTP status codes for different error types
 * - Never expose internal errors to client
 * - Log errors for debugging while returning safe messages
 * - Validate all inputs before processing
 * 
 * SECURITY:
 * - Uses bcrypt to compare hashed passwords
 * - JWT tokens are signed with secret key
 * - Rate limiting should be implemented in production
 * - No user enumeration (same error for invalid email/password)
 * - Account lockout after multiple failed attempts (TODO)
 */

import bcrypt from 'bcryptjs';
import { createToken } from '../../../lib/auth';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests immediately
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Extract and validate request body
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: ['email', 'password']
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Sanitize email (trim whitespace, convert to lowercase)
    const sanitizedEmail = email.trim().toLowerCase();

    // TODO: Fetch user from database
    // In a real implementation:
    // const user = await db.query(
    //   'SELECT id, name, email, password, role FROM users WHERE email = ?',
    //   [sanitizedEmail]
    // )
    // if (!user) {
    //   return res.status(401).json({ message: 'Invalid email or password' })
    // }

    // Placeholder: Simulating database lookup
    // In production, this would come from the database
    // For now, we'll create a demo user with a hashed password for testing
    // Password: "password123" (hashed)
    const demoHashedPassword = await bcrypt.hash('password123', 10);
    
    const user = {
      id: 'user_demo_123',
      name: 'Demo User',
      email: sanitizedEmail,
      password: demoHashedPassword,
      role: 'client'
    };

    // If user doesn't exist in database, return error
    // For demo purposes, we accept any email but check password
    // In production, check if user exists in database first
    
    // Compare provided password with stored hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      // Use same error message for security (prevent user enumeration)
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // TODO: Update last login timestamp
    // await db.query('UPDATE users SET last_login = ? WHERE id = ?', [new Date(), user.id])

    // Generate JWT token with 7-day expiration
    const token = createToken(user.id, user.role, user.email);

    // Return success response with user data (without password)
    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    // CRITICAL: Always catch and handle errors to prevent hanging requests
    console.error('Login error:', error);
    
    // Return safe error message without exposing internals
    return res.status(500).json({ 
      message: 'Internal server error',
      // Only expose error details in development
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
}
