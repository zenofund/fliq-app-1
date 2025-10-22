import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { storage } from '../../lib/storage';
import { createToken } from '../../lib/auth';
import { handleCors, validateMethod, generateId, isValidEmail, handleError } from '../../lib/utils';

/**
 * POST /api/auth/register
 * Registers a new user (client or companion)
 * 
 * Body:
 * - email: string (required)
 * - password: string (required, min 6 characters)
 * - role: 'client' | 'companion' (required)
 * - name: string (required)
 * - phone?: string (optional, for clients)
 * - bio?: string (optional, for companions)
 * - age?: number (optional, for companions)
 * - location?: string (optional, for companions)
 * - hourlyRate?: number (optional, for companions)
 * - category?: string (optional, for companions)
 * 
 * Returns:
 * - 201: { message, token, user }
 * - 400: { message } - Invalid input
 * - 409: { message } - Email already exists
 * - 500: { message } - Server error
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  if (handleCors(req, res)) return;

  // Validate method
  if (!validateMethod(req, res, 'POST')) return;

  try {
    const { email, password, role, name, phone, bio, age, location, hourlyRate, category } = req.body;

    // Validate required fields
    if (!email || !password || !role || !name) {
      return res.status(400).json({ message: 'Email, password, role, and name are required' });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Validate role
    if (!['client', 'companion'].includes(role)) {
      return res.status(400).json({ message: 'Role must be either client or companion' });
    }

    // Check if user already exists
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userId = generateId('user');
    const user = await storage.createUser({
      id: userId,
      email,
      password: hashedPassword,
      role,
      verified: false,
      suspended: false,
    });

    // Create role-specific profile
    if (role === 'companion') {
      const companionId = generateId('companion');
      await storage.createCompanion({
        id: companionId,
        userId: user.id,
        name,
        bio: bio || null,
        age: age || null,
        location: location || null,
        hourlyRate: hourlyRate ? hourlyRate.toString() : null,
        category: category || null,
        availability: 'available',
        verified: false,
        featured: false,
      });
    } else if (role === 'client') {
      const clientId = generateId('client');
      await storage.createClient({
        id: clientId,
        userId: user.id,
        name,
        phone: phone || null,
      });
    }

    // Create JWT token
    const token = createToken({
      userId: user.id,
      email: user.email,
      role: user.role as 'client' | 'companion' | 'admin',
    });

    return res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    handleError(res, error, 'Registration');
  }
}
