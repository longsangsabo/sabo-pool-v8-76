# 🔧 SABO Pool Arena Hub - Troubleshooting Guide

## 🚨 Common Issues & Solutions

### Development Environment Issues

#### Node.js / npm Issues
**Problem**: `npm install` fails or dependency conflicts
```bash
# Solution 1: Clear cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install

# Solution 2: Use specific Node version
nvm use 18
npm install

# Solution 3: Check for permission issues (macOS/Linux)
sudo chown -R $(whoami) ~/.npm
```

#### Development Server Won't Start
**Problem**: `npm run dev` fails or port conflicts
```bash
# Check if port 5173 is in use
lsof -ti:5173 | xargs kill -9

# Try different port
npm run dev -- --port 3000

# Check environment variables
cat .env.local
```

#### TypeScript Errors
**Problem**: Type errors preventing compilation
```bash
# Update TypeScript
npm update typescript

# Regenerate types
rm -rf node_modules/@types
npm install

# Check tsconfig.json configuration
```

### Database Connection Issues

#### Supabase Connection Fails
**Problem**: Cannot connect to Supabase
```bash
# Check environment variables
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY

# Verify Supabase project status
# Visit: https://app.supabase.com/project/knxevbkkkiadgppxbphh
```

**Solutions**:
1. Verify project URL and anon key
2. Check Supabase project status
3. Ensure RLS policies allow access
4. Test connection in Supabase dashboard

#### RLS Policy Violations
**Problem**: "new row violates row-level security policy"
```sql
-- Check existing policies
SELECT * FROM pg_policies WHERE tablename = 'your_table';

-- Common fix: Ensure user_id is set correctly
INSERT INTO table_name (user_id, other_fields) 
VALUES (auth.uid(), other_values);
```

#### Migration Issues
**Problem**: Database schema mismatch
1. Check migration files in `supabase/migrations/`
2. Run migrations manually in SQL Editor
3. Verify RLS policies are created
4. Check foreign key constraints

### Authentication Problems

#### Login/Registration Fails
**Problem**: Users cannot authenticate
**Debugging Steps**:
1. Check Supabase Auth settings
2. Verify email confirmation requirements
3. Test with simple email/password
4. Check browser console for errors

#### Admin Access Issues
**Problem**: Admin features not accessible
**Solutions**:
1. Verify phone number: `0961167717` or `0798893333`
2. Check email: `longsangsabo@gmail.com`
3. Update profile manually in database:
```sql
UPDATE profiles 
SET is_admin = true 
WHERE user_id = 'your-user-id';
```

#### Session Management
**Problem**: Users getting logged out unexpectedly
1. Check token expiration settings
2. Verify Supabase Auth configuration
3. Test session persistence
4. Check for conflicting auth state

### Payment Integration Issues

#### VNPAY Connection Problems
**Problem**: Payment gateway not responding
**Debugging**:
1. Check VNPAY credentials in environment
2. Verify sandbox vs production URLs
3. Test with VNPAY test data
4. Check webhook endpoint accessibility

#### Payment Flow Errors
**Problem**: Payment process fails
**Common Causes**:
- Invalid merchant code
- Incorrect hash secret
- Wrong return URL
- Network connectivity issues

**Solutions**:
```javascript
// Verify VNPAY configuration
console.log('VNP_TMN_CODE:', process.env.VNP_TMN_CODE);
console.log('VNP_RETURN_URL:', process.env.VNP_RETURN_URL);

// Test hash generation
const crypto = require('crypto');
const hmac = crypto.createHmac('sha512', vnp_HashSecret);
```

### Tournament & Challenge Issues

#### Tournament Registration Problems
**Problem**: Users cannot register for tournaments
**Check**:
1. Tournament status and dates
2. Maximum participant limits
3. User eligibility requirements
4. Payment requirements

#### Challenge System Failures
**Problem**: Challenges not creating or expiring incorrectly
**Debug**:
1. Check challenge expiration logic (48 hours)
2. Verify notification system
3. Test challenge status updates
4. Review database triggers

### Ranking System Issues

#### Points Not Calculating
**Problem**: ELO/SPA points not updating
**Solutions**:
1. Check match completion workflow
2. Verify point calculation functions
3. Test ranking update triggers
4. Review player_rankings table

#### Leaderboard Not Updating
**Problem**: Rankings not showing correctly
```sql
-- Manual leaderboard refresh
SELECT recalculate_rankings();

-- Check recent matches
SELECT * FROM matches 
WHERE created_at >= NOW() - INTERVAL '1 day';

-- Verify point logs
SELECT * FROM spa_points_log 
ORDER BY created_at DESC LIMIT 10;
```

