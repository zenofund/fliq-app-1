import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Filter, X, Star, DollarSign, MapPin, Globe, Briefcase } from 'lucide-react'

export default function CompanionFilters({ onFilterChange, initialFilters = {} }) {
  const [isOpen, setIsOpen] = useState(false)
  const [filters, setFilters] = useState({
    minRating: initialFilters.minRating || 0,
    maxPrice: initialFilters.maxPrice || 200,
    minPrice: initialFilters.minPrice || 0,
    availability: initialFilters.availability || '',
    specialties: initialFilters.specialties || '',
    languages: initialFilters.languages || ''
  })

  const handleFilterChange = (key, value) => {
    const newFilters = {
      ...filters,
      [key]: value
    }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const clearFilters = () => {
    const resetFilters = {
      minRating: 0,
      maxPrice: 200,
      minPrice: 0,
      availability: '',
      specialties: '',
      languages: ''
    }
    setFilters(resetFilters)
    onFilterChange(resetFilters)
  }

  const activeFilterCount = Object.values(filters).filter(value => {
    if (typeof value === 'number') return value !== 0 && value !== 200
    return value !== ''
  }).length

  return (
    <div className="relative">
      {/* Filter Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        <span className="text-gray-700 dark:text-gray-300">Filters</span>
        {activeFilterCount > 0 && (
          <span className="px-2 py-0.5 bg-pink-500 text-white text-xs font-semibold rounded-full">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Filter Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50"
          >
            <div className="p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Filters
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={clearFilters}
                    className="text-sm text-pink-600 hover:text-pink-700 dark:text-pink-400"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {/* Rating Filter */}
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Star className="w-4 h-4 mr-2 text-yellow-400" />
                    Minimum Rating
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      min="0"
                      max="5"
                      step="0.5"
                      value={filters.minRating}
                      onChange={(e) => handleFilterChange('minRating', parseFloat(e.target.value))}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    />
                    <span className="text-sm font-semibold text-gray-900 dark:text-white w-8">
                      {filters.minRating}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>Any</span>
                    <span>5.0</span>
                  </div>
                </div>

                {/* Price Range Filter */}
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <DollarSign className="w-4 h-4 mr-2 text-green-400" />
                    Price Range (per hour)
                  </label>
                  <div className="space-y-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="range"
                          min="0"
                          max="200"
                          step="5"
                          value={filters.minPrice}
                          onChange={(e) => handleFilterChange('minPrice', parseInt(e.target.value))}
                          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                        />
                        <span className="text-sm font-semibold text-gray-900 dark:text-white w-12">
                          ${filters.minPrice}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Min</div>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="range"
                          min="0"
                          max="200"
                          step="5"
                          value={filters.maxPrice}
                          onChange={(e) => handleFilterChange('maxPrice', parseInt(e.target.value))}
                          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                        />
                        <span className="text-sm font-semibold text-gray-900 dark:text-white w-12">
                          ${filters.maxPrice}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Max</div>
                    </div>
                  </div>
                </div>

                {/* Availability Filter */}
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <MapPin className="w-4 h-4 mr-2 text-blue-400" />
                    Availability
                  </label>
                  <select
                    value={filters.availability}
                    onChange={(e) => handleFilterChange('availability', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="">All</option>
                    <option value="available">Available Now</option>
                    <option value="busy">Busy</option>
                  </select>
                </div>

                {/* Specialties Filter */}
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Briefcase className="w-4 h-4 mr-2 text-purple-400" />
                    Specialties
                  </label>
                  <input
                    type="text"
                    value={filters.specialties}
                    onChange={(e) => handleFilterChange('specialties', e.target.value)}
                    placeholder="e.g., Fine Dining, Theater"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>

                {/* Languages Filter */}
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Globe className="w-4 h-4 mr-2 text-cyan-400" />
                    Languages
                  </label>
                  <input
                    type="text"
                    value={filters.languages}
                    onChange={(e) => handleFilterChange('languages', e.target.value)}
                    placeholder="e.g., English, Spanish"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </div>

              {/* Apply Button */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-shadow"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
