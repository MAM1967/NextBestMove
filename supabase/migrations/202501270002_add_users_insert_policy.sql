-- Add INSERT policy for users table to allow profile creation on sign-up
-- Users can insert their own profile record using their auth.uid()

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Also allow UPDATE for users to update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE
  USING (auth.uid() = id);


