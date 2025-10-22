# FliQ Companion Platform - Serverless Backend

A modern, serverless backend architecture for the FliQ Companion booking platform, built with Next.js API routes and optimized for Vercel deployment.

## Architecture Overview

This application has been architected as a complete serverless solution with:

- **JWT-based Authentication**: Stateless authentication using JSON Web Tokens
- **Serverless API Routes**: 49+ individual API endpoints as Vercel serverless functions
- **Supabase Realtime**: Real-time messaging and notifications
- **Vercel Cron Jobs**: Background processing for expired bookings
- **Neon Database**: Serverless PostgreSQL with connection pooling
- **Drizzle ORM**: Type-safe database queries

## Key Features

### Authentication System
- User registration (Client/Companion/Admin roles)
- JWT-based login and session management
- Role-based access control
- Account verification and suspension

### Companion Management
- Profile creation and updates
- Availability management
- Bank account verification (Paystack integration)
- Photo upload and approval workflow
- Earnings tracking
- Review system

### Booking System
- Booking creation with automatic expiration
- Payment processing via Paystack
- Payment verification and webhooks
- Booking status management (pending, confirmed, completed, cancelled)
- Real-time messaging between clients and companions

### Admin Dashboard
- Platform statistics
- User management (verify, suspend)
- Photo approval system
- Flagged message moderation
- Settings management
- Booking oversight

### Real-time Features
- Supabase Realtime for instant notifications
- Message broadcasting in booking conversations
- Live updates for booking status changes

## Project Structure

```
/api
├── auth/              # Authentication endpoints
├── companions/        # Companion profile & management
├── bookings/          # Booking creation & management
├── clients/           # Client profile & bookings
├── messages/          # Messaging system
├── notifications/     # Notification management
├── reviews/           # Review system
├── admin/            # Admin dashboard endpoints
├── banks/            # Bank listing
└── cron/             # Background jobs

/lib
├── auth.ts           # JWT authentication utilities
├── storage.ts        # Database operations (Drizzle ORM)
├── schema.ts         # Database schema definitions
├── supabase.ts       # Realtime notifications
├── constants.ts      # Shared constants
└── utils.ts          # Helper functions
```

## API Endpoints

### Authentication (4 endpoints)
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with credentials
- `POST /api/auth/logout` - Logout (client-side token deletion)
- `GET /api/auth/me` - Get current user profile

### Companions (16 endpoints)
- `GET /api/companions/featured` - List featured companions
- `GET /api/companions/me` - Get current companion profile
- `PUT /api/companions/profile` - Update companion profile
- `GET /api/companions/availability` - Get availability status
- `POST /api/companions/toggle-availability` - Toggle availability
- `GET /api/companions/bookings` - Get companion bookings
- `GET /api/companions/[id]` - Get companion by ID
- `PUT /api/companions/[id]/status` - Update companion status (admin)
- `GET /api/companions/[id]/reviews` - Get companion reviews
- `GET /api/companions/search` - Search companions
- `POST /api/companions/verify-bank` - Verify bank account
- `POST /api/companions/bank-setup` - Setup bank account
- `POST /api/companions/upload-photo` - Upload profile photo
- `POST /api/companions/upload-gallery-photo` - Upload gallery photo
- `DELETE /api/companions/delete-gallery-photo` - Delete gallery photo
- `GET /api/companions/earnings` - Get earnings summary

### Bookings (6 endpoints)
- `POST /api/bookings/create` - Create new booking
- `GET /api/bookings/[id]` - Get booking details
- `PUT /api/bookings/[id]` - Update booking status
- `POST /api/bookings/[id]/payment` - Initialize payment
- `POST /api/bookings/[id]/verify-payment` - Verify payment
- `GET /api/bookings/[id]/messages` - Get booking messages
- `POST /api/bookings/payment-callback` - Paystack webhook

### Clients (2 endpoints)
- `GET /api/clients/me` - Get current client profile
- `GET /api/clients/bookings` - Get client bookings

### Messages (3 endpoints)
- `GET /api/messages/[bookingId]` - Get messages for booking
- `POST /api/messages/create` - Send new message
- `GET /api/messages/conversations` - Get all conversations

### Notifications (3 endpoints)
- `GET /api/notifications` - Get all notifications
- `GET /api/notifications/unread-count` - Get unread count
- `PUT /api/notifications/[id]/read` - Mark as read

