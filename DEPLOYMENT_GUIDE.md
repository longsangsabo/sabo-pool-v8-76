# 🚀 SABO Pool Arena Hub - Deployment Guide

## 🌐 Deployment Overview

The application is designed for deployment on **Loveable** platform with **Supabase** backend services.

## 🏗️ Architecture

### Production Stack
- **Frontend**: React App on Loveable CDN
- **Backend**: Supabase (Database + Edge Functions)
- **Payments**: VNPAY Production Gateway
- **Storage**: Supabase Storage
- **Authentication**: Supabase Auth

### Environment Separation
- **Development**: Local + Supabase Development
- **Staging**: Loveable Preview + Supabase Staging
- **Production**: Loveable Production + Supabase Production

## ⚙️ Pre-Deployment Setup

### 1. Supabase Production Configuration

#### Database Setup
1. **Create Production Project**
   - Go to [Supabase Dashboard](https://app.supabase.com/)
   - Create new project for production
   - Note the project URL and anon key

2. **Run Migrations**
   - Copy all migration files from `supabase/migrations/`
   - Run in SQL Editor of production project
   - Verify all tables and functions created

3. **Enable Extensions**
   ```sql
   -- Required extensions
   CREATE EXTENSION IF NOT EXISTS "pg_cron";
   CREATE EXTENSION IF NOT EXISTS "pg_net";
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   ```

4. **Setup Automation Jobs**
   ```sql
   -- Daily challenge reset
   SELECT cron.schedule(
     'daily-challenge-reset',
     '0 0 * * *',
     'SELECT reset_daily_challenges();'
   );

   -- Weekly point decay
   SELECT cron.schedule(
     'weekly-points-decay',
     '0 2 * * 0',
     'SELECT decay_inactive_spa_points();'
   );

   -- Monthly reports
   SELECT cron.schedule(
     'monthly-reports',
     '0 1 1 * *',
     'SELECT send_monthly_reports();'
   );

   -- Quarterly season reset
   SELECT cron.schedule(
     'quarterly-season-reset',
     '0 3 1 */3 *',
     'SELECT automated_season_reset();'
   );

   -- Daily health check
   SELECT cron.schedule(
     'daily-health-check',
     '0 6 * * *',
     'SELECT system_health_check();'
   );
   ```

### 2. VNPAY Production Setup

#### Account Configuration
1. **Production Credentials**
   - Terminal ID (TMN_CODE): Production merchant code
   - Hash Secret: Production secret key
   - Return URL: Production callback URL

2. **Webhook Configuration**
   - Set webhook URL to production domain
   - Configure IPN notifications
   - Test webhook connectivity

### 3. Environment Variables

#### Production Environment
```env
# Supabase Production
VITE_SUPABASE_URL=https://your-prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_production_anon_key

# VNPAY Production
VNP_TMN_CODE=SABO_PROD_2024
VNP_HASH_SECRET=your_production_hash_secret
VNP_RETURN_URL=https://sabopoolarena.com/payment-result
VNP_PAYMENT_URL=https://pay.vnpay.vn/vpcpay/

# Production Settings
NODE_ENV=production
VITE_APP_ENV=production
```

## 🔄 Deployment Process

### 1. Pre-Deployment Checklist

#### Code Quality
- [ ] All tests passing
- [ ] TypeScript compilation successful
- [ ] ESLint warnings resolved
- [ ] Build process successful
- [ ] Performance optimizations applied

#### Database
- [ ] Production database configured
- [ ] All migrations applied
- [ ] RLS policies verified
- [ ] Automation jobs scheduled
- [ ] Backup procedures in place

#### Third-Party Services
- [ ] VNPAY production credentials configured
- [ ] Email service configured (if used)
- [ ] Monitoring tools setup
- [ ] SSL certificates ready

### 2. Loveable Deployment

#### Initial Setup
1. **Connect Repository**
   - Link GitHub repository to Loveable
   - Configure automatic deployments
   - Set up environment variables

2. **Configure Build Settings**
   ```json
   {
     "build": {
       "command": "npm run build",
       "output": "dist"
     },
     "environment": {
       "NODE_VERSION": "18"
     }
   }
   ```

#### Deployment Steps
1. **Push to Production Branch**
   ```bash
   git checkout main
   git pull origin main
   git push origin main
   ```

2. **Monitor Deployment**
   - Check Loveable dashboard
   - Verify build completion
   - Test deployed application

### 3. Post-Deployment Verification

#### Functional Testing
- [ ] User registration/login works
- [ ] Database connections established
- [ ] Payment integration functional
- [ ] Admin panel accessible
- [ ] Automation jobs running

#### Performance Testing
- [ ] Page load times acceptable
- [ ] API response times good
- [ ] Database query performance
- [ ] CDN caching working

#### Security Testing
- [ ] HTTPS enforced
- [ ] Authentication working
- [ ] RLS policies active
- [ ] Input validation working

## 🔄 CI/CD Pipeline

### Automated Deployment
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build application
        run: npm run build
      
      - name: Deploy to Loveable
        # Loveable handles deployment automatically
        run: echo "Deployment triggered"
```

### Staging Environment
1. **Setup Staging Branch**
   - Create `staging` branch
   - Configure separate Loveable app
   - Use staging Supabase project

2. **Testing Workflow**
   - Deploy to staging first
   - Run comprehensive tests
   - Get approval for production

## 📊 Monitoring & Alerts

### Application Monitoring
1. **Health Checks**
   - Automated health monitoring
   - Database connection checks
   - API endpoint monitoring
   - Performance metrics

2. **Error Tracking**
   - JavaScript error monitoring
   - Database error logging
   - Payment failure alerts
   - System error notifications

### Database Monitoring
1. **Performance Metrics**
   - Query execution times
   - Connection pool usage
   - Storage utilization
   - Index effectiveness

2. **Automated Alerts**
   - High error rates
   - Performance degradation
   - Database connection issues
   - Storage limits approaching

## 🔒 Security Considerations

### Production Security
1. **Environment Variables**
   - Store secrets securely
   - Use production credentials only
   - Rotate keys regularly
   - Monitor access logs

2. **Database Security**
   - RLS policies enforced
   - Strong passwords used
   - Regular security updates
   - Access logging enabled

3. **Application Security**
   - HTTPS everywhere
   - Input validation
   - CSRF protection
   - XSS prevention

## 💾 Backup & Recovery

### Database Backups
1. **Automated Backups**
   - Daily database snapshots
   - Weekly full backups
   - Monthly archives
   - Point-in-time recovery

2. **Backup Testing**
   - Regular restore tests
   - Recovery procedures documented
   - RTO/RPO defined
   - Team training completed

### Application Backups
1. **Code Repository**
   - Git version control
   - Tagged releases
   - Branch protection
   - Contributor access control

2. **Configuration Backups**
   - Environment variables
   - Deployment settings
   - Third-party configurations
   - Documentation updates

## 🚨 Rollback Procedures

### Emergency Rollback
1. **Immediate Actions**
   ```bash
   # Revert to previous deployment
   git revert HEAD
   git push origin main
   
   # Or rollback in Loveable dashboard
   # Select previous successful deployment
   ```

2. **Database Rollback**
   - Identify problematic changes
   - Restore from backup if needed
   - Run rollback migrations
   - Verify data integrity

### Communication Plan
1. **Incident Response**
   - Notify stakeholders immediately
   - Post status updates
   - Document incident details
   - Plan prevention measures

## 📈 Performance Optimization

### Production Optimizations
1. **Frontend**
   - Code splitting implemented
   - Images optimized
   - CDN caching enabled
   - Bundle size minimized

2. **Database**
   - Proper indexing
   - Query optimization
   - Connection pooling
   - Caching strategies

3. **API**
   - Response compression
   - Request rate limiting
   - Efficient data serialization
   - Error handling optimization

## 🔧 Maintenance Procedures

### Regular Maintenance
1. **Weekly Tasks**
   - Monitor system health
   - Review error logs
   - Check performance metrics
   - Update dependencies

2. **Monthly Tasks**
   - Security updates
   - Database maintenance
   - Backup verification
   - Performance review

3. **Quarterly Tasks**
   - Major updates
   - Architecture review
   - Capacity planning
   - Disaster recovery testing

## 📞 Support & Escalation

### Support Tiers
1. **Level 1**: Basic issues, user support
2. **Level 2**: Technical issues, system errors
3. **Level 3**: Critical issues, architecture problems

### Escalation Contacts
- **Technical Lead**: [Contact Info]
- **Database Admin**: [Contact Info]
- **System Admin**: longsangsabo@gmail.com
- **Emergency**: 0961167717

---

## 🎯 Go-Live Checklist

### Final Verification
- [ ] All systems operational
- [ ] Performance benchmarks met
- [ ] Security scans completed
- [ ] Backup systems verified
- [ ] Monitoring alerts configured
- [ ] Support team ready
- [ ] Documentation complete
- [ ] Rollback procedures tested

### Launch Communication
- [ ] Stakeholders notified
- [ ] User communication sent
- [ ] Support team briefed
- [ ] Monitoring activated

---

**Deployment Successful! 🎉**

The application is now live and ready to serve users. Continue monitoring and maintaining the system for optimal performance and reliability.