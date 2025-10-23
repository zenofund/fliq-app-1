# Paystack Payment Flow Diagram

## Complete Booking and Payment Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BOOKING LIFECYCLE WITH PAYMENTS                      │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────┐
│  CLIENT  │
└────┬─────┘
     │
     │ 1. Create Booking
     ├────────────────────────►┌──────────────────┐
     │                         │ POST /api/bookings│
     │                         └─────────┬─────────┘
     │                                   │
     │                         Status: PENDING
     │                         Payment: None
     │                                   │
     │                                   ▼
     │                         ┌─────────────────┐
     │                         │  Notify Companion│
     │                         └─────────────────┘
     │                                   │
     │                                   ▼
                                  ┌──────────┐
                                  │COMPANION │
                                  └────┬─────┘
                                       │
                  ┌────────────────────┼────────────────────┐
                  │                    │                    │
        2a. ACCEPT│         2b. REJECT │         2c. EXPIRE │
                  │                    │                    │
                  ▼                    ▼                    ▼
     ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
     │ PUT /api/bookings│  │ PUT /api/bookings│  │ PUT /api/bookings│
     │ action: accept   │  │ action: reject   │  │ action: expire   │
     └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘
              │                     │                     │
   Status: ACCEPTED      Status: REJECTED      Status: EXPIRED
   Chat: ENABLED         Chat: NEVER           Chat: NEVER
   Payment: Ready        Payment: REFUND       Payment: REFUND
              │                     │                     │
              │                     └─────────┬───────────┘
              │                               │
              │                               ▼
              │                    ┌──────────────────────┐
              │                    │ Initiate Refund      │
              │                    │ (if payment made)    │
              │                    └──────────────────────┘
              │
              │ 3. Initialize Payment
              │    with Split Config
              ├────────────────────►┌──────────────────────┐
              │                     │POST /api/payments/   │
              │                     │     paystack         │
              │                     │                      │
              │                     │ companionSubaccount  │
              │                     └───────────┬──────────┘
              │                                 │
              │                    ┌────────────▼──────────┐
              │                    │   PAYSTACK API        │
              │                    │ Initialize Payment    │
              │                    │ with Split Config     │
              │                    └────────────┬──────────┘
              │                                 │
              │◄────────────────────────────────┤
              │    Authorization URL            │
              │                                 │
              │ 4. Complete Payment            │
              ├────────────────────►┌───────────▼──────────┐
              │                     │  PAYSTACK CHECKOUT   │
              │                     │                      │
              │                     │ Client pays with card│
              │                     └───────────┬──────────┘
              │                                 │
              │                                 │ Funds HELD by Paystack
              │                                 │
              │                                 │ 5. Webhook Event
              │                                 ▼
              │                     ┌────────────────────────┐
              │                     │ POST /api/paystack/    │
              │◄────────────────────│      webhook           │
              │  Update Status      │                        │
              │                     │ Event: charge.success  │
              │                     └────────────────────────┘
              │
              │ Payment Status: PAID
              │
              │ 6. Service Delivery
              │    (Companion provides service)
              │
              │ 7. Complete Booking
              ▼
┌──────────┐                        
│COMPANION │                        
└────┬─────┘                        
     │                               
     │ Mark as Complete              
     ├────────────────────►┌──────────────────────┐
     │                     │ PUT /api/bookings    │
     │                     │ action: complete     │
     │                     └───────────┬──────────┘
     │                                 │
     │                     Status: COMPLETED
     │                     Chat: DISABLED
     │                     Payment: SPLIT
     │                                 │
     │                                 ▼
     │                     ┌────────────────────────┐
     │                     │   PAYSTACK             │
     │                     │ Automatic Split Payment│
     │                     │                        │
     │                     │ Platform: Service Fee  │
     │                     │ Companion: Rest        │
     │                     └────────┬───────────────┘
     │                              │
     │                              │ 8. Webhook Event
     │                              ▼
     │                     ┌────────────────────────┐
     │◄────────────────────│ POST /api/paystack/    │
     │  Notify Payment OK  │      webhook           │
     │                     │                        │
     │                     │ Event: transfer.success│
     │                     └────────────────────────┘
     │
     ▼
┌────────────────┐
│ PAYMENT COMPLETE│
│                │
│ ✓ Client charged│
│ ✓ Companion paid│
│ ✓ Platform fee  │
└────────────────┘
```

## Refund Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              REFUND WORKFLOW                                 │
└─────────────────────────────────────────────────────────────────────────────┘

TRIGGER: Booking Rejected/Cancelled/Expired
         (after payment was made)

     ┌──────────────────────┐
     │ PUT /api/bookings    │
     │ action: reject/      │
     │         cancel/      │
     │         expire       │
     └───────────┬──────────┘
                 │
                 │ Detect Payment Made
                 │
                 ▼
     ┌─────────────────────────┐
     │ Initiate Refund         │
     │                         │
     │ lib/paystack.js:        │
     │ initiateRefund()        │
     └───────────┬─────────────┘
                 │
                 ▼
     ┌─────────────────────────┐
     │   PAYSTACK API          │
     │ Process Refund          │
     └───────────┬─────────────┘
                 │
                 │ Refund Processing
                 │
                 ▼
     ┌─────────────────────────┐
     │ POST /api/paystack/     │
     │      webhook            │
     │                         │
     │ Event: refund.processed │
     └───────────┬─────────────┘
                 │
                 │ Update Status
                 │
                 ▼
     ┌─────────────────────────┐
     │ Payment Status:         │
     │ REFUNDED               │
     │                         │
     │ ✓ Client refunded       │
     │ ✓ Booking cancelled     │
     └─────────────────────────┘
```

