import jwt from 'jsonwebtoken';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'client' | 'companion' | 'admin';
}

/**
 * Creates a JWT token for authenticated users
 * Token expires in 7 days
 */
export function createToken(user: JWTPayload): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Verifies and decodes a JWT token
 * Returns null if token is invalid or expired
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Middleware to require authentication for an endpoint
 * Returns the user payload if authenticated, null otherwise
 * Automatically sends 401 response if not authenticated
 */
export async function requireAuth(
  req: VercelRequest,
  res: VercelResponse
): Promise<JWTPayload | null> {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    res.status(401).json({ message: 'Unauthorized' });
    return null;
  }

  const payload = verifyToken(token);
  
  if (!payload) {
    res.status(401).json({ message: 'Invalid token' });
    return null;
  }

  return payload;
}

/**
 * Middleware to require admin authentication for an endpoint
 * Returns the admin user payload if authenticated and admin, null otherwise
 * Automatically sends 401/403 response if not authenticated or not admin
 */
export async function requireAdmin(
  req: VercelRequest,
  res: VercelResponse
): Promise<JWTPayload | null> {
  const user = await requireAuth(req, res);
  
  if (!user) return null;
  
  if (user.role !== 'admin') {
    res.status(403).json({ message: 'Forbidden' });
    return null;
  }

  return user;
}

/**
 * Middleware to require companion authentication for an endpoint
 * Returns the companion user payload if authenticated and companion, null otherwise
 * Automatically sends 401/403 response if not authenticated or not companion
 */
export async function requireCompanion(
  req: VercelRequest,
  res: VercelResponse
): Promise<JWTPayload | null> {
  const user = await requireAuth(req, res);
  
  if (!user) return null;
  
  if (user.role !== 'companion') {
    res.status(403).json({ message: 'Forbidden - Companion access required' });
    return null;
  }

  return user;
}

/**
 * Middleware to require client authentication for an endpoint
 * Returns the client user payload if authenticated and client, null otherwise
 * Automatically sends 401/403 response if not authenticated or not client
 */
export async function requireClient(
  req: VercelRequest,
  res: VercelResponse
): Promise<JWTPayload | null> {
  const user = await requireAuth(req, res);
  
  if (!user) return null;
  
  if (user.role !== 'client') {
    res.status(403).json({ message: 'Forbidden - Client access required' });
    return null;
  }

  return user;
}
