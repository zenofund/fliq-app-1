# Paystack Payment Integration - Manual Testing Guide

This guide provides step-by-step instructions for manually testing the Paystack payment integration.

## Prerequisites

1. **Paystack Test Account**
   - Sign up at https://paystack.com
   - Get test API keys from Dashboard > Settings > API Keys & Webhooks
   - Configure webhook URL: `{YOUR_APP_URL}/api/paystack/webhook`

2. **Environment Setup**
   ```bash
   # .env.local
   PAYSTACK_SECRET_KEY=sk_test_xxxxx
   NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxxx
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

## Test Scenarios

### 1. Bank Account Verification

**Purpose**: Verify that companions can verify their bank accounts before creating subaccounts.

**Steps**:

1. Use a test tool like Postman or curl to make a request:

```bash
curl -X POST http://localhost:3000/api/paystack/verify-bank \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test_token" \
  -d '{
    "accountNumber": "0123456789",
    "bankCode": "058"
  }'
```

**Expected Response**:
```json
{
  "message": "Bank account verified successfully",
  "accountName": "JOHN DOE",
  "accountNumber": "0123456789",
  "bankId": "058"
}
```

**Validation**:
- ✅ Returns 200 status code
- ✅ Response includes account name
- ✅ Invalid account returns error
- ✅ Missing fields returns 400 error

### 2. Subaccount Creation

**Purpose**: Create a Paystack subaccount for a companion.

**Steps**:

1. First verify the bank account (see above)
2. Create subaccount with verified details:

```bash
curl -X POST http://localhost:3000/api/paystack/create-subaccount \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer companion_token" \
  -d '{
    "businessName": "Jane Doe Companion Services",
    "settlementBank": "058",
    "accountNumber": "0123456789",
    "percentageCharge": 0,
    "description": "Companion payment account"
  }'
```

**Expected Response**:
```json
{
  "message": "Subaccount created successfully",
  "subaccountCode": "ACCT_xxxxx",
  "percentageCharge": 0
}
```

**Validation**:
- ✅ Returns 201 status code
- ✅ Response includes subaccount code
- ✅ Subaccount appears in Paystack dashboard
- ✅ Only companions can create subaccounts (403 for clients)

### 3. Payment Initialization (Standard)

**Purpose**: Initialize a payment without split configuration.

**Steps**:

```bash
curl -X POST http://localhost:3000/api/payments/paystack \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer client_token" \
  -d '{
    "bookingId": "123",
    "amount": 50000,
    "currency": "NGN"
  }'
```

**Expected Response**:
```json
{
  "message": "Payment initialized",
  "authorizationUrl": "https://checkout.paystack.com/xxxxx",
  "reference": "booking_123_1234567890",
  "accessCode": "xxxxx"
}
```

**Validation**:
- ✅ Returns 200 status code
- ✅ Authorization URL is valid
- ✅ Reference includes booking ID
- ✅ Can complete payment using test card: 4084 0840 8408 4081

### 4. Payment Initialization (With Split)

**Purpose**: Initialize a payment with split payment to companion subaccount.

**Steps**:

```bash
curl -X POST http://localhost:3000/api/payments/paystack \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer client_token" \
  -d '{
    "bookingId": "124",
    "amount": 50000,
    "currency": "NGN",
    "companionSubaccount": "ACCT_xxxxx"
  }'
```

**Expected Response**:
```json
{
  "message": "Payment initialized",
  "authorizationUrl": "https://checkout.paystack.com/xxxxx",
  "reference": "booking_124_1234567890",
  "accessCode": "xxxxx"
}
```

**Validation**:
- ✅ Returns 200 status code
- ✅ Payment includes split configuration
- ✅ Check Paystack dashboard to verify split setup
- ✅ Complete payment and verify split in transaction details

### 5. Webhook - Successful Payment

**Purpose**: Test webhook processing for successful payment.

**Steps**:

1. Complete a payment using test card
2. Or manually send test webhook from Paystack dashboard:

```bash
# Simulate webhook (with proper signature)
curl -X POST http://localhost:3000/api/paystack/webhook \
  -H "Content-Type: application/json" \
  -H "x-paystack-signature: {computed_signature}" \
  -d '{
    "event": "charge.success",
    "data": {
      "reference": "booking_123_1234567890",
      "amount": 50000,
      "currency": "NGN",
      "status": "success",
      "metadata": {
        "bookingId": "123"
      }
    }
  }'
