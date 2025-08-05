# 📚 SABO POOL ARENA - TÀI LIỆU THAM CHIẾU

> **Hướng dẫn điều hướng và tham chiếu nhanh cho dự án SABO Pool Arena**  
> *Cập nhật: Tháng 8, 2025*

---

## 🎯 MỤC LỤC CHÍNH

### 📋 **1. Tài liệu hệ thống cốt lõi**
- **[RANK_SYSTEM_README.md](./RANK_SYSTEM_README.md)** - Hệ thống phân hạng chính thức
- **[README.md](./README.md)** - Tài liệu chính của dự án
- **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)** - Cấu trúc cơ sở dữ liệu

### 🏆 **2. Tài liệu tournament & ranking**
- **[TOURNAMENT_SYSTEM_README.md](./TOURNAMENT_SYSTEM_README.md)** - Hệ thống tournament
- **[ENHANCED_ELO_SYSTEM_README.md](./ENHANCED_ELO_SYSTEM_README.md)** - Hệ thống ELO nâng cao
- **[BRACKET_GENERATION_GUIDE.md](./BRACKET_GENERATION_GUIDE.md)** - Hướng dẫn tạo bracket

### 🚀 **3. Triển khai & deployment**
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Hướng dẫn triển khai
- **[NETLIFY_DEPLOYMENT_GUIDE.md](./NETLIFY_DEPLOYMENT_GUIDE.md)** - Triển khai Netlify
- **[PRODUCTION_DEPLOYMENT_CHECKLIST.md](./PRODUCTION_DEPLOYMENT_CHECKLIST.md)** - Checklist production

### 🔧 **4. Testing & QA**
- **[TESTING_GUIDE_BACKEND.md](./TESTING_GUIDE_BACKEND.md)** - Testing backend
- **[TOURNAMENT_TESTING_GUIDE.md](./TOURNAMENT_TESTING_GUIDE.md)** - Testing tournament
- **[DASHBOARD_TESTING_GUIDE.md](./DASHBOARD_TESTING_GUIDE.md)** - Testing dashboard

### 💾 **5. Quản lý dữ liệu**
- **[DATABASE_MANAGEMENT_GUIDE.md](./DATABASE_MANAGEMENT_GUIDE.md)** - Quản lý database
- **[CURRENT_SEASON_README.md](./CURRENT_SEASON_README.md)** - Season hiện tại
- **[SEASON_HISTORY_README.md](./SEASON_HISTORY_README.md)** - Lịch sử season

### 🛡️ **6. Admin & management**
- **[ADMIN_SYSTEM_README.md](./ADMIN_SYSTEM_README.md)** - Hệ thống admin
- **[ADMIN_MENU_STRUCTURE.md](./ADMIN_MENU_STRUCTURE.md)** - Cấu trúc menu admin
- **[CHALLENGE_SYSTEM_README.md](./CHALLENGE_SYSTEM_README.md)** - Hệ thống thách đấu

---

## 🎮 CÁC TÍNH NĂNG CHÍNH

### 🏅 **Hệ thống phân hạng (Ranking System)**
- **12 cấp độ:** K → K+ → I → I+ → H → H+ → G → G+ → F → F+ → E → E+
- **ELO Range:** 1000-2100+ với gap 100 điểm
- **Tournament Rewards:** +5 (Top 16) đến +80 (Champion)
- **Chi tiết:** [RANK_SYSTEM_README.md](./RANK_SYSTEM_README.md)

### 🏆 **Tournament System**
- **Bracket Generation:** Tự động tạo bracket theo ELO
- **Multi-format:** Single/Double elimination, Round robin
- **Real-time tracking:** Theo dõi kết quả trực tiếp
- **Chi tiết:** [TOURNAMENT_SYSTEM_README.md](./TOURNAMENT_SYSTEM_README.md)

### 💡 **ELO System v2.0**
- **Dynamic K-factors:** Điều chỉnh theo rank và volatility
- **Tournament bonuses:** Thưởng theo vị trí cuối cùng
- **Skill correlation:** Liên kết với khả năng thực tế
- **Chi tiết:** [ENHANCED_ELO_SYSTEM_README.md](./ENHANCED_ELO_SYSTEM_README.md)

