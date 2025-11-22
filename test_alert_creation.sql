-- Create test alert for AI prioritization testing
-- This will create an alert that can be prioritized by the Edge Function

INSERT INTO alerts (
  alert_type,
  alert_key,
  title,
  description,
  severity,
  status,
  action_route,
  affected_count,
  days_blocked,
  aging_hours
) VALUES (
  'blocked_vehicle',
  'test-alert-' || gen_random_uuid()::text,
  'Test Alert for AI Prioritization',
  'Testing AI prioritization functionality with a blocked vehicle alert',
  'critical',
  'active',
  '/app/blocked',
  1,
  3.0,
  72.0
)
RETURNING id, alert_type, title, created_at;

-- This will return the alert ID - copy it to use in the Edge Function test!




