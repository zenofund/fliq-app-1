import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Send, Paperclip, Smile, MoreVertical, Phone, Video } from 'lucide-react'
import { getPusherClient } from '../../lib/pusher'

export default function ChatUI({ bookingId, otherPartyName, currentUserRole }) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const messagesEndRef = useRef(null)
  const pusherRef = useRef(null)
  const channelRef = useRef(null)

  // Fetch messages from API
  useEffect(() => {
    if (!bookingId) return

    const fetchMessages = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        const response = await fetch(`/api/chat/messages?bookingId=${bookingId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || 'Failed to fetch messages')
        }

        const data = await response.json()
        setMessages(data.messages.map(msg => ({
          id: msg.id,
          sender: msg.senderRole === currentUserRole ? 'me' : 'other',
          text: msg.text,
          timestamp: new Date(msg.createdAt).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit' 
          })
        })))
      } catch (error) {
        console.error('Error fetching messages:', error)
        setError(error.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMessages()
  }, [bookingId, currentUserRole])

  // Subscribe to real-time updates via Pusher
  useEffect(() => {
    if (!bookingId) return

    const setupPusher = async () => {
      try {
        const pusher = getPusherClient()
        if (!pusher) return

        pusherRef.current = pusher

        // Set up auth endpoint
        pusher.config.auth = {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }

        // Subscribe to private conversation channel
        const channel = pusher.subscribe(`private-conversation-${bookingId}`)
        channelRef.current = channel

        // Listen for new messages
        channel.bind('new-message', (data) => {
          // Only add message if it's from the other party
          if (data.sender !== currentUserRole) {
            const newMsg = {
              id: data.id,
              sender: 'other',
              text: data.text,
              timestamp: new Date(data.createdAt).toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit' 
              })
            }
            setMessages(prev => [...prev, newMsg])
          }
        })
      } catch (error) {
        console.error('Error setting up Pusher:', error)
      }
    }

    setupPusher()

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        channelRef.current.unbind_all()
        channelRef.current.unsubscribe()
      }
    }
  }, [bookingId, currentUserRole])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !bookingId) return

    const message = {
      id: Date.now(),
      sender: 'me',
      text: newMessage,
      timestamp: new Date().toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit' 
      })
    }

    // Optimistically add message to UI
    setMessages([...messages, message])
    setNewMessage('')

    try {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          bookingId,
          text: message.text
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to send message')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== message.id))
      setError(error.message)
      // Re-add the text so user can try again
      setNewMessage(message.text)
    }
  }

  if (!bookingId) {
    return (
      <div className="flex items-center justify-center h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <p className="text-gray-500 dark:text-gray-400">Select a conversation to start chatting</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      {/* Error Banner */}
      {error && (
        <div className="px-6 py-3 bg-red-100 dark:bg-red-900/30 border-b border-red-200 dark:border-red-800">
          <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
        </div>
      )}
      
      {/* Chat Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
            {otherPartyName?.charAt(0) || 'U'}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {otherPartyName || 'User'}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {isTyping ? 'Typing...' : 'Online'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <Phone className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <Video className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 dark:text-gray-400">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message, index) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-xs lg:max-w-md ${message.sender === 'me' ? 'order-2' : 'order-1'}`}>
              <div
                className={`px-4 py-2 rounded-2xl ${
                  message.sender === 'me'
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                }`}
              >
                <p className="text-sm break-words">{message.text}</p>
              </div>
              <p className={`text-xs text-gray-500 dark:text-gray-400 mt-1 ${
                message.sender === 'me' ? 'text-right' : 'text-left'
              }`}>
                {message.timestamp}
              </p>
            </div>
          </motion.div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <button
            type="button"
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <button
            type="button"
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Smile className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="p-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>

        {/* AI Moderation Notice */}
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
          Messages are monitored by AI for safety and compliance
        </p>
      </div>
    </div>
  )
}
