-- Add INSERT policy for billing_customers
-- Users can create their own billing customer record
CREATE POLICY "Users can create own billing customer" ON billing_customers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add INSERT policy for billing_subscriptions
-- This is typically done server-side via webhooks, but allow users to view
-- Note: INSERTs are usually done via service role in webhook handler
-- We'll add a policy for completeness, though webhooks use service role
CREATE POLICY "Users can view own billing subscriptions" ON billing_subscriptions
  FOR SELECT USING (
    auth.uid() = (
      SELECT user_id FROM billing_customers WHERE id = billing_customer_id
    )
  );






