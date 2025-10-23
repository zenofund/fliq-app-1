import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MessageCircle, Calendar, MapPin } from 'lucide-react'
import Link from 'next/link'
import ChatUI from '../../components/chat/ChatUI'

export default function ClientMessages() {
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchConversations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchConversations = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/chat/conversations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to fetch conversations')
      }

      const data = await response.json()
      setConversations(data.conversations || [])
      
      // Auto-select first conversation if available
      if (data.conversations && data.conversations.length > 0 && !selectedConversation) {
        setSelectedConversation(data.conversations[0])
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
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
              <Link href="/client/messages" className="text-pink-600 dark:text-pink-500 font-semibold">
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
          className="mb-6"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Messages
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Chat with your companions about booking details
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-280px)]">
          {/* Conversations List */}
          <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h2 className="font-semibold text-gray-900 dark:text-white">Conversations</h2>
            </div>
            <div className="overflow-y-auto h-[calc(100%-60px)]">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
                </div>
              ) : error ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-red-600 dark:text-red-400 mb-2">{error}</p>
                  <button 
                    onClick={fetchConversations}
                    className="text-sm text-pink-600 hover:text-pink-700"
                  >
                    Try Again
                  </button>
                </div>
              ) : conversations.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <MessageCircle className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    No conversations yet. Messages will appear here once a companion accepts your booking.
                  </p>
                </div>
              ) : (
                conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation)}
                    className={`w-full px-4 py-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left ${
                      selectedConversation?.id === conversation.id ? 'bg-pink-50 dark:bg-pink-900/20' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {conversation.otherPartyName}
                      </h3>
                      {conversation.unreadCount > 0 && (
                        <span className="px-2 py-0.5 bg-pink-600 text-white text-xs rounded-full">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                    {conversation.lastMessage && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate mb-2">
                        {conversation.lastMessage}
                      </p>
                    )}
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-500 space-x-2">
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {conversation.date}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        {conversation.location}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2">
            {selectedConversation ? (
              <ChatUI 
                bookingId={selectedConversation.bookingId}
                otherPartyName={selectedConversation.otherPartyName}
                currentUserRole="client"
              />
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md h-full flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Select a conversation to start chatting
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
