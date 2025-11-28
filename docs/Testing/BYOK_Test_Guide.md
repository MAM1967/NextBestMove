# BYOK Testing Guide

## Quick Setup for Testing BYOK Feature

### Option 1: Create Premium Subscription via SQL (Fastest)

1. **Find your user ID:**
   ```sql
   SELECT id, email FROM users WHERE email = 'your-email@example.com';
   ```

2. **Run the test premium subscription script:**
   ```sql
   -- In Supabase SQL Editor, run:
   -- supabase/migrations/202501280001_create_test_premium_user.sql
   ```

3. **Verify premium status:**
   ```sql
   SELECT 
     u.email,
     bs.status,
     bs.metadata->>'plan_type' as plan_type
   FROM users u
   JOIN billing_customers bc ON bc.user_id = u.id
   JOIN billing_subscriptions bs ON bs.billing_customer_id = bc.id
   WHERE u.email = 'your-email@example.com'
     AND bs.status IN ('active', 'trialing');
   ```

### Option 2: Use Stripe Checkout (More Realistic)

1. **Navigate to Settings → Billing**
2. **Click "Start Free Trial" or "Upgrade"**
3. **Select "Professional" plan**
4. **Complete checkout (use Stripe test mode)**

### Testing BYOK

Once you have a premium subscription:

1. **Navigate to Settings → AI Preferences**
   - You should see the BYOK section (not the "Premium feature" placeholder)

2. **Test API Key Validation:**
   - Enter an invalid key (e.g., "test") → Should show error
   - Enter a valid OpenAI key format (starts with "sk-") → Should accept

3. **Test Key:**
   - Enter a valid OpenAI API key
   - Click "Test Key" → Should validate against OpenAI API
   - If valid, you'll see success message

4. **Save Preferences:**
   - Select a model (e.g., "GPT-4o Mini")
   - Click "Save" → Should save and reload page
   - Verify in database:
     ```sql
     SELECT ai_provider, ai_model, 
            CASE WHEN ai_api_key_encrypted IS NOT NULL THEN 'Key saved' ELSE 'No key' END as key_status
     FROM users 
     WHERE email = 'your-email@example.com';
     ```

5. **Test Content Generation:**
   - Generate a weekly summary (if you have ≥6 completed actions)
   - Content prompts should use your API key and selected model
   - Check logs to verify user key is being used

6. **Test Fallback:**
   - Enter an invalid API key and save
   - Generate content → Should fallback to system key
   - Check console logs for fallback message

7. **Remove API Key:**
   - Click "Remove API key and use system default"
   - Should switch back to system key
   - Verify `ai_provider` is set to "system"

## Expected Behavior

### Premium Users
- ✅ See full BYOK UI in Settings
- ✅ Can enter and save API key
- ✅ Can select model
- ✅ Can test API key
- ✅ Can remove API key

### Standard Users
- ✅ See "Premium feature" placeholder
- ❌ Cannot access BYOK features

### API Behavior
- ✅ Uses user's API key if configured
- ✅ Falls back to system key if user key fails
- ✅ Uses user's selected model
- ✅ Falls back to gpt-4o-mini if no model selected

## Troubleshooting

### "Premium subscription required" error
- Verify subscription status is "active" or "trialing"
- Verify `metadata->>'plan_type'` is "professional"
- Check that `billing_customers` record exists

### API key not working
- Verify key format (starts with "sk-")
- Test key directly with OpenAI API
- Check encryption/decryption is working
- Verify key is being passed to OpenAI client

### Model not being used
- Verify `ai_model` is saved in database
- Check that `userModel` is passed to `generateWithAI`
- Verify model name is valid OpenAI model

