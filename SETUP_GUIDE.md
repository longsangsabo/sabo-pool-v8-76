# 🚀 SABO Pool Arena Hub - Development Setup Guide

## Prerequisites

### Required Software
- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** 8+ (comes with Node.js)
- **Git** ([Download](https://git-scm.com/))
- **VS Code** (recommended) with extensions:
  - TypeScript and JavaScript Language Features
  - Tailwind CSS IntelliSense
  - ES7+ React/Redux/React-Native snippets
  - Prettier - Code formatter

### Accounts Needed
- **Supabase Account** - Database and backend services
- **VNPAY Account** - Payment processing (for production)
- **Loveable Account** - Deployment platform

## 🔧 Local Development Setup

### 1. Clone Repository
```bash
git clone [repository-url]
cd sabo-pool-arena-hub
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration

Create `.env.local` file in root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://knxevbkkkiadgppxbphh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtueGV2Ymtra2lhZGdwcHhicGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzODQ1NzMsImV4cCI6MjA2Njk2MDU3M30.bVpo1y8fZuX5y6pePpQafvAQtihY-nJOmsKL9QzRkW4

# VNPAY Configuration (Development)
VNP_TMN_CODE=SABO2024
VNP_HASH_SECRET=your_sandbox_secret_key
VNP_RETURN_URL=http://localhost:5173/payment-result
VNP_PAYMENT_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html

# Development Settings
NODE_ENV=development
```

### 4. Database Setup

#### Connect to Supabase
1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Access project: `knxevbkkkiadgppxbphh`
3. Verify database connection

#### Run Migrations (if needed)
All migrations are already applied. If you need to run new migrations:
```bash
# Check migration status in Supabase Dashboard
# SQL Editor > Run migration files if needed
```

### 5. Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 🗄️ Database Access

### Supabase Dashboard
- **URL**: https://app.supabase.com/project/knxevbkkkiadgppxbphh
- **Database**: PostgreSQL with extensions
- **Auth**: Built-in authentication
- **Storage**: File uploads and management
- **Edge Functions**: Serverless functions

### Key Database Tables
```sql
-- Core tables to understand
profiles              -- User information and roles
club_profiles        -- Club data and verification
tournaments          -- Tournament management
matches              -- Match records and results
challenges           -- Player challenges
player_rankings      -- ELO and SPA points
notifications        -- System notifications
system_logs          -- Automation and system logs
```

### Admin Access
To become an admin user:
1. Register a new account
2. Update your profile with phone: `0961167717` or `0798893333`
3. Or use email: `longsangsabo@gmail.com` or `longsang063@gmail.com`
4. The system will automatically grant admin privileges

## 🔌 Key Integrations

### Supabase Services
- **Database**: PostgreSQL with RLS
- **Authentication**: User management
- **Storage**: File uploads
- **Edge Functions**: Server-side logic
- **Realtime**: Live updates

### VNPAY Payment Gateway
- **Sandbox URL**: https://sandbox.vnpayment.vn/
- **Test Cards**: Available in VNPAY documentation
- **Webhook**: Handled by edge functions

### External APIs
- **Google Maps**: For location services
- **Resend**: For email notifications (if configured)

## 🧪 Testing Setup

### Unit Tests
```bash
npm test                  # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
```

### E2E Testing
```bash
npm run test:e2e         # Run Playwright tests
```

### Manual Testing Checklist
- [ ] User registration and login
- [ ] Profile creation and updates
- [ ] Club registration process
- [ ] Challenge creation and response
- [ ] Tournament registration
- [ ] Payment flow (sandbox)
- [ ] Admin panel access
- [ ] Notifications system

## 🚀 Development Workflow

### Branch Strategy
- `main` - Production ready code
- `develop` - Development branch
- `feature/*` - Feature branches
- `hotfix/*` - Critical fixes

### Code Standards
- **TypeScript**: Strict mode enabled
- **ESLint**: Configured for React/TypeScript
- **Prettier**: Code formatting
- **Husky**: Pre-commit hooks

### Commit Convention
```bash
feat: add new tournament feature
fix: resolve payment gateway issue
docs: update API documentation
style: fix code formatting
refactor: improve component structure
test: add unit tests for ranking system
```

## 🔍 Debugging Tools

### Browser DevTools
- **React DevTools**: Component inspection
- **Network Tab**: API request monitoring
- **Console**: Error logging and debugging

### Supabase Dashboard
- **SQL Editor**: Query database directly
- **Logs**: Monitor edge functions and database
- **Authentication**: User management
- **Storage**: File management

### Application Monitoring
- **Admin Dashboard**: `/admin` - System health and metrics
- **System Logs**: Monitor automation and errors
- **Real-time Updates**: Track live events

## 📊 Performance Optimization

### Frontend
- **Code Splitting**: Lazy loading components
- **Image Optimization**: Proper sizing and formats
- **Bundle Analysis**: Monitor bundle size
- **Caching**: React Query for server state

### Database
- **Indexing**: Proper database indexes
- **RLS Policies**: Efficient row-level security
- **Query Optimization**: Monitor slow queries
- **Connection Pooling**: Supabase handles this

## 🛡️ Security Considerations

### Authentication
- **Supabase Auth**: Secure user management
- **RLS Policies**: Database-level security
- **JWT Tokens**: Automatic token handling
- **Password Requirements**: Strong password enforcement

### Data Protection
- **HTTPS**: All communications encrypted
- **Input Validation**: Server-side validation
- **XSS Prevention**: Proper data sanitization
- **CSRF Protection**: Built-in protections

## 🆘 Common Issues & Solutions

### Development Server Won't Start
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Database Connection Issues
1. Check environment variables
2. Verify Supabase project status
3. Test connection in dashboard
4. Check RLS policies

### Build Failures
1. Check TypeScript errors
2. Verify all imports
3. Update dependencies if needed
4. Clear build cache

### Payment Integration Issues
1. Verify VNPAY credentials
2. Check sandbox environment
3. Test with provided test data
4. Monitor webhook responses

## 📞 Getting Help

### Documentation
- Project README.md
- Component documentation in code
- Database schema documentation
- API endpoint documentation

### Support Channels
- **Technical Issues**: Create GitHub issue
- **System Problems**: Check admin dashboard
- **Payment Issues**: Contact VNPAY support
- **Emergency**: Contact project maintainer

---

**Setup Complete! 🎉**

You should now have a fully functional development environment. If you encounter any issues, refer to the troubleshooting section or contact the development team.