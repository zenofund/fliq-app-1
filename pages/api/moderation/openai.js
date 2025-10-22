/**
 * OpenAI Content Moderation API Route - Serverless Function
 * 
 * INFINITE LOOP PREVENTION:
 * - Never moderate content that triggers moderation endpoint
 * - Single moderation check per request
 * - Don't chain moderation calls
 * - Cache moderation results to avoid re-checking same content
 * - Set maximum content length to prevent abuse
 * 
 * HANGING REQUEST PREVENTION:
 * - Set aggressive timeout for OpenAI API calls (5-10 seconds)
 * - Fail fast if moderation service is down
 * - Don't wait for synchronous moderation in user flows
 * - Consider async moderation for non-critical paths
 * - Return cached results when possible
 * 
 * ERROR HANDLING:
 * - Handle OpenAI API errors gracefully
 * - Fall back to allowing content if moderation fails (or reject based on policy)
 * - Log moderation errors for review
 * - Never expose OpenAI API key in responses
 * - Rate limit requests to prevent quota exhaustion
 * 
 * SECURITY:
 * - Store OpenAI API key in environment variables
 * - Validate and sanitize input content
 * - Implement rate limiting per user
 * - Log flagged content for audit
 * - Consider additional rule-based checks
 * 
 * BEST PRACTICES:
 * - Use OpenAI Moderation API (cheaper than GPT models)
 * - Cache results for identical content
 * - Implement progressive severity levels
 * - Notify users when content is flagged
 * - Human review for edge cases
 */

import OpenAI from 'openai'

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Authenticate user
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' })
    }

    // TODO: Verify JWT token and implement rate limiting
    const user = { id: 'user123' } // Placeholder

    // Validate request body
    const { content, type = 'message' } = req.body

    if (!content || typeof content !== 'string') {
      return res.status(400).json({ message: 'Content is required' })
    }

    // Enforce maximum content length to prevent abuse
    const MAX_CONTENT_LENGTH = 10000 // characters
    if (content.length > MAX_CONTENT_LENGTH) {
      return res.status(400).json({ 
        message: `Content too long. Maximum ${MAX_CONTENT_LENGTH} characters.`
      })
    }

    // Check if content is empty or too short
    if (content.trim().length < 1) {
      return res.status(200).json({
        flagged: false,
        message: 'Content is safe'
      })
    }

    // TODO: Check cache for previously moderated content
    // const cached = await redis.get(`moderation:${hash(content)}`)
    // if (cached) return res.status(200).json(JSON.parse(cached))

    // Initialize OpenAI client
    const openaiApiKey = process.env.OPENAI_API_KEY
    if (!openaiApiKey) {
      console.error('OPENAI_API_KEY not configured')
      // DECISION: Fail safe - allow content if moderation unavailable
      // OR: Fail secure - reject content if moderation unavailable
      // Choose based on your security policy
      return res.status(200).json({
        flagged: false,
        message: 'Moderation temporarily unavailable',
        warning: 'Content not checked'
      })
    }

    const openai = new OpenAI({
      apiKey: openaiApiKey,
      timeout: 8000 // 8 second timeout to prevent hanging
    })

    // Call OpenAI Moderation API
    // IMPORTANT: This is a separate, faster API than GPT models
    const moderation = await openai.moderations.create({
      input: content
    })

    const result = moderation.results[0]

    // Analyze moderation results
    const flagged = result.flagged
    const categories = result.categories
    const categoryScores = result.category_scores

    // Get flagged categories with high confidence
    const flaggedCategories = Object.keys(categories)
      .filter(key => categories[key])
      .map(key => ({
        category: key,
        score: categoryScores[key]
      }))

    // TODO: Store moderation result in database for audit
    // await db.query(
    //   'INSERT INTO moderation_logs (user_id, content_type, flagged, categories, content_hash) VALUES (?, ?, ?, ?, ?)',
    //   [user.id, type, flagged, JSON.stringify(flaggedCategories), hash(content)]
    // )

    // TODO: Cache result to avoid re-moderating same content
    // await redis.setex(`moderation:${hash(content)}`, 3600, JSON.stringify(result))

    // If content is flagged, handle based on severity
    if (flagged) {
      // TODO: Implement progressive action based on severity
      // - Low severity: Allow with warning
      // - Medium severity: Flag for review
      // - High severity: Block immediately and notify admins

      // TODO: Notify user about flagged content
      // await sendNotification(user.id, {
      //   type: 'content_flagged',
      //   categories: flaggedCategories
      // })

      return res.status(200).json({
        flagged: true,
        message: 'Content flagged for review',
        categories: flaggedCategories,
        action: 'blocked' // or 'review', 'warning' based on policy
      })
    }

    // Content passed moderation
    return res.status(200).json({
      flagged: false,
      message: 'Content is safe'
    })

  } catch (error) {
    console.error('Moderation API error:', error)

    // Handle OpenAI-specific errors
    if (error.status === 429) {
      return res.status(429).json({
        message: 'Rate limit exceeded. Please try again later.'
      })
    }

    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      return res.status(504).json({
        message: 'Moderation service timeout'
      })
    }

    // For safety, you can choose to:
    // 1. Block content when moderation fails (fail secure)
    // 2. Allow content when moderation fails (fail safe)
    // Choose based on your risk tolerance

    return res.status(500).json({
      message: 'Moderation check failed',
      flagged: false, // Fail safe - allow content
      warning: 'Could not verify content safety',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    })
  }
}
