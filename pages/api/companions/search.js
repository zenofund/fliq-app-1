/**
 * Companion Search API Route - Serverless Function
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
 * - Input validation and sanitization
 * - SQL injection prevention with parameterized queries
 * - Rate limiting should be implemented in production
 */

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
    // Extract query parameters with defaults
    const {
      query = '',
      location = '',
      minRating = 0,
      maxPrice = 999999,
      minPrice = 0,
      availability = '',
      specialties = '',
      languages = '',
      page = 1,
      limit = 10
    } = req.query;

    // Validate and sanitize inputs
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
    const minRatingNum = Math.max(0, Math.min(5, parseFloat(minRating) || 0));
    const maxPriceNum = Math.max(0, parseFloat(maxPrice) || 999999);
    const minPriceNum = Math.max(0, parseFloat(minPrice) || 0);

    // TODO: In production, fetch from database
    // const companions = await db.query(`
    //   SELECT * FROM companions 
    //   WHERE role = 'companion' 
    //   AND verificationStatus = 'verified'
    //   AND (name LIKE ? OR bio LIKE ?)
    //   AND rating >= ?
    //   AND hourlyRate BETWEEN ? AND ?
    //   ORDER BY rating DESC, distance ASC
    //   LIMIT ? OFFSET ?
    // `, [searchQuery, searchQuery, minRating, minPrice, maxPrice, limit, offset])

    // Placeholder data - in production, this would come from a database
    const allCompanions = [
      {
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
        id: 2,
        name: 'Sophie Anderson',
        rating: 4.8,
        reviews: 98,
        distance: '1.2 km',
        hourlyRate: 45,
        location: 'Midtown, New York',
        bio: 'Experienced companion specializing in business events and networking',
        specialties: ['Business Events', 'Networking', 'Corporate Functions'],
        languages: ['English', 'Spanish'],
        availability: 'available',
        verificationStatus: 'verified',
        image: '/placeholder.jpg'
      },
      {
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
      },
      {
        id: 4,
        name: 'Olivia Chen',
        rating: 4.7,
        reviews: 85,
        distance: '3.1 km',
        hourlyRate: 55,
        location: 'Brooklyn, New York',
        bio: 'Friendly companion for casual outings and social events',
        specialties: ['Casual Dining', 'Movies', 'Concerts'],
        languages: ['English', 'Mandarin'],
        availability: 'available',
        verificationStatus: 'verified',
        image: '/placeholder.jpg'
      },
      {
        id: 5,
        name: 'Ava Thompson',
        rating: 4.8,
        reviews: 112,
        distance: '1.8 km',
        hourlyRate: 48,
        location: 'Chelsea, New York',
        bio: 'Versatile companion for various occasions and events',
        specialties: ['Sports Events', 'Outdoor Activities', 'Travel'],
        languages: ['English', 'German'],
        availability: 'available',
        verificationStatus: 'verified',
        image: '/placeholder.jpg'
      },
      {
        id: 6,
        name: 'Mia Johnson',
        rating: 4.6,
        reviews: 67,
        distance: '4.2 km',
        hourlyRate: 42,
        location: 'Queens, New York',
        bio: 'Fun and energetic companion for entertainment and leisure',
        specialties: ['Dancing', 'Karaoke', 'Party Events'],
        languages: ['English'],
        availability: 'available',
        verificationStatus: 'verified',
        image: '/placeholder.jpg'
      }
    ];

    // Apply filters
    let filteredCompanions = allCompanions.filter(companion => {
      // Text search in name, bio, and specialties
      const searchText = query.toLowerCase();
      const matchesQuery = !query || 
        companion.name.toLowerCase().includes(searchText) ||
        companion.bio.toLowerCase().includes(searchText) ||
        companion.specialties.some(s => s.toLowerCase().includes(searchText));

      // Location filter
      const matchesLocation = !location || 
        companion.location.toLowerCase().includes(location.toLowerCase());

      // Rating filter
      const matchesRating = companion.rating >= minRatingNum;

      // Price range filter
      const matchesPrice = companion.hourlyRate >= minPriceNum && 
        companion.hourlyRate <= maxPriceNum;

      // Availability filter
      const matchesAvailability = !availability || 
        companion.availability === availability;

      // Specialties filter
      const matchesSpecialties = !specialties || 
        companion.specialties.some(s => 
          s.toLowerCase().includes(specialties.toLowerCase())
        );

      // Languages filter
      const matchesLanguages = !languages || 
        companion.languages.some(l => 
          l.toLowerCase().includes(languages.toLowerCase())
        );

      return matchesQuery && matchesLocation && matchesRating && 
        matchesPrice && matchesAvailability && matchesSpecialties && 
        matchesLanguages;
    });

    // Sort by rating (highest first), then by distance (closest first)
    filteredCompanions.sort((a, b) => {
      if (b.rating !== a.rating) {
        return b.rating - a.rating;
      }
      const distA = parseFloat(a.distance);
      const distB = parseFloat(b.distance);
      return distA - distB;
    });

    // Pagination
    const total = filteredCompanions.length;
    const offset = (pageNum - 1) * limitNum;
    const paginatedCompanions = filteredCompanions.slice(offset, offset + limitNum);

    return res.status(200).json({
      message: 'Companions fetched successfully',
      companions: paginatedCompanions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        hasMore: offset + limitNum < total
      },
      filters: {
        query,
        location,
        minRating: minRatingNum,
        maxPrice: maxPriceNum,
        minPrice: minPriceNum,
        availability,
        specialties,
        languages
      }
    });

  } catch (error) {
    // CRITICAL: Always catch and handle errors to prevent hanging requests
    console.error('Companion search error:', error);
    
    // Return safe error message without exposing internals
    return res.status(500).json({ 
      message: 'Internal server error',
      // Only expose error details in development
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
}