### 🎯 **Challenge System**
- **Peer-to-peer challenges:** Thách đấu 1v1
- **Rank-based rewards:** Phần thưởng theo hạng
- **Anti-boost protection:** Chống gian lận điểm số
- **Chi tiết:** [CHALLENGE_SYSTEM_README.md](./CHALLENGE_SYSTEM_README.md)

---

## 🛠️ SETUP & DEVELOPMENT

### 📦 **Quick Start**
```bash
# Clone repository
git clone <repository-url>
cd sabo-pool-v8-76

# Install dependencies
npm install

# Setup environment
cp env.example .env.local

# Start development server
npm run dev
```

### 🔧 **Tech Stack**
- **Frontend:** React 18, TypeScript, Tailwind CSS, Vite
- **Backend:** Supabase (PostgreSQL, Auth, Real-time)
- **Deployment:** Netlify (Frontend), Supabase (Backend)
- **Testing:** Vitest, Playwright, Jest

### 🗄️ **Database Setup**
```bash
# Setup Supabase
npx supabase init
npx supabase start

# Run migrations
npx supabase db reset
```

---

## 📊 ARCHITECTURE OVERVIEW

### 🏗️ **Project Structure**
```
sabo-pool-v8-76/
├── src/                     # Source code
│   ├── components/          # React components
│   ├── pages/              # Page components
│   ├── hooks/              # Custom hooks
│   ├── lib/                # Utilities & config
│   └── types/              # TypeScript definitions
├── supabase/               # Database & functions
├── e2e/                    # End-to-end tests
├── scripts/                # Build & deployment scripts
└── docs/                   # Documentation
```

### 🔄 **Data Flow**
```
User Interface → React Components → Custom Hooks → Supabase Client → PostgreSQL
                                 ↓
                            Real-time Updates ← Supabase Realtime
```

### 🎯 **Key Components**
- **Tournament Bracket:** Interactive tournament display
- **Ranking Dashboard:** Player rankings và statistics
- **Admin Panel:** Tournament và user management
- **Profile System:** Player profiles và history

---

## 🚀 DEPLOYMENT

