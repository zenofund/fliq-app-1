import { motion } from 'framer-motion'
import { Clock, AlertCircle } from 'lucide-react'
import { formatTimeRange } from '../../lib/calendar'

export default function TimeSlotPicker({ 
  selectedTime, 
  onTimeSelect, 
  availableSlots = [], 
  duration = 1,
  isLoading = false 
}) {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-center space-x-2 text-gray-500 dark:text-gray-400">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-pink-500" />
          <span>Loading available times...</span>
        </div>
      </div>
    )
  }

  if (availableSlots.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
        <div className="flex flex-col items-center justify-center space-y-2 text-gray-500 dark:text-gray-400">
          <AlertCircle className="w-8 h-8" />
          <p className="text-center">No available time slots for this date</p>
          <p className="text-xs text-center">Please select a different date</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Select Time
        </h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
        {availableSlots.map((slot) => {
          const isSelected = selectedTime === slot
          const timeRange = formatTimeRange(slot, duration)
          
          return (
            <motion.button
              key={slot}
              type="button"
              onClick={() => onTimeSelect(slot)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`
                p-3 rounded-lg text-sm font-medium transition-colors
                ${isSelected
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                  : 'bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-pink-50 dark:hover:bg-pink-900/20'
                }
              `}
            >
              <div className="font-semibold">{slot}</div>
              <div className={`text-xs mt-1 ${isSelected ? 'text-pink-100' : 'text-gray-500 dark:text-gray-400'}`}>
                {timeRange}
              </div>
            </motion.button>
          )
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {availableSlots.length} time slot{availableSlots.length !== 1 ? 's' : ''} available
        </p>
      </div>
    </div>
  )
}
