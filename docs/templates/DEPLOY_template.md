# 🚀 [Deployment/Production Title]

*#tags: deployment, production, operations, [environment], template*

**Last Updated**: [YYYY-MM-DD]
**Status**: [Draft|Review|Approved]
**Owner**: [Your Name/Team]
**Dependencies**: [Setup docs, environment configs, infrastructure]

**Purpose**: Deployment procedures and production operations for [specific system/environment]

---

## 🎯 Deployment Overview

### 📋 Deployment Scope
- **Environment**: [Development|Staging|Production]
- **Platform**: [Vercel|Netlify|AWS|Docker|Kubernetes]
- **Deployment Type**: [Rolling|Blue-Green|Canary|Recreate]
- **Downtime**: [Zero downtime|Planned maintenance window]
- **Rollback Time**: [X minutes maximum]

### 🏗️ Infrastructure Overview
Brief description of the deployment architecture and infrastructure components.

---

## 🚀 Quick Deployment

### ⚡ One-Command Deploy
```bash
# Automated deployment
npm run deploy:production

# Or with environment specification
npm run deploy -- --env=production

# Verify deployment
npm run verify:production
```

### 🔍 Quick Status Check
```bash
# Check deployment status
npm run status:deployment

# Health check
curl https://your-domain.com/health

# Monitor logs
npm run logs:production
```

---

## 📚 Detailed Deployment Process

### 🛠️ Pre-Deployment Checklist

#### ✅ Code Quality
- [ ] All tests pass locally
- [ ] Code review completed
- [ ] Security scan passed
- [ ] Performance benchmarks met
- [ ] Documentation updated

#### ✅ Environment Preparation
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] SSL certificates valid
- [ ] DNS records configured
- [ ] Monitoring alerts active

#### ✅ Infrastructure Ready
- [ ] Server capacity sufficient
- [ ] Backup procedures tested
- [ ] Rollback plan prepared
- [ ] Team notification sent
- [ ] Maintenance window scheduled

---

## 🌐 Environment-Specific Deployments

### 🧪 Development Environment
```bash
# Deploy to development
git push origin develop

# Auto-deployment via CI/CD
# Triggers on push to develop branch

# Manual deployment
npm run deploy:dev

# Environment URL
echo "https://dev.your-domain.com"
```

### 🎭 Staging Environment
```bash
# Deploy to staging
git push origin staging

# Run staging tests
npm run test:staging

# Performance testing
npm run perf:staging

# Environment URL
echo "https://staging.your-domain.com"
```

### 🏭 Production Environment
```bash
# Create production release
git tag v1.0.0
git push origin v1.0.0

# Deploy to production
npm run deploy:production

# Post-deployment verification
npm run verify:production

# Environment URL
echo "https://your-domain.com"
```

---

## 🐳 Container Deployment

### 📦 Docker Configuration
```dockerfile
# Multi-stage Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### 🏗️ Docker Compose
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
    depends_on:
      - database
      
  database:
    image: postgres:15
    environment:
      - POSTGRES_DB=${DB_NAME}
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      
volumes:
  postgres_data:
```

### ☸️ Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: [app-name]
spec:
  replicas: 3
  selector:
    matchLabels:
      app: [app-name]
  template:
    metadata:
      labels:
        app: [app-name]
    spec:
      containers:
      - name: [app-name]
        image: [your-registry]/[app-name]:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: database-url
```

---

## 🔄 CI/CD Pipeline

### 🏗️ GitHub Actions Workflow
```yaml
name: Deploy to Production
on:
  push:
    tags:
      - 'v*'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run lint
      - run: npm run type-check

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v3
        with:
          name: build-files
          path: dist/

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/download-artifact@v3
        with:
          name: build-files
      - name: Deploy to production
        run: |
          # Deployment commands
          npm run deploy:production
```

### 🔧 Pipeline Configuration
```json
{
  "scripts": {
    "ci:test": "npm run test && npm run lint && npm run type-check",
    "ci:build": "npm run build && npm run test:build",
    "ci:deploy": "npm run deploy:production && npm run verify:production",
    "ci:rollback": "npm run rollback:production"
  }
}
```

---

## 🗄️ Database Deployment

### 📊 Migration Strategy
```bash
# Check migration status
npm run db:migration:status

# Run pending migrations
npm run db:migration:run

# Rollback last migration (if needed)
npm run db:migration:rollback

# Create backup before migration
npm run db:backup production-backup-$(date +%Y%m%d-%H%M%S).sql
```

### 🔄 Zero-Downtime Migrations
```bash
# 1. Deploy new code (backward compatible)
npm run deploy:code-only

# 2. Run migration
npm run db:migration:run

# 3. Deploy final code
npm run deploy:complete

# 4. Clean up old columns (after verification)
npm run db:cleanup:old-columns
```

### 📋 Database Checklist
- [ ] Backup created and verified
- [ ] Migration scripts tested in staging
- [ ] Rollback plan prepared
- [ ] Performance impact assessed
- [ ] Index creation scheduled for low-traffic periods

---

## 🔐 Security Deployment

### 🛡️ Security Hardening
```bash
# Update security headers
npm run security:headers

# Rotate secrets
npm run security:rotate-secrets

# Update SSL certificates
npm run security:ssl-update

