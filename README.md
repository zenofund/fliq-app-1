# FliQ App - Serverless API

Premium lifestyle companion booking platform - Serverless API implementation converted from Express.js to serverless functions.

## 🎯 Project Overview

This project contains 49 serverless endpoints that replicate the functionality of the FliQCompanion Express application, converted to use JWT authentication instead of sessions.

### Files Created

- **5 Library Files**: Authentication, Storage, Paystack, OpenAI, Notifications
- **44 API Endpoints**: All business logic from FliQCompanion/server/routes.ts

## 📁 Project Structure

```
├── lib/
│   ├── auth.ts              # JWT authentication (requireAuth, requireAdmin, createToken)
│   ├── storage.ts           # Database storage interface (needs implementation)
│   ├── paystack.ts          # Paystack payment integration
│   ├── openai.ts            # OpenAI moderation (images & text)
│   └── notifications.ts     # Notification helper
│
├── api/
│   ├── auth/               # Authentication endpoints (4 files)
│   ├── companions/         # Companion endpoints (16 files)
│   ├── clients/            # Client endpoints (2 files)
│   ├── bookings/           # Booking endpoints (6 files)
│   ├── messages/           # Messaging endpoints (3 files)
│   ├── admin/              # Admin endpoints (11 files)
│   ├── reviews/            # Review endpoints (2 files)
│   ├── notifications/      # Notification endpoints (3 files)
│   ├── banks/              # Bank list endpoint (1 file)
│   └── cron/               # Cron job endpoint (1 file)
```

## 🔧 Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file with:

```env
# JWT Authentication
JWT_SECRET=your-secret-key-here

# Database (e.g., Neon, Supabase, PostgreSQL)
DATABASE_URL=your-database-connection-string

# Paystack Payment Gateway
PAYSTACK_SECRET_KEY=your-paystack-secret-key

# OpenAI for Content Moderation
OPENAI_API_KEY=your-openai-api-key

# Cron Job Authentication
CRON_SECRET=your-cron-secret
```

### 3. Implement Database Storage

The `lib/storage.ts` file contains a complete interface but needs database implementation. Connect to your database:

```typescript
// Example using Drizzle ORM with Neon
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql);
```

Then implement all methods in the `DatabaseStorage` class.

### 4. Deploy

Deploy to your serverless platform:

#### Vercel
```bash
npm i -g vercel
vercel
```

#### Netlify
```bash
npm i -g netlify-cli
netlify deploy
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/logout` - Logout

### Companions
- `GET /api/companions/featured` - Get top 4 companions
- `GET /api/companions/me` - Get own profile (auth)
- `PATCH /api/companions/profile` - Update profile (auth)
- `GET /api/companions/search` - Search available companions (auth)
- `POST /api/companions/upload-photo` - Upload profile photo (auth, AI moderated)
- `GET /api/companions/earnings` - Get earnings dashboard (auth)
- `GET /api/companions/[id]` - Get companion by ID (auth)
- ... and 9 more

### Bookings
- `POST /api/bookings/create` - Create booking with payment (auth)
- `GET /api/bookings/[id]` - Get booking details (auth)
- `POST /api/bookings/[id]/payment` - Initialize payment (auth)
- `POST /api/bookings/[id]/verify-payment` - Verify payment (auth)
- `GET/POST /api/bookings/[id]/messages` - Booking messages (auth)
- `GET /api/bookings/payment-callback` - Paystack webhook

### Admin
- `GET /api/admin/stats` - Platform statistics (admin)
- `GET /api/admin/users` - List all users (admin)
- `POST /api/admin/verify-user` - Verify user (admin)
- `GET /api/admin/bookings` - List all bookings (admin)
- ... and 7 more

### Messages, Reviews, Notifications
- Full messaging system with AI moderation
- Review and rating system
- Real-time notifications

## 🔐 Authentication

All protected endpoints require JWT token in Authorization header:

```bash
Authorization: Bearer <your-jwt-token>
```

Get token from `/api/auth/login` or `/api/auth/register`.

## 🎨 Key Features

- ✅ **JWT Authentication** - Stateless authentication
- ✅ **Payment Processing** - Paystack integration with split payments
- ✅ **AI Moderation** - OpenAI content moderation
- ✅ **Bank Verification** - Paystack bank account verification
- ✅ **Booking System** - Complete booking workflow
- ✅ **Review System** - Ratings and reviews
- ✅ **Admin Panel** - Full admin capabilities
- ✅ **Notifications** - User notifications system
- ✅ **CORS Support** - Ready for frontend integration

## 🧪 Testing

Test endpoints using curl, Postman, or your frontend:

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password","role":"client"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Get profile (use token from login)
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <your-token>"
```

## 🔒 Security

- All endpoints use JWT for authentication
- Admin endpoints require admin role
- OpenAI moderates all user-generated content
- Payment processing via secure Paystack
- Environment variables for sensitive data

## 📝 Notes

- Database implementation needed in `lib/storage.ts`
- Configure webhook URL for Paystack callbacks
- Set up cron job for expired bookings check
- Configure CORS origins for production

## 🤝 Contributing

This codebase follows the serverless function pattern:
1. CORS headers on all endpoints
2. Method validation
3. JWT authentication where needed
4. Try/catch error handling
5. Consistent response format

## 📄 License

Private project - All rights reserved
