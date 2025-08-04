#tags: setup, deployment, comprehensive, consolidated
<!-- Consolidated from: SETUP_GUIDE.md, DEPLOYMENT_GUIDE.md, DEPLOYMENT_PROCEDURES.md, SETUP_database-management.md, DEPLOYMENT_README.md -->

# 🚀 Complete Setup & Deployment Guide

**Comprehensive guide for setting up development environment and deploying to production - All setup/deployment docs merged**

## ⚡ Quick Start (Development)

### Prerequisites
```bash
Node.js 18+
npm or yarn  
Git
Supabase account
VNPAY merchant account (for payments)
```

### 1-Minute Setup
```bash
# Clone repository
git clone [repository-url]
cd sabo-pool-v8-76

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your credentials

# Start development
npm run dev
# Opens http://localhost:5173
```

## 🗄️ Database Setup

### Supabase Configuration
```bash
# 1. Create Supabase project at https://supabase.com
# 2. Get your project URL and anon key
# 3. Add to .env.local:

VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Database Schema Migration
```sql
-- Core tables setup
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

CREATE TABLE tournaments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  max_participants INTEGER NOT NULL,
  registration_fee INTEGER DEFAULT 0,
  prize_pool INTEGER DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'in_progress', 'completed', 'cancelled')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE tournament_registrations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tournament_id, user_id)
);

-- Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_registrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Tournaments are viewable by everyone." ON tournaments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create tournaments." ON tournaments FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Indexes for performance
CREATE INDEX idx_tournaments_status ON tournaments(status);
CREATE INDEX idx_tournaments_start_date ON tournaments(start_date);
CREATE INDEX idx_tournament_registrations_tournament_id ON tournament_registrations(tournament_id);
CREATE INDEX idx_tournament_registrations_user_id ON tournament_registrations(user_id);
```

### Database Management Commands
```bash
# Apply migrations
npm run db:push

# Reset database (development only)
npm run db:reset

# Generate types
npm run db:types

# Backup database
npm run db:backup

# Restore database
npm run db:restore
```

## 💰 VNPAY Payment Setup

### VNPAY Configuration
```bash
# Add to .env.local
VITE_VNPAY_MERCHANT_ID=your_merchant_id
VITE_VNPAY_SECRET_KEY=your_secret_key
VITE_VNPAY_RETURN_URL=http://localhost:5173/payment/return
VITE_VNPAY_NOTIFY_URL=http://localhost:5173/api/payment/webhook
```

### Payment Integration Test
```bash
# Test VNPAY integration
npm run test:vnpay

# Test payment flow
node test-vnpay.js
```

## 🔧 Environment Configuration

### Development Environment
```env
# .env.local (development)
NODE_ENV=development
VITE_APP_URL=http://localhost:5173

# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# VNPAY (sandbox)
VITE_VNPAY_MERCHANT_ID=your_sandbox_merchant_id
VITE_VNPAY_SECRET_KEY=your_sandbox_secret
VITE_VNPAY_SANDBOX=true

# Feature flags
VITE_FEATURE_TOURNAMENTS=true
VITE_FEATURE_PAYMENTS=true
VITE_FEATURE_CHAT=false
```

### Production Environment
```env
# .env.production
NODE_ENV=production
VITE_APP_URL=https://your-domain.com

# Supabase (production)
VITE_SUPABASE_URL=https://your-prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_prod_anon_key

# VNPAY (production)
VITE_VNPAY_MERCHANT_ID=your_production_merchant_id
VITE_VNPAY_SECRET_KEY=your_production_secret
VITE_VNPAY_SANDBOX=false

# Performance monitoring
VITE_SENTRY_DSN=your_sentry_dsn
VITE_ANALYTICS_ID=your_analytics_id
```

## 🚀 Production Deployment

### Pre-Deployment Checklist
```bash
# ✅ Build passes
npm run build

# ✅ Tests pass
npm run test
npm run test:e2e

# ✅ Type checking
npm run type-check

# ✅ Linting
npm run lint

# ✅ Security audit
npm audit

