# fliQ - Premium Lifestyle Companion Platform

A modern, full-stack web application built with Next.js for connecting clients with verified companions nearby in real-time.

## 🚀 Tech Stack

### Frontend
- **Next.js 14** - React framework with serverless API routes
- **React 18** - UI library
- **TailwindCSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **Lucide React** - Icon library

### Backend
- **Next.js API Routes** - Serverless functions
- **Supabase** (Placeholder) - Database and real-time subscriptions
- **Pusher** (Placeholder) - Real-time messaging
- **OpenAI** (Placeholder) - AI-powered content moderation
- **Paystack** (Placeholder) - Payment processing

## 📁 Project Structure

```
fliq-app-1/
├── components/
│   ├── auth/              # Authentication components
│   │   ├── LoginForm.js
│   │   └── RegisterForm.js
│   ├── booking/           # Booking management components
│   │   ├── BookingModal.js
│   │   └── RatingPopup.js
│   ├── chat/              # Chat interface
│   │   └── ChatUI.js
│   └── ui/                # Reusable UI components
│       └── NotificationsDropdown.js
├── hooks/                 # Custom React hooks
│   └── useAuth.js
├── lib/                   # Helper libraries
│   ├── auth.ts           # Existing auth utilities
│   ├── openai.js         # OpenAI integration
│   ├── paystack.js       # Paystack payment utilities
│   └── pusher.js         # Pusher real-time utilities
├── pages/
│   ├── api/              # API routes
│   │   ├── bookings/
│   │   │   └── index.js
│   │   ├── moderation/
│   │   │   └── openai.js
│   │   ├── notifications/
│   │   │   └── index.js
│   │   └── payments/
│   │       ├── paystack.js
│   │       └── webhook.js
│   ├── client/           # Client dashboard pages
│   │   └── dashboard.js
│   ├── companion/        # Companion dashboard pages
│   │   └── dashboard.js
│   ├── _app.js
│   ├── _document.js
│   ├── index.js          # Landing page
│   ├── login.js
│   └── register.js
├── public/               # Static assets
└── styles/
    └── globals.css       # Global styles with Tailwind
```

## 🎨 Features

### Landing Page
- ✅ Responsive design with dark/light theme toggle
- ✅ Smooth animations with Framer Motion
- ✅ Feature highlights and how-it-works sections
- ✅ Mobile-friendly navigation

### Authentication
- ✅ Login and registration forms
- ✅ Role-based registration (Client/Companion)
- ✅ Password visibility toggle
- ✅ Form validation

### Client Dashboard
- ✅ Active bookings display
- ✅ Nearby companions search
- ✅ Quick statistics
- ✅ Real-time updates (placeholder)

### Companion Dashboard
- ✅ Onboarding progress tracker
- ✅ Booking requests management
- ✅ Earnings and statistics
- ✅ Quick action buttons

### Components
- ✅ BookingModal - Create new bookings
- ✅ RatingPopup - Rate completed bookings
- ✅ ChatUI - Real-time messaging interface
- ✅ NotificationsDropdown - Notification management

### API Routes (with Safety Best Practices)
- ✅ `/api/bookings` - CRUD operations for bookings
- ✅ `/api/payments/paystack` - Payment initialization
- ✅ `/api/payments/webhook` - Paystack webhook handler
- ✅ `/api/moderation/openai` - Content moderation
- ✅ `/api/notifications` - Notification management

All API routes include:
- Comprehensive comments on preventing infinite loops
- Hanging request prevention strategies
- Proper error handling
- Security best practices
- CORS configuration

## 🛠️ Setup

### Prerequisites
- Node.js 16+ and npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/zenofund/fliq-app-1.git
cd fliq-app-1
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file (copy from `.env.example`):
```bash
cp .env.example .env.local
```

4. Configure environment variables in `.env.local`:
```env
# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Database (Supabase)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Authentication
JWT_SECRET=your_jwt_secret_key_here

# Paystack
PAYSTACK_SECRET_KEY=your_paystack_secret_key
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=your_paystack_public_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Pusher
PUSHER_APP_ID=your_pusher_app_id
PUSHER_SECRET=your_pusher_secret
NEXT_PUBLIC_PUSHER_KEY=your_pusher_key
NEXT_PUBLIC_PUSHER_CLUSTER=us2
```

### Development

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

Build for production:
```bash
npm run build
```

Start production server:
```bash
npm start
```

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Configure environment variables
4. Deploy!

### Netlify

1. Push your code to GitHub
2. Connect repository in [Netlify](https://netlify.com)
3. Build command: `npm run build`
4. Publish directory: `.next`
5. Configure environment variables
6. Deploy!

## 🔐 Security Notes

- All API routes implement proper authentication
- Input validation on all endpoints
- Rate limiting should be implemented in production
- Environment variables are never exposed to client
- Webhook signatures are verified
- Content moderation for user-generated content
- HTTPS required for production

## 📝 API Route Best Practices

Each API route includes detailed comments covering:

1. **Infinite Loop Prevention**
   - Single response per request
   - No recursive calls
   - Request validation before processing

2. **Hanging Request Prevention**
   - Timeouts on external API calls
   - Early returns for invalid requests
   - No long-polling or event listeners

3. **Error Handling**
   - Try-catch blocks around all operations
   - Proper HTTP status codes
   - Safe error messages (no internal details)

4. **Security**
   - JWT authentication
   - Input validation
   - SQL injection prevention
   - XSS protection

## 🎯 Next Steps

To complete the application:

1. **Database Setup**
   - Configure Supabase project
   - Create database schema
   - Implement database queries

2. **Payment Integration**
   - Complete Paystack integration
   - Test payment flows
   - Implement refunds

3. **Real-time Features**
   - Configure Pusher or Supabase Realtime
   - Implement chat functionality
   - Live notifications

4. **AI Moderation**
   - Configure OpenAI API
   - Implement content filtering
   - Test moderation flows

5. **Testing**
   - Add unit tests
   - Integration tests for API routes
   - E2E tests with Playwright

6. **Production Hardening**
   - Rate limiting
   - Monitoring and logging
   - Error tracking
   - Performance optimization

## 📄 License

This project is private and proprietary.

## 🤝 Contributing

This is a private project. Contributions are managed internally.

---

Built with ❤️ using Next.js, React, and TailwindCSS
