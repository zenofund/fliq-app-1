/**
 * Favorites API Route - Serverless Function
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
 * - Database operations have built-in timeout protection
 * 
 * ERROR HANDLING:
 * - Comprehensive try-catch blocks around all operations
 * - Proper HTTP status codes for different error types
 * - Never expose internal errors to client
 * - Log errors for debugging while returning safe messages
 * - Validate all inputs before processing
 * 
 * SECURITY:
 * - JWT authentication required for all operations
 * - Users can only manage their own favorites
 * - SQL injection prevention with parameterized queries
 * - Rate limiting should be implemented in production
 */

import { verifyToken } from '../../../lib/auth';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests immediately
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Authenticate user - ALWAYS verify before processing
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

    // Only clients can have favorites
    if (user.role !== 'client') {
      return res.status(403).json({ message: 'Only clients can manage favorites' });
    }

    // Route based on HTTP method
    switch (req.method) {
      case 'GET':
        return await handleGetFavorites(req, res, user);
      
      case 'POST':
        return await handleAddFavorite(req, res, user);
      
      case 'DELETE':
        return await handleRemoveFavorite(req, res, user);
      
      default:
        return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    // CRITICAL: Always catch and handle errors to prevent hanging requests
    console.error('Favorites API error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      // Don't expose error details in production
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
}

/**
 * GET /api/favorites - Fetch user's favorite companions
 * SAFETY: No loops, single database query with pagination
 */
async function handleGetFavorites(req, res, user) {
  try {
    const { page = 1, limit = 20 } = req.query;

    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));

    // TODO: Query database with proper pagination
    // IMPORTANT: Always use LIMIT and OFFSET to prevent fetching all records
    // const favorites = await db.query(`
    //   SELECT 
    //     f.id as favorite_id,
    //     f.created_at as favorited_at,
    //     c.*
    //   FROM favorites f
    //   JOIN users c ON f.companion_id = c.id
    //   WHERE f.user_id = ? AND c.role = 'companion'
    //   ORDER BY f.created_at DESC
    //   LIMIT ? OFFSET ?
    // `, [user.id, limitNum, (pageNum - 1) * limitNum])

    // Placeholder data - simulating favorited companions
    const mockFavorites = [
      {
        favorite_id: 1,
        favorited_at: '2024-01-10T10:30:00.000Z',
        id: 1,
        name: 'Emma Wilson',
        rating: 4.9,
        reviews: 127,
        distance: '0.5 km',
        hourlyRate: 50,
        location: 'Downtown, New York',
        bio: 'Professional companion with expertise in fine dining and cultural events',
        specialties: ['Fine Dining', 'Theater', 'Art Galleries'],
        languages: ['English', 'French'],
        availability: 'available',
        verificationStatus: 'verified',
        image: '/placeholder.jpg'
      },
      {
        favorite_id: 2,
        favorited_at: '2024-01-08T15:20:00.000Z',
        id: 3,
        name: 'Isabella Martinez',
        rating: 4.9,
        reviews: 143,
        distance: '2.3 km',
        hourlyRate: 60,
        location: 'Upper East Side, New York',
        bio: 'Elite companion for high-end events and exclusive gatherings',
        specialties: ['Gala Events', 'Opera', 'Wine Tasting'],
        languages: ['English', 'Spanish', 'Italian'],
        availability: 'busy',
        verificationStatus: 'verified',
        image: '/placeholder.jpg'
      }
    ];

    // Apply pagination to mock data
    const total = mockFavorites.length;
    const offset = (pageNum - 1) * limitNum;
    const paginatedFavorites = mockFavorites.slice(offset, offset + limitNum);

    return res.status(200).json({
      message: 'Favorites fetched successfully',
      favorites: paginatedFavorites,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        hasMore: offset + limitNum < total
      }
    });

  } catch (error) {
    console.error('Get favorites error:', error);
    return res.status(500).json({ 
      message: 'Failed to fetch favorites',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
}

/**
 * POST /api/favorites - Add a companion to favorites
 * SAFETY: Single INSERT query, no loops
 */
async function handleAddFavorite(req, res, user) {
  try {
    const { companionId } = req.body;

    // Validate input
    if (!companionId) {
      return res.status(400).json({ message: 'Companion ID is required' });
    }

    // TODO: In production, verify companion exists and is verified
    // const companion = await db.query(
    //   'SELECT id, role, verificationStatus FROM users WHERE id = ?',
    //   [companionId]
    // )
    // if (!companion || companion.role !== 'companion') {
    //   return res.status(404).json({ message: 'Companion not found' })
    // }
    // if (companion.verificationStatus !== 'verified') {
    //   return res.status(400).json({ message: 'Can only favorite verified companions' })
    // }

    // TODO: Check if already favorited
    // const existing = await db.query(
    //   'SELECT id FROM favorites WHERE user_id = ? AND companion_id = ?',
    //   [user.id, companionId]
    // )
    // if (existing) {
    //   return res.status(409).json({ message: 'Companion already in favorites' })
    // }

    // TODO: Insert into database
    // const result = await db.query(
    //   'INSERT INTO favorites (user_id, companion_id, created_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
    //   [user.id, companionId]
    // )

    // Placeholder success response
    const newFavorite = {
      id: Date.now(), // Mock ID
      user_id: user.id,
      companion_id: companionId,
      created_at: new Date().toISOString()
    };

    return res.status(201).json({
      message: 'Companion added to favorites',
      favorite: newFavorite
    });

  } catch (error) {
    console.error('Add favorite error:', error);
    return res.status(500).json({ 
      message: 'Failed to add favorite',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
}

/**
 * DELETE /api/favorites - Remove a companion from favorites
 * SAFETY: Single DELETE query, no loops
 */
async function handleRemoveFavorite(req, res, user) {
  try {
    const { companionId } = req.query;

    // Validate input
    if (!companionId) {
      return res.status(400).json({ message: 'Companion ID is required' });
    }

    // TODO: Delete from database
    // const result = await db.query(
    //   'DELETE FROM favorites WHERE user_id = ? AND companion_id = ?',
    //   [user.id, companionId]
    // )
    // if (result.affectedRows === 0) {
    //   return res.status(404).json({ message: 'Favorite not found' })
    // }

    return res.status(200).json({
      message: 'Companion removed from favorites'
    });

  } catch (error) {
    console.error('Remove favorite error:', error);
    return res.status(500).json({ 
      message: 'Failed to remove favorite',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
}