# ✅ Performance audit
npm run lighthouse
```

### Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to staging
vercel

# Deploy to production
vercel --prod

# Environment variables setup in Vercel dashboard:
# - VITE_SUPABASE_URL
# - VITE_SUPABASE_ANON_KEY  
# - VITE_VNPAY_MERCHANT_ID
# - VITE_VNPAY_SECRET_KEY
```

### Netlify Deployment
```bash
# Build command: npm run build
# Publish directory: dist

# netlify.toml configuration
[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

# Environment variables in Netlify dashboard
```

### Docker Deployment
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "preview", "--", "--port", "3000", "--host"]
```

```bash
# Build Docker image
docker build -t sabo-pool-arena .

# Run container
docker run -p 3000:3000 -e NODE_ENV=production sabo-pool-arena

# Docker Compose
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
      - VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}
```

## 📊 Monitoring & Health Checks

### Application Monitoring
```typescript
// Health check endpoint
export async function healthCheck() {
  const checks = {
    database: await checkDatabase(),
    payment: await checkVNPAY(),
    storage: await checkStorage(),
    timestamp: new Date().toISOString()
  };

  return {
    status: Object.values(checks).every(check => check.status === 'ok') ? 'healthy' : 'unhealthy',
    checks
  };
}

async function checkDatabase() {
  try {
    const { data, error } = await supabase.from('health_check').select('count');
    return { status: error ? 'error' : 'ok', message: error?.message };
  } catch (error) {
    return { status: 'error', message: error.message };
  }
}
```

### Performance Monitoring
```bash
# Lighthouse CI
npm install -g @lhci/cli

# lighthouse.json
{
  "ci": {
    "collect": {
      "url": ["http://localhost:5173"],
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", {"minScore": 0.9}],
        "categories:accessibility": ["error", {"minScore": 0.9}]
      }
    }
  }
}

# Run Lighthouse CI
lhci autorun
```

## 🔒 Security Configuration

### SSL/HTTPS Setup
```bash
# Certbot for SSL (if self-hosting)
sudo certbot --nginx -d yourdomain.com

# Or use cloud provider SSL (Vercel/Netlify handle this automatically)
```

### Security Headers
```javascript
// vite.config.ts security headers
export default defineConfig({
  // ...other config
  server: {
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
    }
  }
});
```

### Environment Security
```bash
# Never commit .env files
echo ".env*" >> .gitignore

# Use environment-specific configs
.env.local          # Local development
.env.staging        # Staging environment  
.env.production     # Production environment

# Rotate secrets regularly
# Use secure secret management (Vercel/Netlify environment variables)
```

## 🛠️ Development Tools

### VS Code Configuration
```json
// .vscode/settings.json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}

// .vscode/extensions.json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

### Git Hooks
```bash
# Install husky
npm install --save-dev husky

# Setup pre-commit hook
npx husky add .husky/pre-commit "npm run lint && npm run type-check"

# Setup pre-push hook
npx husky add .husky/pre-push "npm run test"
```

## 🚨 Troubleshooting

### Common Issues

**Build Fails**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node version
node --version  # Should be 18+
```

**Database Connection Issues**
```bash
# Verify Supabase URL and keys
npm run test:db

# Check RLS policies
# Ensure user has proper permissions
```

**VNPAY Integration Issues**
```bash
# Verify merchant credentials
npm run test:vnpay

# Check webhook URL accessibility
curl -X POST your-domain.com/api/payment/webhook
```

**Performance Issues**
```bash
# Analyze bundle size
npm run analyze

# Check memory leaks
npm run test:memory

# Profile in browser dev tools
```

## 📋 Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificate ready
- [ ] Domain DNS configured
- [ ] Monitoring tools setup

### Post-Deployment
- [ ] Health check endpoints responding
- [ ] Payment integration working
- [ ] Database queries performing well
- [ ] Error monitoring active
- [ ] Backup procedures tested

### Go-Live Checklist
- [ ] Load testing completed
- [ ] Security scan passed
- [ ] Performance benchmarks met
- [ ] Team notified of deployment
- [ ] Rollback procedure ready

---

**Setup Status**: ✅ Production Ready  
**Last Updated**: August 2025  
**Deployment Method**: Vercel/Netlify + Supabase + VNPAY
