# CORE INFRASTRUCTURE SETUP - IMPLEMENTATION GUIDE

## 🎯 OVERVIEW

This document outlines the new core infrastructure setup for the SABO Pool application. The foundation provides a unified routing system, consolidated providers, layout architecture, and global state management that all team features can safely plug into.

## 📁 NEW STRUCTURE

```
src/
├── core/                           # Core infrastructure
│   ├── router/
│   │   ├── AppRouter.tsx          # Unified routing system
│   │   ├── RouteGuard.tsx         # Route protection & permissions
│   │   └── PermissionGuard.tsx    # Permission-based guards
│   ├── providers/
│   │   └── AppProvider.tsx        # Consolidated provider hierarchy
│   ├── state/
│   │   └── GlobalStateProvider.tsx # Global state management
│   └── types/
│       └── global.types.ts        # Global type definitions
├── shared/                         # Shared components & layouts
│   ├── layouts/
│   │   ├── UserLayout.tsx         # User dashboard layout
│   │   ├── AdminLayout.tsx        # Admin dashboard layout
│   │   └── ClubLayout.tsx         # Club management layout
│   └── components/
│       ├── navigation/
│       │   ├── UserNavigation.tsx
│       │   ├── AdminNavigation.tsx
│       │   ├── ClubNavigation.tsx
│       │   └── MobileNavigation.tsx
│       └── headers/
│           ├── UserHeader.tsx
│           ├── AdminHeader.tsx
│           └── ClubHeader.tsx
└── hooks/
    └── useUserPermissions.ts      # User roles & permissions
```

## 🛣️ UNIFIED ROUTING SYSTEM

### Route Structure
- **`/`** - Public routes (landing, about, etc.)
- **`/auth/*`** - Authentication routes
- **`/user/*`** - User dashboard and features
- **`/club/*`** - Club management and features  
- **`/admin/*`** - Admin dashboard and tools

### Route Guards
- **`RouteGuard`** - Role-based protection (user, club_owner, admin)
- **`PermissionGuard`** - Permission-based protection (granular permissions)
- **`SmartRedirect`** - Auto-redirect to appropriate dashboard

### Legacy Compatibility
All existing routes automatically redirect to new structure:
- `/dashboard` → `/user/dashboard`
- `/profile` → `/user/profile`
- `/clb` → `/club/dashboard`
- `/admin` → `/admin` (unchanged)

## 🏗️ LAYOUT ARCHITECTURE

### Three Main Layouts

1. **`UserLayout`** - Regular user features
   - User navigation sidebar
   - Profile header with notifications
   - Mobile-responsive design

2. **`AdminLayout`** - Admin dashboard
   - Admin tools navigation
   - System monitoring header
   - Enhanced permissions display

3. **`ClubLayout`** - Club management
   - Club-specific navigation
   - Club switcher header
   - Member management tools

### Responsive Design
- **Mobile**: Collapsible navigation menu
- **Tablet**: Adapted sidebar layout
- **Desktop**: Full sidebar navigation

## 🔧 PROVIDER CONSOLIDATION

### Provider Hierarchy (optimized order)
1. **AppErrorBoundary** - Global error handling
2. **QueryClientProvider** - React Query for server state
3. **HelmetProvider** - Document head management
4. **ThemeProvider** - Theme and dark mode
5. **AuthErrorBoundary** - Authentication error handling
6. **AuthProvider** - Authentication state
7. **CSRFProvider** - CSRF protection
8. **MonitoringProvider** - Performance monitoring
9. **ErrorStateProvider** - Global error state
10. **LoadingStateProvider** - Global loading state
11. **ResponsiveLayoutProvider** - Responsive breakpoints
12. **LanguageProvider** - Internationalization
13. **AvatarProvider** - User avatar management
14. **UserDataProvider** - User profile data
15. **TournamentGlobalProvider** - Tournament global state

## 🌐 GLOBAL STATE MANAGEMENT

### Global State Structure
```typescript
interface GlobalState {
  // Authentication
  user: User | null;
  userProfile: UserProfile | null;
  isAuthenticated: boolean;
  authLoading: boolean;

  // Permissions
  roles: Role[];
  permissions: Permission[];

  // UI State
  theme: 'light' | 'dark' | 'system';
  language: string;
  sidebarCollapsed: boolean;
  mobileMenuOpen: boolean;

  // Responsive
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  breakpoint: 'mobile' | 'tablet' | 'desktop';

  // Loading & Error states
  loading: Record<string, boolean>;
  errors: Record<string, string[]>;

  // Feature flags
  features: Record<string, boolean>;
}
```

