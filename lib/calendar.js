/**
 * Calendar and Booking Management Utilities
 * 
 * Provides utilities for:
 * - Date and time manipulation
 * - Time slot generation and management
 * - Availability checking
 * - Booking conflict detection
 */

/**
 * Format a date to YYYY-MM-DD
 */
export function formatDate(date) {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Format time to HH:MM (24-hour format)
 */
export function formatTime(date) {
  const d = new Date(date)
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

/**
 * Parse date and time strings into a Date object
 */
export function parseDateTime(dateStr, timeStr) {
  return new Date(`${dateStr}T${timeStr}`)
}

/**
 * Check if a date is in the past
 */
export function isPastDate(dateStr, timeStr) {
  const date = parseDateTime(dateStr, timeStr)
  return date < new Date()
}

/**
 * Check if a date is today
 */
export function isToday(dateStr) {
  const today = formatDate(new Date())
  return dateStr === today
}

/**
 * Get array of dates for a month
 */
export function getDatesInMonth(year, month) {
  const dates = []
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  
  for (let date = 1; date <= lastDay.getDate(); date++) {
    dates.push(new Date(year, month, date))
  }
  
  return dates
}

/**
 * Get the start of week for a given date (Sunday)
 */
export function getStartOfWeek(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day
  return new Date(d.setDate(diff))
}

/**
 * Generate time slots for a given day
 * @param {string} startTime - Start time in HH:MM format (e.g., "09:00")
 * @param {string} endTime - End time in HH:MM format (e.g., "21:00")
 * @param {number} intervalMinutes - Interval between slots in minutes (default: 60)
 * @returns {Array} Array of time slot strings in HH:MM format
 */
export function generateTimeSlots(startTime = '09:00', endTime = '21:00', intervalMinutes = 60) {
  const slots = []
  const [startHour, startMin] = startTime.split(':').map(Number)
  const [endHour, endMin] = endTime.split(':').map(Number)
  
  let currentHour = startHour
  let currentMin = startMin
  
  while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
    const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`
    slots.push(timeStr)
    
    currentMin += intervalMinutes
    if (currentMin >= 60) {
      currentHour += Math.floor(currentMin / 60)
      currentMin = currentMin % 60
    }
  }
  
  return slots
}

/**
 * Check if two time ranges overlap
 * @param {string} start1 - Start time of first range (HH:MM)
 * @param {string} end1 - End time of first range (HH:MM)
 * @param {string} start2 - Start time of second range (HH:MM)
 * @param {string} end2 - End time of second range (HH:MM)
 * @returns {boolean} True if ranges overlap
 */
export function timeRangesOverlap(start1, end1, start2, end2) {
  const [h1, m1] = start1.split(':').map(Number)
  const [h2, m2] = end1.split(':').map(Number)
  const [h3, m3] = start2.split(':').map(Number)
  const [h4, m4] = end2.split(':').map(Number)
  
  const start1Min = h1 * 60 + m1
  const end1Min = h2 * 60 + m2
  const start2Min = h3 * 60 + m3
  const end2Min = h4 * 60 + m4
  
  return start1Min < end2Min && end1Min > start2Min
}

/**
 * Calculate end time from start time and duration
 * @param {string} startTime - Start time in HH:MM format
 * @param {number} durationHours - Duration in hours
 * @returns {string} End time in HH:MM format
 */
export function calculateEndTime(startTime, durationHours) {
  const [hours, minutes] = startTime.split(':').map(Number)
  const totalMinutes = hours * 60 + minutes + (durationHours * 60)
  const endHours = Math.floor(totalMinutes / 60) % 24
  const endMinutes = totalMinutes % 60
  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`
}

/**
 * Check if a booking conflicts with existing bookings
 * @param {Object} newBooking - New booking with date, time, duration
 * @param {Array} existingBookings - Array of existing bookings
 * @returns {boolean} True if there's a conflict
 */
export function hasBookingConflict(newBooking, existingBookings) {
  if (!existingBookings || existingBookings.length === 0) {
    return false
  }
  
  const newEndTime = calculateEndTime(newBooking.time, newBooking.duration)
  
  return existingBookings.some(booking => {
    // Only check bookings on the same date
    if (booking.date !== newBooking.date) {
      return false
    }
    
    // Skip cancelled bookings
    if (booking.status === 'cancelled' || booking.status === 'rejected') {
      return false
    }
    
    const existingEndTime = calculateEndTime(booking.time, booking.duration)
    return timeRangesOverlap(newBooking.time, newEndTime, booking.time, existingEndTime)
  })
}

/**
 * Get available time slots for a specific date
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {Array} existingBookings - Array of existing bookings for that date
 * @param {Object} availability - Companion's availability settings
 * @returns {Array} Array of available time slots
 */
export function getAvailableSlots(date, existingBookings = [], availability = {}) {
  const dayOfWeek = new Date(date).getDay()
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const dayName = dayNames[dayOfWeek]
  
  // Get availability for this day of week
  const dayAvailability = availability[dayName]
  
  if (!dayAvailability || !dayAvailability.enabled) {
    return []
  }
  
  // Generate all possible slots
  const allSlots = generateTimeSlots(
    dayAvailability.startTime || '09:00',
    dayAvailability.endTime || '21:00',
    60 // 1-hour slots
  )
  
  // Filter out slots that conflict with existing bookings
  return allSlots.filter(slot => {
    const testBooking = {
      date,
      time: slot,
      duration: 1 // Check with 1-hour duration
    }
    return !hasBookingConflict(testBooking, existingBookings)
  })
}

/**
 * Create default availability schedule (9 AM - 9 PM, Monday-Friday)
 */
export function getDefaultAvailability() {
  const defaultSchedule = {
    startTime: '09:00',
    endTime: '21:00',
    enabled: true
  }
  
  return {
    monday: { ...defaultSchedule },
    tuesday: { ...defaultSchedule },
    wednesday: { ...defaultSchedule },
    thursday: { ...defaultSchedule },
    friday: { ...defaultSchedule },
    saturday: { enabled: false, startTime: '09:00', endTime: '21:00' },
    sunday: { enabled: false, startTime: '09:00', endTime: '21:00' }
  }
}

/**
 * Validate booking data
 * @param {Object} booking - Booking object to validate
 * @returns {Object} { valid: boolean, errors: Array }
 */
export function validateBooking(booking) {
  const errors = []
  
  if (!booking.date) {
    errors.push('Date is required')
  }
  
  if (!booking.time) {
    errors.push('Time is required')
  }
  
  if (!booking.duration || booking.duration < 1) {
    errors.push('Duration must be at least 1 hour')
  }
  
  if (booking.date && booking.time && isPastDate(booking.date, booking.time)) {
    errors.push('Booking must be in the future')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Format booking time range for display
 * @param {string} time - Start time in HH:MM
 * @param {number} duration - Duration in hours
 * @returns {string} Formatted time range (e.g., "2:00 PM - 4:00 PM")
 */
export function formatTimeRange(time, duration) {
  const startDate = new Date(`2000-01-01T${time}`)
  const endTime = calculateEndTime(time, duration)
  const endDate = new Date(`2000-01-01T${endTime}`)
  
  const formatTimeStr = (date) => {
    let hours = date.getHours()
    const minutes = date.getMinutes()
    const ampm = hours >= 12 ? 'PM' : 'AM'
    hours = hours % 12 || 12
    const minuteStr = minutes > 0 ? `:${String(minutes).padStart(2, '0')}` : ''
    return `${hours}${minuteStr} ${ampm}`
  }
  
  return `${formatTimeStr(startDate)} - ${formatTimeStr(endDate)}`
}

/**
 * Format date for display
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @returns {string} Formatted date (e.g., "Monday, January 15, 2024")
 */
export function formatDisplayDate(dateStr) {
  const date = new Date(dateStr)
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  return date.toLocaleDateString('en-US', options)
}
