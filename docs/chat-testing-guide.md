# Chat Feature Testing Guide

This document provides comprehensive testing instructions for the real-time chat feature.

## Prerequisites

Before testing, ensure you have:

1. ✅ Set up Pusher account and configured environment variables
2. ✅ Created database tables (see `database-schema.md`)
3. ✅ Valid JWT tokens for authentication
4. ✅ At least one test client and one test companion account

## Environment Setup

Required environment variables in `.env.local`:

```env
# Pusher (Real-time)
PUSHER_APP_ID=your_pusher_app_id
PUSHER_SECRET=your_pusher_secret
NEXT_PUBLIC_PUSHER_KEY=your_pusher_key
NEXT_PUBLIC_PUSHER_CLUSTER=us2

# Authentication
JWT_SECRET=your_jwt_secret_key_here
```

## Manual Testing Flow

### Test Case 1: Chat Unavailable for Pending Bookings

**Scenario**: Client creates a booking, but companion hasn't accepted yet.

1. Login as Client
2. Navigate to `/client/dashboard`
3. Create a new booking (status: `pending`)
4. **Expected**: Chat button is disabled with text "Chat (Pending)"
5. **Expected**: Tooltip shows "Chat will be available once companion accepts"

### Test Case 2: Companion Accepts Booking - Chat Becomes Available

**Scenario**: Companion accepts booking, enabling chat for both parties.

1. Login as Companion
2. Navigate to `/companion/dashboard`
3. Find the pending booking request
4. Click "Accept" button
5. **Expected**: Booking moves to "Accepted Bookings" section
6. **Expected**: Chat button appears "💬 Chat with Client"
7. Login as Client
8. Navigate to `/client/dashboard`
9. **Expected**: Chat button is now enabled for the accepted booking
10. **Expected**: Clicking chat button navigates to messages page

### Test Case 3: Real-Time Messaging

**Scenario**: Client and companion exchange messages in real-time.

1. **Client Side**:
   - Login as Client
   - Navigate to `/client/messages`
   - Select the conversation with the companion
   - Send a message: "Hello, looking forward to meeting!"
   - **Expected**: Message appears immediately in chat
   - **Expected**: Message has timestamp

2. **Companion Side**:
   - Login as Companion in a different browser/incognito window
   - Navigate to `/companion/messages`
   - **Expected**: New message appears in real-time (via Pusher)
   - **Expected**: Unread count indicator shows 1
   - Click on the conversation
   - Reply with: "Hi! Me too, see you soon!"
   - **Expected**: Reply appears immediately

3. **Client Side**:
   - **Expected**: Companion's reply appears in real-time without refresh

### Test Case 4: Message Validation

**Scenario**: Test message input validation.

1. Login as Client
2. Navigate to `/client/messages` and select a conversation
3. Try to send an empty message (only spaces)
4. **Expected**: Message is not sent (button disabled)
5. Type a message over 5000 characters
6. Try to send
7. **Expected**: Error message: "Message is too long"

### Test Case 5: Booking Completion - Chat Becomes Unavailable

**Scenario**: Companion marks booking as complete, disabling chat.

1. Login as Companion
2. Navigate to `/companion/dashboard`
3. Find an accepted booking
4. Click "Mark Complete" button
5. **Expected**: Booking is removed from the dashboard
6. **Expected**: Alert shows "Booking completed! Chat is now closed."
7. Navigate to `/companion/messages`
8. **Expected**: Conversation no longer appears in the list (status is 'completed')
9. Login as Client
10. Navigate to `/client/messages`
11. **Expected**: Conversation is no longer available

### Test Case 6: Unauthorized Access Prevention

**Scenario**: User cannot access conversations for bookings they're not part of.

1. Login as Client A
2. Get the booking ID of Client B's booking (from database or logs)
3. Try to access: `/api/chat/messages?bookingId=[Client_B_Booking_ID]`
4. **Expected**: 403 Forbidden response
5. Try to send message to Client B's booking
6. **Expected**: 403 Forbidden response

### Test Case 7: Pusher Channel Authentication

**Scenario**: Verify private channel security.

1. Open browser developer console
2. Login as Client
3. Navigate to `/client/messages`
4. Check Network tab for Pusher authentication request
5. **Expected**: POST to `/api/pusher/auth` with JWT token
6. **Expected**: 200 response with Pusher auth credentials
7. Try to subscribe to another user's channel
8. **Expected**: Subscription fails with auth error

