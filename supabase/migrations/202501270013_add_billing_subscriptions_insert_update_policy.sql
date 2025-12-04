-- Add INSERT and UPDATE policies for billing_subscriptions
-- These are needed for webhook handlers and sync operations

-- Allow INSERT for subscriptions (webhook handler creates them)
-- Note: This uses service role in production, but for local dev we need user-level access
CREATE POLICY "Users can create own subscriptions" ON billing_subscriptions
  FOR INSERT WITH CHECK (
    auth.uid() = (
      SELECT user_id FROM billing_customers WHERE id = billing_customer_id
    )
  );

-- Allow UPDATE for subscriptions (webhook handler updates them)
CREATE POLICY "Users can update own subscriptions" ON billing_subscriptions
  FOR UPDATE USING (
    auth.uid() = (
      SELECT user_id FROM billing_customers WHERE id = billing_customer_id
    )
  );







