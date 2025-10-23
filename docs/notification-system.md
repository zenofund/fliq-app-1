# Automated Notification System

This document describes the automated notification system implemented in the fliQ application, which sends notifications through multiple channels for key events.

## Overview

The notification system supports three delivery channels:
1. **In-app notifications** - Stored in database and displayed in the UI
2. **Email notifications** - Sent via email service (SendGrid, Mailgun, AWS SES, etc.)
3. **Push notifications** - Sent via push notification service (Firebase Cloud Messaging, OneSignal, etc.)

## Supported Events

The system automatically sends notifications for the following events:

### Booking Events
- **Booking Request** - When a client creates a new booking request
- **Booking Accepted** - When a companion accepts a booking
- **Booking Rejected** - When a companion rejects a booking
- **Booking Cancelled** - When a booking is cancelled
- **Booking Completed** - When a booking is marked as complete
- **Payment Received** - When a companion receives payment for a completed booking

### Messaging Events
- **New Message** - When a user receives a new chat message

### Reminder Events
- **Appointment Reminder** - Reminders sent 24 hours, 2 hours, and 30 minutes before appointments

## Architecture

### Core Components

#### 1. Notification Service (`lib/notifications.js`)
Central service that handles notification creation and delivery across all channels.

**Key Functions:**
- `sendNotification(userId, notificationType, data, options)` - Send a notification through specified channels
- `sendNotificationWithPreferences(userId, notificationType, data)` - Send notification based on user preferences
- `getUserNotificationPreferences(userId)` - Fetch user notification preferences

**Notification Types:**
```javascript
NOTIFICATION_TYPES = {
  BOOKING_REQUEST: 'booking_request',
  BOOKING_CONFIRMED: 'booking_confirmed',
  BOOKING_ACCEPTED: 'booking_accepted',
  BOOKING_REJECTED: 'booking_rejected',
  BOOKING_CANCELLED: 'booking_cancelled',
  BOOKING_COMPLETED: 'booking_completed',
  NEW_MESSAGE: 'new_message',
  APPOINTMENT_REMINDER: 'appointment_reminder',
  PAYMENT_RECEIVED: 'payment_received',
  PAYMENT_FAILED: 'payment_failed',
}
```

#### 2. API Endpoints

**`/api/notifications/send` (POST)**
- Internal endpoint for sending notifications
- Used by other API routes to trigger notifications
- Requires authentication

**`/api/notifications/reminders` (POST)**
- Endpoint for processing appointment reminders
- Should be called by a cron job every hour
- Protected by CRON_SECRET environment variable

#### 3. Integration Points

Notifications are automatically triggered from:
- `/api/bookings` - For booking lifecycle events
- `/api/chat/messages` - For new message notifications

## Notification Templates

Each notification type has a predefined template that includes:
- Title
- Message format
- Email subject
- Email body (HTML)
- Push notification format

Templates use data passed when creating the notification to populate dynamic content.

**Example Template:**
```javascript
[NOTIFICATION_TYPES.BOOKING_ACCEPTED]: {
  title: 'Booking Accepted',
  getMessage: (data) => `${data.companionName} has accepted your booking request!`,
  emailSubject: 'Booking Accepted',
  getEmailBody: (data) => `
    <h2>Booking Accepted</h2>
    <p>${data.companionName} has accepted your booking request!</p>
    <ul>
      <li><strong>Date:</strong> ${data.date}</li>
      <li><strong>Time:</strong> ${data.time}</li>
      <li><strong>Location:</strong> ${data.location}</li>
    </ul>
    <p><a href="${data.chatUrl}">Start Chat</a></p>
  `,
}
```

## Setup Instructions

### 1. Environment Variables

Add the following to your `.env.local` file:

