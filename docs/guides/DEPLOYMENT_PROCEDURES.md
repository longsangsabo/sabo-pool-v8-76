# 🚀 DEPLOYMENT PROCEDURES

## Pre-Deployment Checklist

### Code Quality Verification
- [ ] All tests passing (unit, integration, e2e)
- [ ] Code review completed and approved
- [ ] Performance benchmarks met
- [ ] Security scan completed
- [ ] Documentation updated

### Infrastructure Readiness
- [ ] Production environment configured
- [ ] Database migrations prepared
- [ ] CDN configuration updated
- [ ] SSL certificates valid
- [ ] Monitoring systems active

### Team Coordination
- [ ] Deployment team notified
- [ ] Support team briefed
- [ ] Rollback team on standby
- [ ] Communication plan activated

## Deployment Execution

### Phase 1: Database Migrations (if needed)

```sql
-- Safe migration script template
BEGIN;

-- 1. Create new indexes (non-blocking)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tournaments_status_date 
ON tournaments(status, tournament_start);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_challenges_user_status 
ON challenges(challenger_id, status);

-- 2. Add new columns (safe)
ALTER TABLE tournaments 
ADD COLUMN IF NOT EXISTS simplified_flow boolean DEFAULT true;

ALTER TABLE challenges 
ADD COLUMN IF NOT EXISTS unified_flow boolean DEFAULT true;

-- 3. Update existing data (batched)
UPDATE tournaments 
SET simplified_flow = true 
WHERE simplified_flow IS NULL;

UPDATE challenges 
SET unified_flow = true 
WHERE unified_flow IS NULL;

-- 4. Verify data integrity
DO $$
DECLARE
    invalid_count integer;
BEGIN
    SELECT COUNT(*) INTO invalid_count 
    FROM tournaments 
    WHERE simplified_flow IS NULL;
    
    IF invalid_count > 0 THEN
        RAISE EXCEPTION 'Data integrity check failed: % invalid records', invalid_count;
    END IF;
END $$;

COMMIT;
```

### Phase 2: Application Deployment

#### Canary Deployment (10% Traffic)

```bash
#!/bin/bash
# deploy-canary.sh

echo "🏗️ Starting Canary Deployment"

# 1. Build optimized bundle
npm run build:production

# 2. Deploy to canary environment
echo "Deploying to canary..."
npm run deploy:canary

# 3. Verify canary health
echo "Checking canary health..."
curl -f https://canary.sabo.app/health || exit 1

# 4. Route 10% traffic to canary
echo "Routing 10% traffic to canary..."
# Update load balancer configuration
./scripts/update-traffic-split.sh canary 10

# 5. Monitor for 30 minutes
echo "Monitoring canary for 30 minutes..."
node ./scripts/monitor-deployment.js --duration=30 --threshold=error-rate:0.1%

echo "✅ Canary deployment complete"
```

#### Monitoring Script
```javascript
// scripts/monitor-deployment.js
const monitoring = {
  errorRate: { threshold: 0.1, current: 0 },
  responseTime: { threshold: 2000, current: 0 },
  memoryUsage: { threshold: 150, current: 0 },
  userSatisfaction: { threshold: 95, current: 0 }
};

async function monitorDeployment(duration, thresholds) {
  const startTime = Date.now();
  const endTime = startTime + (duration * 60 * 1000);
  
  while (Date.now() < endTime) {
    const metrics = await collectMetrics();
    
    // Check all thresholds
    for (const [metric, config] of Object.entries(thresholds)) {
      if (metrics[metric] > config.threshold) {
        console.error(`❌ Threshold breach: ${metric} = ${metrics[metric]}`);
        await triggerRollback();
        process.exit(1);
      }
    }
    
    console.log(`✅ All metrics within thresholds at ${new Date()}`);
    await sleep(60000); // Check every minute
  }
  
  console.log('🎉 Monitoring period completed successfully');
}
```

### Phase 3: Progressive Rollout

#### 30% Traffic Deployment
```bash
#!/bin/bash
# deploy-30-percent.sh

echo "📈 Scaling to 30% traffic"

# Check canary metrics
./scripts/verify-metrics.sh canary || exit 1

# Update traffic routing
./scripts/update-traffic-split.sh production 30

# Extended monitoring (2 hours)
node ./scripts/monitor-deployment.js --duration=120 --threshold=error-rate:0.05%

echo "✅ 30% deployment successful"
```