### Automation System Issues

#### Cron Jobs Not Running
**Problem**: Automated tasks failing
**Debug Steps**:
1. Check `system_logs` table for errors
2. Verify pg_cron extension enabled
3. Test functions manually:
```sql
SELECT reset_daily_challenges();
SELECT decay_inactive_spa_points();
SELECT system_health_check();
```

#### Notification System Problems
**Problem**: Notifications not sending
**Check**:
1. Notification creation functions
2. User notification preferences
3. Real-time subscription status
4. Notification expiration logic

### UI/UX Issues

#### Responsive Design Problems
**Problem**: Layout broken on mobile
**Solutions**:
1. Test with browser dev tools
2. Check Tailwind CSS breakpoints
3. Verify flex/grid layouts
4. Test on actual devices

#### Component Rendering Issues
**Problem**: Components not displaying correctly
**Debug**:
1. Check React DevTools
2. Verify prop passing
3. Test component isolation
4. Check for CSS conflicts

#### Performance Issues
**Problem**: Slow page loads or interactions
**Optimization**:
1. Use React.memo for expensive components
2. Implement proper code splitting
3. Optimize images and assets
4. Monitor bundle size

### Data Integrity Issues

#### Orphaned Records
**Problem**: Database inconsistencies
```sql
-- Find orphaned matches
SELECT * FROM matches m
LEFT JOIN profiles p1 ON m.player1_id = p1.user_id
LEFT JOIN profiles p2 ON m.player2_id = p2.user_id
WHERE p1.user_id IS NULL OR p2.user_id IS NULL;

-- Clean up orphaned data
DELETE FROM matches WHERE player1_id NOT IN (SELECT user_id FROM profiles);
```

#### Duplicate Data
**Problem**: Duplicate entries in database
```sql
-- Find duplicates
SELECT user_id, COUNT(*) 
FROM player_rankings 
GROUP BY user_id 
HAVING COUNT(*) > 1;

-- Remove duplicates (keep most recent)
DELETE FROM player_rankings
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM player_rankings
  ORDER BY user_id, updated_at DESC
);
```

## 🆘 Emergency Procedures

### System Down
1. **Check Supabase Status**
   - Visit Supabase status page
   - Check project dashboard
   - Verify service availability

2. **Database Issues**
   - Review recent changes
   - Check system logs
   - Restore from backup if needed

3. **Application Errors**
   - Check error monitoring
   - Review recent deployments
   - Rollback if necessary

### Data Loss Prevention
1. **Regular Backups**
   - Automated Supabase backups
   - Export critical data regularly
   - Test restore procedures

2. **Version Control**
   - All code changes tracked
   - Database migrations versioned
   - Configuration documented

### Security Incidents
1. **Suspected Breach**
   - Disable affected accounts
   - Review access logs
   - Change sensitive credentials
   - Notify relevant parties

2. **Data Exposure**
   - Assess impact scope
   - Implement immediate fixes
   - Document incident
   - Review security measures

## 📞 Support Contacts

### Technical Issues
- **Database**: Supabase Support
- **Payments**: VNPAY Support
- **Hosting**: Loveable Support
- **General**: Project maintainer

### Emergency Contacts
- **System Admin**: longsangsabo@gmail.com
- **Emergency Phone**: 0961167717
- **Business Contact**: [Business Owner]

## 🔍 Debugging Tools

### Browser Tools
- **React DevTools**: Component inspection
- **Network Tab**: API monitoring
- **Console**: Error logging
- **Application Tab**: Storage inspection

### Database Tools
- **Supabase Dashboard**: SQL Editor, logs
- **pg_stat_statements**: Query performance
- **pg_stat_activity**: Active connections
- **System logs**: Automation monitoring

### Monitoring Tools
- **Admin Dashboard**: System health
- **Real-time Logs**: Live monitoring
- **Performance Metrics**: Response times
- **Error Tracking**: Exception monitoring

---

## 📊 Health Check Commands

```sql
-- System health overview
SELECT system_health_check();

-- Check recent automation
SELECT * FROM system_logs 
WHERE created_at >= NOW() - INTERVAL '1 day'
ORDER BY created_at DESC;

-- Database statistics
SELECT 
  schemaname,
  tablename,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes
FROM pg_stat_user_tables
ORDER BY n_tup_ins + n_tup_upd + n_tup_del DESC;

-- Active connections
SELECT count(*) as connections, state 
FROM pg_stat_activity 
GROUP BY state;
```

---

**System Healthy! ✅**

Regular monitoring and proactive maintenance prevent most issues. When problems occur, this guide provides systematic approaches to resolution.