import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, DollarSign, Star, TrendingUp, CheckCircle, Circle, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import RatingPopup from '../../components/booking/RatingPopup'

export default function CompanionDashboard() {
  const [onboardingProgress, setOnboardingProgress] = useState(60)
  const [bookingRequests, setBookingRequests] = useState([])
  const [acceptedBookings, setAcceptedBookings] = useState([])
  const [completedBookings, setCompletedBookings] = useState([])
  const [stats, setStats] = useState({
    totalEarnings: 0,
    upcomingBookings: 0,
    rating: 0,
    completedBookings: 0
  })
  const [isUpdating, setIsUpdating] = useState(null)
  const [selectedBookingForReview, setSelectedBookingForReview] = useState(null)
  const [isRatingPopupOpen, setIsRatingPopupOpen] = useState(false)

  useEffect(() => {
    // TODO: Fetch user data, booking requests, and stats
    // Placeholder data
    setBookingRequests([
      {
        id: 1,
        client: 'John Smith',
        date: '2024-01-20',
        time: '18:00',
        duration: '2 hours',
        location: 'City Center',
        price: '$100',
        status: 'pending'
      }
    ])

    setAcceptedBookings([
      {
        id: 2,
        client: 'Jane Doe',
        date: '2024-01-22',
        time: '19:00',
        duration: '3 hours',
        location: 'Downtown Restaurant',
        price: '$150',
        status: 'accepted'
      }
    ])

    setCompletedBookings([
      {
        id: 3,
        client: 'Alice Johnson',
        clientName: 'Alice Johnson',
        otherPartyName: 'Alice Johnson',
        date: '2024-01-10',
        time: '18:00',
        duration: '2 hours',
        location: 'Art Gallery',
        price: '$100',
        status: 'completed',
        hasReviewed: false
      }
    ])

    setStats({
      totalEarnings: 2450,
      upcomingBookings: 3,
      rating: 4.8,
      completedBookings: 42
    })
  }, [])

  const handleBookingAction = async (bookingId, action) => {
    setIsUpdating(bookingId)
    
    try {
      const response = await fetch('/api/bookings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          bookingId,
          action
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to update booking')
      }

      const data = await response.json()
      
      // Update UI based on action
      if (action === 'accept') {
        // Move from requests to accepted bookings
        const booking = bookingRequests.find(b => b.id === bookingId)
        if (booking) {
          setBookingRequests(prev => prev.filter(b => b.id !== bookingId))
          setAcceptedBookings(prev => [...prev, { ...booking, status: 'accepted' }])
        }
        alert('Booking accepted! You can now chat with the client.')
      } else if (action === 'reject') {
        setBookingRequests(prev => prev.filter(b => b.id !== bookingId))
        alert('Booking rejected.')
      } else if (action === 'complete') {
        setAcceptedBookings(prev => prev.filter(b => b.id !== bookingId))
        // Add to completed bookings for review
        const booking = acceptedBookings.find(b => b.id === bookingId)
        if (booking) {
          setCompletedBookings(prev => [...prev, { 
            ...booking, 
            status: 'completed',
            hasReviewed: false,
            clientName: booking.client,
            otherPartyName: booking.client
          }])
        }
        alert('Booking completed! Please leave a review for your client.')
      }
    } catch (error) {
      console.error('Error updating booking:', error)
      alert(`Failed to ${action} booking: ${error.message}`)
    } finally {
      setIsUpdating(null)
    }
  }

  const handleOpenReviewPopup = (booking) => {
    setSelectedBookingForReview(booking)
    setIsRatingPopupOpen(true)
  }

  const handleCloseReviewPopup = () => {
    setIsRatingPopupOpen(false)
    setSelectedBookingForReview(null)
    // Mark booking as reviewed
    if (selectedBookingForReview) {
      setCompletedBookings(prev => 
        prev.map(b => b.id === selectedBookingForReview.id ? { ...b, hasReviewed: true } : b)
      )
    }
  }

  const onboardingSteps = [
    { id: 1, title: 'Complete Profile', completed: true },
    { id: 2, title: 'Upload Photos', completed: true },
    { id: 3, title: 'Verify Identity', completed: true },
    { id: 4, title: 'Set Availability', completed: false },
    { id: 5, title: 'Complete Training', completed: false }
  ]

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
              <Link href="/companion/bookings" className="text-gray-700 dark:text-gray-300 hover:text-pink-600">
                My Bookings
              </Link>
              <Link href="/companion/earnings" className="text-gray-700 dark:text-gray-300 hover:text-pink-600">
                Earnings
              </Link>
              <Link href="/companion/profile" className="text-gray-700 dark:text-gray-300 hover:text-pink-600">
                Profile
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, Companion!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your bookings and grow your business
          </p>
        </motion.div>

        {/* Onboarding Progress Bar */}
        {onboardingProgress < 100 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg shadow-lg p-6 text-white"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold mb-1">Complete Your Profile</h3>
                <p className="text-pink-100 text-sm">
                  Finish setting up your profile to start receiving bookings
                </p>
              </div>
              <div className="text-3xl font-bold">{onboardingProgress}%</div>
            </div>
            
            <div className="mb-4">
              <div className="w-full bg-white/30 rounded-full h-3 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${onboardingProgress}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="h-full bg-white rounded-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-4">
              {onboardingSteps.map((step) => (
                <div
                  key={step.id}
                  className={`flex items-center space-x-2 text-sm ${
                    step.completed ? 'text-white' : 'text-pink-200'
                  }`}
                >
                  {step.completed ? (
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 flex-shrink-0" />
                  )}
                  <span>{step.title}</span>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <Link href="/companion/availability">
                <button className="px-6 py-2 bg-white text-pink-600 font-semibold rounded-lg hover:bg-pink-50 transition-colors">
                  Continue Setup
                </button>
              </Link>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Earnings</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      ${stats.totalEarnings}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                    <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Upcoming</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.upcomingBookings}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                    <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Rating</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.rating}/5.0
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                    <Star className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Completed</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.completedBookings}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                    <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Booking Requests */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                New Booking Requests
              </h2>
              {bookingRequests.length > 0 ? (
                <div className="space-y-4">
                  {bookingRequests.map((request) => (
                    <div key={request.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {request.client}
                          </h3>
                          <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                            <div>📅 {request.date} at {request.time}</div>
                            <div>⏱️ Duration: {request.duration}</div>
                            <div>📍 {request.location}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {request.price}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-3">
                        <button 
                          onClick={() => handleBookingAction(request.id, 'accept')}
                          disabled={isUpdating === request.id}
                          className="flex-1 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isUpdating === request.id ? 'Accepting...' : 'Accept'}
                        </button>
                        <button 
                          onClick={() => handleBookingAction(request.id, 'reject')}
                          disabled={isUpdating === request.id}
                          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
                  <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No new booking requests</p>
                </div>
              )}
            </motion.div>

            {/* Completed Bookings - Pending Reviews */}
            {completedBookings.filter(b => !b.hasReviewed).length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mb-8"
              >
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Leave a Review
                </h2>
                <div className="space-y-4">
                  {completedBookings.filter(b => !b.hasReviewed).map((booking) => (
                    <div key={booking.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {booking.client || booking.clientName}
                            </h3>
                            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-xs rounded-full">
                              Completed
                            </span>
                          </div>
                          <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                            <div>📅 {booking.date} at {booking.time}</div>
                            <div>📍 {booking.location}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleOpenReviewPopup(booking)}
                          className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-shadow flex items-center"
                        >
                          <Star className="w-4 h-4 mr-2" />
                          Leave Review
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Accepted Bookings - Chat Available */}
            {acceptedBookings.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Accepted Bookings
                </h2>
                <div className="space-y-4">
                  {acceptedBookings.map((booking) => (
                    <div key={booking.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {booking.client}
                          </h3>
                          <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                            <div>📅 {booking.date} at {booking.time}</div>
                            <div>⏱️ Duration: {booking.duration}</div>
                            <div>📍 {booking.location}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {booking.price}
                          </div>
                          <span className="inline-block mt-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-xs rounded-full">
                            Accepted
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-3">
                        <Link href={`/companion/messages?booking=${booking.id}`} className="flex-1">
                          <button className="w-full px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors">
                            💬 Chat with Client
                          </button>
                        </Link>
                        <button 
                          onClick={() => handleBookingAction(booking.id, 'complete')}
                          disabled={isUpdating === booking.id}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isUpdating === booking.id ? 'Completing...' : 'Mark Complete'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <Link href="/companion/availability">
                  <button className="w-full px-4 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-shadow text-left">
                    Set Availability
                  </button>
                </Link>
                <Link href="/companion/profile">
                  <button className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left">
                    Update Profile
                  </button>
                </Link>
                <button className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left">
                  View Analytics
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-lg shadow-md p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Pro Tip
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Companions with complete profiles and verified photos receive 3x more booking requests!
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Rating Popup */}
      <RatingPopup 
        isOpen={isRatingPopupOpen}
        onClose={handleCloseReviewPopup}
        booking={selectedBookingForReview}
      />
    </div>
  )
}
