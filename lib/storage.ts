import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, and, desc, asc, gte, lte, or, like, sql } from 'drizzle-orm';
import * as schema from './schema';

// Neon serverless driver is optimized for serverless functions
const connectionString = process.env.DATABASE_URL || '';
const sql_client = neon(connectionString);
export const db = drizzle(sql_client, { schema });

// User operations
export async function getUserByEmail(email: string) {
  const result = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  return result[0] || null;
}

export async function getUserById(id: string) {
  const result = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
  return result[0] || null;
}

export async function createUser(data: typeof schema.users.$inferInsert) {
  const result = await db.insert(schema.users).values(data).returning();
  return result[0];
}

export async function updateUser(id: string, data: Partial<typeof schema.users.$inferInsert>) {
  const result = await db.update(schema.users).set({ ...data, updatedAt: new Date() }).where(eq(schema.users.id, id)).returning();
  return result[0];
}

// Companion operations
export async function getCompanionByUserId(userId: string) {
  const result = await db.select().from(schema.companions).where(eq(schema.companions.userId, userId)).limit(1);
  return result[0] || null;
}

export async function getCompanionById(id: string) {
  const result = await db.select().from(schema.companions).where(eq(schema.companions.id, id)).limit(1);
  return result[0] || null;
}

export async function createCompanion(data: typeof schema.companions.$inferInsert) {
  const result = await db.insert(schema.companions).values(data).returning();
  return result[0];
}

export async function updateCompanion(id: string, data: Partial<typeof schema.companions.$inferInsert>) {
  const result = await db.update(schema.companions).set({ ...data, updatedAt: new Date() }).where(eq(schema.companions.id, id)).returning();
  return result[0];
}

export async function getFeaturedCompanions() {
  return await db.select().from(schema.companions).where(eq(schema.companions.featured, true)).orderBy(desc(schema.companions.rating));
}

export async function searchCompanions(filters: {
  location?: string;
  category?: string;
  minRate?: number;
  maxRate?: number;
  availability?: string;
}) {
  let query = db.select().from(schema.companions);
  const conditions = [];

  if (filters.location) {
    conditions.push(like(schema.companions.location, `%${filters.location}%`));
  }
  if (filters.category) {
    conditions.push(eq(schema.companions.category, filters.category));
  }
  if (filters.availability) {
    conditions.push(eq(schema.companions.availability, filters.availability));
  }
  // Note: Rate filtering would require additional logic for decimal comparison

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  return await query.orderBy(desc(schema.companions.rating));
}

// Client operations
export async function getClientByUserId(userId: string) {
  const result = await db.select().from(schema.clients).where(eq(schema.clients.userId, userId)).limit(1);
  return result[0] || null;
}

export async function getClientById(id: string) {
  const result = await db.select().from(schema.clients).where(eq(schema.clients.id, id)).limit(1);
  return result[0] || null;
}

export async function createClient(data: typeof schema.clients.$inferInsert) {
  const result = await db.insert(schema.clients).values(data).returning();
  return result[0];
}

export async function updateClient(id: string, data: Partial<typeof schema.clients.$inferInsert>) {
  const result = await db.update(schema.clients).set({ ...data, updatedAt: new Date() }).where(eq(schema.clients.id, id)).returning();
  return result[0];
}

// Booking operations
export async function createBooking(data: typeof schema.bookings.$inferInsert) {
  const result = await db.insert(schema.bookings).values(data).returning();
  return result[0];
}

export async function getBookingById(id: string) {
  const result = await db.select().from(schema.bookings).where(eq(schema.bookings.id, id)).limit(1);
  return result[0] || null;
}

export async function updateBooking(id: string, data: Partial<typeof schema.bookings.$inferInsert>) {
  const result = await db.update(schema.bookings).set({ ...data, updatedAt: new Date() }).where(eq(schema.bookings.id, id)).returning();
  return result[0];
}

export async function getBookingsByClientId(clientId: string) {
  return await db.select().from(schema.bookings).where(eq(schema.bookings.clientId, clientId)).orderBy(desc(schema.bookings.createdAt));
}

export async function getBookingsByCompanionId(companionId: string) {
  return await db.select().from(schema.bookings).where(eq(schema.bookings.companionId, companionId)).orderBy(desc(schema.bookings.createdAt));
}

export async function getExpiredPendingBookings() {
  const now = new Date();
  return await db.select().from(schema.bookings).where(
    and(
      eq(schema.bookings.status, 'pending'),
      lte(schema.bookings.expiresAt, now)
    )
  );
}

export async function getAllBookings() {
  return await db.select().from(schema.bookings).orderBy(desc(schema.bookings.createdAt));
}

// Message operations
export async function createMessage(data: typeof schema.messages.$inferInsert) {
  const result = await db.insert(schema.messages).values(data).returning();
  return result[0];
}

export async function getMessagesByBookingId(bookingId: string) {
  return await db.select().from(schema.messages).where(eq(schema.messages.bookingId, bookingId)).orderBy(asc(schema.messages.createdAt));
}

export async function getFlaggedMessages() {
  return await db.select().from(schema.messages).where(
    and(
      eq(schema.messages.flagged, true),
      eq(schema.messages.dismissed, false)
    )
  ).orderBy(desc(schema.messages.createdAt));
}

export async function updateMessage(id: string, data: Partial<typeof schema.messages.$inferInsert>) {
  const result = await db.update(schema.messages).set(data).where(eq(schema.messages.id, id)).returning();
  return result[0];
}

