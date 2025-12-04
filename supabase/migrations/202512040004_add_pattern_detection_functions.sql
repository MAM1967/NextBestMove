-- 202512040004_add_pattern_detection_functions.sql
-- Professional plan Phase 1: Pattern Detection SQL Functions
-- Functions to detect user behavior patterns from actions data

BEGIN;

-- Function 1: Detect day of week performance patterns
-- Returns reply rates by day of week, identifying best and worst days
CREATE OR REPLACE FUNCTION detect_day_of_week_pattern(p_user_id UUID)
RETURNS TABLE (
  day_of_week TEXT,
  reply_rate NUMERIC(5, 2),
  is_best BOOLEAN,
  is_worst BOOLEAN
) AS $$
DECLARE
  avg_reply_rate NUMERIC(5, 2);
  max_reply_rate NUMERIC(5, 2);
  min_reply_rate NUMERIC(5, 2);
BEGIN
  -- Calculate average reply rate across all days
  SELECT COALESCE(AVG(reply_rate), 0) INTO avg_reply_rate
  FROM (
    SELECT 
      TO_CHAR(created_at, 'Day') AS day,
      CASE 
        WHEN COUNT(*) FILTER (WHERE state IN ('REPLIED', 'DONE')) > 0 
        THEN (COUNT(*) FILTER (WHERE state = 'REPLIED')::NUMERIC / 
              NULLIF(COUNT(*) FILTER (WHERE state IN ('REPLIED', 'DONE')), 0)) * 100
        ELSE 0
      END AS reply_rate
    FROM actions
    WHERE user_id = p_user_id
      AND state IN ('REPLIED', 'DONE')
      AND created_at >= CURRENT_DATE - INTERVAL '90 days'
    GROUP BY TO_CHAR(created_at, 'Day')
  ) day_stats;

  -- Get max and min for threshold calculation
  SELECT MAX(reply_rate), MIN(reply_rate) INTO max_reply_rate, min_reply_rate
  FROM (
    SELECT 
      TO_CHAR(created_at, 'Day') AS day,
      CASE 
        WHEN COUNT(*) FILTER (WHERE state IN ('REPLIED', 'DONE')) > 0 
        THEN (COUNT(*) FILTER (WHERE state = 'REPLIED')::NUMERIC / 
              NULLIF(COUNT(*) FILTER (WHERE state IN ('REPLIED', 'DONE')), 0)) * 100
        ELSE 0
      END AS reply_rate
    FROM actions
    WHERE user_id = p_user_id
      AND state IN ('REPLIED', 'DONE')
      AND created_at >= CURRENT_DATE - INTERVAL '90 days'
    GROUP BY TO_CHAR(created_at, 'Day')
    HAVING COUNT(*) >= 3  -- Need at least 3 actions to be meaningful
  ) day_stats;

  -- Return day stats with best/worst flags
  RETURN QUERY
  SELECT 
    TRIM(TO_CHAR(created_at, 'Day')) AS day_of_week,
    CASE 
      WHEN COUNT(*) FILTER (WHERE state IN ('REPLIED', 'DONE')) > 0 
      THEN (COUNT(*) FILTER (WHERE state = 'REPLIED')::NUMERIC / 
            NULLIF(COUNT(*) FILTER (WHERE state IN ('REPLIED', 'DONE')), 0)) * 100
      ELSE 0
    END AS reply_rate,
    CASE 
      WHEN (COUNT(*) FILTER (WHERE state IN ('REPLIED', 'DONE')) > 0 AND
            (COUNT(*) FILTER (WHERE state = 'REPLIED')::NUMERIC / 
             NULLIF(COUNT(*) FILTER (WHERE state IN ('REPLIED', 'DONE')), 0)) * 100) >= 
           COALESCE(max_reply_rate * 0.9, avg_reply_rate * 1.2)
      THEN TRUE
      ELSE FALSE
    END AS is_best,
    CASE 
      WHEN (COUNT(*) FILTER (WHERE state IN ('REPLIED', 'DONE')) > 0 AND
            (COUNT(*) FILTER (WHERE state = 'REPLIED')::NUMERIC / 
             NULLIF(COUNT(*) FILTER (WHERE state IN ('REPLIED', 'DONE')), 0)) * 100) <= 
           COALESCE(min_reply_rate * 1.1, avg_reply_rate * 0.8)
           AND max_reply_rate > min_reply_rate  -- Only mark worst if there's variation
      THEN TRUE
      ELSE FALSE
    END AS is_worst
  FROM actions
  WHERE user_id = p_user_id
    AND state IN ('REPLIED', 'DONE')
    AND created_at >= CURRENT_DATE - INTERVAL '90 days'
  GROUP BY TO_CHAR(created_at, 'Day')
  HAVING COUNT(*) >= 3  -- Need at least 3 actions to be meaningful
  ORDER BY reply_rate DESC;
END;
$$ LANGUAGE plpgsql;

