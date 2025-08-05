# TASK 8: FILE CLEANUP PROCEDURES - TESTING STRATEGY

## TESTING OVERVIEW

### Phase 1: Manual Testing (DRY RUN)
Test the file cleanup system safely without deleting any files.

#### 1.1 Test Individual Bucket Scanning
```bash
# Test scanning specific bucket (dry run)
curl -X POST 'https://knxevbkkkiadgppxbphh.supabase.co/functions/v1/file-cleanup' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "action": "scan",
    "dry_run": true,
    "bucket_name": "avatars"
  }'
```

#### 1.2 Test All Buckets Scanning
```bash
# Test scanning all buckets (dry run)
curl -X POST 'https://knxevbkkkiadgppxbphh.supabase.co/functions/v1/file-cleanup' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "action": "scan",
    "dry_run": true
  }'
```

#### 1.3 Test Orphaned Files Identification
```sql
-- Run orphaned files queries to verify detection accuracy
\i file_cleanup_orphaned_files_queries.sql

-- Verify specific file references
SELECT * FROM public.profiles WHERE avatar_url = 'specific-file-name.jpg';
SELECT * FROM public.tournaments WHERE banner_image = 'specific-banner.jpg';
```

### Phase 2: Configuration Testing
Test cleanup configuration and scheduling.

#### 2.1 Test Manual Trigger Function
```sql
-- Test manual trigger (dry run)
SELECT public.trigger_file_cleanup('avatars', true, 'admin-user-id');

-- Test manual trigger for all buckets
SELECT public.trigger_file_cleanup(NULL, true, 'admin-user-id');
```

#### 2.2 Test Configuration Updates
```sql
-- Update cleanup configuration
UPDATE public.file_cleanup_config 
SET retention_days = 15, auto_cleanup_enabled = true 
WHERE bucket_name = 'avatars';

-- Verify configuration
SELECT * FROM public.file_cleanup_config;
```

#### 2.3 Test Scheduled Cleanup (Manual Trigger)
```bash
# Manually trigger scheduled cleanup
curl -X POST 'https://knxevbkkkiadgppxbphh.supabase.co/functions/v1/scheduled-file-cleanup' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"force": false}'
```

### Phase 3: Limited Production Testing
Test actual file deletion with small, safe datasets.

#### 3.1 Create Test Files
```sql
-- Create test orphaned files in storage (manually upload test files)
-- Ensure these are NOT referenced in any tables
```

#### 3.2 Test Actual Cleanup (Small Scale)
```bash
# Test cleanup on specific bucket with actual deletion
curl -X POST 'https://knxevbkkkiadgppxbphh.supabase.co/functions/v1/file-cleanup' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "action": "cleanup",
    "dry_run": false,
    "bucket_name": "avatars"
  }'
```

#### 3.3 Verify Cleanup Results
```sql
-- Check cleanup logs
SELECT * FROM public.file_cleanup_logs ORDER BY created_at DESC LIMIT 10;

-- Check system logs
SELECT * FROM public.system_logs 
WHERE log_type IN ('file_cleanup', 'scheduled_file_cleanup') 
ORDER BY created_at DESC LIMIT 10;
```

### Phase 4: Performance Testing
Test system performance and resource usage.

#### 4.1 Large Dataset Testing
```sql
-- Test with buckets containing many files
-- Monitor execution time and memory usage
```

#### 4.2 Concurrent Operations Testing
```bash
# Test multiple cleanup operations running simultaneously
# Ensure no conflicts or deadlocks occur
```

### Phase 5: Production Rollout
Gradual deployment to production environment.

#### 5.1 Enable Auto-Cleanup for Low-Risk Buckets
```sql
-- Start with temporary files bucket
UPDATE public.file_cleanup_config 
SET auto_cleanup_enabled = true 
WHERE bucket_name IN ('avatars') AND retention_days <= 30;
```

#### 5.2 Monitor Production Performance
```sql
-- Monitor cleanup statistics daily
SELECT 
  bucket_name,
  SUM(files_deleted) as total_deleted,
  pg_size_pretty(SUM(total_size)) as total_space_freed,
  AVG(execution_time_ms) as avg_execution_time
FROM public.file_cleanup_logs 
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY bucket_name;
```

## VALIDATION CRITERIA

### Success Criteria
1. **Accuracy**: 100% accurate identification of orphaned files
2. **Performance**: Cleanup completes within 5 minutes for buckets with <10,000 files
3. **Safety**: No false positives (deleting referenced files)
4. **Logging**: Complete audit trail of all cleanup activities
5. **Recovery**: Ability to identify what was deleted and when

### Failure Scenarios to Test
1. **Network interruptions** during cleanup
2. **Database connection failures**
3. **Storage API rate limiting**
4. **Concurrent file uploads** during cleanup
5. **Invalid file references** in database

### Performance Benchmarks
- **Scan time**: <1 second per 100 files
- **Deletion time**: <5 seconds per 100 files
- **Memory usage**: <100MB during execution
- **CPU usage**: <50% during execution

## ROLLBACK PROCEDURES

### Emergency Stop
```sql
-- Disable all auto cleanup immediately
UPDATE public.file_cleanup_config SET auto_cleanup_enabled = false;

-- Cancel scheduled cron job
SELECT cron.unschedule('weekly-file-cleanup');
```

### Rollback Configuration
```sql
-- Reset to safe defaults
UPDATE public.file_cleanup_config SET 
  retention_days = 90,
  max_file_age_days = 365,
  auto_cleanup_enabled = false;
```

### Recovery Procedures
```sql
-- Review what was deleted in emergency
SELECT 
  bucket_name,
  orphaned_files,
  created_at,
  files_deleted,
  total_size
FROM public.file_cleanup_logs 
WHERE created_at >= 'INCIDENT_START_TIME'
ORDER BY created_at DESC;
```

## MONITORING AND ALERTING

### Key Metrics to Monitor
1. **Cleanup frequency**: Should run weekly as scheduled
2. **Error rate**: Should be <5% of operations
3. **Space freed**: Should be consistent with expectations
4. **Execution time**: Should not increase significantly over time

### Alert Conditions
1. **Cleanup hasn't run** in >10 days
2. **High error rate** (>10% in last 24 hours)
3. **Unusually large deletions** (>1GB in single operation)
4. **Long execution times** (>30 minutes)

### Health Check Queries
```sql
-- Daily health check
SELECT 
  'File Cleanup Health' as check_name,
  CASE 
    WHEN MAX(created_at) < NOW() - INTERVAL '10 days' THEN 'WARNING: No recent cleanup'
    WHEN COUNT(*) FILTER (WHERE errors::json[] != '{}') > 0 THEN 'WARNING: Recent errors'
    ELSE 'OK'
  END as status,
  COUNT(*) as total_operations,
  MAX(created_at) as last_operation
FROM public.file_cleanup_logs 
WHERE created_at >= NOW() - INTERVAL '7 days';
```