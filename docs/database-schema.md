# Database Schema

This document describes the database schema required for the fliQ application, including chat, bookings, and review features.

## Reviews Table

Stores reviews and ratings between clients and companions after completed bookings.

```sql
CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER NOT NULL UNIQUE,
  reviewer_id VARCHAR(255) NOT NULL,
  reviewer_role VARCHAR(50) NOT NULL CHECK (reviewer_role IN ('client', 'companion')),
  reviewee_id VARCHAR(255) NOT NULL,
  reviewee_role VARCHAR(50) NOT NULL CHECK (reviewee_role IN ('client', 'companion')),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign key to bookings table
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  
  -- Indexes for faster queries
  INDEX idx_booking_id (booking_id),
  INDEX idx_reviewee_id (reviewee_id),
  INDEX idx_reviewer_id (reviewer_id),
  INDEX idx_created_at (created_at)
);
```

**Review Rules:**
- Each booking can have up to 2 reviews (one from client, one from companion)
- Reviews can only be submitted after booking status is `'completed'`
- Reviewers can only review the other party in the booking
- Ratings are on a scale of 1-5 stars
- Review text is optional but recommended

## Messages Table

Stores all chat messages between clients and companions.

```sql
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER NOT NULL,
  sender_id VARCHAR(255) NOT NULL,
  sender_role VARCHAR(50) NOT NULL CHECK (sender_role IN ('client', 'companion')),
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP NULL,
  
  -- Foreign key to bookings table
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  
  -- Index for faster queries
  INDEX idx_booking_id (booking_id),
  INDEX idx_created_at (created_at)
);
```

## Bookings Table Updates

The existing bookings table should track booking status to control chat availability.

**Chat Availability Rules:**
- Chat becomes available when status is `'accepted'` or `'confirmed'`
- Chat becomes unavailable when status is `'completed'`, `'cancelled'`, or `'rejected'`
- Chat never becomes available if booking is in `'pending'` state

```sql
-- Ensure bookings table has proper status column
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS status VARCHAR(50) 
  DEFAULT 'pending' 
  CHECK (status IN ('pending', 'accepted', 'confirmed', 'completed', 'cancelled', 'rejected'));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_companion_id ON bookings(companion_id);
```

## Required Columns in Bookings Table

For the chat feature to work properly, the bookings table needs:

- `id` - Unique identifier for the booking
- `user_id` - Client's user ID
- `companion_id` - Companion's user ID
- `status` - Current status of the booking (affects chat availability)
- `date` - Booking date
- `time` - Booking time
- `location` - Booking location
- `created_at` - When booking was created

## Example Queries

### Get all conversations for a user

```sql
SELECT 
  b.*,
  CASE 
    WHEN b.user_id = ? THEN c.name
    ELSE u.name
  END as other_party_name,
  CASE 
    WHEN b.user_id = ? THEN c.id
    ELSE u.id
  END as other_party_id,
  (SELECT COUNT(*) FROM messages WHERE booking_id = b.id AND sender_id != ? AND read_at IS NULL) as unread_count,
  (SELECT text FROM messages WHERE booking_id = b.id ORDER BY created_at DESC LIMIT 1) as last_message,
  (SELECT created_at FROM messages WHERE booking_id = b.id ORDER BY created_at DESC LIMIT 1) as last_message_at
FROM bookings b
LEFT JOIN users u ON b.user_id = u.id
LEFT JOIN companions c ON b.companion_id = c.id
WHERE (b.user_id = ? OR b.companion_id = ?)
  AND b.status IN ('accepted', 'confirmed')
ORDER BY last_message_at DESC NULLS LAST, b.date DESC;
```

### Get messages for a conversation

```sql
SELECT * FROM messages 
WHERE booking_id = ? 
ORDER BY created_at ASC 
LIMIT 50 OFFSET ?;
```

### Insert a new message

```sql
INSERT INTO messages (booking_id, sender_id, sender_role, text, created_at) 
VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
RETURNING *;
```

### Mark messages as read

