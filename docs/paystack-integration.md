# Paystack Payment Gateway Integration

This document describes the Paystack payment integration for the fliQ application, including split payments, refunds, and bank account verification.

## Overview

The Paystack integration handles all financial transactions in the application:
- **Payment Collection**: Clients pay for bookings via Paystack
- **Payment Holding**: Funds are held until booking completion
- **Split Payments**: Automatic payout to companions when bookings are completed
- **Refunds**: Automatic refunds when bookings are declined or expired
- **Bank Verification**: Verify companion bank accounts before creating subaccounts

## API Endpoints

### 1. Initialize Payment
**Endpoint**: `POST /api/payments/paystack`

Initializes a payment transaction for a booking. Supports split payments via companion subaccounts.

**Request Body**:
```json
{
  "bookingId": "123",
  "amount": 50000,
  "currency": "NGN",
  "companionSubaccount": "ACCT_xxxxx" // Optional - for split payment
}
```

**Response**:
```json
{
  "message": "Payment initialized",
  "authorizationUrl": "https://checkout.paystack.com/xxxxx",
  "reference": "booking_123_1234567890",
  "accessCode": "xxxxx"
}
```

### 2. Verify Bank Account
**Endpoint**: `POST /api/paystack/verify-bank`

Verifies a bank account before creating a subaccount.

**Request Body**:
```json
{
  "accountNumber": "0123456789",
  "bankCode": "058"
}
```

**Response**:
```json
{
  "message": "Bank account verified successfully",
  "accountName": "JANE DOE",
  "accountNumber": "0123456789",
  "bankId": "058"
}
```

### 3. Create Subaccount
**Endpoint**: `POST /api/paystack/create-subaccount`

Creates a Paystack subaccount for a companion to receive split payments.

**Request Body**:
```json
{
  "businessName": "Jane Doe",
  "settlementBank": "058",
  "accountNumber": "0123456789",
  "percentageCharge": 0,
  "description": "Companion payment account"
}
```

**Response**:
```json
{
  "message": "Subaccount created successfully",
  "subaccountCode": "ACCT_xxxxx",
  "percentageCharge": 0
}
```

### 4. Webhook Handler
**Endpoint**: `POST /api/paystack/webhook`

Receives webhook events from Paystack for payment confirmations, refunds, and transfers.

**Supported Events**:
- `charge.success` - Payment successful
- `charge.failed` - Payment failed
- `transfer.success` - Payout to companion successful
- `transfer.failed` - Payout failed
- `refund.processed` - Refund completed
- `refund.failed` - Refund failed

## Payment Workflow

### Booking Creation Flow

1. **Client Creates Booking**
   - Status: `pending`
   - No payment yet

2. **Companion Accepts Booking**
   - Payment is initialized with split payment configuration
   - Client pays via Paystack
   - Funds are held by Paystack
   - Status: `accepted`
   - Chat becomes available

3. **Booking Completed**
   - Companion marks booking as `completed`
   - Paystack automatically splits payment:
     - Platform receives service fee (transaction charge)
     - Companion receives remaining amount via subaccount
   - Status: `completed`
   - Chat becomes unavailable

### Refund Flow

Refunds are automatically triggered when:

1. **Companion Declines Booking**
   - Action: `reject`
   - Status: `rejected`
   - Automatic refund to client

2. **Client Cancels Booking**
   - Action: `cancel`
   - Status: `cancelled`
   - Automatic refund to client (if payment was made)

3. **Booking Expires**
   - Action: `expire`
   - Status: `expired`
   - Automatic refund to client

**Refund Processing**:
```javascript
// Automatically triggered in booking update handler
await initiateRefund({
  transaction: paymentReference,
  amount: bookingAmount,
  customerNote: 'Refund for cancelled booking',
  merchantNote: 'Automatic refund - booking cancelled'
})
```

## Split Payment Configuration

### Service Fee Model

The platform earns revenue by keeping the Paystack transaction charge:

```javascript
{
  subaccount: companionSubaccountCode,
  transactionCharge: 0, // Platform keeps all transaction fees
  bearer: 'account' // Companion bears the transaction fee
}
```

**Example**:
- Booking Amount: ₦50,000
- Paystack Fee (1.5% + ₦100): ₦850
- Companion Receives: ₦49,150
- Platform Receives: ₦850 (as service fee)

### Custom Service Fee

To charge additional platform fees, set a percentage charge on the subaccount:

```javascript
{
  percentageCharge: 10, // Platform takes 10% of transaction
  transactionCharge: 0
}
```

**Example with 10% fee**:
- Booking Amount: ₦50,000
- Platform Fee (10%): ₦5,000
- Paystack Fee: ₦850
- Companion Receives: ₦44,150
- Platform Receives: ₦5,850

## Companion Onboarding

### Bank Account Setup

1. **Verify Bank Account**
   ```javascript
   POST /api/paystack/verify-bank
   {
     "accountNumber": "0123456789",
     "bankCode": "058"
   }
   ```

2. **Create Subaccount**
   ```javascript
   POST /api/paystack/create-subaccount
   {
     "businessName": "Companion Name",
     "settlementBank": "058",
     "accountNumber": "0123456789",
     "percentageCharge": 0
   }
   ```

3. **Store Subaccount Code**
   - Save the returned `subaccountCode` in the companion's profile
   - Use this code when initializing payments for the companion's bookings

## Webhook Configuration

