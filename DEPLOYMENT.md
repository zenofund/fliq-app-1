# Deployment Guide - FliQ Companion Serverless Backend

This guide will help you deploy the FliQ Companion serverless backend to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Neon Account**: Sign up at [neon.tech](https://neon.tech) for serverless PostgreSQL
3. **Supabase Account**: Sign up at [supabase.com](https://supabase.com) for Realtime
4. **Paystack Account**: Sign up at [paystack.com](https://paystack.com) for payments (Nigerian businesses)
5. **Node.js**: Version 18+ installed locally

## Step 1: Set Up Neon Database

1. Create a new Neon project at [console.neon.tech](https://console.neon.tech)
2. Copy your connection string (it looks like `postgresql://user:password@host/database`)
3. Install Drizzle Kit globally:
   ```bash
   npm install -g drizzle-kit
   ```
4. Create the database schema:
   ```bash
   # Set your DATABASE_URL environment variable
   export DATABASE_URL="your-neon-connection-string"
   
   # Generate and push schema
   npx drizzle-kit push:pg
   ```

## Step 2: Set Up Supabase

1. Create a new Supabase project at [supabase.com/dashboard](https://supabase.com/dashboard)
2. Go to Settings > API
3. Copy your:
   - Project URL (e.g., `https://xxxxx.supabase.co`)
   - Anon/Public key (starts with `eyJ...`)
4. Enable Realtime for these tables:
   - Go to Database > Replication
   - Enable replication for: `notifications`, `messages`

## Step 3: Set Up Paystack

1. Sign up at [paystack.com](https://paystack.com) (for Nigerian businesses)
2. Go to Settings > API Keys & Webhooks
3. Copy your **Secret Key** (starts with `sk_test_` or `sk_live_`)
4. Set up webhook:
   - Webhook URL: `https://your-domain.vercel.app/api/bookings/payment-callback`
   - Events: Select `charge.success`

## Step 4: Deploy to Vercel

### Option A: Deploy via CLI

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel
   ```

4. Follow the prompts:
   - Set up and deploy: **Yes**
   - Which scope: **Your account**
   - Link to existing project: **No**
   - Project name: **fliq-app**
   - Directory: **./`** (current directory)

### Option B: Deploy via GitHub

1. Push your code to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your GitHub repository
4. Vercel will automatically detect Next.js and configure the build

## Step 5: Configure Environment Variables

In the Vercel dashboard, go to Settings > Environment Variables and add:

```env
DATABASE_URL=postgresql://user:password@host/database
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
CRON_SECRET=your-cron-secret-key-for-vercel-cron-jobs
PAYSTACK_SECRET_KEY=sk_test_your_paystack_secret_key
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
FRONTEND_URL=https://your-app-domain.vercel.app
```

### Generating Secrets

Generate secure random secrets:
```bash
# JWT_SECRET (32+ characters)
openssl rand -base64 32

# CRON_SECRET
openssl rand -base64 32
```

## Step 6: Verify Deployment

1. Go to your Vercel deployment URL (e.g., `https://fliq-app.vercel.app`)
2. Test the API endpoints:

```bash
# Health check - should return banks list
curl https://your-domain.vercel.app/api/banks/list

# Register a test user
curl -X POST https://your-domain.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "role": "client",
    "name": "Test User"
  }'

# Login
curl -X POST https://your-domain.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

## Step 7: Verify Cron Job

1. Go to Vercel Dashboard > Your Project > Settings > Crons
2. You should see `check-expired-bookings` scheduled to run every minute
3. View logs to verify it's running:
   - Go to Deployment > Functions
   - Find `/api/cron/check-expired-bookings`
   - Check execution logs

## Step 8: Set Up Monitoring (Optional but Recommended)

### Vercel Analytics
1. Enable in Vercel Dashboard > Analytics
2. Monitor API performance and errors

### Sentry Error Tracking
1. Create account at [sentry.io](https://sentry.io)
2. Create a new Next.js project
3. Add Sentry SDK:
   ```bash
   npm install @sentry/nextjs
   ```
4. Configure `sentry.properties` and initialization

## Troubleshooting

### Database Connection Issues
```bash
# Test database connection
psql "postgresql://user:password@host/database"

# Or using Node.js
node -e "const { neon } = require('@neondatabase/serverless'); const sql = neon(process.env.DATABASE_URL); sql\`SELECT NOW()\`.then(console.log)"
```

### JWT Token Issues
- Ensure JWT_SECRET is at least 32 characters
- Check token expiry (default 7 days)
- Verify Authorization header format: `Bearer <token>`

### CORS Issues
- All endpoints include CORS headers automatically
- If issues persist, check browser console for specific error
- Verify frontend URL in CORS_HEADERS

### Paystack Webhook Not Working
1. Check webhook URL in Paystack dashboard
2. Verify PAYSTACK_SECRET_KEY is correct
3. Check function logs in Vercel for errors
4. Test webhook signature verification

### Cron Job Not Running
1. Verify CRON_SECRET environment variable is set
2. Check function logs in Vercel
3. Cron schedule in `vercel.json`: `* * * * *` (every minute)
4. Test manually: `curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-domain.vercel.app/api/cron/check-expired-bookings`

## Performance Optimization

### Database Queries
- Neon uses connection pooling automatically
- Keep queries simple and indexed
- Use SELECT only needed columns

### Function Cold Starts
- First request after inactivity may be slower
- Vercel automatically caches functions
- Consider upgrading to Pro for better cold start performance

### Rate Limiting (Production Recommendation)
Consider adding rate limiting middleware:
```bash
npm install @upstash/ratelimit @upstash/redis
```

## Security Checklist

- [ ] Strong JWT_SECRET (32+ characters, randomly generated)
- [ ] Strong CRON_SECRET (32+ characters, randomly generated)
- [ ] Environment variables set in Vercel (not in code)
- [ ] Database credentials secured
- [ ] Paystack webhooks verified via signature
- [ ] Admin endpoints properly protected
- [ ] HTTPS enabled (automatic on Vercel)
- [ ] Regular dependency updates (`npm audit`)

## Scaling Considerations

### Vercel Limits (Hobby Plan)
- 100 GB bandwidth per month
- 100 hours serverless function execution
- 12 concurrent builds

### Upgrading for Production
Consider Vercel Pro ($20/month) for:
- 1 TB bandwidth
- 1000 hours function execution
- Better cold start performance
- Team collaboration
- Advanced analytics

### Database Scaling
Neon automatically scales:
- Connection pooling included
- Auto-pause when idle
- Easy to upgrade plan as needed

## Backup and Recovery

### Database Backups
Neon provides automatic backups:
- Point-in-time recovery
- Daily backups retained for 7 days (Free)
- Longer retention on paid plans

### Manual Backup
```bash
# Export database
pg_dump "postgresql://user:password@host/database" > backup.sql

# Restore database
psql "postgresql://user:password@host/database" < backup.sql
```

## Support

- **Vercel Support**: [vercel.com/support](https://vercel.com/support)
- **Neon Support**: [neon.tech/docs](https://neon.tech/docs)
- **Supabase Support**: [supabase.com/docs](https://supabase.com/docs)
- **Paystack Support**: [paystack.com/support](https://paystack.com/support)

## Next Steps

1. Test all API endpoints thoroughly
2. Set up frontend to consume the API
3. Add monitoring and error tracking
4. Configure custom domain (optional)
5. Set up staging environment
6. Enable analytics
7. Document API for your team

---

**Congratulations! Your FliQ Companion serverless backend is now deployed and ready for production use.**
