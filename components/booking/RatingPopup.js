import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Star } from 'lucide-react'

export default function RatingPopup({ isOpen, onClose, booking }) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [review, setReview] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch(`/api/bookings/${booking?.id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          rating,
          review
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Rating submission failed')
      }

      alert('Thank you for your feedback!')
      onClose()
    } catch (error) {
      alert(error.message)
    } finally {
      setIsLoading(false)
    }
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
                  Rate Your Experience
                </h3>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="px-6 py-6">
                <div className="space-y-6">
                  {/* Companion/Client Info */}
                  <div className="text-center">
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                      How was your experience with
                    </p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {booking?.otherPartyName || booking?.companionName || 'the other party'}?
                    </p>
                  </div>

                  {/* Star Rating */}
                  <div className="flex justify-center items-center space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                        className="focus:outline-none transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-10 h-10 ${
                            star <= (hoveredRating || rating)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300 dark:text-gray-600'
                          }`}
                        />
                      </button>
                    ))}
                  </div>

                  {/* Rating Text */}
                  {rating > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center"
                    >
                      <p className="text-lg font-medium text-gray-900 dark:text-white">
                        {rating === 5 && '⭐ Excellent!'}
                        {rating === 4 && '😊 Great!'}
                        {rating === 3 && '👍 Good'}
                        {rating === 2 && '😐 Fair'}
                        {rating === 1 && '😞 Poor'}
                      </p>
                    </motion.div>
                  )}

                  {/* Review Text */}
                  <div>
                    <label htmlFor="review" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Write a Review (Optional)
                    </label>
                    <textarea
                      id="review"
                      name="review"
                      value={review}
                      onChange={(e) => setReview(e.target.value)}
                      rows="4"
                      placeholder="Share your experience to help others make informed decisions..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {review.length}/500 characters
                    </p>
                  </div>

                  {/* Privacy Note */}
                  <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <p className="text-xs text-blue-700 dark:text-blue-400">
                      Your review will be public and help maintain service quality. Please be honest and respectful.
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex space-x-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Skip
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || rating === 0}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Submitting...' : 'Submit Rating'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}
