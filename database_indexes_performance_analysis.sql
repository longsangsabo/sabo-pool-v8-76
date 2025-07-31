-- ============================================
-- TASK 7: DATABASE INDEXES - PERFORMANCE ANALYSIS
-- ============================================

-- Query to check all created indexes and their usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_tup_read,
  idx_tup_fetch,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes 
WHERE schemaname = 'public' 
  AND indexname LIKE 'idx_%'
ORDER BY idx_tup_read DESC;

-- Query to identify slow queries that benefit from indexes
SELECT 
  query,
  calls,
  total_time,
  rows,
  100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements 
WHERE query LIKE '%FROM public.%'
ORDER BY total_time DESC 
LIMIT 10;

-- Check index bloat and health
SELECT 
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_total_relation_size(indexrelid)) as size,
  CASE 
    WHEN idx_tup_read = 0 THEN 'UNUSED'
    WHEN idx_tup_read < 1000 THEN 'LOW_USAGE' 
    ELSE 'ACTIVE'
  END as usage_status
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY pg_total_relation_size(indexrelid) DESC;

-- Before/After performance comparison queries
-- Run BEFORE creating indexes:

-- Example query 1: User notification timeline
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM public.notifications 
WHERE user_id = '123e4567-e89b-12d3-a456-426614174000'
  AND deleted_at IS NULL
ORDER BY created_at DESC 
LIMIT 20;

-- Example query 2: Tournament participant lookup
EXPLAIN (ANALYZE, BUFFERS)
SELECT tr.*, t.name as tournament_name
FROM public.tournament_registrations tr
JOIN public.tournaments t ON tr.tournament_id = t.id
WHERE tr.player_id = '123e4567-e89b-12d3-a456-426614174000'
ORDER BY tr.registration_date DESC;

-- Example query 3: Active challenges for user
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM public.challenges
WHERE (challenger_id = '123e4567-e89b-12d3-a456-426614174000' 
   OR opponent_id = '123e4567-e89b-12d3-a456-426614174000')
  AND status = 'pending'
  AND deleted_at IS NULL
ORDER BY created_at DESC;

-- Example query 4: ELO leaderboard
EXPLAIN (ANALYZE, BUFFERS)
SELECT p.full_name, p.display_name, pr.elo_points
FROM public.player_rankings pr
JOIN public.profiles p ON pr.player_id = p.user_id
WHERE pr.deleted_at IS NULL
ORDER BY pr.elo_points DESC
LIMIT 50;

-- ============================================
-- EXPECTED PERFORMANCE IMPROVEMENTS
-- ============================================

/*
BEFORE INDEXES:
- User timeline queries: 100-500ms (sequential scans)
- Tournament lookups: 50-200ms (nested loops without indexes)  
- Challenge queries: 200-800ms (full table scans)
- Leaderboard: 300-1000ms (sorting without index)

AFTER INDEXES:
- User timeline queries: 5-20ms (index scan)
- Tournament lookups: 10-50ms (index nested loops)
- Challenge queries: 15-100ms (index scans + filtering)
- Leaderboard: 20-100ms (index scan with sort)

EXPECTED IMPROVEMENTS:
- 80-95% reduction in query execution time
- 90%+ reduction in disk I/O for filtered queries
- Better concurrent performance under load
- Reduced CPU usage on database server
*/