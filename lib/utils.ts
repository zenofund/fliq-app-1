import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { CORS_HEADERS } from './constants';

/**
 * Sets CORS headers on a response
 * Call this at the beginning of every API route handler
 */
export function setCorsHeaders(res: VercelResponse) {
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
}

/**
 * Handles CORS preflight requests
 * Returns true if the request was handled (OPTIONS), false otherwise
 */
export function handleCors(req: VercelRequest, res: VercelResponse): boolean {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  
  return false;
}

/**
 * Validates that the request method matches expected method(s)
 * Automatically sends 405 response if method doesn't match
 */
export function validateMethod(
  req: VercelRequest,
  res: VercelResponse,
  allowedMethods: string | string[]
): boolean {
  const methods = Array.isArray(allowedMethods) ? allowedMethods : [allowedMethods];
  
  if (!req.method || !methods.includes(req.method)) {
    res.status(405).json({ message: 'Method not allowed' });
    return false;
  }
  
  return true;
}

/**
 * Generates a unique ID with a prefix using cryptographically secure random values
 */
export function generateId(prefix: string): string {
  const timestamp = Date.now();
  const randomBytes = crypto.getRandomValues(new Uint8Array(9));
  const randomString = Array.from(randomBytes, (byte) => byte.toString(36)).join('').substr(0, 9);
  return `${prefix}_${timestamp}_${randomString}`;
}

/**
 * Calculates booking expiration time
 */
export function getBookingExpiration(minutes: number = 30): Date {
  const expiration = new Date();
  expiration.setMinutes(expiration.getMinutes() + minutes);
  return expiration;
}

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates phone number format (Nigerian format)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^(\+234|0)[789]\d{9}$/;
  return phoneRegex.test(phone);
}

/**
 * Sanitizes user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .trim();
}

/**
 * Formats currency in Nigerian Naira
 */
export function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
  }).format(num);
}

/**
 * Error handler for API routes
 * Logs error and sends appropriate response
 */
export function handleError(res: VercelResponse, error: any, context: string) {
  console.error(`${context} error:`, error);
  
  const message = error?.message || 'An unexpected error occurred';
  const statusCode = error?.statusCode || 500;
  
  res.status(statusCode).json({ message });
}
