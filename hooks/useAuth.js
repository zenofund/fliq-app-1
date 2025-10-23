/**
 * useAuth Hook
 * Custom hook for authentication state management
 */

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const router = useRouter()

  // Check if user is authenticated on mount
  useEffect(() => {
    checkAuth()
  }, [])

  /**
   * Check authentication status
   */
  const checkAuth = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      if (!token) {
        setUser(null)
        setLoading(false)
        return
      }

      // Verify token with backend
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Invalid token')
      }
      
      const data = await response.json()
      setUser(data.user)
      
    } catch (err) {
      console.error('Auth check error:', err)
      setError(err.message)
      setUser(null)
      localStorage.removeItem('token')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Login user
   */
  const login = useCallback(async (email, password) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Login failed')
      }

      // Store token
      localStorage.setItem('token', data.token)
      setUser(data.user)

      // Redirect based on role
      const dashboardPath = data.user.role === 'companion' 
        ? '/companion/dashboard' 
        : '/client/dashboard'
      router.push(dashboardPath)

      return { success: true }
    } catch (err) {
      console.error('Login error:', err)
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [router])

  /**
   * Register user
   */
  const register = useCallback(async (userData) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed')
      }

      // Store token
      localStorage.setItem('token', data.token)
      setUser(data.user)

      // Redirect based on role
      const dashboardPath = data.user.role === 'companion' 
        ? '/companion/dashboard' 
        : '/client/dashboard'
      router.push(dashboardPath)

      return { success: true }
    } catch (err) {
      console.error('Registration error:', err)
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [router])

  /**
   * Logout user
   */
  const logout = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      
      // Call logout endpoint
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      }
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      // Always clear local state and redirect, even if API call fails
      localStorage.removeItem('token')
      setUser(null)
      router.push('/')
    }
  }, [router])

  /**
   * Update user profile
   */
  const updateProfile = useCallback(async (updates) => {
    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem('token')
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Update failed')
      }

      setUser(data.user)
      return { success: true }
    } catch (err) {
      console.error('Profile update error:', err)
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Require authentication
   * Redirect to login if not authenticated
   */
  const requireAuth = useCallback((redirectTo = '/login') => {
    if (!loading && !user) {
      router.push(redirectTo)
    }
  }, [user, loading, router])

  /**
   * Require specific role
   */
  const requireRole = useCallback((role, redirectTo = '/') => {
    if (!loading && (!user || user.role !== role)) {
      router.push(redirectTo)
    }
  }, [user, loading, router])

  return {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    requireAuth,
    requireRole,
    isAuthenticated: !!user
  }
}
