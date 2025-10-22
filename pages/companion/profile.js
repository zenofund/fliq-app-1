import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Phone, MapPin, Calendar, Camera, Save, ArrowLeft, DollarSign, Globe, Award, Clock, CheckCircle, Image as ImageIcon } from 'lucide-react'
import Link from 'next/link'

export default function CompanionProfile() {
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [error, setError] = useState('')
  
  const [profileData, setProfileData] = useState({
    // Basic Information
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    location: '',
    address: '',
    
    // Professional Information
    bio: '',
    experience: '',
    specialties: '',
    languages: '',
    hourlyRate: '',
    
    // Verification & Status
    verificationStatus: 'pending',
    availabilityStatus: 'available',
    
    // Gallery (placeholder for image URLs)
    profilePhoto: '',
    galleryPhotos: []
  })

  useEffect(() => {
    // TODO: Fetch companion profile data from API
    // Placeholder data
    setProfileData({
      name: 'Emma Wilson',
      email: 'emma.wilson@example.com',
      phone: '+1 (555) 234-5678',
      dateOfBirth: '1995-08-20',
      location: 'New York, NY',
      address: '456 Broadway, Suite 12',
      bio: 'Professional companion with 3 years of experience. Passionate about creating memorable experiences and providing excellent company for various occasions.',
      experience: '3 years',
      specialties: 'Fine Dining, Cultural Events, Business Functions, Travel Companion',
      languages: 'English (Native), Spanish (Fluent), French (Conversational)',
      hourlyRate: '50',
      verificationStatus: 'verified',
      availabilityStatus: 'available',
      profilePhoto: '',
      galleryPhotos: []
    })
  }, [])

  const handleChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccessMessage('')

    try {
      // TODO: Implement actual API call to update profile
      const response = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(profileData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile')
      }

      setSuccessMessage('Profile updated successfully!')
      setIsEditing(false)
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const getVerificationBadge = () => {
    if (profileData.verificationStatus === 'verified') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
          <CheckCircle className="w-4 h-4 mr-1" />
          Verified
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400">
        <Clock className="w-4 h-4 mr-1" />
        Pending Verification
      </span>
    )
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
              <Link href="/companion/bookings" className="text-gray-700 dark:text-gray-300 hover:text-pink-600">
                My Bookings
              </Link>
              <Link href="/companion/earnings" className="text-gray-700 dark:text-gray-300 hover:text-pink-600">
                Earnings
              </Link>
              <Link href="/companion/profile" className="text-pink-600 font-semibold">
                Profile
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          href="/companion/dashboard"
          className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-pink-600 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                My Profile
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage your professional profile and showcase your services
              </p>
            </div>
            {getVerificationBadge()}
          </div>
        </motion.div>

        {/* Messages */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400"
          >
            {successMessage}
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400"
          >
            {error}
          </motion.div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 px-6 py-8">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center">
                  <User className="w-12 h-12 text-gray-400" />
                </div>
                <button className="absolute bottom-0 right-0 p-2 bg-white dark:bg-gray-700 rounded-full shadow-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                  <Camera className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </button>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-1">{profileData.name}</h2>
                <p className="text-pink-100">{profileData.email}</p>
                <div className="mt-2 flex items-center space-x-4 text-sm text-pink-100">
                  <span className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {profileData.location}
                  </span>
                  <span className="flex items-center">
                    <DollarSign className="w-4 h-4 mr-1" />
                    ${profileData.hourlyRate}/hour
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-6 py-2 bg-white text-pink-600 font-semibold rounded-lg hover:bg-pink-50 transition-colors"
              >
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-8">
              {/* Personal Information Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={profileData.name}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={profileData.email}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={profileData.phone}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Date of Birth
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="date"
                        id="dateOfBirth"
                        name="dateOfBirth"
                        value={profileData.dateOfBirth}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      City, State
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MapPin className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="location"
                        name="location"
                        value={profileData.location}
                        onChange={handleChange}
                        disabled={!isEditing}
                        placeholder="e.g., New York, NY"
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Street Address
                    </label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={profileData.address}
                      onChange={handleChange}
                      disabled={!isEditing}
                      placeholder="e.g., 123 Main Street"
                      className="block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500"
                    />
                  </div>
                </div>
              </div>

              {/* Professional Information Section */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Award className="w-5 h-5 mr-2" />
                  Professional Information
                </h3>
                <div className="space-y-6">
                  <div>
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Professional Bio
                    </label>
                    <textarea
                      id="bio"
                      name="bio"
                      value={profileData.bio}
                      onChange={handleChange}
                      disabled={!isEditing}
                      rows={4}
                      placeholder="Describe your experience and what makes you unique..."
                      className="block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500 resize-none"
                    />
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      This will be visible to clients when they view your profile.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="experience" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Years of Experience
                      </label>
                      <input
                        type="text"
                        id="experience"
                        name="experience"
                        value={profileData.experience}
                        onChange={handleChange}
                        disabled={!isEditing}
                        placeholder="e.g., 3 years"
                        className="block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Hourly Rate ($)
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <DollarSign className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="number"
                          id="hourlyRate"
                          name="hourlyRate"
                          value={profileData.hourlyRate}
                          onChange={handleChange}
                          disabled={!isEditing}
                          min="0"
                          placeholder="50"
                          className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="specialties" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Specialties & Services
                    </label>
                    <input
                      type="text"
                      id="specialties"
                      name="specialties"
                      value={profileData.specialties}
                      onChange={handleChange}
                      disabled={!isEditing}
                      placeholder="e.g., Fine Dining, Cultural Events, Business Functions"
                      className="block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500"
                    />
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Separate multiple specialties with commas.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="languages" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Globe className="w-4 h-4 inline mr-1" />
                      Languages Spoken
                    </label>
                    <input
                      type="text"
                      id="languages"
                      name="languages"
                      value={profileData.languages}
                      onChange={handleChange}
                      disabled={!isEditing}
                      placeholder="e.g., English (Native), Spanish (Fluent), French (Conversational)"
                      className="block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500"
                    />
                  </div>
                </div>
              </div>

              {/* Photo Gallery Section */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <ImageIcon className="w-5 h-5 mr-2" />
                  Photo Gallery
                </h3>
                <div className="bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                  <ImageIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    Add professional photos to showcase your profile
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                    Upload up to 6 high-quality photos (JPG, PNG)
                  </p>
                  <button
                    type="button"
                    disabled={!isEditing}
                    className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Upload Photos
                  </button>
                  <p className="mt-4 text-xs text-gray-500 dark:text-gray-500">
                    Photos are subject to verification and must comply with our guidelines.
                  </p>
                </div>
              </div>

              {/* Availability Status */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Availability Status
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <input
                      type="radio"
                      id="available"
                      name="availabilityStatus"
                      value="available"
                      checked={profileData.availabilityStatus === 'available'}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="mt-1 h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 disabled:opacity-50"
                    />
                    <div className="ml-3">
                      <label htmlFor="available" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Available
                      </label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Accept new booking requests
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <input
                      type="radio"
                      id="busy"
                      name="availabilityStatus"
                      value="busy"
                      checked={profileData.availabilityStatus === 'busy'}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="mt-1 h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 disabled:opacity-50"
                    />
                    <div className="ml-3">
                      <label htmlFor="busy" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Busy
                      </label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Temporarily unavailable for new bookings
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <input
                      type="radio"
                      id="offline"
                      name="availabilityStatus"
                      value="offline"
                      checked={profileData.availabilityStatus === 'offline'}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="mt-1 h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 disabled:opacity-50"
                    />
                    <div className="ml-3">
                      <label htmlFor="offline" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Offline
                      </label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Profile hidden from search results
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              {isEditing && (
                <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Profile Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-lg shadow-md p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Profile Tips
          </h3>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start">
              <CheckCircle className="w-5 h-5 text-pink-500 mr-2 flex-shrink-0 mt-0.5" />
              <span>Complete profiles with verified photos receive 3x more booking requests</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="w-5 h-5 text-pink-500 mr-2 flex-shrink-0 mt-0.5" />
              <span>A detailed bio helps clients understand your personality and style</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="w-5 h-5 text-pink-500 mr-2 flex-shrink-0 mt-0.5" />
              <span>Keep your availability status updated to maximize booking opportunities</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="w-5 h-5 text-pink-500 mr-2 flex-shrink-0 mt-0.5" />
              <span>Professional photos should be high-quality and reflect your personality</span>
            </li>
          </ul>
        </motion.div>
      </div>
    </div>
  )
}
