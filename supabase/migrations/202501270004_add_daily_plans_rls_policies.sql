-- Add RLS policies for daily_plans and daily_plan_actions
-- These policies allow users to manage (INSERT/UPDATE/DELETE) their own daily plans

-- Add INSERT/UPDATE/DELETE policy for daily_plans
CREATE POLICY "Users can manage own daily plans" ON daily_plans
  FOR ALL USING (auth.uid() = user_id);

-- Add policies for daily_plan_actions
-- Users can view their own daily_plan_actions (through daily_plans they own)
CREATE POLICY "Users can view own daily plan actions" ON daily_plan_actions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM daily_plans
      WHERE daily_plans.id = daily_plan_actions.daily_plan_id
      AND daily_plans.user_id = auth.uid()
    )
  );

-- Users can insert their own daily_plan_actions (through daily_plans they own)
CREATE POLICY "Users can insert own daily plan actions" ON daily_plan_actions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM daily_plans
      WHERE daily_plans.id = daily_plan_actions.daily_plan_id
      AND daily_plans.user_id = auth.uid()
    )
  );

-- Users can update their own daily_plan_actions (through daily_plans they own)
CREATE POLICY "Users can update own daily plan actions" ON daily_plan_actions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM daily_plans
      WHERE daily_plans.id = daily_plan_actions.daily_plan_id
      AND daily_plans.user_id = auth.uid()
    )
  );

-- Users can delete their own daily_plan_actions (through daily_plans they own)
CREATE POLICY "Users can delete own daily plan actions" ON daily_plan_actions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM daily_plans
      WHERE daily_plans.id = daily_plan_actions.daily_plan_id
      AND daily_plans.user_id = auth.uid()
    )
  );