### 🌐 **Production URLs**
- **Main App:** [https://sabo-pool-arena.netlify.app](https://sabo-pool-arena.netlify.app)
- **Admin Panel:** [/admin](https://sabo-pool-arena.netlify.app/admin)
- **API:** Supabase hosted database

### 📋 **Deployment Checklist**
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Build tests passing
- [ ] Performance benchmarks met
- [ ] Security scan completed

**Chi tiết:** [PRODUCTION_DEPLOYMENT_CHECKLIST.md](./PRODUCTION_DEPLOYMENT_CHECKLIST.md)

---

## 🧪 TESTING

### 🔍 **Test Coverage**
- **Unit Tests:** Components và utilities
- **Integration Tests:** API endpoints và database
- **E2E Tests:** User workflows
- **Performance Tests:** Load và stress testing

### 🎯 **Testing Commands**
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

**Chi tiết:** [TESTING_GUIDE_BACKEND.md](./TESTING_GUIDE_BACKEND.md)

---

## 💰 PAYMENT INTEGRATION

### 💳 **VNPay Integration**
- **Payment gateway:** VNPay cho thị trường Việt Nam
- **Supported methods:** Banking, QR Code, Cards
- **Security:** SHA256 signing, webhook verification
- **Chi tiết:** [VNPAY_INTEGRATION_README.md](./VNPAY_INTEGRATION_README.md)

---

## 🌐 LOCALIZATION

### 🗣️ **Multi-language Support**
- **Vietnamese:** Ngôn ngữ chính
- **English:** International support
- **Translation system:** i18next integration
- **Chi tiết:** [TRANSLATION_GUIDELINES.md](./TRANSLATION_GUIDELINES.md)

---

## 📈 MONITORING & ANALYTICS

### 📊 **Performance Monitoring**
- **Lighthouse CI:** Performance tracking
- **Bundle analysis:** Code splitting optimization
- **Error tracking:** Real-time error monitoring
- **Chi tiết:** [MONITORING_SETUP.md](./MONITORING_SETUP.md)

---

## 🤝 CONTRIBUTING

### 📝 **Development Guidelines**
1. **Code Style:** ESLint + Prettier configuration
2. **Git Workflow:** Feature branches + PR reviews
3. **Testing:** Required for new features
4. **Documentation:** Update relevant docs

### 🔄 **Workflow**
```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes
git add .
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/new-feature
```

---

## 🆘 TROUBLESHOOTING

### ❌ **Common Issues**

#### Database Connection
```bash
# Check Supabase status
npx supabase status

# Reset database
npx supabase db reset
```

#### Build Errors
```bash
# Clear cache
npm run clean
npm install

# Check TypeScript
npm run type-check
```

#### Deployment Issues
- Check environment variables
- Verify build output
- Review deployment logs

**Chi tiết:** [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

---

## 📞 SUPPORT & CONTACTS

### 🛠️ **Technical Support**
- **GitHub Issues:** [Repository Issues](https://github.com/longsangsabo/sabo-pool-v8-76/issues)
- **Documentation:** Tài liệu trong thư mục `/docs`
- **Wiki:** [Project Wiki](https://github.com/longsangsabo/sabo-pool-v8-76/wiki)

### 👥 **Team Contacts**
- **Project Lead:** Development Team
- **DevOps:** Infrastructure Team
- **QA:** Testing Team

---

## 📅 VERSION HISTORY

| Version | Date | Major Changes |
|---------|------|---------------|
| v8.76 | Aug 2025 | Current development version |
| v8.75 | Jul 2025 | Enhanced ELO system |
| v8.74 | Jun 2025 | Tournament improvements |
| v8.73 | May 2025 | Admin panel overhaul |

---

## 🎯 ROADMAP

### 🚀 **Upcoming Features**
- [ ] Mobile app development
- [ ] AI-powered matchmaking
- [ ] Video replay system
- [ ] International tournaments
- [ ] Sponsor integration

### 📊 **Performance Goals**
- [ ] Sub-3s page load times
- [ ] 99.9% uptime
- [ ] Real-time latency < 100ms
- [ ] Mobile-first optimization

---

## 📚 ADDITIONAL RESOURCES

### 🔗 **External Links**
- **React Documentation:** [react.dev](https://react.dev)
- **Supabase Docs:** [supabase.com/docs](https://supabase.com/docs)
- **Tailwind CSS:** [tailwindcss.com](https://tailwindcss.com)
- **TypeScript:** [typescriptlang.org](https://typescriptlang.org)

### 📖 **Learning Resources**
- **React Patterns:** Best practices cho React development
- **Database Design:** PostgreSQL optimization
- **Real-time Apps:** Supabase realtime features
- **Performance:** Web vitals và optimization

---

*Tài liệu này được cập nhật thường xuyên. Để có thông tin mới nhất, vui lòng kiểm tra version control history.*

**Version:** 1.0  
**Last Updated:** August 4, 2025  
**Maintained by:** SABO Pool Arena Development Team

---

## 🔍 QUICK SEARCH

**Tìm kiếm nhanh theo chức năng:**

- **Ranking System** → [RANK_SYSTEM_README.md](./RANK_SYSTEM_README.md)
- **Tournament** → [TOURNAMENT_SYSTEM_README.md](./TOURNAMENT_SYSTEM_README.md)
- **Database** → [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)
- **Testing** → [TESTING_GUIDE_BACKEND.md](./TESTING_GUIDE_BACKEND.md)
- **Deployment** → [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- **Admin** → [ADMIN_SYSTEM_README.md](./ADMIN_SYSTEM_README.md)
- **Payment** → [VNPAY_INTEGRATION_README.md](./VNPAY_INTEGRATION_README.md)
- **Troubleshooting** → [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

**Tìm kiếm theo phase:**
- **Phase 1** → `docs/phases/`
- **Phase 2** → [PHASE_2_BACKEND_PLAN.md](./PHASE_2_BACKEND_PLAN.md)
- **Completed** → `docs/completed-tasks/`
- **Archive** → `docs/archived/`