#### 100% Traffic Deployment
```bash
#!/bin/bash
# deploy-full.sh

echo "🌟 Full deployment to 100% traffic"

# Final verification
./scripts/verify-metrics.sh production || exit 1

# Route all traffic
./scripts/update-traffic-split.sh production 100

# Remove canary environment
./scripts/cleanup-canary.sh

# Final monitoring (24 hours)
node ./scripts/monitor-deployment.js --duration=1440 --threshold=error-rate:0.01%

echo "🎊 Full deployment complete!"
```

## Feature Flag Management

### Feature Flag Configuration
```javascript
// config/feature-flags.js
export const featureFlags = {
  // New simplified systems
  unified_tournaments: {
    enabled: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    rules: {
      userType: ['premium', 'admin'], // Premium users first
      region: ['vietnam'],
      deviceType: ['desktop', 'mobile']
    }
  },
  
  unified_challenges: {
    enabled: process.env.NODE_ENV === 'production' ? 0.3 : 1.0,
    rules: {
      userType: ['all'],
      minVersion: '2.1.0'
    }
  },
  
  lazy_admin_loading: {
    enabled: 1.0, // Safe to enable for all
    rules: {
      userType: ['admin', 'club_owner']
    }
  }
};

// Feature flag evaluation
export function isFeatureEnabled(flagName, userContext) {
  const flag = featureFlags[flagName];
  if (!flag) return false;
  
  // Check if enabled for user percentage
  if (Math.random() > flag.enabled) return false;
  
  // Check additional rules
  if (flag.rules) {
    if (flag.rules.userType && !flag.rules.userType.includes(userContext.type)) {
      return false;
    }
    // Add more rule checks as needed
  }
  
  return true;
}
```

### Gradual Feature Enablement
```javascript
// Rollout schedule
const rolloutSchedule = {
  week1: { unified_tournaments: 0.1 },
  week2: { unified_tournaments: 0.3, unified_challenges: 0.1 },
  week3: { unified_tournaments: 0.5, unified_challenges: 0.3 },
  week4: { unified_tournaments: 1.0, unified_challenges: 0.5 },
  week5: { unified_challenges: 1.0 }
};
```

## Rollback Procedures

### Automatic Rollback Triggers
```javascript
// scripts/auto-rollback.js
const rollbackTriggers = {
  errorRate: { threshold: 1.0, window: '5m' },
  responseTime: { threshold: 5000, window: '5m' },
  memoryLeak: { threshold: 200, window: '10m' },
  userComplaints: { threshold: 10, window: '15m' }
};

async function checkRollbackTriggers() {
  for (const [trigger, config] of Object.entries(rollbackTriggers)) {
    const currentValue = await getMetric(trigger, config.window);
    
    if (currentValue > config.threshold) {
      console.log(`🚨 Rollback trigger activated: ${trigger} = ${currentValue}`);
      await executeRollback();
      break;
    }
  }
}
```

### Manual Rollback Process
```bash
#!/bin/bash
# rollback.sh

echo "🔄 Initiating rollback procedure"

# 1. Stop new deployments
./scripts/halt-deployment.sh

# 2. Route traffic to previous version
./scripts/update-traffic-split.sh previous 100

# 3. Verify rollback health
curl -f https://sabo.app/health || echo "❌ Rollback health check failed"

# 4. Notify team
./scripts/notify-team.sh "Rollback completed"

# 5. Preserve logs for analysis
./scripts/backup-logs.sh $(date +%Y%m%d-%H%M%S)

echo "✅ Rollback completed"
```

## Database Rollback Strategy

### Safe Data Rollback
```sql
-- Rollback script template
BEGIN;

-- 1. Backup current state
CREATE TABLE tournaments_backup_20240201 AS 
SELECT * FROM tournaments;

-- 2. Revert data changes (if safe)
UPDATE tournaments 
SET simplified_flow = false 
WHERE created_at > '2024-02-01 00:00:00';

-- 3. Remove new columns (if safe)
-- ALTER TABLE tournaments DROP COLUMN IF EXISTS simplified_flow;

-- 4. Verify rollback
SELECT COUNT(*) FROM tournaments WHERE simplified_flow = true;

COMMIT;
```