```sql
UPDATE messages 
SET read_at = CURRENT_TIMESTAMP 
WHERE booking_id = ? 
  AND sender_id != ? 
  AND read_at IS NULL;
```

### Submit a review

```sql
INSERT INTO reviews (booking_id, reviewer_id, reviewer_role, reviewee_id, reviewee_role, rating, review_text, created_at)
VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
RETURNING *;
```

### Get reviews for a user (companion or client)

```sql
SELECT 
  r.*,
  u.name as reviewer_name,
  b.date as booking_date
FROM reviews r
LEFT JOIN users u ON r.reviewer_id = u.id
LEFT JOIN bookings b ON r.booking_id = b.id
WHERE r.reviewee_id = ?
ORDER BY r.created_at DESC
LIMIT 50 OFFSET ?;
```

### Get average rating for a user

```sql
SELECT 
  AVG(rating) as average_rating,
  COUNT(*) as total_reviews
FROM reviews
WHERE reviewee_id = ?;
```

### Check if user has already reviewed a booking

```sql
SELECT id FROM reviews
WHERE booking_id = ? AND reviewer_id = ?
LIMIT 1;
```

### Get completed bookings that haven't been reviewed by user

```sql
SELECT b.*, 
  CASE 
    WHEN b.user_id = ? THEN c.name
    ELSE u.name
  END as other_party_name
FROM bookings b
LEFT JOIN users u ON b.user_id = u.id
LEFT JOIN companions c ON b.companion_id = c.id
LEFT JOIN reviews r ON r.booking_id = b.id AND r.reviewer_id = ?
WHERE (b.user_id = ? OR b.companion_id = ?)
  AND b.status = 'completed'
  AND r.id IS NULL
ORDER BY b.date DESC;
```

## Supabase Implementation

If using Supabase, you can create these tables using the Supabase dashboard SQL editor or via migrations:

1. Navigate to the SQL Editor in your Supabase project
2. Run the CREATE TABLE statements above
3. Enable Row Level Security (RLS) policies:

```sql
-- Enable RLS on messages table
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view messages from their own bookings
CREATE POLICY "Users can view their own messages" ON messages
  FOR SELECT
  USING (
    booking_id IN (
      SELECT id FROM bookings 
      WHERE user_id = auth.uid() OR companion_id = auth.uid()
    )
  );

-- Policy: Users can insert messages to their own bookings
CREATE POLICY "Users can send messages" ON messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    booking_id IN (
      SELECT id FROM bookings 
      WHERE (user_id = auth.uid() OR companion_id = auth.uid())
        AND status IN ('accepted', 'confirmed')
    )
  );

-- Enable RLS on reviews table
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view reviews (public)
CREATE POLICY "Reviews are publicly viewable" ON reviews
  FOR SELECT
  USING (true);

-- Policy: Users can submit reviews for their own completed bookings
CREATE POLICY "Users can submit reviews" ON reviews
  FOR INSERT
  WITH CHECK (
    reviewer_id = auth.uid() AND
    booking_id IN (
      SELECT id FROM bookings 
      WHERE (user_id = auth.uid() OR companion_id = auth.uid())
        AND status = 'completed'
    ) AND
    -- Ensure user hasn't already reviewed this booking
    NOT EXISTS (
      SELECT 1 FROM reviews 
      WHERE booking_id = NEW.booking_id AND reviewer_id = auth.uid()
    )
  );
```

## Migration Guide

To implement the database changes:

1. **Create reviews table**: Run the CREATE TABLE statement for reviews
2. **Create messages table**: Run the CREATE TABLE statement for messages
3. **Update bookings table**: Ensure status column exists with proper constraints
4. **Add indexes**: Create indexes for performance optimization
5. **Set up RLS policies**: If using Supabase, enable and configure RLS
6. **Test queries**: Verify all queries work with your data
5. **Test queries**: Verify all queries work with your data

## Notes

- Messages are automatically deleted when a booking is deleted (CASCADE)
- The `read_at` column tracks when messages are read for notification purposes
- Indexes are crucial for performance as the messages table will grow large
- Always verify user access to bookings before allowing message operations
