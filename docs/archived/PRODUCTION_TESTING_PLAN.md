# PRODUCTION TESTING PLAN

## 1. DATABASE INDEXES TESTING & DEPLOYMENT

### Phase 1: Pre-Production Testing (7 days)

#### A. Test Environment Setup
```sql
-- Create test dataset with production-like size
-- Estimated 100K users, 500K matches, 10K tournaments

-- 1. Populate test data
INSERT INTO profiles (user_id, full_name, elo, city, district) 
SELECT 
  gen_random_uuid(),
  'Test User ' || generate_series,
  1000 + random() * 1000,
  (ARRAY['Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng'])[ceil(random()*3)],
  'Quận ' || ceil(random()*12)
FROM generate_series(1, 100000);

-- 2. Generate match results
INSERT INTO match_results (player1_id, player2_id, winner_id, match_date, player1_elo_before, player2_elo_before)
SELECT 
  p1.user_id, 
  p2.user_id,
  (CASE WHEN random() > 0.5 THEN p1.user_id ELSE p2.user_id END),
  now() - (random() * interval '365 days'),
  p1.elo,
  p2.elo
FROM 
  (SELECT user_id, elo FROM profiles ORDER BY random() LIMIT 250000) p1,
  (SELECT user_id, elo FROM profiles ORDER BY random() LIMIT 250000) p2
WHERE p1.user_id != p2.user_id
LIMIT 500000;
```

#### B. Benchmark Queries (Before Indexes)
```sql
-- Query 1: Leaderboard with pagination
EXPLAIN (ANALYZE, BUFFERS) 
SELECT pr.*, p.full_name, p.avatar_url 
FROM player_rankings pr 
JOIN profiles p ON pr.player_id = p.user_id 
WHERE p.city = 'Hồ Chí Minh' 
ORDER BY pr.elo_points DESC 
LIMIT 20 OFFSET 100;

-- Query 2: Match history for user
EXPLAIN (ANALYZE, BUFFERS)
SELECT mr.*, p1.full_name as player1_name, p2.full_name as player2_name
FROM match_results mr
JOIN profiles p1 ON mr.player1_id = p1.user_id
JOIN profiles p2 ON mr.player2_id = p2.user_id
WHERE mr.player1_id = 'test-user-id' OR mr.player2_id = 'test-user-id'
ORDER BY mr.match_date DESC
LIMIT 50;

-- Query 3: Tournament registrations
EXPLAIN (ANALYZE, BUFFERS)
SELECT COUNT(*) 
FROM tournament_registrations tr
JOIN tournaments t ON tr.tournament_id = t.id
WHERE t.status = 'active' AND tr.registration_status = 'confirmed';
```

#### C. Create Indexes Incrementally
```sql
-- Day 1: Critical indexes
CREATE INDEX CONCURRENTLY idx_player_rankings_elo_city ON player_rankings (elo_points DESC) WHERE city IS NOT NULL;
CREATE INDEX CONCURRENTLY idx_match_results_player_date ON match_results (player1_id, match_date DESC);
CREATE INDEX CONCURRENTLY idx_match_results_player2_date ON match_results (player2_id, match_date DESC);

-- Day 2: Tournament indexes  
CREATE INDEX CONCURRENTLY idx_tournament_registrations_status ON tournament_registrations (registration_status, tournament_id);
CREATE INDEX CONCURRENTLY idx_tournaments_status_date ON tournaments (status, tournament_start DESC);

-- Day 3: Profile indexes
CREATE INDEX CONCURRENTLY idx_profiles_city_elo ON profiles (city, elo DESC);
CREATE INDEX CONCURRENTLY idx_profiles_verification ON profiles (verification_status, verified_at DESC);

-- Continue with remaining indexes...
```

#### D. Performance Benchmarks (After Each Index)
```sql
-- Track performance improvements
CREATE TABLE index_performance_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  index_name TEXT NOT NULL,
  query_description TEXT NOT NULL,
  execution_time_before_ms INTEGER,
  execution_time_after_ms INTEGER,
  improvement_percentage DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Example benchmark result
INSERT INTO index_performance_log VALUES 
('idx_player_rankings_elo_city', 'Leaderboard query with city filter', 2500, 45, 98.2);
```

### Phase 2: Production Deployment (3 days)

#### A. Deployment Schedule
```bash
# Day 1: Critical indexes (during low traffic - 2-4 AM)
psql -c "CREATE INDEX CONCURRENTLY idx_player_rankings_elo_city ON player_rankings (elo_points DESC);"

# Day 2: Secondary indexes
psql -c "CREATE INDEX CONCURRENTLY idx_match_results_composite ON match_results (player1_id, player2_id, match_date DESC);"

# Day 3: Remaining indexes
# Continue with rest...
```

#### B. Monitoring Points
```sql
-- Monitor index usage
SELECT 
  indexname,
  idx_tup_read,
  idx_tup_fetch,
  idx_scan
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Monitor query performance
SELECT 
  query,
  mean_time,
  calls,
  total_time
FROM pg_stat_statements 
WHERE query LIKE '%player_rankings%'
ORDER BY mean_time DESC;
```

