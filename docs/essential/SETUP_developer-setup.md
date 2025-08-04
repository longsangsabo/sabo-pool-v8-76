# 🚀 Developer Setup Guide

**Quick start guide for new developers** - Get up and running in 10 minutes!

## ⚡ Prerequisites

```bash
Node.js 18+
npm or yarn
Git
```

## 🛠️ Setup Steps

### 1. Clone & Install
```bash
git clone [repository-url]
cd sabo-pool-v8-76
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env.local
# Edit .env.local with your credentials
```

### 3. Database Setup
```bash
# Connect to Supabase
npm run db:push
```

### 4. Start Development
```bash
npm run dev
# Opens http://localhost:5173
```

## 🎯 Key Commands

```bash
# Development
npm run dev              # Start dev server
npm run build           # Production build
npm run preview         # Preview production build

# Testing
npm test                # Run tests
npm run test:e2e        # E2E tests
npm run test:coverage   # Coverage report

# Code Quality
npm run lint            # ESLint check
npm run lint:fix        # Auto-fix issues
npm run format          # Prettier format
```

## 📁 Project Structure

```
src/
├── components/         # Shared UI components
├── features/          # Feature-based modules
│   ├── club/         # CLB management
│   ├── tournament/   # Tournament system
│   └── user/         # User management
├── hooks/            # Custom React hooks
├── pages/            # Route components
├── shared/           # Shared utilities
└── types/            # TypeScript types
```

## 🔧 Configuration Files

- `configs/vite.config.ts` - Build configuration
- `configs/tailwind.config.ts` - Styling
- `configs/jest.config.ts` - Testing
- `package.json` - Dependencies & scripts

## 🐛 Common Issues & Fixes

### Build Errors
```bash
# Clear cache & reinstall
rm -rf node_modules package-lock.json
npm install
```

### Database Connection
```bash
# Check environment variables
npm run test:vnpay
```

### Type Errors
```bash
# Run type check
npm run type-check
```

## 📚 Next Steps

1. Read [API Guide](API_GUIDE.md) for backend integration
2. Check [Database Guide](DATABASE_GUIDE.md) for schema
3. Review [Features Complete](FEATURES_COMPLETE.md) for functionality

## 🆘 Getting Help

- **Documentation**: Check `docs/essential/`
- **Issues**: Create GitHub issue
- **Emergency**: See [Troubleshooting](TROUBLESHOOTING_GUIDE.md)

---

**Ready to code! 🎉**
