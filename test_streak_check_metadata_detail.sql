-- Detailed metadata check - see the full structure
SELECT 
  email,
  metadata,
  metadata->'streak_notifications' as streak_notifications,
  jsonb_typeof(metadata->'streak_notifications') as notifications_type
FROM users
WHERE email = 'mcddsl@icloud.com';

-- Check if metadata exists at all
SELECT 
  email,
  CASE 
    WHEN metadata IS NULL THEN 'NULL'
    WHEN metadata = '{}'::jsonb THEN 'Empty object'
    WHEN metadata->'streak_notifications' IS NULL THEN 'No streak_notifications key'
    WHEN metadata->'streak_notifications' = '{}'::jsonb THEN 'Empty streak_notifications'
    ELSE 'Has data'
  END as metadata_status,
  metadata
FROM users
WHERE email = 'mcddsl@icloud.com';