# Scan for vulnerabilities
npm run security:scan
```

### 🔑 Secrets Management
```bash
# Environment-specific secrets
# Production
PRODUCTION_SECRET_KEY=xxx
DATABASE_PASSWORD=xxx
API_KEYS=xxx

# Use secret management service
kubectl create secret generic app-secrets \
  --from-literal=database-url=$DATABASE_URL \
  --from-literal=api-key=$API_KEY
```

### 📊 Security Monitoring
```bash
# Enable security monitoring
npm run monitoring:security

# Configure alerts
npm run alerts:security

# Audit logs
npm run logs:security
```

---

## 📊 Monitoring & Observability

### 📈 Application Monitoring
```bash
# Configure monitoring
npm run monitoring:setup

# Health checks
npm run health:configure

# Performance metrics
npm run metrics:setup

# Error tracking
npm run errors:setup
```

### 🚨 Alerting Configuration
```yaml
# Example alert configuration
alerts:
  - name: High Error Rate
    condition: error_rate > 5%
    duration: 5m
    notification: slack-channel
    
  - name: High Response Time
    condition: response_time_95th > 500ms
    duration: 2m
    notification: pagerduty
    
  - name: Low Availability
    condition: availability < 99%
    duration: 1m
    notification: emergency-contact
```

### 📊 Dashboard Setup
```bash
# Create monitoring dashboard
npm run dashboard:create

# Configure metrics
npm run metrics:configure

# Set up log aggregation
npm run logs:aggregate
```

---

## 🔄 Rollback Procedures

### ⏪ Quick Rollback
```bash
# Rollback to previous version
npm run rollback:previous

# Rollback to specific version
npm run rollback:version v1.2.3

# Emergency rollback
npm run rollback:emergency
```

### 🚨 Emergency Procedures
```bash
# 1. Immediate traffic stop (if needed)
npm run traffic:stop

# 2. Rollback application
npm run rollback:immediate

# 3. Rollback database (if needed)
npm run db:rollback:emergency

# 4. Restore traffic
npm run traffic:restore

# 5. Incident notification
npm run incident:notify
```

### ✅ Rollback Verification
```bash
# Verify rollback success
npm run verify:rollback

# Check all services
npm run health:check:all

# Monitor error rates
npm run monitor:errors

# Validate functionality
npm run test:smoke:production
```

---

## 🚨 Troubleshooting

### 🔧 Common Deployment Issues

**Build failures**
```bash
# Clear build cache
npm run build:clean

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check build logs
npm run build:verbose
```

**Deployment timeouts**
```bash
# Increase timeout
DEPLOY_TIMEOUT=600 npm run deploy

# Check deployment status
npm run deploy:status

# Manual deployment steps
npm run deploy:manual
```

**Database connection issues**
```bash
# Test database connection
npm run db:test-connection

# Check connection pool
npm run db:pool:status

# Reset connections
npm run db:connections:reset
```

**SSL certificate issues**
```bash
# Check certificate status
npm run ssl:check

# Renew certificates
npm run ssl:renew

# Update certificate configuration
npm run ssl:update-config
```

### 🐛 Debug Mode
```bash
# Enable deployment debugging
DEBUG=deploy:* npm run deploy

# Verbose logging
npm run deploy:verbose

# Step-by-step deployment
npm run deploy:debug
```

---

## 📋 Deployment Checklist

### ✅ Pre-Deployment
- [ ] Code merged to main branch
- [ ] All tests passing
- [ ] Security scan completed
- [ ] Performance benchmarks met
- [ ] Database backup created
- [ ] Team notified
- [ ] Rollback plan ready

### 🚀 During Deployment
- [ ] Monitor deployment progress
- [ ] Watch error rates
- [ ] Check response times
- [ ] Verify health checks
- [ ] Monitor user feedback
- [ ] Track key metrics

### ✅ Post-Deployment
- [ ] Smoke tests passed
- [ ] All services healthy
- [ ] Monitoring active
- [ ] Performance acceptable
- [ ] User feedback positive
- [ ] Documentation updated
- [ ] Team notified of completion

---

## 📖 References

### 🔗 Related Documentation
- `SETUP_complete-guide.md` - Environment setup
- `TEST_comprehensive-guide.md` - Testing procedures
- `SECURITY_production-guide.md` - Security guidelines

### 📚 Infrastructure Resources
- [Platform Documentation Links]
- [CI/CD Best Practices]
- [Monitoring and Alerting Guides]

### 🛠️ Tools and Services
- **CI/CD**: [GitHub Actions|GitLab CI|Jenkins]
- **Hosting**: [Vercel|Netlify|AWS|Google Cloud]
- **Monitoring**: [DataDog|New Relic|Grafana]
- **Security**: [Snyk|OWASP ZAP|SonarQube]

---

**Template Version**: 1.0  
**Last Updated**: August 2025  
**Status**: ✅ Template Ready  

---

## 📝 Template Usage Instructions

1. **Copy this template**: `cp docs/templates/DEPLOY_template.md docs/DEPLOY_your-environment.md`
2. **Replace placeholders**: Update all `[bracketed]` content with specific deployment details
3. **Add platform specifics**: Include actual deployment commands and configurations
4. **Test procedures**: Verify every deployment step and rollback procedure
5. **Update metadata**: Set correct tags, owner, dependencies
6. **Review and approve**: Follow team review process
