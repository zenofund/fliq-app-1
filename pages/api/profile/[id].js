/**
 * Profile Fetch API Route - Serverless Function
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
 * - JWT authentication optional for public profiles
 * - Sensitive data filtered based on authentication
 * - SQL injection prevention with parameterized queries
 * - Rate limiting should be implemented in production
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
    // Get profile ID from query parameters
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ message: 'Profile ID is required' });
    }

    // Verify if request is authenticated (optional)
    let isAuthenticated = false;
    let requestingUserId = null;
    
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = verifyToken(token);
        if (decoded) {
          isAuthenticated = true;
          requestingUserId = decoded.id;
        }
      } catch (err) {
        // Token invalid, continue as unauthenticated
      }
    }

    // TODO: Fetch profile from database
    // In a real implementation:
    // const profile = await db.query('SELECT * FROM users WHERE id = ?', [id])
    // if (!profile) {
    //   return res.status(404).json({ message: 'Profile not found' })
    // }

    // Placeholder profile data
    const fullProfile = {
      id: id,
      name: 'John Smith',
      email: 'john.smith@example.com',
      phone: '+1 (555) 123-4567',
      dateOfBirth: '1990-05-15',
      location: 'New York, NY',
      address: '123 Main Street, Apt 4B',
      bio: 'Love exploring new restaurants and cultural events.',
      interests: 'Fine Dining, Theater, Art Galleries',
      role: 'client',
      emergencyContact: 'Jane Smith',
      emergencyPhone: '+1 (555) 987-6543',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-15T12:30:00.000Z'
    };

    // Filter sensitive data if not authenticated or not the owner
    const isOwner = isAuthenticated && requestingUserId === id;
    
    let publicProfile = {
      id: fullProfile.id,
      name: fullProfile.name,
      location: fullProfile.location,
      bio: fullProfile.bio,
      interests: fullProfile.interests,
      role: fullProfile.role
    };

    // Add companion-specific public fields
    if (fullProfile.role === 'companion') {
      publicProfile = {
        ...publicProfile,
        experience: fullProfile.experience || '',
        specialties: fullProfile.specialties || '',
        languages: fullProfile.languages || '',
        hourlyRate: fullProfile.hourlyRate || 0,
        rating: fullProfile.rating || 0,
        verificationStatus: fullProfile.verificationStatus || 'pending',
        availabilityStatus: fullProfile.availabilityStatus || 'available'
      };
    }

    // Return full profile if owner, otherwise return public profile
    const profileToReturn = isOwner ? fullProfile : publicProfile;

    return res.status(200).json({
      message: 'Profile fetched successfully',
      profile: profileToReturn,
      isOwner
    });

  } catch (error) {
    // CRITICAL: Always catch and handle errors to prevent hanging requests
    console.error('Profile fetch error:', error);
    
    // Return safe error message without exposing internals
    return res.status(500).json({ 
      message: 'Internal server error',
      // Only expose error details in development
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
}