### Reviews (2 endpoints)
- `POST /api/reviews/create` - Create review
- `GET /api/reviews/[companionId]` - Get companion reviews

### Admin (11 endpoints)
- `GET /api/admin/stats` - Platform statistics
- `GET /api/admin/users` - List all users
- `POST /api/admin/user-verify` - Verify user
- `POST /api/admin/user-suspend` - Suspend/unsuspend user
- `GET /api/admin/flagged-messages` - Get flagged messages
- `POST /api/admin/dismiss-message` - Dismiss flagged message
- `GET /api/admin/settings` - Get setting
- `PUT /api/admin/settings` - Update setting
- `GET /api/admin/unapproved-photos` - Get pending photos
- `POST /api/admin/approve-photo` - Approve photo
- `POST /api/admin/reject-photo` - Reject photo
- `GET /api/admin/bookings` - Get all bookings

### Utilities (1 endpoint)
- `GET /api/banks/list` - Get Nigerian banks list

### Cron Jobs (1 endpoint)
- `GET /api/cron/check-expired-bookings` - Process expired bookings (runs every minute)

**Total: 49 API endpoints**

## Environment Variables

Required environment variables (see `.env.example`):

```env
DATABASE_URL=                    # Neon PostgreSQL connection string
JWT_SECRET=                      # Secret key for JWT tokens
CRON_SECRET=                     # Secret for cron job authentication
PAYSTACK_SECRET_KEY=            # Paystack payment API key
NEXT_PUBLIC_SUPABASE_URL=       # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # Supabase anonymous key
FRONTEND_URL=                    # Frontend application URL
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/zenofund/fliq-app-1.git
cd fliq-app-1
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your actual values
```

4. Run database migrations (if using Drizzle Kit):
```bash
npm run db:push
```

5. Start development server:
```bash
npm run dev
```

## Deployment to Vercel

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel
```

3. Set environment variables in Vercel dashboard:
   - Go to your project settings
   - Navigate to Environment Variables
   - Add all required variables from `.env.example`

4. The cron job will automatically be configured from `vercel.json`

## Security Features

- **JWT Authentication**: Secure, stateless authentication
- **Role-based Access Control**: Separate permissions for clients, companions, and admins
- **CORS Headers**: Proper CORS configuration on all endpoints
- **Input Sanitization**: XSS prevention on user inputs
- **Webhook Verification**: Paystack signature verification
- **Cron Secret**: Protected background jobs
- **Password Hashing**: BCrypt for secure password storage

## Serverless Best Practices

✅ **Stateless Design**: No server-side sessions, uses JWT tokens
✅ **Connection Pooling**: Neon serverless driver optimized for lambdas
✅ **Proper Error Handling**: Try/catch blocks in all endpoints
✅ **CORS Support**: OPTIONS preflight handling
✅ **Timeout Management**: Quick responses, long operations via webhooks
✅ **Environment Variables**: Secure configuration management
✅ **Cold Start Optimization**: Minimal dependencies per function

## API Response Format

All API responses follow a consistent format:

**Success (200/201):**
```json
{
  "message": "Operation successful",
  "data": { ... }
}
```

**Error (400/401/403/404/500):**
```json
{
  "message": "Error description"
}
```

## Frontend Integration

To use the API from a frontend application:

```typescript
// Login
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ email, password }),
});
const { token } = await response.json();
localStorage.setItem('auth_token', token);

// Authenticated requests
const response = await fetch('/api/companions/me', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
  },
});
```

## Real-time Subscriptions

Subscribe to real-time updates using Supabase client:

```typescript
import { supabase } from './lib/supabase';

// Subscribe to notifications
supabase
  .channel('notifications')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
    filter: `user_id=eq.${userId}`,
  }, (payload) => {
    console.log('New notification:', payload.new);
  })
  .subscribe();
```

## Database Schema

The application uses the following main tables:
- `users` - Base user authentication
- `companions` - Extended companion profiles
- `clients` - Extended client profiles
- `bookings` - Booking records
- `messages` - Booking conversations
- `reviews` - Companion reviews
- `notifications` - User notifications
- `photo_approvals` - Photo moderation queue
- `settings` - Application settings

See `lib/schema.ts` for complete schema definitions.

## Development

### Running locally
```bash
npm run dev
```

### Building
```bash
npm run build
```

### Linting
```bash
npm run lint
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is proprietary and confidential.

## Support

For issues and questions, please open an issue on GitHub.