### Permission System
- **Roles**: `user`, `club_owner`, `admin`
- **Permissions**: Granular permissions like `admin_access`, `club_management`, etc.
- **Guards**: Route and component level protection

## 🚀 MIGRATION GUIDE

### Step 1: Update Import Paths
Replace old component imports with new shared components:

```typescript
// OLD
import { SomeLayout } from '@/components/layouts/SomeLayout';

// NEW
import { UserLayout } from '@/shared/layouts/UserLayout';
```

### Step 2: Update Route Definitions
Replace direct routing with new structure:

```typescript
// OLD
<Route path="/dashboard" element={<Dashboard />} />

// NEW - handled automatically by AppRouter
// /dashboard now redirects to /user/dashboard
```

### Step 3: Use New Permission Hooks
```typescript
// NEW
import { useUserPermissions } from '@/hooks/useUserPermissions';

const { hasRole, hasPermission } = useUserPermissions();

if (hasRole('admin')) {
  // Show admin content
}

if (hasPermission('club_management')) {
  // Show club management features
}
```

### Step 4: Use Global State
```typescript
import { useGlobalState, useAuth, usePermissions } from '@/core/state/GlobalStateProvider';

const { user, isAuthenticated } = useAuth();
const { roles, permissions } = usePermissions();
```

## 📋 TEAM INTEGRATION CHECKLIST

### For PERSON1 (Admin Features)
- ✅ Admin routes now under `/admin/*`
- ✅ Use `AdminLayout` for all admin pages
- ✅ Use `AdminNavigation` component
- ✅ Check permissions with `hasPermission('admin_access')`

### For PERSON2 (Club & Tournament Features)
- ✅ Club routes now under `/club/*`
- ✅ Use `ClubLayout` for club management
- ✅ Use `ClubNavigation` component
- ✅ Check permissions with `hasRole('club_owner')`

### For PERSON3 (User & Challenge Features)
- ✅ User routes now under `/user/*`
- ✅ Use `UserLayout` for user features
- ✅ Use `UserNavigation` component
- ✅ All users have basic permissions by default

## 🔒 SECURITY FEATURES

1. **Route Protection** - Role and permission-based guards
2. **CSRF Protection** - Built-in CSRF token management
3. **Authentication Recovery** - Robust auth state management
4. **Permission Validation** - Server-side permission checks
5. **Error Boundaries** - Graceful error handling

## 🎨 THEMING & STYLING

1. **Consistent Design System** - Shared UI components
2. **Dark/Light Mode** - Global theme management
3. **Responsive Design** - Mobile-first approach
4. **Brand Colors** - Role-specific color schemes
   - User: Default primary colors
   - Club: Blue accent colors
   - Admin: Orange accent colors

## 📊 MONITORING & DEBUGGING

1. **Performance Monitoring** - Built-in performance tracking
2. **Error Tracking** - Global error state management
3. **Loading States** - Centralized loading management
4. **Debug Tools** - Development helpers and logging

## 🚨 BREAKING CHANGES

1. **Route Structure** - All routes now follow `/role/*` pattern
2. **Provider Order** - Specific provider hierarchy required
3. **Permission System** - New permission-based access control
4. **Layout Components** - Must use new shared layouts

## 🆘 TROUBLESHOOTING

### Common Issues

1. **Import Errors** - Update TypeScript path mappings
2. **Permission Errors** - Check user role assignments
3. **Navigation Issues** - Update route references
4. **Provider Conflicts** - Use consolidated AppProvider

### Getting Help

1. Check this README first
2. Review the type definitions in `global.types.ts`
3. Look at existing implementations in shared components
4. Ask team for specific integration questions

## ✅ NEXT STEPS

1. **Team Review** - Each person reviews their affected areas
2. **Integration Testing** - Test cross-feature interactions
3. **Performance Testing** - Verify no performance regressions
4. **Documentation Updates** - Update feature-specific docs
5. **Deployment Planning** - Plan staged rollout if needed

---

**🎯 GOAL ACHIEVED**: Foundation ready for safe team development with unified routing, consolidated providers, responsive layouts, and global state management.
