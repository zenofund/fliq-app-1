/**
 * Storage Layer for FliQ Serverless Functions
 * This is a stub implementation - connect to your actual database
 * 
 * TODO: Set up database connection (Neon/Supabase/etc.) and implement methods
 * For now, this provides type-safe interfaces for all endpoints
 */

export interface User {
  id: string;
  email: string;
  password: string;
  role: string;
  isVerified: boolean;
  createdAt: Date;
}

export interface Companion {
  id: string;
  userId: string;
  fullName: string;
  dateOfBirth: Date;
  bio: string;
  city: string;
  languages: string[];
  interests: string[];
  hourlyRate: string;
  availability: string;
  isAvailable: boolean;
  profilePhoto: string | null;
  galleryPhotos: string[];
  rating: string;
  totalBookings: number;
  latitude: string | null;
  longitude: string | null;
  paystackSubaccountCode: string | null;
  bankAccountName: string | null;
  bankAccountNumber: string | null;
  bankCode: string | null;
  isPhotoApproved: boolean;
  createdAt: Date;
}

export interface Client {
  id: string;
  userId: string;
  fullName: string;
  phone: string | null;
  createdAt: Date;
}

export interface Booking {
  id: string;
  companionId: string;
  clientId: string;
  startTime: Date;
  endTime: Date;
  totalAmount: string;
  platformFee: string;
  companionEarnings: string;
  status: string;
  paymentStatus: string;
  paystackReference: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  bookingId: string;
  senderId: string;
  content: string;
  isFlagged: boolean;
  createdAt: Date;
}

export interface Review {
  id: string;
  bookingId: string;
  companionId: string;
  clientId: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  bookingId: string | null;
  isRead: boolean;
  createdAt: Date;
}

export interface PlatformSettings {
  id: string;
  commissionPercentage: string;
  createdAt: Date;
  updatedAt: Date;
}

class DatabaseStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    throw new Error('Database not connected - implement storage layer');
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    throw new Error('Database not connected - implement storage layer');
  }

  async createUser(user: Partial<User>): Promise<User> {
    throw new Error('Database not connected - implement storage layer');
  }

  async getAllUsers(): Promise<User[]> {
    throw new Error('Database not connected - implement storage layer');
  }

  async verifyUser(id: string): Promise<void> {
    throw new Error('Database not connected - implement storage layer');
  }

  async suspendUser(id: string): Promise<void> {
    throw new Error('Database not connected - implement storage layer');
  }

  // Companions
  async getCompanion(id: string): Promise<Companion | undefined> {
    throw new Error('Database not connected - implement storage layer');
  }

  async getCompanionByUserId(userId: string): Promise<Companion | undefined> {
    throw new Error('Database not connected - implement storage layer');
  }

  async createCompanion(companion: Partial<Companion>): Promise<Companion> {
    throw new Error('Database not connected - implement storage layer');
  }

  async updateCompanion(id: string, data: Partial<Companion>): Promise<Companion> {
    throw new Error('Database not connected - implement storage layer');
  }

  async getAllCompanions(): Promise<Companion[]> {
    throw new Error('Database not connected - implement storage layer');
  }

  // Clients
  async getClient(id: string): Promise<Client | undefined> {
    throw new Error('Database not connected - implement storage layer');
  }

  async getClientByUserId(userId: string): Promise<Client | undefined> {
    throw new Error('Database not connected - implement storage layer');
  }

  async createClient(client: Partial<Client>): Promise<Client> {
    throw new Error('Database not connected - implement storage layer');
  }

  async getClientById(clientId: string): Promise<Client | undefined> {
    return this.getClient(clientId);
  }

  // Bookings
  async getBooking(id: string): Promise<Booking | undefined> {
    throw new Error('Database not connected - implement storage layer');
  }

  async createBooking(booking: Partial<Booking>): Promise<Booking> {
    throw new Error('Database not connected - implement storage layer');
  }

  async updateBooking(id: string, data: Partial<Booking>): Promise<Booking> {
    throw new Error('Database not connected - implement storage layer');
  }

  async getCompanionBookings(companionId: string): Promise<Booking[]> {
    throw new Error('Database not connected - implement storage layer');
  }

  async getClientBookings(clientId: string): Promise<Booking[]> {
    throw new Error('Database not connected - implement storage layer');
  }

  async getAllBookings(): Promise<Booking[]> {
    throw new Error('Database not connected - implement storage layer');
  }

  async getBookingById(bookingId: string): Promise<Booking | undefined> {
    return this.getBooking(bookingId);
  }

  // Messages
  async createMessage(message: Partial<Message>): Promise<Message> {
    throw new Error('Database not connected - implement storage layer');
  }

  async getBookingMessages(bookingId: string): Promise<Message[]> {
    throw new Error('Database not connected - implement storage layer');
  }

  async getFlaggedMessages(): Promise<any[]> {
    throw new Error('Database not connected - implement storage layer');
  }

  async dismissFlaggedMessage(id: string): Promise<void> {
    throw new Error('Database not connected - implement storage layer');
  }

  // Reviews
  async createReview(review: Partial<Review> & { clientId: string }): Promise<Review> {
    throw new Error('Database not connected - implement storage layer');
  }

  async getCompanionReviews(companionId: string): Promise<Review[]> {
    throw new Error('Database not connected - implement storage layer');
  }

  async getReviewsByCompanionId(companionId: string): Promise<Review[]> {
    return this.getCompanionReviews(companionId);
  }

  async getReviewByBookingId(bookingId: string): Promise<Review | undefined> {
    throw new Error('Database not connected - implement storage layer');
  }

  async updateCompanionRating(companionId: string, rating: string): Promise<void> {
    throw new Error('Database not connected - implement storage layer');
  }

  async getUserById(userId: string): Promise<User | undefined> {
    return this.getUser(userId);
  }

  // Platform Settings
  async getPlatformSettings(): Promise<PlatformSettings> {
    throw new Error('Database not connected - implement storage layer');
  }

  async updatePlatformSettings(commissionPercentage: number): Promise<PlatformSettings> {
    throw new Error('Database not connected - implement storage layer');
  }

  // Photo Moderation
  async getUnapprovedCompanions(): Promise<Companion[]> {
    throw new Error('Database not connected - implement storage layer');
  }

  async approveCompanionPhoto(id: string): Promise<void> {
    throw new Error('Database not connected - implement storage layer');
  }

  async rejectCompanionPhoto(id: string): Promise<void> {
    throw new Error('Database not connected - implement storage layer');
  }

  // Admin Stats
  async getAdminStats(): Promise<any> {
    throw new Error('Database not connected - implement storage layer');
  }

  // Notifications
  async createNotification(data: Partial<Notification>): Promise<Notification> {
    throw new Error('Database not connected - implement storage layer');
  }

  async getUserNotifications(userId: string): Promise<Notification[]> {
    throw new Error('Database not connected - implement storage layer');
  }

  async markNotificationAsRead(id: string): Promise<Notification> {
    throw new Error('Database not connected - implement storage layer');
  }

  async getUnreadCount(userId: string): Promise<number> {
    throw new Error('Database not connected - implement storage layer');
  }
}

export const storage = new DatabaseStorage();
