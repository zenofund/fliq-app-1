import { useState } from 'react'
import { motion } from 'framer-motion'
import { Clock, Save, X } from 'lucide-react'
import { getDefaultAvailability } from '../../lib/calendar'

export default function AvailabilityManager({ 
  initialAvailability, 
  onSave, 
  onCancel,
  isLoading = false 
}) {
  const [availability, setAvailability] = useState(
    initialAvailability || getDefaultAvailability()
  )
  const [hasChanges, setHasChanges] = useState(false)

  const days = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' }
  ]

  const handleToggleDay = (dayKey) => {
    setAvailability({
      ...availability,
      [dayKey]: {
        ...availability[dayKey],
        enabled: !availability[dayKey].enabled
      }
    })
    setHasChanges(true)
  }

  const handleTimeChange = (dayKey, field, value) => {
    setAvailability({
      ...availability,
      [dayKey]: {
        ...availability[dayKey],
        [field]: value
      }
    })
    setHasChanges(true)
  }

  const handleSave = () => {
    onSave(availability)
    setHasChanges(false)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-pink-500" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Availability Schedule
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Set your weekly availability for bookings
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Days Schedule */}
      <div className="p-6 space-y-4">
        {days.map((day) => {
          const daySchedule = availability[day.key]
          
          return (
            <motion.div
              key={day.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
            >
              {/* Day Toggle */}
              <div className="flex items-center gap-3 sm:w-40">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={daySchedule.enabled}
                    onChange={() => handleToggleDay(day.key)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 dark:peer-focus:ring-pink-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-gradient-to-r peer-checked:from-pink-500 peer-checked:to-purple-600" />
                </label>
                <span className={`font-medium ${daySchedule.enabled ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                  {day.label}
                </span>
              </div>

              {/* Time Inputs */}
              {daySchedule.enabled ? (
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={daySchedule.startTime}
                      onChange={(e) => handleTimeChange(day.key, 'startTime', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                  <span className="text-gray-400 dark:text-gray-500 mt-5">to</span>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={daySchedule.endTime}
                      onChange={(e) => handleTimeChange(day.key, 'endTime', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex-1 text-sm text-gray-400 dark:text-gray-500 italic">
                  Unavailable
                </div>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Actions */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={!hasChanges || isLoading}
          className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {isLoading ? 'Saving...' : 'Save Schedule'}
        </button>
      </div>
    </div>
  )
}
