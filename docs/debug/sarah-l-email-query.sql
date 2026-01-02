-- SQL Queries to Check Email Data for Sarah L.
-- Run these in Supabase SQL Editor or via psql

-- 1. First, find Sarah L.'s relationship record and email
SELECT 
  id,
  name,
  email,
  url,
  status,
  created_at
FROM leads
WHERE name ILIKE '%sarah%l%'
ORDER BY created_at DESC
LIMIT 5;

-- 2. Once you have the relationship ID, check all email metadata for that relationship
-- Replace 'RELATIONSHIP_ID_HERE' with the actual ID from query 1
SELECT 
  em.id,
  em.subject,
  em.snippet,
  em.received_at,
  em.from_email_hash,
  em.person_id,
  -- Legacy fields
  em.last_topic,
  em.ask,
  em.sentiment,
  em.intent,
  em.recommended_action_type,
  em.recommended_action_description,
  -- Comprehensive AI fields
  em.thread_summary_1l,
  em.thread_summary_detail,
  em.primary_category,
  em.secondary_categories,
  em.topics_comprehensive,
  em.proposed_tiers,
  em.asks_from_sender,
  em.value_to_capture,
  em.suggested_next_actions,
  em.attachments,
  em.links,
  em.relationship_signal,
  em.processed_at,
  em.created_at
FROM email_metadata em
WHERE em.person_id = 'RELATIONSHIP_ID_HERE'  -- Replace with actual ID
ORDER BY em.received_at DESC;

-- 3. Check if emails exist but aren't matched (by email hash)
-- This requires computing the SHA-256 hash of the email address
-- For rosie@digitalcluesgroup.com, the hash should be: 5e64605a6232e20ff264e2fccbb17b7e76ee6e604697c0f0b2cae9890b09d85a
-- (You can compute this in Node.js or use an online SHA-256 tool)

-- Check unmatched emails by hash (if you know the hash)
SELECT 
  em.id,
  em.subject,
  em.snippet,
  em.received_at,
  em.from_email_hash,
  em.person_id,
  em.thread_summary_1l,
  em.topics_comprehensive,
  em.asks_from_sender
FROM email_metadata em
WHERE em.from_email_hash = '5e64605a6232e20ff264e2fccbb17b7e76ee6e604697c0f0b2cae9890b09d85a'  -- rosie@digitalcluesgroup.com hash
  AND em.person_id IS NULL  -- Unmatched emails
ORDER BY em.received_at DESC;

-- 4. Complete query: Get relationship + all email data in one query
SELECT 
  l.id as relationship_id,
  l.name as relationship_name,
  l.email as relationship_email,
  l.url as relationship_url,
  em.id as email_id,
  em.subject,
  em.snippet,
  em.received_at,
  -- Check which comprehensive fields are populated
  CASE WHEN em.thread_summary_1l IS NOT NULL THEN 'YES' ELSE 'NO' END as has_summary_1l,
  CASE WHEN em.thread_summary_detail IS NOT NULL THEN 'YES' ELSE 'NO' END as has_summary_detail,
  CASE WHEN em.topics_comprehensive IS NOT NULL AND array_length(em.topics_comprehensive, 1) > 0 THEN 'YES' ELSE 'NO' END as has_topics_comprehensive,
  CASE WHEN em.asks_from_sender IS NOT NULL AND array_length(em.asks_from_sender, 1) > 0 THEN 'YES' ELSE 'NO' END as has_asks_from_sender,
  CASE WHEN em.suggested_next_actions IS NOT NULL AND array_length(em.suggested_next_actions, 1) > 0 THEN 'YES' ELSE 'NO' END as has_suggested_actions,
  CASE WHEN em.attachments IS NOT NULL THEN 'YES' ELSE 'NO' END as has_attachments,
  CASE WHEN em.links IS NOT NULL THEN 'YES' ELSE 'NO' END as has_links,
  CASE WHEN em.relationship_signal IS NOT NULL THEN 'YES' ELSE 'NO' END as has_relationship_signal,
  -- Show actual values
  em.topics_comprehensive,
  em.asks_from_sender,
  em.suggested_next_actions,
  em.thread_summary_1l,
  em.relationship_signal,
  em.processed_at
FROM leads l
LEFT JOIN email_metadata em ON em.person_id = l.id
WHERE l.name ILIKE '%sarah%l%'
ORDER BY em.received_at DESC NULLS LAST;

-- 5. Count emails and check comprehensive field population
SELECT 
  l.name,
  l.email,
  COUNT(em.id) as total_emails,
  COUNT(em.thread_summary_1l) as emails_with_summary_1l,
  COUNT(em.topics_comprehensive) FILTER (WHERE em.topics_comprehensive IS NOT NULL AND array_length(em.topics_comprehensive, 1) > 0) as emails_with_topics,
  COUNT(em.asks_from_sender) FILTER (WHERE em.asks_from_sender IS NOT NULL AND array_length(em.asks_from_sender, 1) > 0) as emails_with_asks,
  COUNT(em.suggested_next_actions) FILTER (WHERE em.suggested_next_actions IS NOT NULL AND array_length(em.suggested_next_actions, 1) > 0) as emails_with_actions,
  COUNT(em.relationship_signal) as emails_with_signal,
  MAX(em.received_at) as most_recent_email
FROM leads l
LEFT JOIN email_metadata em ON em.person_id = l.id
WHERE l.name ILIKE '%sarah%l%'
GROUP BY l.id, l.name, l.email;

