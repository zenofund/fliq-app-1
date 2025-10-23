import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Search, Star, Calendar, Clock, MessageCircle, Loader } from 'lucide-react'
import Link from 'next/link'
import BookingModal from '../../components/booking/BookingModal'
import CompanionFilters from '../../components/ui/CompanionFilters'

export default function ClientDashboard() {
  const [activeBookings, setActiveBookings] = useState([])
  const [nearbyCompanions, setNearbyCompanions] = useState([])
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  const [selectedCompanion, setSelectedCompanion] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({})
  const [isSearching, setIsSearching] = useState(false)
  const [pagination, setPagination] = useState({})

  useEffect(() => {
    // TODO: Fetch user data and active bookings
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

    // Fetch companions on initial load
    fetchCompanions()
  }, [])

  const fetchCompanions = async (search = '', filterParams = {}) => {
    setIsSearching(true)
    try {
      // Build query string
      const params = new URLSearchParams({
        query: search,
        ...filterParams
      })

      const response = await fetch(`/api/companions/search?${params}`)
      const data = await response.json()

      if (response.ok) {
        setNearbyCompanions(data.companions || [])
        setPagination(data.pagination || {})
      } else {
        console.error('Failed to fetch companions:', data.message)
      }
    } catch (error) {
      console.error('Error fetching companions:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    fetchCompanions(searchQuery, filters)
  }

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)
    fetchCompanions(searchQuery, newFilters)
  }

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
            <form onSubmit={handleSearch} className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search companions by name, interests, or specialties..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
              <CompanionFilters onFilterChange={handleFilterChange} initialFilters={filters} />
              <button 
                type="submit"
                disabled={isSearching}
                className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </form>
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
                        {/* Chat button only available for accepted/confirmed bookings */}
                        {['accepted', 'confirmed'].includes(booking.status) ? (
                          <Link href={`/client/messages?booking=${booking.id}`} className="flex-1">
                            <button className="w-full px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors">
                              <MessageCircle className="w-4 h-4 inline mr-2" />
                              Chat
                            </button>
                          </Link>
                        ) : booking.status === 'pending' ? (
                          <button 
                            disabled
                            className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg cursor-not-allowed"
                            title="Chat will be available once companion accepts"
                          >
                            <MessageCircle className="w-4 h-4 inline mr-2" />
                            Chat (Pending)
                          </button>
                        ) : (
                          <button 
                            disabled
                            className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg cursor-not-allowed"
                            title="Chat is not available for this booking"
                          >
                            <MessageCircle className="w-4 h-4 inline mr-2" />
                            Chat (Unavailable)
                          </button>
                        )}
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
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {searchQuery || Object.keys(filters).some(k => filters[k]) ? 'Search Results' : 'Nearby Companions'}
                </h2>
                {pagination.total && (
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {pagination.total} companion{pagination.total !== 1 ? 's' : ''} found
                  </span>
                )}
              </div>
              {isSearching ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
                  <Loader className="w-8 h-8 mx-auto text-pink-500 animate-spin mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">Searching for companions...</p>
                </div>
              ) : nearbyCompanions.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {nearbyCompanions.map((companion) => (
                    <div key={companion.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow">
                      <div className="h-48 bg-gradient-to-br from-pink-200 to-purple-200 dark:from-pink-900 dark:to-purple-900"></div>
                      <div className="p-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          {companion.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                          {companion.bio}
                        </p>
                        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                          <div className="flex items-center">
                            <Star className="w-4 h-4 text-yellow-400 mr-1 fill-yellow-400" />
                            {companion.rating} ({companion.reviews} reviews)
                          </div>
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {companion.distance}
                          </div>
                        </div>
                        {companion.specialties && companion.specialties.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {companion.specialties.slice(0, 2).map((specialty, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-400 text-xs rounded-full"
                              >
                                {specialty}
                              </span>
                            ))}
                            {companion.specialties.length > 2 && (
                              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                                +{companion.specialties.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-lg font-bold text-gray-900 dark:text-white">
                              ${companion.hourlyRate}
                            </span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">/hour</span>
                          </div>
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
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
                  <Search className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    {searchQuery || Object.keys(filters).some(k => filters[k]) 
                      ? 'No companions found matching your criteria. Try adjusting your filters.'
                      : 'No companions available at the moment.'}
                  </p>
                </div>
              )}
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
