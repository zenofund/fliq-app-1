import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MapPin, DollarSign } from 'lucide-react'
import Calendar from './Calendar'
import TimeSlotPicker from './TimeSlotPicker'
import { formatDate, getAvailableSlots, hasBookingConflict, validateBooking } from '../../lib/calendar'

export default function BookingModal({ isOpen, onClose, companion }) {
  const [step, setStep] = useState(1) // 1: Date, 2: Time, 3: Details
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    duration: '1',
    location: '',
    notes: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [availableSlots, setAvailableSlots] = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  // Fetch available slots when date changes
  useEffect(() => {
    if (formData.date && companion?.id) {
      setLoadingSlots(true)
      
      // Fetch companion's availability and existing bookings
      fetch(`/api/bookings/availability?companionId=${companion.id}&date=${formData.date}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
        .then(res => res.json())
        .then(data => {
          const slots = getAvailableSlots(
            formData.date,
            data.existingBookings || [],
            data.availability || {}
          )
          setAvailableSlots(slots)
        })
        .catch(error => {
          console.error('Error fetching availability:', error)
          setAvailableSlots([])
        })
        .finally(() => {
          setLoadingSlots(false)
        })
    } else {
      setAvailableSlots([])
    }
  }, [formData.date, companion?.id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validate booking data
      const validation = validateBooking(formData)
      if (!validation.valid) {
        throw new Error(validation.errors.join(', '))
      }

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          companionId: companion?.id,
          ...formData,
          duration: parseInt(formData.duration)
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Booking failed')
      }

      // Success - redirect to booking confirmation or close modal
      alert('Booking request sent successfully!')
      onClose()
      // Reset form
      setFormData({
        date: '',
        time: '',
        duration: '1',
        location: '',
        notes: ''
      })
      setStep(1)
    } catch (error) {
      alert(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleDateSelect = (date) => {
    setFormData({
      ...formData,
      date,
      time: '' // Reset time when date changes
    })
    setStep(2) // Move to time selection
  }

  const handleTimeSelect = (time) => {
    setFormData({
      ...formData,
      time
    })
    setStep(3) // Move to details
  }

  const calculatePrice = () => {
    const hourlyRate = companion?.hourlyRate || 50
    return hourlyRate * parseInt(formData.duration || 1)
  }

  const canProceedToNextStep = () => {
    if (step === 1) return formData.date !== ''
    if (step === 2) return formData.time !== ''
    if (step === 3) return formData.location !== ''
    return true
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gray-500 dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-75 transition-opacity"
              onClick={onClose}
            />

            {/* Modal */}
            <span className="hidden sm:inline-block sm:h-screen sm:align-middle">&#8203;</span>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Book {companion?.name || 'Companion'}
                </h3>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Progress Indicator */}
              <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className={`flex items-center gap-2 ${step >= 1 ? 'text-pink-500' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${step >= 1 ? 'bg-pink-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                      1
                    </div>
                    <span className="text-sm font-medium hidden sm:inline">Date</span>
                  </div>
                  <div className={`flex-1 h-0.5 mx-2 ${step >= 2 ? 'bg-pink-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
                  <div className={`flex items-center gap-2 ${step >= 2 ? 'text-pink-500' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${step >= 2 ? 'bg-pink-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                      2
                    </div>
                    <span className="text-sm font-medium hidden sm:inline">Time</span>
                  </div>
                  <div className={`flex-1 h-0.5 mx-2 ${step >= 3 ? 'bg-pink-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
                  <div className={`flex items-center gap-2 ${step >= 3 ? 'text-pink-500' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${step >= 3 ? 'bg-pink-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                      3
                    </div>
                    <span className="text-sm font-medium hidden sm:inline">Details</span>
                  </div>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="px-6 py-4">
                <div className="space-y-4">
                  {/* Step 1: Date Selection */}
                  {step === 1 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <Calendar
                        selectedDate={formData.date}
                        onDateSelect={handleDateSelect}
                        minDate={formatDate(new Date())}
                      />
                    </motion.div>
                  )}

                  {/* Step 2: Time Selection */}
                  {step === 2 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      {/* Duration Selection */}
                      <div>
                        <label htmlFor="duration" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Duration (hours)
                        </label>
                        <select
                          id="duration"
                          name="duration"
                          value={formData.duration}
                          onChange={handleChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                        >
                          <option value="1">1 hour</option>
                          <option value="2">2 hours</option>
                          <option value="3">3 hours</option>
                          <option value="4">4 hours</option>
                          <option value="6">6 hours</option>
                          <option value="8">8 hours</option>
                        </select>
                      </div>

                      <TimeSlotPicker
                        selectedTime={formData.time}
                        onTimeSelect={handleTimeSelect}
                        availableSlots={availableSlots}
                        duration={parseInt(formData.duration)}
                        isLoading={loadingSlots}
                      />
                    </motion.div>
                  )}

                  {/* Step 3: Details */}
                  {step === 3 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      {/* Booking Summary */}
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Booking Summary</h4>
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Date:</span>
                            <span className="text-gray-900 dark:text-white font-medium">{formData.date}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Time:</span>
                            <span className="text-gray-900 dark:text-white font-medium">{formData.time}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                            <span className="text-gray-900 dark:text-white font-medium">{formData.duration} hour(s)</span>
                          </div>
                        </div>
                      </div>

                      {/* Location */}
                      <div>
                        <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          <MapPin className="w-4 h-4 inline mr-2" />
                          Meeting Location
                        </label>
                        <input
                          type="text"
                          id="location"
                          name="location"
                          value={formData.location}
                          onChange={handleChange}
                          required
                          placeholder="e.g., Downtown Restaurant"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                        />
                      </div>

                      {/* Notes */}
                      <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Additional Notes (Optional)
                        </label>
                        <textarea
                          id="notes"
                          name="notes"
                          value={formData.notes}
                          onChange={handleChange}
                          rows="3"
                          placeholder="Any special requests or information..."
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                        />
                      </div>

                      {/* Price Summary */}
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-gray-700 dark:text-gray-300">
                            <DollarSign className="w-5 h-5 mr-2" />
                            <span className="font-medium">Total Price</span>
                          </div>
                          <span className="text-2xl font-bold text-gray-900 dark:text-white">
                            ${calculatePrice()}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Payment will be processed securely via Paystack
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-6 flex space-x-3">
                  {step > 1 && (
                    <button
                      type="button"
                      onClick={() => setStep(step - 1)}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Back
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  {step < 3 ? (
                    <button
                      type="button"
                      onClick={() => setStep(step + 1)}
                      disabled={!canProceedToNextStep()}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Processing...' : 'Confirm Booking'}
                    </button>
                  )}
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}
