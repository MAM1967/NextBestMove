# Past Due vs Canceled: Subscription Status Scenarios

## Key Difference

**`past_due`**: Payment failed, but Stripe is still trying to collect payment (retry attempts active)  
**`canceled`**: Subscription has been canceled (either by user or after Stripe exhausts retry attempts)

---

## Real-World Scenario: Payment Failure Flow

### Step 1: User Has Active Subscription
- Status: `active`
- User is paying monthly, subscription renews automatically

### Step 2: Payment Fails (Card Expired/Insufficient Funds)
**What Happens:**
1. Stripe attempts to charge the card on renewal date
2. Payment fails (card declined, expired, insufficient funds, etc.)
3. Stripe sends `invoice.payment_failed` webhook
4. Our webhook handler sets status to `past_due`

**Status:** `past_due`  
**User Experience:**
- User sees "Payment failed — Update to keep your streak alive" banner
- PaywallOverlay shows amber "Payment Failed" badge
- User can still access their data (read-only mode)
- User can update payment method via billing portal

### Step 3: Stripe Retry Attempts
**What Happens:**
- Stripe automatically retries payment (typically 3-4 times over several days)
- Each retry attempt may send another `invoice.payment_failed` webhook
- Status remains `past_due` during retry period

**Status:** Still `past_due`  
**User Experience:**
- Same as Step 2
- User has time to update payment method
- Subscription is not canceled yet

### Step 4A: User Updates Payment Method (Success Path)
**What Happens:**
1. User updates payment method in Stripe billing portal
2. Stripe retries payment with new card
3. Payment succeeds
4. Stripe sends `invoice.paid` webhook
5. Our webhook handler calls `handleSubscriptionUpdated()`
6. Status changes back to `active`

**Status:** `active`  
**User Experience:**
- Full access restored
- No paywall
- Subscription continues normally

### Step 4B: Stripe Exhausts Retry Attempts (Failure Path)
**What Happens:**
1. Stripe tries payment multiple times (default: 3-4 attempts over ~1 week)
2. All retry attempts fail
3. Stripe automatically cancels the subscription
4. Stripe sends `customer.subscription.deleted` webhook
5. Our webhook handler sets status to `canceled`

**Status:** `canceled`  
**User Experience:**
- PaywallOverlay shows "Your plan is paused" message
- User can reactivate subscription
- Data is preserved

---

## When Each Status Occurs

### `past_due` Status
**Triggers:**
- `invoice.payment_failed` webhook received
- Payment attempt failed, but retries are still possible
- User has time to fix payment method

**Duration:**
- Typically 3-7 days (while Stripe retries)
- Ends when payment succeeds OR retries are exhausted

**User Actions:**
- Update payment method via billing portal
- Payment will be retried automatically

### `canceled` Status
**Triggers:**
- `customer.subscription.deleted` webhook received
- User manually canceled subscription
- Stripe exhausted all retry attempts
- Subscription period ended with `cancel_at_period_end = true`

**Duration:**
- Permanent (until user reactivates)

**User Actions:**
- Reactivate subscription (creates new subscription)
- Or start fresh with new checkout

---

## Code Flow

### Webhook Handler Logic

```typescript
// When invoice payment fails
case "invoice.payment_failed": {
  // Sets status to past_due
  await supabase
    .from("billing_subscriptions")
    .update({ status: "past_due" })
    .eq("stripe_subscription_id", subscriptionId);
}

// When subscription is deleted
case "customer.subscription.deleted": {
  // Sets status to canceled
  await supabase
    .from("billing_subscriptions")
    .update({ status: "canceled" })
    .eq("stripe_subscription_id", subscription.id);
}

// When subscription is updated
case "customer.subscription.updated": {
  // Maps Stripe status directly
  if (subscription.status === "past_due") status = "past_due";
  else if (subscription.status === "canceled") status = "canceled";
  // ... updates database
}
```

---

## Testing Scenarios

### Test Past Due Status
```sql
-- Simulate payment failure
UPDATE billing_subscriptions 
SET status = 'past_due'
WHERE billing_customer_id = (
  SELECT id FROM billing_customers 
  WHERE user_id = 'YOUR_USER_ID'
);
```

**Expected:**
- PaywallOverlay shows "Payment failed — Update to keep your streak alive"
- Amber badge: "Payment Failed"
- CTA: "Update Payment Method"

### Test Canceled Status
```sql
-- Simulate canceled subscription
UPDATE billing_subscriptions 
SET status = 'canceled',
    trial_ends_at = NOW() - INTERVAL '10 days'
WHERE billing_customer_id = (
  SELECT id FROM billing_customers 
  WHERE user_id = 'YOUR_USER_ID'
);
```

**Expected:**
- PaywallOverlay shows "Your plan is paused"
- CTA: "Reactivate Subscription"

---

## Summary

| Status | When It Happens | User Can Fix? | Duration |
|--------|----------------|---------------|----------|
| `past_due` | Payment failed, retries active | Yes (update payment method) | 3-7 days (retry period) |
| `canceled` | Subscription deleted/retries exhausted | Yes (reactivate) | Permanent until reactivated |

**Key Insight:** `past_due` is a temporary state during payment retry attempts. `canceled` is a permanent state that requires user action to reactivate.

