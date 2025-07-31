-- ============================================
-- TASK 8: FILE CLEANUP - ORPHANED FILES IDENTIFICATION QUERIES
-- ============================================

-- Query 1: Find avatar files that are not referenced in profiles table
-- This helps identify orphaned avatar files
SELECT 
  'avatars' as bucket_name,
  so.name as file_name,
  so.created_at as file_created_at,
  so.updated_at as file_updated_at,
  pg_size_pretty(so.metadata->>'size') as file_size,
  'Avatar not referenced in profiles' as reason
FROM storage.objects so
WHERE so.bucket_id = 'avatars'
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.avatar_url = so.name 
    AND p.deleted_at IS NULL
  )
  -- Exclude files created in last 24 hours (may still be in use)
  AND so.created_at < NOW() - INTERVAL '24 hours'
ORDER BY so.created_at DESC;

-- Query 2: Find tournament banner files not referenced in tournaments
SELECT 
  'tournament-banners' as bucket_name,
  so.name as file_name,
  so.created_at as file_created_at,
  pg_size_pretty(so.metadata->>'size') as file_size,
  'Tournament banner not referenced' as reason
FROM storage.objects so
WHERE so.bucket_id = 'tournament-banners'
  AND NOT EXISTS (
    SELECT 1 FROM public.tournaments t 
    WHERE t.banner_image = so.name 
    AND t.deleted_at IS NULL
  )
  AND so.created_at < NOW() - INTERVAL '24 hours'
ORDER BY so.created_at DESC;

-- Query 3: Find club photos not referenced in club_registrations
SELECT 
  'club-photos' as bucket_name,
  so.name as file_name,
  so.created_at as file_created_at,
  pg_size_pretty(so.metadata->>'size') as file_size,
  'Club photo not referenced' as reason
FROM storage.objects so
WHERE so.bucket_id = 'club-photos'
  AND NOT EXISTS (
    SELECT 1 FROM public.club_registrations cr 
    WHERE cr.photos @> ARRAY[so.name]
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.club_profiles cp
    WHERE cp.verification_notes LIKE '%' || so.name || '%'
    AND cp.deleted_at IS NULL
  )
  AND so.created_at < NOW() - INTERVAL '24 hours'
ORDER BY so.created_at DESC;

-- Query 4: Find match evidence files not referenced in match_disputes
SELECT 
  'match-evidence' as bucket_name,
  so.name as file_name,
  so.created_at as file_created_at,
  pg_size_pretty(so.metadata->>'size') as file_size,
  'Match evidence not referenced' as reason
FROM storage.objects so
WHERE so.bucket_id = 'match-evidence'
  AND NOT EXISTS (
    SELECT 1 FROM public.match_disputes md 
    WHERE md.evidence_urls @> ARRAY[so.name]
  )
  AND so.created_at < NOW() - INTERVAL '24 hours'
ORDER BY so.created_at DESC;

-- Query 5: Find old files (older than retention period) by bucket
WITH bucket_config AS (
  SELECT bucket_name, retention_days, max_file_age_days 
  FROM public.file_cleanup_config 
  WHERE enabled = true
)
SELECT 
  so.bucket_id,
  so.name as file_name,
  so.created_at as file_created_at,
  pg_size_pretty(so.metadata->>'size') as file_size,
  bc.retention_days,
  EXTRACT(days FROM (NOW() - so.created_at)) as age_days,
  CASE 
    WHEN EXTRACT(days FROM (NOW() - so.created_at)) > bc.max_file_age_days THEN 'Exceeds max age limit'
    WHEN EXTRACT(days FROM (NOW() - so.created_at)) > bc.retention_days THEN 'Exceeds retention period'
    ELSE 'Within retention period'
  END as age_status
FROM storage.objects so
JOIN bucket_config bc ON so.bucket_id = bc.bucket_name
WHERE EXTRACT(days FROM (NOW() - so.created_at)) > bc.retention_days
ORDER BY so.created_at ASC;

