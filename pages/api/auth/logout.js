/**
 * User Logout API Route - Serverless Function
 * Handles logout by invalidating client-side token
 * 
 * INFINITE LOOP PREVENTION:
 * - Single API call per request
 * - No recursive calls
 * - Always returns a response
 * 
 * HANGING REQUEST PREVENTION:
 * - Immediate response (no async operations needed)
 * - No external API calls
 * - No database operations required
 * 
 * ERROR HANDLING:
 * - Try-catch for unexpected errors
 * - Proper HTTP status codes
 * - Safe error messages
 * 
 * SECURITY:
 * - Client-side token invalidation (JWT is stateless)
 * - In production with database, could maintain token blacklist
 * - CORS headers properly configured
 * 
 * NOTE: Since JWT tokens are stateless, server-side invalidation
 * requires a token blacklist in database (optional TODO for production)
 */

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests immediately
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Extract token from Authorization header (optional, for logging purposes)
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    // TODO: In production with database, add token to blacklist
    // if (token) {
    //   await db.query(
    //     'INSERT INTO token_blacklist (token, blacklisted_at) VALUES (?, ?)',
    //     [token, new Date()]
    //   )
    // }

    // Log logout event (optional)
    if (token) {
      console.log('User logged out successfully');
    }

    // Return success response
    // Client should remove token from localStorage
    return res.status(200).json({
      message: 'Logout successful'
    });

  } catch (error) {
    // CRITICAL: Always catch and handle errors to prevent hanging requests
    console.error('Logout error:', error);
    
    // Return safe error message without exposing internals
    return res.status(500).json({ 
      message: 'Internal server error',
      // Only expose error details in development
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
}
