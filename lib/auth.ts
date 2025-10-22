/**
 * JWT Authentication Library for Serverless Functions
 * Converts Express session-based auth to JWT token-based auth
 */

interface AuthUser {
  userId: string;
  email: string;
  role: string;
}

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

const SECRET_KEY = process.env.JWT_SECRET || 'fliq-secret-key-change-in-production';

/**
 * Create JWT token with user data
 * @param userData - User data to encode in token
 * @returns JWT token string
 */
export const createToken = (userData: AuthUser): string => {
  // JWT library will be imported at runtime from login/register
  const jwt = require('jsonwebtoken');
  return jwt.sign(userData, SECRET_KEY, { expiresIn: '7d' });
};

/**
 * Verify and decode JWT token
 * @param token - JWT token string
 * @returns Decoded token payload or null if invalid
 */
export const verifyToken = (token: string): AuthUser | null => {
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, SECRET_KEY) as JWTPayload;
    return {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };
  } catch (error) {
    return null;
  }
};

/**
 * Serverless authentication middleware
 * Verifies JWT token from Authorization header
 * @param req - Request object
 * @param res - Response object
 * @returns AuthUser if valid, null if unauthorized (response already sent)
 */
export const requireAuth = async (req: any, res: any): Promise<AuthUser | null> => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Unauthorized' });
    return null;
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    res.status(401).json({ message: 'Invalid or expired token' });
    return null;
  }

  return decoded;
};

/**
 * Serverless admin authentication middleware
 * Verifies JWT token and checks for admin role
 * @param req - Request object
 * @param res - Response object
 * @returns AuthUser if valid admin, null if unauthorized (response already sent)
 */
export const requireAdmin = async (req: any, res: any): Promise<AuthUser | null> => {
  const authUser = await requireAuth(req, res);
  
  if (!authUser) {
    return null; // requireAuth already sent 401 response
  }

  if (authUser.role !== 'admin') {
    res.status(403).json({ message: 'Forbidden - Admin access required' });
    return null;
  }

  return authUser;
};