```env
# Email Service (Choose one: SendGrid, Mailgun, AWS SES, etc.)
EMAIL_SERVICE_URL=your_email_service_url
EMAIL_SERVICE_API_KEY=your_email_service_api_key
EMAIL_FROM=notifications@fliq.app

# Push Notifications (Choose one: FCM, OneSignal, etc.)
FCM_SERVER_KEY=your_fcm_server_key

# Cron Job Secret
CRON_SECRET=your_random_cron_secret_key
```

### 2. Database Schema

Add a notifications table to your database:

```sql
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_user_id (user_id),
  INDEX idx_read (read),
  INDEX idx_created_at (created_at)
);
```

Add a booking_reminders table to track sent reminders:

```sql
CREATE TABLE booking_reminders (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER NOT NULL,
  reminder_window DECIMAL(3,1) NOT NULL, -- Hours before appointment (24, 2, 0.5)
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  UNIQUE KEY unique_reminder (booking_id, reminder_window),
  INDEX idx_booking_id (booking_id)
);
```

Add notification preferences table (optional):

```sql
CREATE TABLE notification_preferences (
  user_id VARCHAR(255) PRIMARY KEY,
  in_app BOOLEAN DEFAULT TRUE,
  email BOOLEAN DEFAULT TRUE,
  push BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 3. Email Service Integration

The notification service uses a placeholder for email sending. Integrate with your preferred email service:

**Example with SendGrid:**
```javascript
// In lib/notifications.js, update sendEmailNotification function
const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

async function sendEmailNotification(email, template, data) {
  try {
    const msg = {
      to: email,
      from: process.env.EMAIL_FROM || 'notifications@fliq.app',
      subject: template.emailSubject,
      html: template.getEmailBody(data),
    }
    
    await sgMail.send(msg)
    return { success: true, email }
  } catch (error) {
    console.error('Error sending email notification:', error)
    return { success: false, error: error.message }
  }
}
```

### 4. Push Notification Integration

The notification service uses a placeholder for push notifications. Integrate with your preferred push service:

**Example with Firebase Cloud Messaging:**
```javascript
// In lib/notifications.js, update sendPushNotification function
const admin = require('firebase-admin')

async function sendPushNotification(pushToken, template, data) {
  try {
    const message = {
      notification: {
        title: template.title,
        body: template.getMessage(data)
      },
      data: data,
      token: pushToken
    }
    
    await admin.messaging().send(message)
    return { success: true, pushToken }
  } catch (error) {
    console.error('Error sending push notification:', error)
    return { success: false, error: error.message }
  }
}
```

### 5. Set Up Cron Job for Reminders

Configure a cron job to call the reminders endpoint every hour:

**Using Vercel Cron:**

Create `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/notifications/reminders",
      "schedule": "0 * * * *"
    }
  ]
}
```

**Using GitHub Actions:**

Create `.github/workflows/reminders.yml`:
```yaml
name: Send Appointment Reminders
on:
  schedule:
    - cron: '0 * * * *'  # Every hour
  
jobs:
  send-reminders:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger reminders endpoint
        run: |
          curl -X POST https://your-app.vercel.app/api/notifications/reminders \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

## Usage Examples

### Sending a Notification from Code

```javascript
import { sendNotification, NOTIFICATION_TYPES } from '../../../lib/notifications'

// Send booking accepted notification
await sendNotification(
  userId,
  NOTIFICATION_TYPES.BOOKING_ACCEPTED,
  {
    companionName: 'Sarah Johnson',
    date: '2024-01-20',
    time: '18:00',
    location: 'Downtown Restaurant',
    chatUrl: 'https://app.fliq.com/client/dashboard?booking=123&chat=true'
  },
  {
    inApp: true,
    email: true,
    push: true,
    userEmail: 'user@example.com',
    pushToken: 'user_push_token_here'
  }
)
```

### Using User Preferences