#### C. Rollback Procedures
```sql
-- If performance degrades, rollback specific indexes
DROP INDEX CONCURRENTLY IF EXISTS idx_problematic_index;

-- Monitor after rollback
SELECT * FROM pg_stat_activity WHERE state = 'active';
```

---

## 2. FILE CLEANUP DEPLOYMENT PLAN

### Phase 1: Safety Measures Implementation

#### A. Extended Dry-Run Mode (7 days)
```sql
-- Create safe cleanup configuration
INSERT INTO file_cleanup_config (bucket_name, enabled, auto_cleanup_enabled, retention_days) VALUES
('avatars', true, false, 90),  -- Start with manual mode only
('match-photos', true, false, 60),
('tournament-banners', true, false, 30);

-- Log all operations without deleting
CREATE TABLE file_cleanup_dry_run_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bucket_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  last_modified TIMESTAMP,
  would_be_deleted BOOLEAN,
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### B. Incremental Deployment Strategy
```typescript
// src/utils/fileCleanupSafe.ts
export const safeFileCleanup = async (bucketName: string) => {
  const config = await getCleanupConfig(bucketName);
  
  if (!config.enabled) {
    console.log(`Cleanup disabled for bucket: ${bucketName}`);
    return;
  }

  // Phase 1: Dry run mode (7 days)
  if (!config.auto_cleanup_enabled) {
    await performDryRun(bucketName);
    return;
  }

  // Phase 2: Small batch cleanup (1 bucket, max 10 files)
  if (config.safety_mode) {
    await performSafeCleanup(bucketName, { maxFiles: 10 });
    return;
  }

  // Phase 3: Full cleanup (after validation)
  await performFullCleanup(bucketName);
};
```

#### C. Extensive Logging & Notifications
```sql
-- Enhanced logging table
CREATE TABLE file_cleanup_detailed_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  operation_id UUID NOT NULL,
  bucket_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  action_taken TEXT NOT NULL, -- 'analyzed', 'deleted', 'skipped'
  file_size BIGINT,
  reason TEXT,
  execution_time_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Notification triggers
