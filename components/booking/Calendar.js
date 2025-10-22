import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { formatDate, getDatesInMonth, isToday } from '../../lib/calendar'

export default function Calendar({ selectedDate, onDateSelect, minDate, disabledDates = [] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const monthDates = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    return getDatesInMonth(year, month)
  }, [currentMonth])

  // Get the first day of the month to calculate offset
  const firstDayOfMonth = useMemo(() => {
    return new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay()
  }, [currentMonth])

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const isDateDisabled = (date) => {
    const dateStr = formatDate(date)
    
    // Check if date is before minimum date
    if (minDate && date < new Date(minDate)) {
      return true
    }
    
    // Check if date is in disabled dates list
    if (disabledDates.includes(dateStr)) {
      return true
    }
    
    return false
  }

  const isDateSelected = (date) => {
    if (!selectedDate) return false
    return formatDate(date) === selectedDate
  }

  const handleDateClick = (date) => {
    if (!isDateDisabled(date)) {
      onDateSelect(formatDate(date))
    }
  }

  // Create array of day cells including empty cells for alignment
  const calendarCells = []
  
  // Add empty cells for days before the first of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarCells.push(<div key={`empty-${i}`} className="aspect-square" />)
  }
  
  // Add cells for each day of the month
  monthDates.forEach((date, index) => {
    const disabled = isDateDisabled(date)
    const selected = isDateSelected(date)
    const today = isToday(formatDate(date))
    
    calendarCells.push(
      <motion.button
        key={`date-${index}`}
        type="button"
        onClick={() => handleDateClick(date)}
        disabled={disabled}
        whileHover={!disabled ? { scale: 1.05 } : {}}
        whileTap={!disabled ? { scale: 0.95 } : {}}
        className={`
          aspect-square p-2 rounded-lg text-sm font-medium transition-colors
          ${disabled 
            ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' 
            : 'text-gray-900 dark:text-white hover:bg-pink-50 dark:hover:bg-pink-900/20 cursor-pointer'
          }
          ${selected 
            ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700' 
            : ''
          }
          ${today && !selected 
            ? 'ring-2 ring-pink-500 dark:ring-pink-400' 
            : ''
          }
        `}
      >
        {date.getDate()}
      </motion.button>
    )
  })

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={goToPreviousMonth}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {monthName}
        </h3>
        
        <button
          type="button"
          onClick={goToNextMonth}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Day Labels */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarCells}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded ring-2 ring-pink-500" />
            <span className="text-gray-600 dark:text-gray-400">Today</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gradient-to-r from-pink-500 to-purple-600" />
            <span className="text-gray-600 dark:text-gray-400">Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-200 dark:bg-gray-700" />
            <span className="text-gray-600 dark:text-gray-400">Unavailable</span>
          </div>
        </div>
      </div>
    </div>
  )
}