```

**Expected Response**:
```json
{
  "message": "Webhook received"
}
```

**Validation**:
- ✅ Returns 200 status code
- ✅ Event is logged in console
- ✅ Payment status updated (when DB is connected)
- ✅ Invalid signature returns 401

### 6. Booking Status Updates

**Purpose**: Test booking status transitions and payment handling.

#### 6a. Accept Booking

```bash
curl -X PUT http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer companion_token" \
  -d '{
    "bookingId": "123",
    "action": "accept"
  }'
```

**Expected Response**:
```json
{
  "message": "Booking accepted successfully",
  "bookingId": "123",
  "status": "accepted",
  "chatAvailable": true,
  "paymentAction": "none"
}
```

**Validation**:
- ✅ Status changes to accepted
- ✅ Chat becomes available
- ✅ Payment can be initialized after acceptance

#### 6b. Complete Booking

```bash
curl -X PUT http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer companion_token" \
  -d '{
    "bookingId": "123",
    "action": "complete"
  }'
```

**Expected Response**:
```json
{
  "message": "Booking completed successfully",
  "bookingId": "123",
  "status": "completed",
  "chatAvailable": false,
  "paymentAction": "split_payment_processed"
}
```

**Validation**:
- ✅ Status changes to completed
- ✅ Chat becomes unavailable
- ✅ Split payment processed (if configured)
- ✅ Companion receives funds (check Paystack dashboard)

#### 6c. Reject Booking

```bash
curl -X PUT http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer companion_token" \
  -d '{
    "bookingId": "124",
    "action": "reject"
  }'
```

**Expected Response**:
```json
{
  "message": "Booking rejected successfully",
  "bookingId": "124",
  "status": "rejected",
  "chatAvailable": false,
  "paymentAction": "refund_initiated"
}
```

**Validation**:
- ✅ Status changes to rejected
- ✅ Chat never becomes available
- ✅ Refund initiated (if payment was made)
- ✅ Webhook receives refund event

#### 6d. Cancel Booking

```bash
curl -X PUT http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer client_token" \
  -d '{
    "bookingId": "125",
    "action": "cancel"
  }'
```

**Expected Response**:
```json
{
  "message": "Booking cancelled successfully",
  "bookingId": "125",
  "status": "cancelled",
  "chatAvailable": false,
  "paymentAction": "refund_initiated"
}
```

**Validation**:
- ✅ Status changes to cancelled
- ✅ Chat becomes unavailable
- ✅ Refund initiated (if payment was made)

#### 6e. Expire Booking

```bash
curl -X PUT http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer system_token" \
  -d '{
    "bookingId": "126",
    "action": "expire"
  }'
```

**Expected Response**:
```json
{
  "message": "Booking expired successfully",
  "bookingId": "126",
  "status": "expired",
  "chatAvailable": false,
  "paymentAction": "refund_initiated"
}
```

**Validation**:
- ✅ Status changes to expired
- ✅ Chat never becomes available
- ✅ Refund initiated (if payment was made)

### 7. Webhook - Refund Processing

**Purpose**: Test webhook processing for refund events.

**Steps**:

Send test webhook from Paystack dashboard or wait for actual refund:

```bash
curl -X POST http://localhost:3000/api/paystack/webhook \
  -H "Content-Type: application/json" \
  -H "x-paystack-signature: {computed_signature}" \
  -d '{
    "event": "refund.processed",
    "data": {
      "transaction": "booking_124_1234567890",
      "transaction_reference": "booking_124_1234567890",
      "amount": 50000,
      "currency": "NGN",
      "status": "processed"
    }
  }'
