# Fliq App Database Schema

This document outlines the complete database schema for the Fliq app, designed for Supabase/Postgres. It includes table definitions, Row-Level Security (RLS) policies, and performance indexes.

---

## 1. User Management (Authentication & Profiles)

Extends Supabase's built-in `auth.users` table.

### **Table: `profiles`**
Stores public user information, roles, and companion-specific details.

```sql
-- Table to store user profiles, extending auth.users
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'client', -- 'client' or 'companion'
    -- Companion-specific fields
    bio TEXT,
    hourly_rate INT,
    availability_schedule JSONB, -- e.g., {"monday": ["09:00-17:00"], "tuesday": [...]}
    paystack_subaccount_code TEXT, -- For Paystack split payments
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policies for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can see all profiles (to find companions)
CREATE POLICY "Allow public read access" ON public.profiles
    FOR SELECT USING (true);

-- Users can only insert their own profile
CREATE POLICY "Allow individual insert" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can only update their own profile
CREATE POLICY "Allow individual update" ON public.profiles
    FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Index to speed up searching for companions
CREATE INDEX idx_profiles_role ON public.profiles(role);
```

---

## 2. Booking System

Manages the entire lifecycle of a booking request.

### **Table: `bookings`**
Tracks appointments between clients and companions.

```sql
-- Table for bookings
CREATE TYPE booking_status AS ENUM ('pending', 'accepted', 'completed', 'declined', 'cancelled');

CREATE TABLE public.bookings (
    id BIGSERIAL PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES public.profiles(id),
    companion_id UUID NOT NULL REFERENCES public.profiles(id),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status booking_status NOT NULL DEFAULT 'pending',
    total_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policies for bookings
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Users can only insert bookings where they are the client
CREATE POLICY "Allow client to create bookings" ON public.bookings
    FOR INSERT WITH CHECK (auth.uid() = client_id);

-- Client and Companion involved in the booking can view it
CREATE POLICY "Allow related users to view bookings" ON public.bookings
    FOR SELECT USING (auth.uid() = client_id OR auth.uid() = companion_id);

-- Companion can update the status (accept/decline/complete)
-- Client can update the status (cancel)
CREATE POLICY "Allow related users to update booking status" ON public.bookings
    FOR UPDATE USING (auth.uid() = client_id OR auth.uid() = companion_id);

-- Indexes for fetching bookings by user
CREATE INDEX idx_bookings_client_id ON public.bookings(client_id);
CREATE INDEX idx_bookings_companion_id ON public.bookings(companion_id);

-- Index for filtering bookings by status
CREATE INDEX idx_bookings_status ON public.bookings(status);
```

---

## 3. Secure Messaging System

Enables private chat, accessible only under specific conditions tied to a booking.

### **Table: `chats` & `messages`**
Manages chat rooms and the messages within them.

```sql
-- Table for chat sessions linked to a booking
CREATE TABLE public.chats (
    id BIGSERIAL PRIMARY KEY,
    booking_id BIGINT UNIQUE NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE
);

-- Table for individual messages
CREATE TABLE public.messages (
    id BIGSERIAL PRIMARY KEY,
    chat_id BIGINT NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policies for chats
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

-- Allow users to see chats related to their accepted bookings
CREATE POLICY "Allow access to chats for accepted bookings" ON public.chats
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.bookings b
            WHERE b.id = chats.booking_id
            AND b.status = 'accepted'
            AND (b.client_id = auth.uid() OR b.companion_id = auth.uid())
        )
    );

-- RLS Policies for messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Allow users to see messages in chats they have access to
CREATE POLICY "Allow read access to messages in accessible chats" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.chats c
            WHERE c.id = messages.chat_id
        )
    );

-- Allow users to send messages in chats they have access to
CREATE POLICY "Allow insert access for messages in accessible chats" ON public.messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.chats c
            WHERE c.id = messages.chat_id
        )
    );

-- Index to fetch messages for a chat
CREATE INDEX idx_messages_chat_id ON public.messages(chat_id);

-- Index to fetch messages by sender
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
```

---

## 4. Reviews and Ratings System

Stores feedback after a booking is completed.

### **Table: `reviews`**
Stores ratings and comments for completed bookings.

```sql
-- Table for reviews
CREATE TABLE public.reviews (
    id BIGSERIAL PRIMARY KEY,
    booking_id BIGINT UNIQUE NOT NULL REFERENCES public.bookings(id),
    reviewer_id UUID NOT NULL REFERENCES public.profiles(id),
    reviewee_id UUID NOT NULL REFERENCES public.profiles(id),
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policies for reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read reviews
CREATE POLICY "Allow public read access to reviews" ON public.reviews
    FOR SELECT USING (true);

-- A user can only leave a review for a 'completed' booking they were part of
CREATE POLICY "Allow review insertion for completed bookings" ON public.reviews
    FOR INSERT WITH CHECK (
        reviewer_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.bookings b
            WHERE b.id = reviews.booking_id
            AND b.status = 'completed'
            AND (b.client_id = auth.uid() OR b.companion_id = auth.uid())
        )
    );

-- Index to quickly find all reviews for a user/companion
CREATE INDEX idx_reviews_reviewee_id ON public.reviews(reviewee_id);

-- Index to find all reviews written by a user
CREATE INDEX idx_reviews_reviewer_id ON public.reviews(reviewer_id);
```

---

## 5. Supporting Features

Tables for payments, notifications, and favorites.

### **Table: `transactions`**
Logs payment activities handled by Paystack.

```sql
-- Table for payment transactions
CREATE TYPE transaction_status AS ENUM ('pending', 'success', 'failed', 'refunded');

CREATE TABLE public.transactions (
    id BIGSERIAL PRIMARY KEY,
    booking_id BIGINT NOT NULL REFERENCES public.bookings(id),
    paystack_reference TEXT UNIQUE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status transaction_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policies for transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Only related users can view their transaction details
CREATE POLICY "Allow related users to view transactions" ON public.transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.bookings b
            WHERE b.id = transactions.booking_id
            AND (b.client_id = auth.uid() OR b.companion_id = auth.uid())
        )
    );

-- Index to find a transaction for a booking
CREATE INDEX idx_transactions_booking_id ON public.transactions(booking_id);

-- Index to query transactions by status
CREATE INDEX idx_transactions_status ON public.transactions(status);
```

### **Table: `notifications`**
Stores in-app notifications for users.

```sql
-- Table for notifications
CREATE TABLE public.notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policies for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only access their own notifications
CREATE POLICY "Allow individual access to notifications" ON public.notifications
    FOR ALL USING (user_id = auth.uid());

-- Index to quickly fetch notifications for a user, often filtering by read status
CREATE INDEX idx_notifications_user_id_is_read ON public.notifications(user_id, is_read);
```

### **Table: `favorites`**
Allows users to save their favorite companions.

```sql
-- Table for favorites/wishlist
CREATE TABLE public.favorites (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    companion_id UUID NOT NULL REFERENCES public.profiles(id),
    UNIQUE(user_id, companion_id) -- A user can only favorite a companion once
);

-- RLS Policies for favorites
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own favorites list
CREATE POLICY "Allow individual access to favorites" ON public.favorites
    FOR ALL USING (user_id = auth.uid());
```