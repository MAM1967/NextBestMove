-- Add missing RLS policies for weekly_summaries table
-- The initial schema only had SELECT, but we need INSERT/UPDATE for generation

-- Allow users to insert their own weekly summaries
CREATE POLICY "Users can insert own weekly summaries" ON weekly_summaries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own weekly summaries
CREATE POLICY "Users can update own weekly summaries" ON weekly_summaries
  FOR UPDATE USING (auth.uid() = user_id);


