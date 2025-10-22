/**
 * OpenAI Helper Library
 * Utility functions for OpenAI API integration
 */

import OpenAI from 'openai'

// Initialize OpenAI client
let openaiClient = null

function getOpenAIClient() {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 10000
    })
  }
  return openaiClient
}

/**
 * Moderate content using OpenAI Moderation API
 * @param {string} content - Content to moderate
 * @returns {Promise<Object>} - Moderation result
 */
export async function moderateContent(content) {
  try {
    const openai = getOpenAIClient()
    
    const moderation = await openai.moderations.create({
      input: content
    })

    const result = moderation.results[0]
    
    return {
      flagged: result.flagged,
      categories: result.categories,
      categoryScores: result.category_scores
    }
  } catch (error) {
    console.error('OpenAI moderation error:', error)
    throw new Error('Failed to moderate content')
  }
}

/**
 * Generate chat completion
 * @param {Array} messages - Array of message objects
 * @param {Object} options - Additional options
 * @returns {Promise<string>} - Generated response
 */
export async function generateChatCompletion(messages, options = {}) {
  try {
    const openai = getOpenAIClient()
    
    const completion = await openai.chat.completions.create({
      model: options.model || 'gpt-3.5-turbo',
      messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 500
    })

    return completion.choices[0].message.content
  } catch (error) {
    console.error('OpenAI chat completion error:', error)
    throw new Error('Failed to generate response')
  }
}

/**
 * Analyze sentiment of text
 * @param {string} text - Text to analyze
 * @returns {Promise<Object>} - Sentiment analysis result
 */
export async function analyzeSentiment(text) {
  try {
    const response = await generateChatCompletion([
      {
        role: 'system',
        content: 'You are a sentiment analyzer. Analyze the sentiment of the given text and respond with ONLY one word: positive, negative, or neutral.'
      },
      {
        role: 'user',
        content: text
      }
    ])

    return {
      sentiment: response.toLowerCase().trim()
    }
  } catch (error) {
    console.error('Sentiment analysis error:', error)
    throw new Error('Failed to analyze sentiment')
  }
}

/**
 * Check if text contains inappropriate content
 * @param {string} text - Text to check
 * @returns {Promise<boolean>} - True if content is safe
 */
export async function isSafeContent(text) {
  try {
    const result = await moderateContent(text)
    return !result.flagged
  } catch (error) {
    console.error('Content safety check error:', error)
    // Fail safe - allow content if check fails
    // Change based on your security policy
    return true
  }
}
