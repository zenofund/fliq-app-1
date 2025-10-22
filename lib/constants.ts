/**
 * Shared constants for the FliQ Companion platform
 */

// Booking expiration time (30 minutes)
export const BOOKING_EXPIRATION_MINUTES = 30;

// Payment provider
export const PAYSTACK_BASE_URL = 'https://api.paystack.co';

// Nigerian banks list (for bank verification)
export const NIGERIAN_BANKS = [
  { code: '044', name: 'Access Bank' },
  { code: '063', name: 'Access Bank (Diamond)' },
  { code: '050', name: 'Ecobank Nigeria' },
  { code: '070', name: 'Fidelity Bank' },
  { code: '011', name: 'First Bank of Nigeria' },
  { code: '214', name: 'First City Monument Bank' },
  { code: '058', name: 'Guaranty Trust Bank' },
  { code: '030', name: 'Heritage Bank' },
  { code: '301', name: 'Jaiz Bank' },
  { code: '082', name: 'Keystone Bank' },
  { code: '526', name: 'Parallex Bank' },
  { code: '076', name: 'Polaris Bank' },
  { code: '101', name: 'Providus Bank' },
  { code: '221', name: 'Stanbic IBTC Bank' },
  { code: '068', name: 'Standard Chartered Bank' },
  { code: '232', name: 'Sterling Bank' },
  { code: '100', name: 'Suntrust Bank' },
  { code: '032', name: 'Union Bank of Nigeria' },
  { code: '033', name: 'United Bank For Africa' },
  { code: '215', name: 'Unity Bank' },
  { code: '035', name: 'Wema Bank' },
  { code: '057', name: 'Zenith Bank' },
];

// Companion categories
export const COMPANION_CATEGORIES = [
  'dinner',
  'events',
  'travel',
  'nightlife',
  'business',
  'cultural',
  'sports',
];

// Booking statuses
export const BOOKING_STATUSES = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
} as const;

// Payment statuses
export const PAYMENT_STATUSES = {
  PENDING: 'pending',
  PAID: 'paid',
  REFUNDED: 'refunded',
  FAILED: 'failed',
} as const;

// User roles
export const USER_ROLES = {
  CLIENT: 'client',
  COMPANION: 'companion',
  ADMIN: 'admin',
} as const;

// Availability statuses
export const AVAILABILITY_STATUSES = {
  AVAILABLE: 'available',
  UNAVAILABLE: 'unavailable',
  BUSY: 'busy',
} as const;

// Photo types
export const PHOTO_TYPES = {
  PROFILE: 'profile',
  GALLERY: 'gallery',
} as const;

// Photo approval statuses
export const PHOTO_APPROVAL_STATUSES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

// Notification types
export const NOTIFICATION_TYPES = {
  BOOKING_CREATED: 'booking_created',
  BOOKING_CONFIRMED: 'booking_confirmed',
  BOOKING_CANCELLED: 'booking_cancelled',
  BOOKING_COMPLETED: 'booking_completed',
  PAYMENT_RECEIVED: 'payment_received',
  PAYMENT_REFUNDED: 'payment_refunded',
  MESSAGE_RECEIVED: 'message_received',
  REVIEW_RECEIVED: 'review_received',
  PROFILE_VERIFIED: 'profile_verified',
  PHOTO_APPROVED: 'photo_approved',
  PHOTO_REJECTED: 'photo_rejected',
} as const;

// CORS headers for all API routes
export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};
