# 🚀 SABO Pool Arena Hub - Complete Automation Setup

## 📋 Overview

This project has been configured with a comprehensive automation pipeline including:

- **Code Quality**: ESLint + Prettier + Husky
- **Testing**: Jest + React Testing Library + Playwright E2E
- **CI/CD**: GitHub Actions with multiple environments
- **Performance**: Lighthouse CI + Bundle Analyzer
- **Security**: CodeQL + Vulnerability scanning
- **Monitoring**: Sentry error tracking
- **Supabase**: Database migrations + Edge Functions automation

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite 5 + TypeScript 5
- **Styling**: Tailwind CSS + Radix UI
- **Backend**: Supabase (PostgreSQL, Realtime, Edge Functions)
- **Payment**: VNPAY integration
- **Testing**: Jest + Playwright + MSW
- **CI/CD**: GitHub Actions
- **Monitoring**: Sentry + Lighthouse CI

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm 8+
- Git

### Installation
```bash
# Clone repository
git clone <repository-url>
cd sabo-pool-arena-hub

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

## 📁 Project Structure

```
├── src/
│   ├── components/          # React components
│   ├── pages/              # Page components
│   ├── hooks/              # Custom hooks
│   ├── lib/                # Utilities and configurations
│   ├── test/               # Test setup and mocks
│   └── types/              # TypeScript type definitions
├── e2e/                    # Playwright E2E tests
├── supabase/               # Supabase configuration
├── .github/                # GitHub Actions workflows
├── scripts/                # Utility scripts
└── docs/                   # Documentation
```

## 🧪 Testing

### Unit Tests (Jest + React Testing Library)
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### E2E Tests (Playwright)
```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in headed mode
npm run test:e2e:headed
```

### Performance Tests
```bash
# Run Lighthouse CI
npm run test:performance

# Analyze bundle size
npm run analyze
```

## 🔧 Code Quality

### Linting & Formatting
```bash
# Run ESLint
npm run lint

# Fix ESLint issues
npm run lint:fix

# Format code with Prettier
npm run format

# Check formatting
npm run format:check

# Type checking
npm run type-check
```

### Pre-commit Hooks
The project uses Husky to automatically run linting and formatting on commit:
- ESLint fixes
- Prettier formatting
- Type checking

## 🚀 CI/CD Pipeline

### GitHub Actions Workflows

1. **CI Pipeline** (`.github/workflows/ci.yml`)
   - Lint and format check
   - Unit and E2E tests
   - Build verification
   - Security audit
   - Performance testing
   - Preview deployment

2. **CodeQL Security** (`.github/workflows/codeql.yml`)
   - Static code analysis
   - Security vulnerability detection

3. **Supabase CI/CD** (`.github/workflows/supabase.yml`)
   - Database migrations
   - Edge Functions deployment
   - Health checks

### Deployment Environments

- **Preview**: Automatic deployment for pull requests
- **Production**: Automatic deployment for main branch

## 🔒 Security

### Automated Security Checks
- **CodeQL**: Static analysis for security vulnerabilities
- **npm audit**: Dependency vulnerability scanning
- **Snyk**: Additional security scanning (optional)

### Environment Variables
All environment variables are validated using Zod schema in `src/lib/env.ts`:

```typescript
// Required variables
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_VNP_TMN_CODE
VITE_VNP_HASH_SECRET
VITE_VNP_RETURN_URL
VITE_VNP_PAYMENT_URL

// Optional variables
VITE_SENTRY_DSN
VITE_APP_VERSION
VITE_ENABLE_PWA
VITE_ENABLE_ANALYTICS
```

## 📊 Performance Monitoring

### Lighthouse CI
- Performance score: ≥80
- Accessibility score: ≥90
- Best practices score: ≥80
- SEO score: ≥80

### Bundle Analysis
```bash
# Analyze bundle size
npm run analyze
```

### Performance Budgets
- First Contentful Paint: <2s
- Largest Contentful Paint: <2.5s
- Cumulative Layout Shift: <0.1
- First Input Delay: <100ms

## 🔍 Error Tracking

### Sentry Integration
- Automatic error capture in production
- Performance monitoring
- User context tracking
- Release tracking

### Error Boundaries
- React error boundaries for component-level error handling
- Global error handling in main App component

## 🗄️ Supabase Management

### Database Migrations
```bash
# Push migrations to development
npm run db:push

# Reset database
npm run db:reset

# Check database health
npm run db:health
```

### Edge Functions
```bash
# Deploy Edge Functions
npm run functions:deploy

# View function logs
npm run functions:logs

# Test Edge Functions
npm run functions:health
```

### Real-time Health
```bash
# Check real-time subscriptions
npm run realtime:health
```

## 📈 Dependabot

### Automatic Updates
- **npm dependencies**: Weekly updates
- **GitHub Actions**: Weekly updates
- **Docker**: Weekly updates (if applicable)

### Update Strategy
- Minor and patch updates: Auto-merge
- Major updates: Manual review required
- Security updates: Immediate attention

## 🎯 Development Workflow

### 1. Feature Development
```bash
# Create feature branch
git checkout -b feature/amazing-feature

# Make changes and commit
git add .
git commit -m "feat: add amazing feature"

# Push and create PR
git push origin feature/amazing-feature
```

### 2. Code Review Process
- Automated checks run on PR
- Manual review required
- All tests must pass
- Performance benchmarks must be met

### 3. Deployment
- Preview deployment for PRs
- Production deployment for main branch
- Zero-downtime deployments

## 🐛 Troubleshooting

### Common Issues

1. **ESLint/Prettier conflicts**
   ```bash
   npm run lint:fix
   npm run format
   ```

2. **Test failures**
   ```bash
   npm run test:watch
   # Check specific test files
   ```

3. **Build failures**
   ```bash
   npm run type-check
   npm run build
   ```

4. **Supabase issues**
   ```bash
   npm run db:health
   npm run functions:health
   ```

### Performance Issues
```bash
# Analyze bundle
npm run analyze

# Run performance tests
npm run test:performance

# Check Lighthouse scores
npx lhci autorun
```

## 📚 Additional Resources

- [React Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supabase Documentation](https://supabase.com/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

### Commit Message Convention
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test additions/changes
- `chore:` Build/tooling changes

## 📄 License

This project is licensed under the MIT License.

---

**🎉 Your project is now fully automated with professional-grade CI/CD, testing, security, and monitoring!** 