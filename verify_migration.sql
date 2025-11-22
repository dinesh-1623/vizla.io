-- Quick verification queries to check migration was successful

-- Check tables exist
SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('alerts', 'alert_ai_priorities') THEN '✅ Created'
    ELSE '❌ Missing'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('alerts', 'alert_ai_priorities');

-- Check indexes exist
SELECT 
  indexname,
  tablename
FROM pg_indexes 
WHERE tablename IN ('alerts', 'alert_ai_priorities')
ORDER BY tablename, indexname;

-- Check RLS is enabled
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('alerts', 'alert_ai_priorities');

-- Check policies exist
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename IN ('alerts', 'alert_ai_priorities')
ORDER BY tablename, policyname;

-- Check triggers exist
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers 
WHERE event_object_schema = 'public' 
  AND event_object_table IN ('alerts', 'alert_ai_priorities');




