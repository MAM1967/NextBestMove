-- Verify that reprocess populated comprehensive AI fields
-- Run this after calling the reprocess API

SELECT 
  id,
  subject,
  received_at,
  -- Check if full_body was populated
  CASE WHEN full_body IS NOT NULL THEN 'YES' ELSE 'NO' END as has_full_body,
  LENGTH(full_body) as full_body_length,
  -- Check comprehensive AI fields
  CASE WHEN thread_summary_1l IS NOT NULL THEN 'YES' ELSE 'NO' END as has_summary_1l,
  thread_summary_1l,
  CASE WHEN topics_comprehensive IS NOT NULL AND array_length(topics_comprehensive, 1) > 0 THEN 'YES' ELSE 'NO' END as has_topics,
  topics_comprehensive,
  CASE WHEN asks_from_sender IS NOT NULL AND array_length(asks_from_sender, 1) > 0 THEN 'YES' ELSE 'NO' END as has_asks,
  asks_from_sender,
  CASE WHEN suggested_next_actions IS NOT NULL AND array_length(suggested_next_actions, 1) > 0 THEN 'YES' ELSE 'NO' END as has_actions,
  suggested_next_actions,
  CASE WHEN relationship_signal IS NOT NULL THEN 'YES' ELSE 'NO' END as has_signal,
  relationship_signal,
  processed_at
FROM email_metadata
WHERE id = '5a9dff53-b7fd-420c-aad8-64f2b6b40358';

