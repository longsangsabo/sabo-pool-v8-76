# SABO Arena - Integration & Cleanup Roadmap

## 🎯 TỔNG QUAN
Roadmap chi tiết để tích hợp user components vào existing pages và cleanup codebase.

## 📋 PHASE 1: PAGE MAPPING & ANALYSIS (HOÀN THÀNH)
✅ User component migration (6 phases)
✅ Navigation system update
✅ Routing configuration

## 📋 PHASE 2: PAGE INTEGRATION (ĐANG TIẾN HÀNH)

### 2.1 Core Page Replacements
- [ ] `Dashboard.tsx` → `UnifiedDashboard.tsx` (sử dụng user components)
- [ ] `Profile.tsx` → `UnifiedProfilePage.tsx` (đã có)
- [ ] `ChallengesPage.tsx` → `EnhancedChallengesPageV2.tsx` (đã có)

### 2.2 Enhanced Page Integration
- [ ] `LeaderboardPage.tsx` → `RankingDashboardPage.tsx` (user/ranking components)
- [ ] `MarketplacePage.tsx` → `EnhancedMarketplacePage.tsx` (user/wallet components)
- [ ] `DiscoveryPage.tsx` → `EnhancedDiscoveryPage.tsx` (user/social components)

### 2.3 New Feature Pages (Cần tạo components)
- [ ] `AnalyticsPage.tsx` → Tích hợp user/dashboard analytics
- [ ] `ChatPage.tsx` → Tích hợp user/social messaging
- [ ] `MembershipPage.tsx` → Tích hợp user/wallet membership
- [ ] `MatchHistoryPage.tsx` → Tích hợp user/tournaments history

## 📋 PHASE 3: COMPONENT CONSOLIDATION

### 3.1 Duplicate Page Analysis
```
DUPLICATE PAGES DETECTED:
- Dashboard.tsx vs UnifiedDashboard.tsx vs SimpleDashboard.tsx
- Profile.tsx vs UnifiedProfilePage.tsx vs OptimizedMobileProfile.tsx
- ChallengesPage.tsx vs EnhancedChallengesPageV2.tsx vs SaboChallengesPage.tsx
- MarketplacePage.tsx vs EnhancedMarketplacePage.tsx
- LeaderboardPage.tsx vs EnhancedLeaderboardPage.tsx vs RankingDashboardPage.tsx
```

### 3.2 Integration Strategy
1. **Unified Approach**: Sử dụng 1 page duy nhất cho mỗi feature
2. **Component Reuse**: Tận dụng user components đã migration
3. **Responsive Design**: Đảm bảo mobile/desktop compatibility

## 📋 PHASE 4: CLEANUP & DEPRECATION

### 4.1 Safe Cleanup Criteria
Chỉ cleanup khi:
- [ ] New page đã implement đầy đủ features của old page
- [ ] Testing đã confirm functionality
- [ ] No production dependencies
- [ ] Import references đã được update

### 4.2 Cleanup Priority Order
1. **_DEPRECATED_** files (an toàn nhất)
2. **_ARCHIVED_** files 
3. **Duplicate/redundant** pages
4. **Unused imports** và dependencies

## 📋 PHASE 5: OPTIMIZATION & TESTING

### 5.1 Performance Optimization
- [ ] Lazy loading optimization
- [ ] Bundle size analysis
- [ ] Component tree optimization

### 5.2 Testing Strategy
- [ ] Component integration testing
- [ ] Page functionality testing
- [ ] User workflow testing
- [ ] Mobile/desktop testing

## 🚀 IMPLEMENTATION PLAN

### Week 1: Page Integration
- Integrate user components into existing pages
- Update routing and navigation
- Test basic functionality

### Week 2: Component Consolidation  
- Merge duplicate pages
- Standardize component usage
- Update import paths

### Week 3: Testing & Cleanup
- Comprehensive testing
- Safe cleanup of deprecated files
- Performance optimization

### Week 4: Final Polish
- UI/UX refinements
- Documentation updates
- Production deployment prep

## ⚠️ CLEANUP SAFETY RULES

### ✅ Safe to Clean:
- Files prefixed with `_DEPRECATED_`
- Files prefixed with `_ARCHIVED_`
- Unused import statements
- Dead code detected by linting

### ❌ DO NOT Clean Until:
- [ ] New implementation tested thoroughly
- [ ] All import references updated
- [ ] User workflows verified
- [ ] Performance benchmarks met

## 📊 PROGRESS TRACKING

### Current Status:
- User Components: ✅ 100% (Phase 1 complete)
- Navigation: ✅ 100% (Phase 1 complete)
- Page Integration: 🔄 30% (Phase 2 in progress)
- Cleanup: ❌ 0% (Phase 4 not started)

### Next Actions:
1. Complete page integration using user components
2. Test integrated pages thoroughly
3. Begin systematic cleanup of deprecated files
4. Optimize performance and bundle size