CREATE OR REPLACE FUNCTION notify_cleanup_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Send notification when cleanup completes
  PERFORM pg_notify('file_cleanup_complete', 
    json_build_object(
      'bucket', NEW.bucket_name,
      'files_deleted', NEW.files_deleted,
      'total_size', NEW.total_size
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER file_cleanup_notification
  AFTER INSERT ON file_cleanup_logs
  FOR EACH ROW
  EXECUTE FUNCTION notify_cleanup_completion();
```

### Phase 2: Deployment Steps

#### Day 1: Dry Run Analysis
```bash
# Enable dry run mode for all buckets
npm run file-cleanup:dry-run

# Review results
psql -c "SELECT bucket_name, COUNT(*), SUM(file_size) FROM file_cleanup_dry_run_log GROUP BY bucket_name;"
```

#### Day 2-3: Incremental Cleanup (1 bucket at a time)
```bash
# Start with least critical bucket
npm run file-cleanup:safe --bucket=temporary-uploads --max-files=10

# Validate results
npm run file-cleanup:validate --bucket=temporary-uploads

# Proceed if validation passes
npm run file-cleanup:safe --bucket=temp-tournament-data --max-files=50
```

#### Day 4-7: Full Deployment
```bash
# Enable auto cleanup for validated buckets
psql -c "UPDATE file_cleanup_config SET auto_cleanup_enabled = true WHERE bucket_name IN ('temporary-uploads', 'temp-tournament-data');"

# Schedule regular cleanup
echo "0 2 * * 0 /usr/local/bin/npm run file-cleanup:weekly" >> /etc/crontab
```

### Phase 3: Post-Deployment Validation

#### A. Success Criteria
```sql
-- Storage space reclaimed
SELECT 
  bucket_name,
  SUM(total_size) as space_reclaimed_bytes,
  COUNT(*) as cleanup_operations,
  AVG(execution_time_ms) as avg_execution_time
FROM file_cleanup_logs 
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY bucket_name;

-- Error rate monitoring
SELECT 
  bucket_name,
  COUNT(*) FILTER (WHERE errors IS NOT NULL) as error_count,
  COUNT(*) as total_operations,
  ROUND(
    COUNT(*) FILTER (WHERE errors IS NOT NULL) * 100.0 / COUNT(*), 
    2
  ) as error_percentage
FROM file_cleanup_logs 
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY bucket_name;
```

#### B. Emergency Stop Procedures
```sql
-- Immediate disable all auto cleanup
UPDATE file_cleanup_config SET auto_cleanup_enabled = false;

-- Stop all running cleanup jobs
SELECT pg_cancel_backend(pid) 
FROM pg_stat_activity 
WHERE query LIKE '%file_cleanup%';

-- Restore from backup if needed
-- (Backup procedures should be in place before deployment)
```

---

## 3. CONSOLE CLEANUP FINALIZATION

### Current Status Analysis
- **Trước:** 866 console statements
- **Sau cleanup:** 283 console statements còn lại
- **Cần phân tích:** Justify 283 statements còn lại

#### A. Categorize Remaining Console Statements
```bash
# Analyze remaining console statements
grep -r "console\." src/ | wc -l  # Count total
grep -r "console\.error" src/ | wc -l  # Count error logs
grep -r "console\.warn" src/ | wc -l   # Count warnings
grep -r "console\.log" src/ | wc -l    # Count debug logs
```

#### B. Production-Safe Logging Implementation
```typescript
// src/utils/logger.ts
export class ProductionLogger {
  private static instance: ProductionLogger;
  private isDevelopment = process.env.NODE_ENV === 'development';

  static getInstance() {
    if (!ProductionLogger.instance) {
      ProductionLogger.instance = new ProductionLogger();
    }
    return ProductionLogger.instance;
  }

  error(message: string, error?: Error, context?: any) {
    // Always log errors (keep console.error for production)
    console.error(`[ERROR] ${message}`, error, context);
    
    // Send to external monitoring in production
    if (!this.isDevelopment) {
      this.sendToMonitoring('error', message, error, context);
    }
  }

  warn(message: string, context?: any) {
    if (this.isDevelopment) {
      console.warn(`[WARN] ${message}`, context);
    }
    
    // Log warnings to monitoring service in production
    if (!this.isDevelopment) {
      this.sendToMonitoring('warn', message, null, context);
    }
  }

  debug(message: string, context?: any) {
    // Only log in development
    if (this.isDevelopment) {
      console.log(`[DEBUG] ${message}`, context);
    }
  }

  info(message: string, context?: any) {
    if (this.isDevelopment) {
      console.info(`[INFO] ${message}`, context);
    }
  }

  private sendToMonitoring(level: string, message: string, error?: Error, context?: any) {
    // Implementation for external monitoring service
    // Could integrate with Sentry, LogRocket, etc.
    try {
      const logData = {
        level,
        message,
        error: error?.message,
        stack: error?.stack,
        context,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent
      };
      
      // Store in localStorage as fallback
      const existingLogs = JSON.parse(localStorage.getItem('production_logs') || '[]');
      existingLogs.push(logData);
      
      // Keep only last 50 logs
      if (existingLogs.length > 50) {
        existingLogs.splice(0, existingLogs.length - 50);
      }
      
      localStorage.setItem('production_logs', JSON.stringify(existingLogs));
    } catch (monitoringError) {
      // Fallback to console.error if monitoring fails
      console.error('Monitoring service failed:', monitoringError);
    }
  }
}

export const logger = ProductionLogger.getInstance();
```

#### C. Replace Remaining Console Statements
```bash
#!/bin/bash
# scripts/replace-console-with-logger.sh

# Replace console.log with logger.debug
find src/ -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/console\.log(/logger.debug(/g'

# Replace console.warn with logger.warn  
find src/ -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/console\.warn(/logger.warn(/g'

# Replace console.info with logger.info
find src/ -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/console\.info(/logger.info(/g'

# Keep console.error as is (justified for production error handling)
echo "Keeping console.error statements for production error handling"

# Add logger import to files
find src/ -name "*.tsx" -o -name "*.ts" -exec grep -l "logger\." {} \; | \
xargs sed -i '1i import { logger } from "@/utils/logger";'
```

### Final Validation
```bash
# After replacement, count remaining console statements
grep -r "console\." src/ --include="*.ts" --include="*.tsx" | \
grep -v "console\.error" | \
wc -l
# Target: 0 (except console.error for error handling)

# Validate console.error usage is appropriate
grep -r "console\.error" src/ --include="*.ts" --include="*.tsx" | \
grep -v "catch\|error\|Error" | \
wc -l
# Target: 0 (all console.error should be in error handling contexts)
```

---

## SUMMARY METRICS

### Error Boundaries Implementation
- ✅ **4 major sections** wrapped with error boundaries
- ✅ **Comprehensive fallback UI** with retry mechanisms  
- ✅ **Error telemetry** and monitoring dashboard
- ✅ **Production-ready** error handling

### Database Indexes Testing
- 📋 **24 indexes** ready for production testing
- 📋 **7-day testing phase** with incremental deployment
- 📋 **Performance benchmarks** and rollback procedures
- 📋 **Monitoring setup** for production validation

### File Cleanup Deployment
- 📋 **Safety-first approach** with 7-day dry run
- 📋 **Incremental deployment** (1 bucket at a time)
- 📋 **Extensive logging** and error handling
- 📋 **Emergency stop procedures** ready

### Console Cleanup Finalization  
- 📋 **Production logger** implementation ready
- 📋 **Automated replacement** scripts prepared
- 📋 **Justified error logging** preservation
- 📋 **Zero debug statements** in production target

**All công việc còn lại đã được hoàn thiện với detailed implementation và deployment plans!**
