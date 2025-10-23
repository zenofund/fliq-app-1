-- =============================================
-- 1. USER MANAGEMENT (PROFILES)
-- =============================================

-- Table to store user profiles, extending auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'companion')),
    -- Companion-specific fields
    bio TEXT,
    hourly_rate INT CHECK (hourly_rate > 0),
    availability_schedule JSONB,
    paystack_subaccount_code TEXT,
    specialties TEXT[] DEFAULT ARRAY[]::TEXT[],
    documents JSONB,
    verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'suspended')),
    admin_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "profiles_public_read" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "profiles_individual_insert" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_individual_update" ON public.profiles
    FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_verification_status ON public.profiles(verification_status);

-- =============================================
-- 2. BOOKING SYSTEM
-- =============================================

-- Enum for booking status
DO $$ BEGIN
    CREATE TYPE booking_status AS ENUM ('pending', 'accepted', 'completed', 'declined', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
    id BIGSERIAL PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    companion_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status booking_status NOT NULL DEFAULT 'pending',
    total_price DECIMAL(10, 2) NOT NULL CHECK (total_price >= 0),
    duration_hours INT NOT NULL DEFAULT 1 CHECK (duration_hours > 0),
    location TEXT,
    notes TEXT,
    companion_share_percent NUMERIC(5, 2),
    platform_share_percent NUMERIC(5, 2),
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_time_range CHECK (end_time > start_time),
    CONSTRAINT different_users CHECK (client_id != companion_id)
);

-- Enable RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "bookings_client_insert" ON public.bookings
    FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "bookings_related_select" ON public.bookings
    FOR SELECT USING (auth.uid() = client_id OR auth.uid() = companion_id);

CREATE POLICY "bookings_related_update" ON public.bookings
    FOR UPDATE USING (auth.uid() = client_id OR auth.uid() = companion_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bookings_client_id ON public.bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_companion_id ON public.bookings(companion_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_start_time ON public.bookings(start_time);

-- =============================================
-- 3. SECURE MESSAGING SYSTEM
-- =============================================

-- Chats table
CREATE TABLE IF NOT EXISTS public.chats (
    id BIGSERIAL PRIMARY KEY,
    booking_id BIGINT UNIQUE NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id BIGSERIAL PRIMARY KEY,
    chat_id BIGINT NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (length(content) > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chats
CREATE POLICY "chats_accepted_bookings_select" ON public.chats
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.bookings b
            WHERE b.id = chats.booking_id
            AND b.status = 'accepted'
            AND (b.client_id = auth.uid() OR b.companion_id = auth.uid())
        )
    );

-- RLS Policies for messages
CREATE POLICY "messages_accessible_chats_select" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.chats c
            JOIN public.bookings b ON b.id = c.booking_id
            WHERE c.id = messages.chat_id
            AND b.status = 'accepted'
            AND (b.client_id = auth.uid() OR b.companion_id = auth.uid())
        )
    );

CREATE POLICY "messages_accessible_chats_insert" ON public.messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.chats c
            JOIN public.bookings b ON b.id = c.booking_id
            WHERE c.id = messages.chat_id
            AND b.status = 'accepted'
            AND (b.client_id = auth.uid() OR b.companion_id = auth.uid())
        )
    );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON public.messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(chat_id, created_at);

-- =============================================
-- 4. REVIEWS AND RATINGS SYSTEM
-- =============================================

-- Reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
    id BIGSERIAL PRIMARY KEY,
    booking_id BIGINT UNIQUE NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reviewee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    flagged BOOLEAN NOT NULL DEFAULT false,
    hidden BOOLEAN NOT NULL DEFAULT false,
    moderation_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT different_review_users CHECK (reviewer_id != reviewee_id)
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "reviews_public_select" ON public.reviews
    FOR SELECT USING (true);