Configure the webhook URL in your Paystack dashboard:

**Webhook URL**: `https://yourdomain.com/api/paystack/webhook`

**Events to Subscribe**:
- ✅ charge.success
- ✅ charge.failed
- ✅ transfer.success
- ✅ transfer.failed
- ✅ refund.processed
- ✅ refund.failed

**Security**:
- Webhook signatures are automatically verified
- Only requests with valid signatures are processed
- Event idempotency prevents duplicate processing

## Error Handling

### Payment Initialization Errors

```javascript
try {
  await initializePayment(...)
} catch (error) {
  // Handle timeout
  if (error.code === 'ECONNABORTED') {
    return 'Payment service timeout'
  }
  
  // Handle Paystack errors
  if (error.response?.data) {
    return error.response.data.message
  }
}
```

### Refund Errors

```javascript
try {
  await initiateRefund(...)
} catch (error) {
  // Log for manual intervention
  console.error('Refund failed:', error)
  // Alert admin
  await sendAdminAlert({
    type: 'refund_failed',
    bookingId,
    error: error.message
  })
}
```

## Testing

### Test Mode

Use Paystack test keys for development:

```env
PAYSTACK_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxxx
```

### Test Cards

Use Paystack test cards for testing payments:

- **Success**: `4084 0840 8408 4081`
- **Decline**: `5060 6666 6666 6666`

### Test Webhook Events

Use Paystack's webhook testing tools to simulate events:

1. Navigate to Paystack Dashboard > Settings > Webhooks
2. Use the "Send Test Event" feature
3. Verify events are received and processed correctly

## Security Best Practices

1. **Never expose secret keys**
   - Store in environment variables
   - Never commit to version control
   - Use different keys for test/production

2. **Always verify webhooks**
   - Check signature on every webhook
   - Reject invalid signatures
   - Log suspicious requests

3. **Validate amounts server-side**
   - Never trust client-provided amounts
   - Recalculate based on booking details
   - Use database values for refunds

4. **Implement idempotency**
   - Track processed webhook events
   - Prevent duplicate processing
   - Use unique payment references

5. **Monitor transactions**
   - Log all payment operations
   - Set up alerts for failures
   - Regular reconciliation with Paystack

## Database Schema Updates

### Bookings Table

```sql
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'unpaid';
CREATE INDEX IF NOT EXISTS idx_bookings_payment_reference ON bookings(payment_reference);
```

### Companions Table

```sql
ALTER TABLE companions ADD COLUMN IF NOT EXISTS subaccount_code VARCHAR(255);
ALTER TABLE companions ADD COLUMN IF NOT EXISTS settlement_bank VARCHAR(10);
ALTER TABLE companions ADD COLUMN IF NOT EXISTS account_number VARCHAR(20);
CREATE INDEX IF NOT EXISTS idx_companions_subaccount ON companions(subaccount_code);
```

### Payments Table (Optional)

```sql
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER NOT NULL,
  reference VARCHAR(255) UNIQUE NOT NULL,
  amount INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'NGN',
  status VARCHAR(50) DEFAULT 'pending',
  refund_status VARCHAR(50),
  paid_at TIMESTAMP,
  refunded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

CREATE INDEX idx_payments_reference ON payments(reference);
CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_payments_status ON payments(status);
```

### Webhook Events Table (Optional)

```sql
CREATE TABLE IF NOT EXISTS webhook_events (
  id SERIAL PRIMARY KEY,
  event_id VARCHAR(255) UNIQUE NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  data JSONB NOT NULL,
  processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_webhook_events_event_id ON webhook_events(event_id);
CREATE INDEX idx_webhook_events_type ON webhook_events(event_type);
```

## Monitoring and Alerts

### Key Metrics to Monitor

1. **Payment Success Rate**
   - Track successful vs failed payments
   - Alert on unusual failure rates

2. **Refund Processing Time**
   - Monitor time from initiation to completion
   - Alert on stuck refunds

3. **Split Payment Accuracy**
   - Verify amounts match expectations
   - Monitor for discrepancies

4. **Webhook Delivery**
   - Track webhook receipt and processing
   - Alert on missed events

### Logging

```javascript
// Log all payment operations
console.log('Payment initialized:', {
  bookingId,
  reference,
  amount,
  timestamp: new Date().toISOString()
})

// Log errors with context
console.error('Payment error:', {
  error: error.message,
  bookingId,
  userId,
  timestamp: new Date().toISOString()
})
```

## Troubleshooting

### Payment Not Processing

1. Check webhook configuration
2. Verify Paystack keys are correct
3. Check webhook signature validation
4. Review Paystack dashboard for errors

### Refund Not Issued

1. Verify payment was successful first
2. Check transaction reference is correct
3. Review Paystack dashboard for refund status
4. Check webhook logs for refund events

### Split Payment Not Working

1. Verify subaccount is active
2. Check subaccount code is correct
3. Ensure payment was initialized with split config
4. Review Paystack dashboard for split details

## Production Checklist

- [ ] Update to production Paystack keys
- [ ] Configure webhook URL in Paystack dashboard
- [ ] Set up webhook signature verification
- [ ] Implement database schema changes
- [ ] Add logging and monitoring
- [ ] Test payment flow end-to-end
- [ ] Test refund flow
- [ ] Test split payment flow
- [ ] Set up alerts for failures
- [ ] Document incident response procedures