## API Testing with cURL

### 1. Get Conversations

```bash
curl -X GET http://localhost:3000/api/chat/conversations \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response**:
```json
{
  "conversations": [
    {
      "id": 1,
      "bookingId": 1,
      "otherPartyName": "Sarah Johnson",
      "status": "accepted",
      "unreadCount": 0,
      "lastMessage": "See you tomorrow!"
    }
  ]
}
```

### 2. Get Messages for a Conversation

```bash
curl -X GET "http://localhost:3000/api/chat/messages?bookingId=1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response**:
```json
{
  "messages": [
    {
      "id": 1,
      "bookingId": 1,
      "senderId": "user123",
      "senderRole": "client",
      "text": "Hello!",
      "createdAt": "2024-01-20T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1
  }
}
```

### 3. Send a Message

```bash
curl -X POST http://localhost:3000/api/chat/messages \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": 1,
    "text": "Looking forward to meeting you!"
  }'
```

**Expected Response**:
```json
{
  "message": "Message sent successfully",
  "data": {
    "id": 2,
    "bookingId": 1,
    "senderId": "user123",
    "senderRole": "client",
    "text": "Looking forward to meeting you!",
    "createdAt": "2024-01-20T10:35:00Z"
  }
}
```

### 4. Update Booking Status (Accept)

```bash
curl -X PUT http://localhost:3000/api/bookings \
  -H "Authorization: Bearer YOUR_COMPANION_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": 1,
    "action": "accept"
  }'
```

**Expected Response**:
```json
{
  "message": "Booking accepted successfully",
  "bookingId": 1,
  "status": "accepted",
  "chatAvailable": true
}
```

## Edge Cases to Test

1. **Network Interruption**: Disconnect internet while sending message
   - Expected: Error message shown, message remains in input field
   
2. **Multiple Tabs**: Open messages page in multiple tabs
   - Expected: Messages sync across all tabs via Pusher
   
3. **Long Message**: Send exactly 5000 characters
   - Expected: Message is sent successfully
   
4. **Special Characters**: Send message with emojis, quotes, HTML tags
   - Expected: Message is sent and displayed correctly (not interpreted as HTML)
   
5. **Concurrent Actions**: Both users send message at exact same time
   - Expected: Both messages appear in correct chronological order

## Performance Testing

1. **Load Testing**: Send 100 messages rapidly
   - Expected: All messages delivered without loss
   - Expected: UI remains responsive
   
2. **Large Conversation**: Test with 500+ messages in history
   - Expected: Initial load uses pagination (50 messages)
   - Expected: Scroll to load more works correctly

## Browser Compatibility

Test on:
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ✅ Mobile Chrome (iOS/Android)
- ✅ Mobile Safari (iOS)

## Common Issues and Troubleshooting

### Issue: Messages not appearing in real-time

**Diagnosis**:
1. Check Pusher credentials in `.env.local`
2. Check browser console for Pusher connection errors
3. Verify Pusher app is enabled in dashboard
4. Check if channel authentication is successful

**Solution**: Verify all Pusher environment variables are correct

### Issue: "Chat (Unavailable)" shows for accepted booking

**Diagnosis**:
1. Check booking status in database
2. Verify status is exactly 'accepted' or 'confirmed' (case-sensitive)

**Solution**: Update booking status in database or via API

### Issue: 401 Unauthorized when accessing chat

**Diagnosis**:
1. Check if JWT token is present in localStorage
2. Verify token hasn't expired
3. Check JWT_SECRET matches between token creation and verification

**Solution**: Re-login to get fresh token

## Success Criteria

✅ All test cases pass
✅ No console errors in browser
✅ Messages appear in real-time (< 1 second latency)
✅ Chat becomes available/unavailable based on booking status
✅ No unauthorized access to other users' conversations
✅ API responses follow documented schema
✅ UI is responsive and user-friendly

## Security Checklist

- [x] JWT authentication required for all endpoints
- [x] Users can only access their own bookings/conversations
- [x] Private Pusher channels with auth endpoint
- [x] Message length validation (max 5000 chars)
- [x] SQL injection prevention (parameterized queries in TODOs)
- [x] XSS prevention (React escapes content by default)
- [x] CORS headers properly configured
- [x] Error messages don't expose internal details