-- Function 2: Detect follow-up timing patterns
-- Returns reply rates by time buckets (0-24h, 24-48h, 48-72h, 72h+)
-- Based on time between action creation and when it got a reply
CREATE OR REPLACE FUNCTION detect_follow_up_timing_pattern(p_user_id UUID)
RETURNS TABLE (
  bucket_label TEXT,
  hours_min INTEGER,
  hours_max INTEGER,
  reply_rate NUMERIC(5, 2)
) AS $$
BEGIN
  RETURN QUERY
  WITH action_timing AS (
    SELECT 
      a.id,
      a.person_id,
      a.created_at,
      a.state,
      CASE 
        WHEN EXTRACT(EPOCH FROM (COALESCE(a.completed_at, a.updated_at) - a.created_at)) / 3600 < 24 THEN '0-24 hours'
        WHEN EXTRACT(EPOCH FROM (COALESCE(a.completed_at, a.updated_at) - a.created_at)) / 3600 < 48 THEN '24-48 hours'
        WHEN EXTRACT(EPOCH FROM (COALESCE(a.completed_at, a.updated_at) - a.created_at)) / 3600 < 72 THEN '48-72 hours'
        ELSE '72+ hours'
      END AS bucket,
      CASE 
        WHEN EXTRACT(EPOCH FROM (COALESCE(a.completed_at, a.updated_at) - a.created_at)) / 3600 < 24 THEN 0
        WHEN EXTRACT(EPOCH FROM (COALESCE(a.completed_at, a.updated_at) - a.created_at)) / 3600 < 48 THEN 24
        WHEN EXTRACT(EPOCH FROM (COALESCE(a.completed_at, a.updated_at) - a.created_at)) / 3600 < 72 THEN 48
        ELSE 72
      END AS hours_min,
      CASE 
        WHEN EXTRACT(EPOCH FROM (COALESCE(a.completed_at, a.updated_at) - a.created_at)) / 3600 < 24 THEN 24
        WHEN EXTRACT(EPOCH FROM (COALESCE(a.completed_at, a.updated_at) - a.created_at)) / 3600 < 48 THEN 48
        WHEN EXTRACT(EPOCH FROM (COALESCE(a.completed_at, a.updated_at) - a.created_at)) / 3600 < 72 THEN 72
        ELSE NULL
      END AS hours_max
    FROM actions a
    WHERE a.user_id = p_user_id
      AND a.state IN ('REPLIED', 'DONE')
      AND a.created_at >= CURRENT_DATE - INTERVAL '90 days'
      AND a.action_type IN ('FOLLOW_UP', 'OUTREACH')
  )
  SELECT 
    at.bucket AS bucket_label,
    at.hours_min,
    at.hours_max,
    CASE 
      WHEN COUNT(*) > 0 
      THEN (COUNT(*) FILTER (WHERE at.state = 'REPLIED')::NUMERIC / NULLIF(COUNT(*), 0)) * 100
      ELSE 0
    END AS reply_rate
  FROM action_timing at
  GROUP BY at.bucket, at.hours_min, at.hours_max
  HAVING COUNT(*) >= 3  -- Need at least 3 actions per bucket
  ORDER BY at.hours_min;
END;
$$ LANGUAGE plpgsql;

-- Function 3: Detect action type conversion patterns
-- Returns reply rates by action type
CREATE OR REPLACE FUNCTION detect_action_type_conversion_pattern(p_user_id UUID)
RETURNS TABLE (
  action_type TEXT,
  reply_rate NUMERIC(5, 2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.action_type::TEXT,
    CASE 
      WHEN COUNT(*) FILTER (WHERE a.state IN ('REPLIED', 'DONE')) > 0 
      THEN (COUNT(*) FILTER (WHERE a.state = 'REPLIED')::NUMERIC / 
            NULLIF(COUNT(*) FILTER (WHERE a.state IN ('REPLIED', 'DONE')), 0)) * 100
      ELSE 0
    END AS reply_rate
  FROM actions a
  WHERE a.user_id = p_user_id
    AND a.state IN ('REPLIED', 'DONE')
    AND a.created_at >= CURRENT_DATE - INTERVAL '90 days'
    AND a.action_type IN ('OUTREACH', 'FOLLOW_UP', 'NURTURE')
  GROUP BY a.action_type
  HAVING COUNT(*) >= 5  -- Need at least 5 actions per type
  ORDER BY reply_rate DESC;
END;
$$ LANGUAGE plpgsql;

-- Function 4: Detect warm re-engagement patterns
-- Returns count and success rate of re-engaging archived/snoozed pins
CREATE OR REPLACE FUNCTION detect_warm_reengagement_pattern(p_user_id UUID)
RETURNS TABLE (
  reengaged_count INTEGER,
  success_rate NUMERIC(5, 2)
) AS $$
DECLARE
  v_reengaged_count INTEGER;
  v_success_count INTEGER;
BEGIN
  -- Count actions on pins that were archived or snoozed before the action
  SELECT 
    COUNT(*)::INTEGER,
    COUNT(*) FILTER (WHERE a.state = 'REPLIED')::INTEGER
  INTO v_reengaged_count, v_success_count
  FROM actions a
  JOIN person_pins pp ON pp.id = a.person_id
  WHERE a.user_id = p_user_id
    AND a.created_at >= CURRENT_DATE - INTERVAL '90 days'
    AND (
      -- Pin is currently archived/snoozed (was likely archived before action)
      pp.status IN ('ARCHIVED', 'SNOOZED')
      OR EXISTS (
        -- Check if pin was archived/snoozed before this action
        SELECT 1 
        FROM person_pins pp2
        WHERE pp2.id = pp.id
          AND pp2.status IN ('ARCHIVED', 'SNOOZED')
          AND pp2.updated_at < a.created_at
      )
    );

  -- Only return if we have enough data
  IF v_reengaged_count >= 3 THEN
    RETURN QUERY
    SELECT 
      v_reengaged_count AS reengaged_count,
      CASE 
        WHEN v_reengaged_count > 0 
        THEN (v_success_count::NUMERIC / v_reengaged_count::NUMERIC) * 100
        ELSE 0
      END AS success_rate;
  ELSE
    -- Return zero values if not enough data
    RETURN QUERY
    SELECT 0::INTEGER, 0::NUMERIC(5, 2);
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMIT;

