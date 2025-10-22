import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Search, Star, Calendar, Clock, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import BookingModal from '../../components/booking/BookingModal'

export default function ClientDashboard() {
  const [activeBookings, setActiveBookings] = useState([])
  const [nearbyCompanions, setNearbyCompanions] = useState([])
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  const [selectedCompanion, setSelectedCompanion] = useState(null)

  useEffect(() => {
    // TODO: Fetch user data, active bookings, and nearby companions
    // Placeholder data
    setActiveBookings([
      {
        id: 1,
        companion: 'Sarah Johnson',
        date: '2024-01-15',
        time: '19:00',
        status: 'confirmed',
        location: 'Downtown Restaurant'
      }
    ])

    setNearbyCompanions([
      {
        id: 1,
        name: 'Emma Wilson',
        rating: 4.9,
        distance: '0.5 km',
        hourlyRate: 50,
        image: '/placeholder.jpg'
      },
      {
        id: 2,
        name: 'Sophie Anderson',
        rating: 4.8,
        distance: '1.2 km',
        hourlyRate: 45,
        image: '/placeholder.jpg'
      }
    ])
  }, [])

  const handleBookNow = (companion) => {
    setSelectedCompanion(companion)
    setIsBookingModalOpen(true)
  }

  const handleCloseBookingModal = () => {
    setIsBookingModalOpen(false)
    setSelectedCompanion(null)
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
              <Link href="/client/bookings" className="text-gray-700 dark:text-gray-300 hover:text-pink-600">
                My Bookings
              </Link>
              <Link href="/client/messages" className="text-gray-700 dark:text-gray-300 hover:text-pink-600">
                Messages
              </Link>
              <Link href="/client/profile" className="text-gray-700 dark:text-gray-300 hover:text-pink-600">
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
            Welcome back, Client!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Find and book companions nearby
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search companions..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
              <button className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-shadow">
                Search
              </button>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Active Bookings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Active Bookings
              </h2>
              {activeBookings.length > 0 ? (
                <div className="space-y-4">
                  {activeBookings.map((booking) => (
                    <div key={booking.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {booking.companion}
                          </h3>
                          <div className="mt-2 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-2" />
                              {booking.date}
                            </div>
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-2" />
                              {booking.time}
                            </div>
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 mr-2" />
                              {booking.location}
                            </div>
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-sm font-medium rounded-full">
                          {booking.status}
                        </span>
                      </div>
                      <div className="mt-4 flex space-x-3">
                        <button className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors">
                          <MessageCircle className="w-4 h-4 inline mr-2" />
                          Chat
                        </button>
                        <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
                  <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No active bookings</p>
                </div>
              )}
            </motion.div>

            {/* Nearby Companions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Nearby Companions
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {nearbyCompanions.map((companion) => (
                  <div key={companion.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow">
                    <div className="h-48 bg-gradient-to-br from-pink-200 to-purple-200 dark:from-pink-900 dark:to-purple-900"></div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {companion.name}
                      </h3>
                      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-3">
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-400 mr-1" />
                          {companion.rating}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {companion.distance}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          ${companion.hourlyRate}/hour
                        </span>
                        <button 
                          onClick={() => handleBookNow(companion)}
                          className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg text-sm hover:shadow-lg transition-shadow"
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Quick Stats
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Bookings</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">24</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Favorite Companions</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">5</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Spent</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">$1,200</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={handleCloseBookingModal}
        companion={selectedCompanion}
      />
    </div>
  )
}
