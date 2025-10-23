# Database Integration Guide

This guide helps you connect the chat feature to a real database (Supabase recommended).

## Quick Start with Supabase

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create an account
2. Create a new project
3. Copy your project URL and keys from Settings > API

### 2. Configure Environment Variables

Update `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Run Database Migrations

In Supabase SQL Editor, run:

```sql
-- Create messages table
CREATE TABLE messages (
  id BIGSERIAL PRIMARY KEY,
  booking_id BIGINT NOT NULL,
  sender_id TEXT NOT NULL,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('client', 'companion')),
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE NULL
);

-- Create indexes
CREATE INDEX idx_messages_booking_id ON messages(booking_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- Enable Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policies for messages table
CREATE POLICY "Users can view their own messages" ON messages
  FOR SELECT
  USING (
    booking_id IN (
      SELECT id FROM bookings 
      WHERE user_id = auth.uid()::text OR companion_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()::text AND
    booking_id IN (
      SELECT id FROM bookings 
      WHERE (user_id = auth.uid()::text OR companion_id = auth.uid()::text)
        AND status IN ('accepted', 'confirmed')
    )
  );
```

### 4. Install Supabase Client

If not already installed:

```bash
npm install @supabase/supabase-js
```

### 5. Create Supabase Helper

Create `lib/supabase.js`:

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Client for browser use
export const supabase = createClient(supabaseUrl, supabaseKey)

// Admin client for server-side operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
```

## Implementing Database Queries

### Update `/api/chat/messages.js`

Replace the TODO sections with actual database queries:

```javascript
import { supabaseAdmin } from '../../../lib/supabase'

// In handleGetMessages function:
async function handleGetMessages(req, res, user) {
  const { bookingId, page = 1, limit = 50 } = req.query

  // Verify user has access to this booking
  const { data: booking, error: bookingError } = await supabaseAdmin
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .or(`user_id.eq.${user.id},companion_id.eq.${user.id}`)
    .single()

  if (bookingError || !booking) {
    return res.status(403).json({ message: 'Access denied to this conversation' })
  }

  // Check booking status
  if (!['accepted', 'confirmed'].includes(booking.status)) {
    return res.status(403).json({ 
      message: 'Chat is not available for this booking',
      status: booking.status
    })
  }

  // Fetch messages with pagination
  const { data: messages, error } = await supabaseAdmin
    .from('messages')
    .select('*')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: true })
    .range((page - 1) * limit, page * limit - 1)

  if (error) {
    throw error
  }

  return res.status(200).json({
    messages,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: messages.length
    }
  })
}

// In handleSendMessage function:
async function handleSendMessage(req, res, user) {
  const { bookingId, text } = req.body

  // Verify user has access
  const { data: booking, error: bookingError } = await supabaseAdmin
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .or(`user_id.eq.${user.id},companion_id.eq.${user.id}`)
    .single()

  if (bookingError || !booking) {
    return res.status(403).json({ message: 'Access denied to this conversation' })
  }

  // Check booking status
  if (!['accepted', 'confirmed'].includes(booking.status)) {
    return res.status(403).json({ 
      message: 'Chat is not available for this booking',
      status: booking.status,
      hint: booking.status === 'pending' 
        ? 'Chat will be available once the companion accepts the booking'
        : 'Chat is no longer available for this booking'
    })
  }

  // Insert message
  const { data: newMessage, error } = await supabaseAdmin
    .from('messages')
    .insert({
      booking_id: bookingId,
      sender_id: user.id,
      sender_role: user.role,
      text: text
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  // Send real-time notification via Pusher
  await sendMessageToConversation(bookingId, {
    ...newMessage,
    sender: user.role
  })

  return res.status(201).json({
    message: 'Message sent successfully',
    data: newMessage
  })
}
```

### Update `/api/chat/conversations.js`

```javascript
import { supabaseAdmin } from '../../../lib/supabase'

async function handler(req, res) {
  // ... auth code ...

  // Fetch conversations
  const { data: bookings, error } = await supabaseAdmin
    .from('bookings')
    .select(`
      *,
      users!user_id(name),
      companions!companion_id(name)
    `)
    .or(`user_id.eq.${user.id},companion_id.eq.${user.id}`)
    .in('status', ['accepted', 'confirmed'])
    .order('date', { ascending: false })

  if (error) {
    throw error
  }

  // Fetch last message and unread count for each booking
  const conversations = await Promise.all(
    bookings.map(async (booking) => {
      const { data: lastMessage } = await supabaseAdmin
        .from('messages')
        .select('text, created_at')
        .eq('booking_id', booking.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      const { count: unreadCount } = await supabaseAdmin
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('booking_id', booking.id)
        .neq('sender_id', user.id)
        .is('read_at', null)

      return {
        id: booking.id,
        bookingId: booking.id,
        otherPartyName: user.role === 'client' 
          ? booking.companions.name 
          : booking.users.name,
        otherPartyId: user.role === 'client' 
          ? booking.companion_id 
          : booking.user_id,
        otherPartyRole: user.role === 'client' ? 'companion' : 'client',
        status: booking.status,
        date: booking.date,
        time: booking.time,
        location: booking.location,
        unreadCount: unreadCount || 0,
        lastMessage: lastMessage?.text || null,
        lastMessageAt: lastMessage?.created_at || null
      }
    })
  )

  return res.status(200).json({ conversations })
}
```

### Update `/api/bookings/index.js`

```javascript
import { supabaseAdmin } from '../../lib/supabase'

// In handleUpdateBooking:
async function handleUpdateBooking(req, res, user) {
  const { bookingId, action } = req.body

  // Fetch booking
  const { data: booking, error: fetchError } = await supabaseAdmin
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single()

  if (fetchError || !booking) {
    return res.status(404).json({ message: 'Booking not found' })
  }

  // Verify ownership
  if (booking.user_id !== user.id && booking.companion_id !== user.id) {
    return res.status(403).json({ message: 'Not authorized' })
  }

  // Map action to status
  const statusMap = {
    'accept': 'accepted',
    'reject': 'rejected',
    'complete': 'completed',
    'cancel': 'cancelled'
  }
  const newStatus = statusMap[action]

  // Update booking
  const { error: updateError } = await supabaseAdmin
    .from('bookings')
    .update({ status: newStatus })
    .eq('id', bookingId)

  if (updateError) {
    throw updateError
  }

  return res.status(200).json({
    message: `Booking ${action}ed successfully`,
    bookingId,
    status: newStatus,
    chatAvailable: ['accepted', 'confirmed'].includes(newStatus)
  })
}
```

## Alternative: Using PostgreSQL Directly

If not using Supabase, you can use `pg` (node-postgres):

### 1. Install pg

```bash
npm install pg
```

### 2. Create Database Helper

Create `lib/db.js`:

```javascript
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

export async function query(text, params) {
  const start = Date.now()
  const res = await pool.query(text, params)
  const duration = Date.now() - start
  console.log('Executed query', { text, duration, rows: res.rowCount })
  return res
}

export default pool
```

### 3. Use in API Routes

```javascript
import { query } from '../../../lib/db'

// Fetch messages
const result = await query(
  'SELECT * FROM messages WHERE booking_id = $1 ORDER BY created_at ASC LIMIT $2 OFFSET $3',
  [bookingId, limit, (page - 1) * limit]
)
const messages = result.rows
```

## Environment Variables Summary

For production deployment, ensure these are set:

```env
# Required for Database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OR for PostgreSQL
DATABASE_URL=postgresql://user:password@host:5432/database

# Required for Auth
JWT_SECRET=your_jwt_secret_key

# Required for Real-time
PUSHER_APP_ID=your_pusher_app_id
PUSHER_SECRET=your_pusher_secret
NEXT_PUBLIC_PUSHER_KEY=your_pusher_key
NEXT_PUBLIC_PUSHER_CLUSTER=us2
```

## Testing Database Connection

Create a simple test script `scripts/test-db.js`:

```javascript
import { supabaseAdmin } from '../lib/supabase'

async function testConnection() {
  try {
    const { data, error } = await supabaseAdmin
      .from('messages')
      .select('count(*)')
      .limit(1)

    if (error) throw error
    
    console.log('✅ Database connection successful!')
    console.log('Messages table exists and is accessible')
  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
  }
}

testConnection()
```

Run: `node scripts/test-db.js`

## Common Issues

### Issue: "relation 'messages' does not exist"
**Solution**: Run the database migrations to create tables

### Issue: RLS policy blocking queries
**Solution**: Use `supabaseAdmin` (service role) in API routes, not `supabase` (anon key)

### Issue: "null value in column 'sender_role'"
**Solution**: Ensure `sender_role` is passed when inserting messages

## Next Steps

1. ✅ Create database tables using migrations
2. ✅ Test connection with test script
3. ✅ Replace TODO comments in API routes with actual queries
4. ✅ Test each endpoint with real data
5. ✅ Deploy to production with proper environment variables

## Production Checklist

- [ ] Database tables created with proper indexes
- [ ] RLS policies configured (if using Supabase)
- [ ] Connection pooling configured
- [ ] Database backups enabled
- [ ] Environment variables set in production
- [ ] SSL enabled for database connections
- [ ] Query performance tested with realistic data volumes
- [ ] Error logging and monitoring set up
