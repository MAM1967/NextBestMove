-- Add DELETE policy for users table to allow account deletion
-- Users can delete their own profile (for GDPR compliance)

CREATE POLICY "Users can delete own profile" ON users
  FOR DELETE
  USING (auth.uid() = id);





