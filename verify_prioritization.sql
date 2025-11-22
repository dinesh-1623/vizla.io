-- Verify AI prioritization was saved to database

-- Check priority was saved
SELECT 
  ap.id,
  ap.alert_id,
  ap.priority_score,
  ap.priority_level,
  ap.short_reason,
  ap.recommended_action,
  ap.urgency_factors,
  ap.estimated_impact,
  ap.confidence_score,
  ap.prioritized_at,
  a.title as alert_title,
  a.severity as alert_severity
FROM alert_ai_priorities ap
JOIN alerts a ON ap.alert_id = a.id
WHERE ap.alert_id = 'd723acbe-188c-4756-aada-8a36c7d447db'
ORDER BY ap.prioritized_at DESC;

-- Check processing log
SELECT 
  id,
  vehicle_id,
  processing_type,
  status,
  tokens_used,
  cost_usd,
  processing_time_ms,
  error_message,
  created_at
FROM ai_processing_logs
WHERE processing_type = 'alert_prioritization'
ORDER BY created_at DESC
LIMIT 5;

-- Cost summary (last 24 hours)
SELECT 
  COUNT(*) as total_prioritizations,
  SUM(tokens_used) as total_tokens,
  SUM(cost_usd) as total_cost_usd,
  AVG(processing_time_ms) as avg_processing_time_ms,
  MIN(cost_usd) as min_cost,
  MAX(cost_usd) as max_cost
FROM ai_processing_logs
WHERE processing_type = 'alert_prioritization'
  AND status = 'success'
  AND created_at >= NOW() - INTERVAL '24 hours';