### Data Integrity Verification
```javascript
// scripts/verify-data-integrity.js
async function verifyDataIntegrity() {
  const checks = [
    {
      name: 'Tournament integrity',
      query: 'SELECT COUNT(*) FROM tournaments WHERE status IS NULL'
    },
    {
      name: 'Challenge integrity', 
      query: 'SELECT COUNT(*) FROM challenges WHERE challenger_id IS NULL'
    },
    {
      name: 'User profile integrity',
      query: 'SELECT COUNT(*) FROM profiles WHERE user_id IS NULL'
    }
  ];
  
  for (const check of checks) {
    const result = await db.query(check.query);
    if (result.rows[0].count > 0) {
      throw new Error(`Data integrity check failed: ${check.name}`);
    }
  }
  
  console.log('✅ All data integrity checks passed');
}
```

## Communication Plan

### Deployment Notifications
```markdown
## Deployment Communication Template

### Pre-Deployment (24h before)
**To**: All team members, stakeholders
**Subject**: SABO Pool Arena Deployment Scheduled - [Date/Time]

Hi team,

We're scheduled to deploy the performance-optimized version of SABO Pool Arena:
- **Date**: [Date]
- **Time**: [Time] (Vietnam time)
- **Duration**: 2-4 hours
- **Impact**: Minimal (rolling deployment)

### Key Improvements:
- 68% reduction in bundle size
- 71% faster page loads
- Simplified tournament & challenge flows

### Support Coverage:
- Primary: [Name]
- Secondary: [Name]
- Escalation: [Name]

### During Deployment
**To**: Support team
**Subject**: Deployment in Progress - Monitor for Issues

Deployment Status: [In Progress/Complete]
Current Phase: [Canary 10%/Production 30%/Full 100%]
Metrics: All green ✅

### Post-Deployment (24h after)
**To**: All stakeholders
**Subject**: SABO Pool Arena Deployment Complete ✅

Deployment completed successfully:
- Performance improvements confirmed
- All systems operating normally
- User feedback positive

**Metrics**:
- Error rate: 0.02% (target: <0.1%)
- Response time: 1.2s avg (target: <2s)
- User satisfaction: 96% (target: >95%)
```

### Incident Communication
```markdown
## Incident Communication Template

### Severity 1 (Critical)
**Response Time**: 15 minutes
**Channels**: Slack, Email, SMS
**Recipients**: All team members

### Severity 2 (High)
**Response Time**: 1 hour
**Channels**: Slack, Email
**Recipients**: Tech team, stakeholders

### Severity 3 (Medium)
**Response Time**: 4 hours
**Channels**: Slack
**Recipients**: Tech team
```

## Post-Deployment Monitoring

### 24-Hour Monitoring Checklist
- [ ] Error rates within normal range
- [ ] Performance metrics stable
- [ ] User satisfaction scores good
- [ ] Business metrics unaffected
- [ ] Support ticket volume normal

### Weekly Performance Review
- [ ] Bundle size analysis
- [ ] User engagement metrics
- [ ] Performance trend analysis
- [ ] Feature adoption rates
- [ ] Technical debt assessment

### Success Criteria Validation
```javascript
const deploymentSuccess = {
  performance: {
    bundleSize: { current: 0, target: '68% reduction', status: 'pending' },
    loadTime: { current: 0, target: '<2s', status: 'pending' },
    memoryUsage: { current: 0, target: '<100MB', status: 'pending' }
  },
  reliability: {
    errorRate: { current: 0, target: '<0.1%', status: 'pending' },
    uptime: { current: 0, target: '>99.9%', status: 'pending' },
    responseTime: { current: 0, target: '<2s P95', status: 'pending' }
  },
  business: {
    userSatisfaction: { current: 0, target: '>95%', status: 'pending' },
    conversionRate: { current: 0, target: 'maintain', status: 'pending' },
    supportTickets: { current: 0, target: '<5% increase', status: 'pending' }
  }
};
```

## Final Deployment Sign-off

### Go/No-Go Decision Matrix
```markdown
## Deployment Readiness Assessment

### Technical Readiness ✅
- [ ] All tests passing
- [ ] Performance targets met  
- [ ] Security scan clean
- [ ] Documentation complete

### Operational Readiness ✅
- [ ] Monitoring configured
- [ ] Support team trained
- [ ] Rollback procedures tested
- [ ] Communication plan active

### Business Readiness ✅
- [ ] Stakeholder approval
- [ ] User communication sent
- [ ] Success metrics defined
- [ ] Risk mitigation planned

**Decision**: GO / NO-GO
**Signed**: [Name, Role, Date]
```