-- Query 6: Summary of storage usage by bucket
SELECT 
  so.bucket_id,
  COUNT(*) as total_files,
  pg_size_pretty(SUM((so.metadata->>'size')::bigint)) as total_size,
  MIN(so.created_at) as oldest_file,
  MAX(so.created_at) as newest_file,
  COUNT(*) FILTER (WHERE so.created_at < NOW() - INTERVAL '30 days') as files_older_than_30_days,
  COUNT(*) FILTER (WHERE so.created_at < NOW() - INTERVAL '90 days') as files_older_than_90_days
FROM storage.objects so
GROUP BY so.bucket_id
ORDER BY SUM((so.metadata->>'size')::bigint) DESC;

-- Query 7: Find files with no recent access (if last_accessed_at is tracked)
SELECT 
  so.bucket_id,
  so.name as file_name,
  so.created_at as file_created_at,
  so.last_accessed_at,
  CASE 
    WHEN so.last_accessed_at IS NULL THEN 'Never accessed'
    WHEN so.last_accessed_at < NOW() - INTERVAL '90 days' THEN 'Not accessed in 90+ days'
    WHEN so.last_accessed_at < NOW() - INTERVAL '30 days' THEN 'Not accessed in 30+ days'
    ELSE 'Recently accessed'
  END as access_status,
  pg_size_pretty(so.metadata->>'size') as file_size
FROM storage.objects so
WHERE so.last_accessed_at IS NULL 
   OR so.last_accessed_at < NOW() - INTERVAL '30 days'
ORDER BY so.last_accessed_at ASC NULLS FIRST;

-- Query 8: File cleanup history and statistics
SELECT 
  fcl.bucket_name,
  fcl.action_type,
  fcl.files_found,
  fcl.files_deleted,
  pg_size_pretty(fcl.total_size) as space_processed,
  fcl.execution_time_ms,
  array_length(fcl.errors::json[], 1) as error_count,
  fcl.created_at
FROM public.file_cleanup_logs fcl
ORDER BY fcl.created_at DESC
LIMIT 50;

-- Query 9: Cleanup configuration status
SELECT 
  fcc.bucket_name,
  fcc.enabled,
  fcc.retention_days,
  fcc.max_file_age_days,
  fcc.auto_cleanup_enabled,
  fcc.cleanup_schedule,
  fcc.last_cleanup_at,
  CASE 
    WHEN fcc.last_cleanup_at IS NULL THEN 'Never cleaned'
    WHEN fcc.last_cleanup_at < NOW() - INTERVAL '7 days' THEN 'Cleanup overdue'
    ELSE 'Recently cleaned'
  END as cleanup_status
FROM public.file_cleanup_config fcc
ORDER BY fcc.last_cleanup_at ASC NULLS FIRST;

-- Query 10: Get total orphaned files count and size estimate
WITH orphaned_files AS (
  -- Combine all orphaned file queries
  SELECT 'avatars' as bucket, name, (metadata->>'size')::bigint as size FROM storage.objects so
  WHERE so.bucket_id = 'avatars' AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.avatar_url = so.name AND p.deleted_at IS NULL)
  
  UNION ALL
  
  SELECT 'tournament-banners', name, (metadata->>'size')::bigint FROM storage.objects so
  WHERE so.bucket_id = 'tournament-banners' AND NOT EXISTS (SELECT 1 FROM public.tournaments t WHERE t.banner_image = so.name AND t.deleted_at IS NULL)
  
  UNION ALL
  
  SELECT 'club-photos', name, (metadata->>'size')::bigint FROM storage.objects so
  WHERE so.bucket_id = 'club-photos' AND NOT EXISTS (SELECT 1 FROM public.club_registrations cr WHERE cr.photos @> ARRAY[so.name])
  
  UNION ALL
  
  SELECT 'match-evidence', name, (metadata->>'size')::bigint FROM storage.objects so
  WHERE so.bucket_id = 'match-evidence' AND NOT EXISTS (SELECT 1 FROM public.match_disputes md WHERE md.evidence_urls @> ARRAY[so.name])
)
SELECT 
  bucket,
  COUNT(*) as orphaned_files_count,
  pg_size_pretty(SUM(size)) as total_orphaned_size,
  pg_size_pretty(AVG(size)) as avg_file_size
FROM orphaned_files
GROUP BY bucket
ORDER BY SUM(size) DESC;