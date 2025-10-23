import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Star, User, Calendar } from 'lucide-react'

export default function ReviewsList({ userId, userRole = 'companion' }) {
  const [reviews, setReviews] = useState([])
  const [stats, setStats] = useState({ averageRating: 0, totalReviews: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)

  const fetchReviews = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/reviews?userId=${userId}&page=${page}&limit=10`)
      const data = await response.json()

      if (response.ok) {
        setReviews(data.reviews || [])
        setStats(data.stats || { averageRating: 0, totalReviews: 0 })
        setPagination(data.pagination)
      } else {
        console.error('Failed to fetch reviews:', data.message)
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setIsLoading(false)
    }
  }, [userId, page])

  useEffect(() => {
    if (userId) {
      fetchReviews()
    }
  }, [userId, page, fetchReviews])

  const renderStars = (rating) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        ))}
      </div>
    )
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {userRole === 'companion' ? 'Companion' : 'Client'} Rating
            </h3>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Star className="w-8 h-8 fill-yellow-400 text-yellow-400" />
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.averageRating.toFixed(1)}
                </span>
              </div>
              <span className="text-gray-600 dark:text-gray-400">
                ({stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'})
              </span>
            </div>
          </div>
          <div className="hidden sm:block">
            {renderStars(Math.round(stats.averageRating))}
          </div>
        </div>
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="text-center py-12">
          <Star className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            No reviews yet. Complete bookings to start building your reputation!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {review.reviewerName}
                    </p>
                    <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(review.createdAt)}</span>
                    </div>
                  </div>
                </div>
                {renderStars(review.rating)}
              </div>
              
              {review.reviewText && (
                <p className="text-gray-700 dark:text-gray-300 mt-3">
                  {review.reviewText}
                </p>
              )}

              {review.bookingDate && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Booking Date: {formatDate(review.bookingDate)}
                  </p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center items-center space-x-4 pt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-gray-600 dark:text-gray-400">
            Page {page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