```javascript
import { sendNotificationWithPreferences, NOTIFICATION_TYPES } from '../../../lib/notifications'

// Send notification based on user's preferences
await sendNotificationWithPreferences(
  userId,
  NOTIFICATION_TYPES.NEW_MESSAGE,
  {
    senderName: 'John Doe',
    messagePreview: 'Hey, are we still on for tonight?',
    chatUrl: 'https://app.fliq.com/companion/dashboard?booking=123&chat=true'
  }
)
```

## Testing

### Manual Testing

1. **Test In-app Notifications:**
   - Create a booking request
   - Check the notifications dropdown in the UI
   - Verify the notification appears

2. **Test Email Notifications:**
   - Ensure email service credentials are configured
   - Create a booking request
   - Check recipient email inbox
   - Verify email content and formatting

3. **Test Push Notifications:**
   - Ensure push service credentials are configured
   - Register a device with a push token
   - Create a booking request
   - Verify push notification appears on device

4. **Test Reminders:**
   - Create a booking for 24 hours from now
   - Call the reminders endpoint manually:
     ```bash
     curl -X POST http://localhost:3000/api/notifications/reminders \
       -H "Authorization: Bearer your_cron_secret"
     ```
   - Check that reminder notifications are sent

### Automated Testing

Add tests for notification service:

```javascript
// tests/notifications.test.js
import { sendNotification, NOTIFICATION_TYPES } from '../lib/notifications'

describe('Notification Service', () => {
  it('should send in-app notification', async () => {
    const result = await sendNotification(
      'user123',
      NOTIFICATION_TYPES.BOOKING_REQUEST,
      { clientName: 'Test User', date: '2024-01-20', time: '18:00' },
      { inApp: true, email: false, push: false }
    )
    
    expect(result.inApp.success).toBe(true)
  })
})
```

## Monitoring and Debugging

### Logs

The notification service logs:
- Successful notification sends
- Failed notification attempts
- Email/push service errors

Check logs in your hosting platform (Vercel, Netlify, etc.) or use a logging service.

### Common Issues

**1. Notifications not appearing in UI**
- Check Pusher credentials
- Verify WebSocket connection
- Check browser console for errors

**2. Emails not being delivered**
- Verify email service credentials
- Check spam folder
- Review email service logs
- Verify sender email is verified

**3. Push notifications not working**
- Verify push service credentials
- Check device push token is valid
- Ensure app has notification permissions
- Review push service logs

**4. Reminders not being sent**
- Verify cron job is running
- Check cron secret matches
- Review booking_reminders table for duplicates
- Check database query returns expected bookings

## Best Practices

1. **Don't fail main operations if notifications fail** - Notifications are wrapped in try-catch blocks
2. **Use notification preferences** - Respect user preferences for each channel
3. **Rate limiting** - Implement rate limiting to prevent spam
4. **Template consistency** - Keep notification templates consistent across channels
5. **Avoid notification loops** - Never send notifications about notification actions
6. **Monitor delivery rates** - Track notification success/failure rates
7. **Test regularly** - Test all notification channels in staging before production

## Security Considerations

1. **API Authentication** - All notification endpoints require authentication
2. **Cron Secret** - Protect reminder endpoint with CRON_SECRET
3. **Input Validation** - Validate all notification data before processing
4. **User Privacy** - Don't include sensitive data in notifications
5. **Rate Limiting** - Prevent notification spam
6. **Email Verification** - Only send emails to verified addresses

## Future Enhancements

- [ ] SMS notifications via Twilio
- [ ] In-app notification badges
- [ ] Notification sounds
- [ ] Rich media notifications (images, actions)
- [ ] Notification scheduling
- [ ] A/B testing for notification templates
- [ ] Analytics dashboard for notification metrics
- [ ] User-configurable notification preferences UI
- [ ] Notification history page
- [ ] Digest notifications (daily/weekly summaries)

## Support

For issues or questions about the notification system:
1. Check the logs for error messages
2. Review this documentation
3. Check the code comments in `lib/notifications.js`
4. Contact the development team

---

Last updated: 2025-10-23
