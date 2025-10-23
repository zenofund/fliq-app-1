import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Heart, Star, MapPin, Search, Loader, Trash2 } from 'lucide-react'
import Link from 'next/link'
import BookingModal from '../../components/booking/BookingModal'

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  const [selectedCompanion, setSelectedCompanion] = useState(null)

  useEffect(() => {
    fetchFavorites()
  }, [])

  const fetchFavorites = async () => {
    setIsLoading(true)
    try {
      // TODO: Add actual authentication token
      const token = 'mock-token'
      const response = await fetch('/api/favorites', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()

      if (response.ok) {
        setFavorites(data.favorites || [])
      } else {
        console.error('Failed to fetch favorites:', data.message)
      }
    } catch (error) {
      console.error('Error fetching favorites:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveFavorite = async (companionId) => {
    try {
      // TODO: Add actual authentication token
      const token = 'mock-token'
      const response = await fetch(`/api/favorites?companionId=${companionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()

      if (response.ok) {
        // Remove from local state
        setFavorites(prev => prev.filter(fav => fav.id !== companionId))
      } else {
        console.error('Failed to remove favorite:', data.message)
        alert('Failed to remove from favorites')
      }
    } catch (error) {
      console.error('Error removing favorite:', error)
      alert('Failed to remove from favorites')
    }
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
              <Link href="/client/dashboard" className="text-gray-700 dark:text-gray-300 hover:text-pink-600">
                Dashboard
              </Link>
              <Link href="/client/bookings" className="text-gray-700 dark:text-gray-300 hover:text-pink-600">
                My Bookings
              </Link>
              <Link href="/client/messages" className="text-gray-700 dark:text-gray-300 hover:text-pink-600">
                Messages
              </Link>
              <Link href="/client/favorites" className="text-pink-600 dark:text-pink-500 font-semibold">
                Favorites
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center">
                <Heart className="w-8 h-8 mr-3 text-pink-500 fill-pink-500" />
                My Favorite Companions
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Quick access to your preferred companions
              </p>
            </div>
            {favorites.length > 0 && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {favorites.length} favorite{favorites.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </motion.div>

        {isLoading ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
            <Loader className="w-8 h-8 mx-auto text-pink-500 animate-spin mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading your favorites...</p>
          </div>
        ) : favorites.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {favorites.map((companion, index) => (
              <motion.div
                key={companion.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow relative"
              >
                {/* Remove button */}
                <button
                  onClick={() => handleRemoveFavorite(companion.id)}
                  className="absolute top-3 right-3 z-10 p-2 bg-white dark:bg-gray-700 rounded-full shadow-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors group"
                  title="Remove from favorites"
                >
                  <Trash2 className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-500" />
                </button>

                <div className="h-48 bg-gradient-to-br from-pink-200 to-purple-200 dark:from-pink-900 dark:to-purple-900"></div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {companion.name}
                    </h3>
                    <Heart className="w-5 h-5 text-pink-500 fill-pink-500 flex-shrink-0" />
                  </div>
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
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center"
          >
            <Heart className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No favorites yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Start adding companions to your favorites to easily find and book them later.
            </p>
            <Link href="/client/dashboard">
              <button className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-shadow inline-flex items-center">
                <Search className="w-5 h-5 mr-2" />
                Browse Companions
              </button>
            </Link>
          </motion.div>
        )}
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