```

**Expected Response**:
```json
{
  "message": "Webhook received"
}
```

**Validation**:
- ✅ Returns 200 status code
- ✅ Refund logged in console
- ✅ Payment status updated to refunded (when DB connected)

### 8. Error Handling

#### 8a. Invalid Bank Account

```bash
curl -X POST http://localhost:3000/api/paystack/verify-bank \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test_token" \
  -d '{
    "accountNumber": "9999999999",
    "bankCode": "058"
  }'
```

**Expected**: 400 error with message about invalid account

#### 8b. Missing Required Fields

```bash
curl -X POST http://localhost:3000/api/payments/paystack \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer client_token" \
  -d '{
    "amount": 50000
  }'
```

**Expected**: 400 error listing required fields

#### 8c. Invalid Webhook Signature

```bash
curl -X POST http://localhost:3000/api/paystack/webhook \
  -H "Content-Type: application/json" \
  -H "x-paystack-signature: invalid_signature" \
  -d '{"event": "charge.success"}'
```

**Expected**: 401 error for invalid signature

## Integration Testing

### Complete Booking Flow

1. **Create Companion Subaccount**
   - Verify bank account
   - Create subaccount
   - Save subaccount code

2. **Create Booking**
   - Client creates booking (status: pending)

3. **Accept Booking**
   - Companion accepts booking (status: accepted)
   - Chat becomes available

4. **Initialize Payment**
   - Initialize payment with split configuration
   - Include companion subaccount code

5. **Complete Payment**
   - Use test card: 4084 0840 8408 4081
   - Verify webhook receives charge.success event
   - Verify payment status updates

6. **Complete Booking**
   - Companion marks booking as completed
   - Verify split payment processes
   - Check Paystack dashboard for split details
   - Chat becomes unavailable

### Refund Flow

1. **Create and Pay for Booking**
   - Initialize payment
   - Complete payment

2. **Reject Booking**
   - Companion rejects booking
   - Verify refund is initiated
   - Check Paystack dashboard for refund

3. **Verify Refund Webhook**
   - Wait for refund.processed webhook
   - Verify event is processed correctly

## Paystack Dashboard Verification

After each test, verify in Paystack Dashboard:

1. **Transactions**
   - View all transactions
   - Check payment status
   - Verify amounts

2. **Subaccounts**
   - View created subaccounts
   - Check settlement details
   - Verify percentage charges

3. **Transfers**
   - View companion payouts
   - Verify amounts after split
   - Check transfer status

4. **Refunds**
   - View refund history
   - Verify refund amounts
   - Check refund status

5. **Webhooks**
   - View webhook logs
   - Check delivery status
   - Review event data

## Checklist

Use this checklist to track testing progress:

- [ ] Bank account verification works
- [ ] Subaccount creation successful
- [ ] Standard payment initialization works
- [ ] Split payment initialization works
- [ ] Test card payment completes
- [ ] Webhook signature verification works
- [ ] charge.success webhook processes
- [ ] Booking accept flow works
- [ ] Booking complete triggers split payment
- [ ] Booking reject triggers refund
- [ ] Booking cancel triggers refund
- [ ] Booking expire triggers refund
- [ ] refund.processed webhook processes
- [ ] Error handling works for invalid inputs
- [ ] Unauthorized access returns 401/403
- [ ] All endpoints return proper status codes

## Common Issues

### Issue: Webhook signature validation fails
**Solution**: Ensure PAYSTACK_SECRET_KEY is correct and webhook body is raw (not parsed)

### Issue: Subaccount creation fails
**Solution**: Verify bank account first and ensure all required fields are provided

### Issue: Split payment not working
**Solution**: Verify subaccount code is correct and active in Paystack dashboard

### Issue: Refund not processing
**Solution**: Check that original payment was successful and transaction reference is correct

## Notes

- All tests use Paystack test mode
- Test cards will not charge real money
- Webhooks may have a delay in delivery
- Check Paystack dashboard for detailed transaction logs
- Save all test IDs and references for debugging
