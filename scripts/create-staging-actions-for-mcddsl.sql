-- Seed sample leads + actions for cognitive-load testing on staging
-- Target user: email = 'mcddsl@icloud.com'
--
-- Usage:
--   1. Open Supabase SQL editor for the **staging** project
--   2. Paste this entire script and run it once
--   3. Then sign in as mcddsl@icloud.com on staging and open the Actions page
--
-- This script:
--   - Looks up the user_id from auth.users by email
--   - Creates 6 sample leads (people)
--   - Creates 6 actions, one per person, spread across:
--       * Needs attention now (overdue + today)
--       * Conversations in motion (follow-ups / replied)
--       * Stay top of mind (nurture)
--       * Optional / background (content)

with u as (
  select id as user_id
  from auth.users
  where email = 'mcddsl@icloud.com'
  limit 1
),
created_leads as (
  insert into public.leads (
    id,
    user_id,
    name,
    url,
    notes,
    status,
    snooze_until,
    created_at,
    updated_at
  )
  select
    gen_random_uuid(),
    u.user_id,
    'Karen – RevOps lead',
    'https://linkedin.com/in/karen-example',
    'ICP who cares a lot about pacing and cognitive load.',
    'ACTIVE'::lead_status,
    null::date,
    now(),
    now()
  from u
  union all
  select
    gen_random_uuid(),
    u.user_id,
    'Mike O''Brien – Fractional CMO',
    'https://linkedin.com/in/mike-obrien-example',
    'Met at SaaS dinner. Warm contact.',
    'ACTIVE'::lead_status,
    null::date,
    now(),
    now()
  from u
  union all
  select
    gen_random_uuid(),
    u.user_id,
    'Sarah L. – Consultant',
    'https://linkedin.com/in/sarah-l-example',
    'Referral from existing client.',
    'ACTIVE'::lead_status,
    null::date,
    now(),
    now()
  from u
  union all
  select
    gen_random_uuid(),
    u.user_id,
    'Luis – Product marketing lead',
    'https://linkedin.com/in/luis-example',
    'PMM contact who cares about narrative and positioning.',
    'ACTIVE'::lead_status,
    null::date,
    now(),
    now()
  from u
  union all
  select
    gen_random_uuid(),
    u.user_id,
    'Amira – CS leader',
    'https://linkedin.com/in/amira-example',
    'Customer success leader focused on renewals.',
    'ACTIVE'::lead_status,
    null::date,
    now(),
    now()
  from u
  returning *
),
-- Helper CTE to name leads for readability
l as (
  select
    id,
    user_id,
    name,
    (row_number() over (order by created_at)) as idx
  from created_leads
)
insert into public.actions (
  id,
  user_id,
  person_id,
  action_type,
  state,
  description,
  due_date,
  completed_at,
  snooze_until,
  notes,
  auto_created,
  created_at,
  updated_at
)
-- 1) Needs attention now – follow-up due today (Karen)
select
  gen_random_uuid(),
  l.user_id,
  l.id,
  'FOLLOW_UP'::action_type,
  'NEW'::action_state,
  'Follow up on last week''s call with ' || l.name,
  current_date, -- due today (treat as urgent; CHECK constraint disallows past dates)
  null::timestamptz,
  null::date,
  'Important thread that stalled – good test for “Needs attention now”.',
  false,
  now(),
  now()
from l
where l.idx = 1

union all

-- 2) Needs attention now – due today outreach (Mike)
select
  gen_random_uuid(),
  l.user_id,
  l.id,
  'OUTREACH'::action_type,
  'NEW'::action_state,
  'Start conversation about Q1 plan with ' || l.name,
  current_date, -- due today
  null::timestamptz,
  null::date,
  'Top of list outreach item for today.',
  false,
  now(),
  now()
from l
where l.idx = 2

union all

-- 3) Conversations in motion – scheduled follow-up (Sarah)
select
  gen_random_uuid(),
  l.user_id,
  l.id,
  'FOLLOW_UP'::action_type,
  'NEW'::action_state,
  'Advance conversation – next step after proposal',
  (current_date + interval '3 days')::date,
  null::timestamptz,
  null::date,
  'Follow-up already scheduled. Good example of “conversations in motion”.',
  true,
  now(),
  now()
from l
where l.idx = 3

union all

-- 4) Conversations in motion – recently replied thread (Luis)
select
  gen_random_uuid(),
  l.user_id,
  l.id,
  'FOLLOW_UP'::action_type,
  'REPLIED'::action_state,
  'Reply received – decide next move with ' || l.name,
  (current_date + interval '5 days')::date,
  null::timestamptz,
  null::date,
  'Simulates a thread where the other side replied recently.',
  true,
  now(),
  now()
from l
where l.idx = 4

union all

-- 5) Stay top of mind – nurture check-in (Amira)
select
  gen_random_uuid(),
  l.user_id,
  l.id,
  'NURTURE'::action_type,
  'NEW'::action_state,
  'Check in – see how things are going this quarter',
  (current_date + interval '10 days')::date,
  null::timestamptz,
  null::date,
  'Low-frequency touch to keep relationship warm.',
  false,
  now(),
  now()
from l
where l.idx = 5

union all

-- 6) Optional / background – content task (new person)
select
  gen_random_uuid(),
  l.user_id,
  l.id,
  'CONTENT'::action_type,
  'NEW'::action_state,
  'Draft LinkedIn post: How I structure my relationship work',
  (current_date + interval '7 days')::date,
  null::timestamptz,
  null::date,
  'Nice-to-do content task that should land in Optional / background.',
  false,
  now(),
  now()
from l
where l.idx = 6;


