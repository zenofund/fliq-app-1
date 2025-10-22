/**
 * Companion Availability API Route
 * 
 * GET /api/bookings/availability?companionId=xxx&date=YYYY-MM-DD
 * - Fetch availability schedule and existing bookings for a date
 * 
 * POST /api/bookings/availability
 * - Update companion's availability schedule
 */

import { getDefaultAvailability } from '../../../lib/calendar'

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    // Authenticate user
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' })
    }

    // TODO: Verify JWT token
    const user = { id: 'user123', role: 'client' } // Placeholder

    switch (req.method) {
      case 'GET':
        return await handleGetAvailability(req, res, user)
      
      case 'POST':
        return await handleUpdateAvailability(req, res, user)
      
      default:
        return res.status(405).json({ message: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Availability API error:', error)
    return res.status(500).json({ 
      message: 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    })
  }
}

/**
 * GET - Fetch companion's availability and bookings for a specific date
 */
async function handleGetAvailability(req, res, user) {
  try {
    const { companionId, date } = req.query

    if (!companionId) {
      return res.status(400).json({ 
        message: 'companionId is required' 
      })
    }

    // TODO: Fetch companion's availability from database
    // const availability = await db.query(
    //   'SELECT * FROM companion_availability WHERE companion_id = ?',
    //   [companionId]
    // )

    // Use default availability as placeholder
    const availability = getDefaultAvailability()

    // TODO: Fetch existing bookings for the companion on this date
    // If date is provided, filter bookings for that specific date
    // const existingBookings = await db.query(
    //   'SELECT * FROM bookings WHERE companion_id = ? AND date = ? AND status NOT IN (?, ?)',
    //   [companionId, date, 'cancelled', 'rejected']
    // )

    // Placeholder data
    const existingBookings = date ? [
      // Example: A booking from 2:00 PM - 4:00 PM
      // {
      //   id: 1,
      //   date: date,
      //   time: '14:00',
      //   duration: 2,
      //   status: 'confirmed'
      // }
    ] : []

    return res.status(200).json({
      companionId,
      availability,
      existingBookings,
      date: date || null
    })
  } catch (error) {
    console.error('Error fetching availability:', error)
    throw error
  }
}

/**
 * POST - Update companion's availability schedule
 */
async function handleUpdateAvailability(req, res, user) {
  try {
    const { availability } = req.body

    if (!availability) {
      return res.status(400).json({ 
        message: 'Availability schedule is required' 
      })
    }

    // Validate that user is a companion
    if (user.role !== 'companion') {
      return res.status(403).json({ 
        message: 'Only companions can update availability' 
      })
    }

    // Validate availability structure
    const requiredDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    const isValid = requiredDays.every(day => {
      const daySchedule = availability[day]
      return daySchedule && 
             typeof daySchedule.enabled === 'boolean' &&
             typeof daySchedule.startTime === 'string' &&
             typeof daySchedule.endTime === 'string'
    })

    if (!isValid) {
      return res.status(400).json({ 
        message: 'Invalid availability format' 
      })
    }

    // TODO: Save availability to database
    // await db.query(
    //   'INSERT INTO companion_availability (companion_id, schedule, updated_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE schedule = ?, updated_at = ?',
    //   [user.id, JSON.stringify(availability), new Date(), JSON.stringify(availability), new Date()]
    // )

    return res.status(200).json({
      message: 'Availability updated successfully',
      availability
    })
  } catch (error) {
    console.error('Error updating availability:', error)
    throw error
  }
}