export async function getConversationsByUserId(userId: string) {
  // Get all bookings where user is either client or companion
  const companion = await getCompanionByUserId(userId);
  const client = await getClientByUserId(userId);

  let bookings: any[] = [];
  
  if (companion) {
    const companionBookings = await getBookingsByCompanionId(companion.id);
    bookings = [...bookings, ...companionBookings];
  }
  
  if (client) {
    const clientBookings = await getBookingsByClientId(client.id);
    bookings = [...bookings, ...clientBookings];
  }

  return bookings;
}

// Review operations
export async function createReview(data: typeof schema.reviews.$inferInsert) {
  const result = await db.insert(schema.reviews).values(data).returning();
  
  // Update companion rating
  const reviews = await getReviewsByCompanionId(data.companionId);
  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  await updateCompanion(data.companionId, {
    rating: avgRating.toString(),
    reviewCount: reviews.length,
  });
  
  return result[0];
}

export async function getReviewsByCompanionId(companionId: string) {
  return await db.select().from(schema.reviews).where(eq(schema.reviews.companionId, companionId)).orderBy(desc(schema.reviews.createdAt));
}

export async function getReviewByBookingId(bookingId: string) {
  const result = await db.select().from(schema.reviews).where(eq(schema.reviews.bookingId, bookingId)).limit(1);
  return result[0] || null;
}

// Notification operations
export async function createNotification(data: typeof schema.notifications.$inferInsert) {
  const result = await db.insert(schema.notifications).values(data).returning();
  return result[0];
}

export async function getNotificationsByUserId(userId: string) {
  return await db.select().from(schema.notifications).where(eq(schema.notifications.userId, userId)).orderBy(desc(schema.notifications.createdAt));
}

export async function getUnreadNotificationCount(userId: string) {
  const result = await db.select({ count: sql<number>`count(*)` }).from(schema.notifications).where(
    and(
      eq(schema.notifications.userId, userId),
      eq(schema.notifications.isRead, false)
    )
  );
  return result[0]?.count || 0;
}

export async function markNotificationAsRead(id: string) {
  const result = await db.update(schema.notifications).set({ isRead: true }).where(eq(schema.notifications.id, id)).returning();
  return result[0];
}

// Photo approval operations
export async function createPhotoApproval(data: typeof schema.photoApprovals.$inferInsert) {
  const result = await db.insert(schema.photoApprovals).values(data).returning();
  return result[0];
}

export async function getUnapprovedPhotos() {
  return await db.select().from(schema.photoApprovals).where(eq(schema.photoApprovals.status, 'pending')).orderBy(desc(schema.photoApprovals.createdAt));
}

export async function updatePhotoApproval(id: string, status: string) {
  const result = await db.update(schema.photoApprovals).set({ status, updatedAt: new Date() }).where(eq(schema.photoApprovals.id, id)).returning();
  return result[0];
}

// Admin operations
export async function getAllUsers() {
  return await db.select().from(schema.users).orderBy(desc(schema.users.createdAt));
}

export async function getAdminStats() {
  const totalUsers = await db.select({ count: sql<number>`count(*)` }).from(schema.users);
  const totalCompanions = await db.select({ count: sql<number>`count(*)` }).from(schema.companions);
  const totalClients = await db.select({ count: sql<number>`count(*)` }).from(schema.clients);
  const totalBookings = await db.select({ count: sql<number>`count(*)` }).from(schema.bookings);
  const activeBookings = await db.select({ count: sql<number>`count(*)` }).from(schema.bookings).where(
    or(
      eq(schema.bookings.status, 'pending'),
      eq(schema.bookings.status, 'confirmed')
    )
  );

  return {
    totalUsers: totalUsers[0]?.count || 0,
    totalCompanions: totalCompanions[0]?.count || 0,
    totalClients: totalClients[0]?.count || 0,
    totalBookings: totalBookings[0]?.count || 0,
    activeBookings: activeBookings[0]?.count || 0,
  };
}

// Settings operations
export async function getSetting(key: string) {
  const result = await db.select().from(schema.settings).where(eq(schema.settings.key, key)).limit(1);
  return result[0] || null;
}

export async function updateSetting(key: string, value: string) {
  const existing = await getSetting(key);
  
  if (existing) {
    const result = await db.update(schema.settings).set({ value, updatedAt: new Date() }).where(eq(schema.settings.key, key)).returning();
    return result[0];
  } else {
    const result = await db.insert(schema.settings).values({
      id: `setting_${Date.now()}`,
      key,
      value,
    }).returning();
    return result[0];
  }
}

export const storage = {
  // Users
  getUserByEmail,
  getUserById,
  createUser,
  updateUser,
  getAllUsers,
  
  // Companions
  getCompanionByUserId,
  getCompanionById,
  createCompanion,
  updateCompanion,
  getFeaturedCompanions,
  searchCompanions,
  
  // Clients
  getClientByUserId,
  getClientById,
  createClient,
  updateClient,
  
  // Bookings
  createBooking,
  getBookingById,
  updateBooking,
  getBookingsByClientId,
  getBookingsByCompanionId,
  getExpiredPendingBookings,
  getAllBookings,
  
  // Messages
  createMessage,
  getMessagesByBookingId,
  getFlaggedMessages,
  updateMessage,
  getConversationsByUserId,
  
  // Reviews
  createReview,
  getReviewsByCompanionId,
  getReviewByBookingId,
  
  // Notifications
  createNotification,
  getNotificationsByUserId,
  getUnreadNotificationCount,
  markNotificationAsRead,
  
  // Photo approvals
  createPhotoApproval,
  getUnapprovedPhotos,
  updatePhotoApproval,
  
  // Admin
  getAdminStats,
  
  // Settings
  getSetting,
  updateSetting,
};
