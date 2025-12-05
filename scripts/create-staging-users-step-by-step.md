# Create Staging Users - Step by Step

## Step 1: Create Auth Users in Staging Dashboard

Go to: https://supabase.com/dashboard/project/adgiptzbxnzddbgfeuut/auth/users

For each user, click "Add User" and enter:

1. **User 1:**
   - Email: `mcddsl@icloud.com`
   - Password: `TestPass123!`
   - Auto Confirm User: ✅ (checked)
   - Copy the User ID (UUID) that's created

2. **User 2:**
   - Email: `mcddsl@gmail.com`
   - Password: `TestPass123!`
   - Auto Confirm User: ✅ (checked)
   - Copy the User ID (UUID) that's created

3. **User 3:**
   - Email: `mcddsl+test1@gmail.com`
   - Password: `TestPass123!`
   - Auto Confirm User: ✅ (checked)
   - Copy the User ID (UUID) that's created

4. **User 4:**
   - Email: `mcddsl+onboard1@gmail.com`
   - Password: `TestPass123!`
   - Auto Confirm User: ✅ (checked)
   - Copy the User ID (UUID) that's created

## Step 2: Update and Run the INSERT Query

1. Open: `scripts/create-staging-users.sql`
2. Replace `USER_ID_1`, `USER_ID_2`, `USER_ID_3`, `USER_ID_4` with the actual UUIDs from Step 1
3. Go to: https://supabase.com/dashboard/project/adgiptzbxnzddbgfeuut/sql/new
4. Paste the updated SQL and run it

## Step 3: Verify

Run this query to verify users were created:

```sql
SELECT id, email, name, created_at 
FROM users 
ORDER BY created_at;
```

You should see all 4 users.