## Split Payment Detail

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SPLIT PAYMENT BREAKDOWN                             │
└─────────────────────────────────────────────────────────────────────────────┘

Example: ₦50,000 Booking

┌────────────────────────────────────────┐
│  CLIENT PAYMENT                        │
│  ₦50,000                               │
└──────────────┬─────────────────────────┘
               │
               │ Paystack processes payment
               │ (with split configuration)
               │
               ▼
┌──────────────────────────────────────────────┐
│  PAYSTACK SPLIT CALCULATION                  │
│                                              │
│  Total:                      ₦50,000        │
│  Paystack Fee (1.5% + ₦100): ₦850          │
│  Platform Service Fee:       ₦850 (keeps fee)│
│  Companion Amount:           ₦49,150        │
└──────────────┬──────────────┬────────────────┘
               │              │
               │              │
    ┌──────────▼─────┐   ┌───▼────────────┐
    │   PLATFORM     │   │  COMPANION     │
    │   ACCOUNT      │   │  SUBACCOUNT    │
    │                │   │                │
    │   Receives:    │   │  Receives:     │
    │   ₦850        │   │  ₦49,150      │
    │   (fee only)   │   │  (service pay) │
    └────────────────┘   └────────────────┘
```

## API Flow Summary

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         API ENDPOINTS INTERACTION                            │
└─────────────────────────────────────────────────────────────────────────────┘

COMPANION SETUP:
┌─────────────────────────────────────────┐
│ 1. POST /api/paystack/verify-bank       │ ← Verify bank details
├─────────────────────────────────────────┤
│ 2. POST /api/paystack/create-subaccount │ ← Create payment account
└─────────────────────────────────────────┘

BOOKING & PAYMENT:
┌─────────────────────────────────────────┐
│ 1. POST /api/bookings                   │ ← Create booking
├─────────────────────────────────────────┤
│ 2. PUT /api/bookings (accept)           │ ← Companion accepts
├─────────────────────────────────────────┤
│ 3. POST /api/payments/paystack          │ ← Initialize payment
│    - Include companionSubaccount        │   with split config
├─────────────────────────────────────────┤
│ 4. Client completes payment             │ ← Paystack checkout
├─────────────────────────────────────────┤
│ 5. POST /api/paystack/webhook           │ ← charge.success
│    - Update payment status              │   event received
├─────────────────────────────────────────┤
│ 6. PUT /api/bookings (complete)         │ ← Companion completes
│    - Triggers split payment             │   service
├─────────────────────────────────────────┤
│ 7. POST /api/paystack/webhook           │ ← transfer.success
│    - Confirm split payment              │   event received
└─────────────────────────────────────────┘

REFUND SCENARIO:
┌─────────────────────────────────────────┐
│ 1. PUT /api/bookings (reject/cancel)    │ ← Booking cancelled
│    - Automatically initiates refund     │
├─────────────────────────────────────────┤
│ 2. POST /api/paystack/webhook           │ ← refund.processed
│    - Confirm refund completed           │   event received
└─────────────────────────────────────────┘
```

## Status Transitions

```
BOOKING STATUS FLOW:
┌─────────┐    accept    ┌──────────┐   complete   ┌───────────┐
│ PENDING ├─────────────►│ ACCEPTED ├─────────────►│ COMPLETED │
└────┬────┘              └────┬─────┘              └───────────┘
     │                        │
     │ reject/expire          │ cancel
     │                        │
     ▼                        ▼
┌──────────┐            ┌───────────┐
│ REJECTED │            │ CANCELLED │
│ EXPIRED  │            └───────────┘
└──────────┘

PAYMENT STATUS FLOW:
┌────────┐     paid      ┌──────┐  refund_pending  ┌──────────┐
│ UNPAID ├──────────────►│ PAID ├─────────────────►│ REFUNDED │
└────────┘               └───┬──┘                  └──────────┘
                             │
                             │ complete
                             ▼
                      ┌─────────────┐
                      │ SPLIT_PAID  │
                      └─────────────┘

CHAT AVAILABILITY:
┌─────────┐ ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌───────────┐
│ PENDING │ │ ACCEPTED │ │ COMPLETED │ │ REJECTED │ │ CANCELLED │
│    ❌   │ │    ✅    │ │     ❌    │ │    ❌    │ │     ❌    │
└─────────┘ └──────────┘ └───────────┘ └──────────┘ └───────────┘
```
