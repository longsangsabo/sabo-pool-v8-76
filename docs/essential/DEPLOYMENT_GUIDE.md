# 🚀 Production Deployment Guide

**Step-by-step deployment checklist for going live**

## ⚡ Pre-Deployment Checklist

### 🔧 Environment Setup
- [ ] Production environment variables configured
- [ ] SSL certificates installed and verified
- [ ] Domain DNS settings configured
- [ ] CDN configured (Cloudflare/AWS)
- [ ] Backup procedures tested

### 🗄️ Database Setup
- [ ] Production database created (Supabase)
- [ ] All migrations applied successfully
- [ ] Row Level Security (RLS) policies verified
- [ ] Database backups automated
- [ ] Connection pooling configured

### 💰 Payment Integration
- [ ] VNPAY production credentials configured
- [ ] Payment webhooks tested
- [ ] Test transactions completed successfully
- [ ] Error handling verified
- [ ] Refund procedures tested

## 🚀 Deployment Steps

### 1. Build & Test
```bash
# Run full test suite
npm run test
npm run test:e2e
npm run test:coverage

# Build for production
npm run build

# Test production build locally
npm run preview
```

### 2. Environment Variables
```bash
# Production .env file
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_production_anon_key
VITE_VNPAY_MERCHANT_ID=your_production_merchant_id
VITE_VNPAY_SECRET_KEY=your_production_secret_key
VITE_APP_URL=https://your-domain.com
NODE_ENV=production
```

### 3. Deploy to Platform

#### Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod

# Verify deployment
vercel --prod --confirm
```

#### Netlify Deployment
```bash
# Build and deploy
npm run build
netlify deploy --prod --dir=dist

# Or use automated deployment
git push origin main  # Triggers auto-deploy
```

### 4. Post-Deployment Verification

#### Health Checks
```bash
# Check application health
curl https://your-domain.com/api/health

# Check database connectivity
curl https://your-domain.com/api/db/status

# Test payment endpoints
curl https://your-domain.com/api/payments/test
```

#### Performance Tests
```bash
# Run Lighthouse audit
npm run lighthouse

# Check Core Web Vitals
# - First Contentful Paint < 1.8s
# - Largest Contentful Paint < 2.5s  
# - Cumulative Layout Shift < 0.1
```

## 📊 Monitoring Setup

### Application Monitoring
```bash
# Install monitoring tools
npm install @sentry/react @sentry/vite-plugin

# Configure error tracking
# See monitoring configuration in src/utils/monitoring.ts
```

### Database Monitoring
- Supabase Dashboard: Monitor queries, connections
- Set up alerts for:
  - Connection pool exhaustion
  - Slow queries (>1s)
  - High error rates

### Payment Monitoring
- VNPAY Dashboard: Monitor transactions
- Set up alerts for:
  - Failed payments
  - Webhook failures
  - Refund issues

## 🔒 Security Checklist

### SSL & HTTPS
- [ ] SSL certificate valid and auto-renewing
- [ ] HTTP redirects to HTTPS
- [ ] HSTS headers configured
- [ ] Security headers (CSP, CORS) set

### API Security
- [ ] Rate limiting implemented
- [ ] API authentication working
- [ ] Sensitive data not exposed in logs
- [ ] Database connections secured

### Payment Security
- [ ] PCI DSS compliance verified
- [ ] Payment data encrypted in transit
- [ ] No sensitive payment data stored
- [ ] Webhook signature verification working

## 🚨 Rollback Procedures

### Quick Rollback
```bash
# Revert to previous deployment
vercel --prod --rollback

# Or for Netlify
netlify rollback
```

### Database Rollback
```bash
# Rollback database migrations if needed
supabase db reset --db-url=production_url
# Apply specific migration
supabase db push --db-url=production_url
```

## 📈 Performance Optimization

### Build Optimization
- Bundle size analyzed and optimized
- Code splitting implemented
- Lazy loading for non-critical components
- Image optimization enabled

### Runtime Performance  
- API response caching configured
- Database query optimization verified
- CDN caching headers set
- Service worker configured (if applicable)

## 🆘 Emergency Procedures

### System Down
1. Check monitoring dashboard
2. Verify DNS/CDN status
3. Check application health endpoints
4. Contact hosting provider if needed

### Database Issues
1. Check Supabase status page
2. Verify connection strings
3. Check connection pool status
4. Contact Supabase support if needed

### Payment Issues
1. Check VNPAY status
2. Verify webhook endpoints
3. Check transaction logs
4. Contact VNPAY support if needed

## 📞 Contact Information

### Emergency Contacts
- **Technical Lead**: [Contact Info]
- **DevOps Engineer**: [Contact Info]
- **System Administrator**: [Contact Info]

### Vendor Support
- **Supabase Support**: support@supabase.io
- **VNPAY Support**: [VNPAY support contact]
- **Hosting Provider**: [Provider support]

---

## ✅ Deployment Complete!

**Post-deployment tasks:**
1. Update team on successful deployment
2. Monitor for 24 hours post-deployment  
3. Schedule next deployment window
4. Update documentation with any changes

**🎉 Your application is now LIVE in production!**