CREATE POLICY "reviews_completed_bookings_insert" ON public.reviews
    FOR INSERT WITH CHECK (
        reviewer_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.bookings b
            WHERE b.id = reviews.booking_id
            AND b.status = 'completed'
            AND (b.client_id = auth.uid() OR b.companion_id = auth.uid())
            AND ((b.client_id = auth.uid() AND b.companion_id = reviews.reviewee_id) 
                 OR (b.companion_id = auth.uid() AND b.client_id = reviews.reviewee_id))
        )
    );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee_id ON public.reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON public.reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_booking_id ON public.reviews(booking_id);
CREATE INDEX IF NOT EXISTS idx_reviews_flagged ON public.reviews(flagged) WHERE flagged = true;

-- =============================================
-- 5. SUPPORTING FEATURES
-- =============================================

-- Transaction status enum
DO $$ BEGIN
    CREATE TYPE transaction_status AS ENUM ('pending', 'success', 'failed', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
    id BIGSERIAL PRIMARY KEY,
    booking_id BIGINT NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    paystack_reference TEXT UNIQUE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
    status transaction_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "transactions_related_select" ON public.transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.bookings b
            WHERE b.id = transactions.booking_id
            AND (b.client_id = auth.uid() OR b.companion_id = auth.uid())
        )
    );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_transactions_booking_id ON public.transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_reference ON public.transactions(paystack_reference);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "notifications_individual_access" ON public.notifications
    FOR ALL USING (user_id = auth.uid());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_is_read ON public.notifications(user_id, is_read);

-- Favorites table
CREATE TABLE IF NOT EXISTS public.favorites (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    companion_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_favorite UNIQUE(user_id, companion_id),
    CONSTRAINT different_favorite_users CHECK (user_id != companion_id)
);

-- Enable RLS
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "favorites_individual_access" ON public.favorites
    FOR ALL USING (user_id = auth.uid());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_companion_id ON public.favorites(companion_id);

-- =============================================
-- 6. FUNCTIONS AND TRIGGERS
-- =============================================

-- Platform settings table for revenue splits and configuration
CREATE TABLE IF NOT EXISTS public.platform_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    companion_share_percent NUMERIC(5, 2) NOT NULL DEFAULT 80,
    platform_share_percent NUMERIC(5, 2) NOT NULL DEFAULT 20,
    auto_approve_companions BOOLEAN NOT NULL DEFAULT false,
    dispute_escalation_email TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.platform_settings (id)
VALUES ('default')
ON CONFLICT (id) DO NOTHING;

-- Dispute management
DO $$ BEGIN
    CREATE TYPE dispute_status AS ENUM ('open', 'in_review', 'resolved', 'escalated');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id BIGINT REFERENCES public.bookings(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    companion_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status dispute_status NOT NULL DEFAULT 'open',
    summary TEXT,
    details TEXT,
    resolution TEXT,
    notes JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS disputes_participant_select ON public.disputes
    FOR SELECT USING (
        auth.uid() = client_id OR auth.uid() = companion_id
    );

CREATE POLICY IF NOT EXISTS disputes_participant_insert ON public.disputes
    FOR INSERT WITH CHECK (
        auth.uid() = client_id OR auth.uid() = companion_id
    );

CREATE INDEX IF NOT EXISTS idx_disputes_status ON public.disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_created_at ON public.disputes(created_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for profiles table
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_disputes_updated_at ON public.disputes;
CREATE TRIGGER update_disputes_updated_at
    BEFORE UPDATE ON public.disputes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_platform_settings_updated_at ON public.platform_settings;
CREATE TRIGGER update_platform_settings_updated_at
    BEFORE UPDATE ON public.platform_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create chat when booking is accepted
CREATE OR REPLACE FUNCTION create_chat_on_booking_accepted()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
        INSERT INTO public.chats (booking_id)
        VALUES (NEW.id)
        ON CONFLICT (booking_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for automatic chat creation
DROP TRIGGER IF EXISTS trigger_create_chat_on_accepted ON public.bookings;
CREATE TRIGGER trigger_create_chat_on_accepted
    AFTER UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION create_chat_on_booking_accepted();
