/**
 * Registration Endpoint - Serverless Function
 * Converts Express session to JWT authentication
 */

import bcrypt from 'bcryptjs';
import { storage } from '../../lib/storage';
import { createToken } from '../../lib/auth';

export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Validate HTTP method
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password, role, fullName, phone } = req.body;

    // Check if user exists
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await storage.createUser({
      email,
      password: hashedPassword,
      role: role || 'client',
      isVerified: false,
    });

    // Create profile based on role
    if (role === 'companion') {
      await storage.createCompanion({
        userId: user.id,
        fullName: fullName || '',
        dateOfBirth: new Date(),
        bio: '',
        city: '',
        languages: [],
        interests: [],
        hourlyRate: '0',
        availability: 'available',
        isAvailable: true,
        profilePhoto: null,
        galleryPhotos: [],
        rating: '0',
        totalBookings: 0,
        isPhotoApproved: false,
      });
    } else {
      await storage.createClient({
        userId: user.id,
        fullName: fullName || '',
        phone: phone || null,
      });
    }

    // Create JWT token
    const token = createToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Return token + user data
    return res.status(201).json({
      message: 'Registration successful',
      token,
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Registration failed' });
  }
}