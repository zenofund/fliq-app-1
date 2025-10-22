import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Calendar } from 'lucide-react'
import Link from 'next/link'
import AvailabilityManager from '../../components/booking/AvailabilityManager'
import { getDefaultAvailability } from '../../lib/calendar'

export default function CompanionAvailability() {
  const [availability, setAvailability] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    // Fetch current availability
    fetchAvailability()
  }, [])

  const fetchAvailability = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/bookings/availability', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch availability')
      }

      setAvailability(data.availability || getDefaultAvailability())
    } catch (err) {
      console.error('Error fetching availability:', err)
      setError(err.message)
      // Use default availability if fetch fails
      setAvailability(getDefaultAvailability())
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async (newAvailability) => {
    try {
      setIsSaving(true)
      setError('')
      setSuccessMessage('')

      const response = await fetch('/api/bookings/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ availability: newAvailability })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update availability')
      }

      setAvailability(newAvailability)
      setSuccessMessage('Availability updated successfully!')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
              fliQ
            </Link>
            <nav className="flex items-center space-x-6">
              <Link href="/companion/dashboard" className="text-gray-700 dark:text-gray-300 hover:text-pink-600">
                Dashboard
              </Link>
              <Link href="/companion/bookings" className="text-gray-700 dark:text-gray-300 hover:text-pink-600">
                My Bookings
              </Link>
              <Link href="/companion/profile" className="text-gray-700 dark:text-gray-300 hover:text-pink-600">
                Profile
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          href="/companion/dashboard"
          className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>

        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-8 h-8 text-pink-500" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Manage Availability
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Set your weekly schedule to let clients know when you&apos;re available for bookings
          </p>
        </motion.div>

        {/* Success/Error Messages */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 px-4 py-3 rounded-lg"
          >
            {successMessage}
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg"
          >
            {error}
          </motion.div>
        )}

        {/* Availability Manager */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {isLoading ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Loading your availability...</p>
            </div>
          ) : (
            <AvailabilityManager
              initialAvailability={availability}
              onSave={handleSave}
              isLoading={isSaving}
            />
          )}
        </motion.div>

        {/* Help Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6"
        >
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
            How Availability Works
          </h3>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Toggle each day on or off to indicate which days you&apos;re available</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Set your preferred working hours for each day you&apos;re available</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Clients will only be able to book slots during your available hours</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>You can update your availability at any time</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Already confirmed bookings will not be affected by availability changes</span>
            </li>
          </ul>
        </motion.div>
      </div>
    </div>
  )
}
