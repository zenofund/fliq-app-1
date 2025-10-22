import { pgTable, text, timestamp, integer, boolean, decimal, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table - base authentication
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  role: text('role').notNull(), // 'client' | 'companion' | 'admin'
  verified: boolean('verified').default(false),
  suspended: boolean('suspended').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Companions table - extended profile for companions
export const companions = pgTable('companions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  bio: text('bio'),
  age: integer('age'),
  location: text('location'),
  hourlyRate: decimal('hourly_rate', { precision: 10, scale: 2 }),
  category: text('category'), // 'dinner', 'events', 'travel', 'nightlife'
  languages: jsonb('languages').$type<string[]>(),
  interests: jsonb('interests').$type<string[]>(),
  availability: text('availability').default('available'), // 'available' | 'unavailable' | 'busy'
  profilePhoto: text('profile_photo'),
  galleryPhotos: jsonb('gallery_photos').$type<string[]>(),
  verified: boolean('verified').default(false),
  featured: boolean('featured').default(false),
  rating: decimal('rating', { precision: 3, scale: 2 }).default('0'),
  reviewCount: integer('review_count').default(0),
  bankName: text('bank_name'),
  accountNumber: text('account_number'),
  accountName: text('account_name'),
  bankVerified: boolean('bank_verified').default(false),
  totalEarnings: decimal('total_earnings', { precision: 10, scale: 2 }).default('0'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Clients table - extended profile for clients
export const clients = pgTable('clients', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  phone: text('phone'),
  preferences: jsonb('preferences').$type<any>(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Bookings table
export const bookings = pgTable('bookings', {
  id: text('id').primaryKey(),
  clientId: text('client_id').notNull().references(() => clients.id),
  companionId: text('companion_id').notNull().references(() => companions.id),
  date: timestamp('date').notNull(),
  duration: integer('duration').notNull(), // in hours
  location: text('location').notNull(),
  notes: text('notes'),
  status: text('status').notNull().default('pending'), // 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'expired'
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  paymentStatus: text('payment_status').default('pending'), // 'pending' | 'paid' | 'refunded'
  paystackReference: text('paystack_reference'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Messages table
export const messages = pgTable('messages', {
  id: text('id').primaryKey(),
  bookingId: text('booking_id').notNull().references(() => bookings.id),
  senderId: text('sender_id').notNull().references(() => users.id),
  content: text('content').notNull(),
  flagged: boolean('flagged').default(false),
  dismissed: boolean('dismissed').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// Reviews table
export const reviews = pgTable('reviews', {
  id: text('id').primaryKey(),
  bookingId: text('booking_id').notNull().references(() => bookings.id),
  companionId: text('companion_id').notNull().references(() => companions.id),
  clientId: text('client_id').notNull().references(() => clients.id),
  rating: integer('rating').notNull(),
  comment: text('comment'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Notifications table
export const notifications = pgTable('notifications', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  type: text('type').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  bookingId: text('booking_id'),
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// Photo approvals table
export const photoApprovals = pgTable('photo_approvals', {
  id: text('id').primaryKey(),
  companionId: text('companion_id').notNull().references(() => companions.id),
  photoUrl: text('photo_url').notNull(),
  photoType: text('photo_type').notNull(), // 'profile' | 'gallery'
  status: text('status').default('pending'), // 'pending' | 'approved' | 'rejected'
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Admin settings table
export const settings = pgTable('settings', {
  id: text('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Define relations
export const usersRelations = relations(users, ({ one }) => ({
  companion: one(companions, {
    fields: [users.id],
    references: [companions.userId],
  }),
  client: one(clients, {
    fields: [users.id],
    references: [clients.userId],
  }),
}));

export const companionsRelations = relations(companions, ({ one, many }) => ({
  user: one(users, {
    fields: [companions.userId],
    references: [users.id],
  }),
  bookings: many(bookings),
  reviews: many(reviews),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  user: one(users, {
    fields: [clients.userId],
    references: [users.id],
  }),
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  client: one(clients, {
    fields: [bookings.clientId],
    references: [clients.id],
  }),
  companion: one(companions, {
    fields: [bookings.companionId],
    references: [companions.id],
  }),
  messages: many(messages),
  review: one(reviews),
}));
