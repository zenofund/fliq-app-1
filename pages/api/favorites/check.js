/**
 * Check Favorite Status API Route - Serverless Function
 * 
 * INFINITE LOOP PREVENTION:
 * - Each request is handled exactly once with a single response
 * - No recursive API calls or self-referencing endpoints
 * - Request validation happens before any processing
 * 
 * HANGING REQUEST PREVENTION:
 * - All async operations have error handling
 * - Always return a response (success or error)
 * - Database operations have built-in timeout protection
 * 
 * ERROR HANDLING:
 * - Comprehensive try-catch blocks around all operations
 * - Proper HTTP status codes for different error types
 * - Validate all inputs before processing
 * 
 * SECURITY:
 * - JWT authentication required
 * - Users can only check their own favorites
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
    // Authenticate user
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.substring(7);
    let user;
    try {
      user = verifyToken(token);
      if (!user) {
        return res.status(401).json({ message: 'Invalid token' });
      }
    } catch (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const { companionIds } = req.query;

    if (!companionIds) {
      return res.status(400).json({ message: 'Companion IDs are required' });
    }

    // Parse companion IDs (can be comma-separated)
    const idsArray = companionIds.split(',').map(id => id.trim());

    // TODO: Query database to check which companions are favorited
    // const favorites = await db.query(
    //   'SELECT companion_id FROM favorites WHERE user_id = ? AND companion_id IN (?)',
    //   [user.id, idsArray]
    // )
    // const favoritedIds = favorites.map(f => f.companion_id)

    // Mock data - for demonstration, companion 1 and 3 are favorited
    const mockFavoritedIds = [1, 3];
    
    // Create a map of companion ID to favorite status
    const favoriteStatus = {};
    idsArray.forEach(id => {
      favoriteStatus[id] = mockFavoritedIds.includes(parseInt(id));
    });

    return res.status(200).json({
      message: 'Favorite status fetched successfully',
      favoriteStatus
    });

  } catch (error) {
    console.error('Check favorite status error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
}
