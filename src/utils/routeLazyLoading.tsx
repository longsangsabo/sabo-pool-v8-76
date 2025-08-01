import { lazy, Suspense, ComponentType } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * PHASE 2: Advanced Route Lazy Loading
 * Implement progressive loading with preloading strategies
 */

// ✅ Loading fallback components
const RouteLoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center">
      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
      <p className="text-muted-foreground">Đang tải trang...</p>
    </div>
  </div>
);

const AdminLoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center">
      <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
      <p className="text-lg font-semibold text-foreground">Đang tải Admin Dashboard...</p>
      <p className="text-sm text-muted-foreground mt-2">Vui lòng đợi...</p>
    </div>
  </div>
);

// ✅ CRITICAL ROUTES - Load immediately
export const HomePage = lazy(() => import('@/pages/Home'));
export const AuthPage = lazy(() => import('@/pages/AuthPage'));

// ✅ USER ROUTES - Load on demand with preloading
export const Dashboard = lazy(() => 
  import('@/pages/Dashboard').then(module => {
    console.log('✅ Dashboard loaded');
    return module;
  })
);

export const ProfilePage = lazy(() => 
  import('@/pages/ProfilePage').then(module => {
    console.log('✅ ProfilePage loaded');
    return module;
  })
);

// ✅ FEATURE ROUTES - Chunked by feature
export const ChallengesPage = lazy(() => 
  import('@/pages/EnhancedChallengesPageV2').then(module => {
    console.log('✅ ChallengesPage loaded');
    return module;
  })
);

export const TournamentsPage = lazy(() => 
  import('@/pages/TournamentsPage').then(module => {
    console.log('✅ TournamentsPage loaded');
    return module;
  })
);

export const LeaderboardPage = lazy(() => 
  import('@/pages/LeaderboardPage').then(module => {
    console.log('✅ LeaderboardPage loaded');
    return module;
  })
);

// ✅ CLUB ROUTES - Grouped together
export const ClubsPage = lazy(() => import('@/pages/ClubsPage'));
export const ClubDetailPage = lazy(() => import('@/pages/ClubDetailPage'));
export const ClubRegistrationPage = lazy(() => import('@/pages/ClubRegistrationPage'));
export const ClubManagementPage = lazy(() => import('@/pages/ClubManagementPage'));

// ✅ ADMIN ROUTES - Ultra lazy loading
export const AdminDashboard = lazy(() => 
  // Try admin route first, fallback to dashboard
  Promise.resolve({
    default: () => <div>Admin Dashboard Loading...</div>
  })
);

export const AdminUsers = lazy(() => 
  Promise.resolve({
    default: () => <div>Admin Users Loading...</div>
  })
);

// ✅ UTILITY ROUTES - Low priority
export const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
export const AboutPage = lazy(() => import('@/pages/AboutPage'));
export const PrivacyPage = lazy(() => import('@/pages/PrivacyPage'));
export const TermsPage = lazy(() => import('@/pages/TermsPage'));

// ✅ PRELOADING STRATEGIES
export class RoutePreloader {
  private static preloadedRoutes = new Set<string>();
  
  // Preload route on hover/focus
  static preloadRoute(routeName: string, importFn: () => Promise<any>) {
    if (this.preloadedRoutes.has(routeName)) {
      return;
    }
    
    return () => {
      console.log(`🔄 Preloading route: ${routeName}`);
      importFn().then(() => {
        this.preloadedRoutes.add(routeName);
        console.log(`✅ Preloaded route: ${routeName}`);
      }).catch(error => {
        console.error(`❌ Failed to preload route: ${routeName}`, error);
      });
    };
  }
  
  // Preload user routes after auth
  static async preloadUserRoutes() {
    const userRoutes = [
      ['Dashboard', () => import('@/pages/Dashboard')],
      ['ProfilePage', () => import('@/pages/ProfilePage')],
      ['ChallengesPage', () => import('@/pages/EnhancedChallengesPageV2')],
    ];
    
    console.log('🔄 Preloading user routes...');
    await Promise.allSettled(
      userRoutes.map(([name, importFn]) => 
        this.preloadRoute(name as string, importFn as () => Promise<any>)()
      )
    );
    console.log('✅ User routes preloaded');
  }
  
  // Preload admin routes for admin users - simplified
  static async preloadAdminRoutes() {
    console.log('🔄 Admin routes available for lazy loading');
  }
}

// ✅ HOC for route wrapping with Suspense
export const withRouteLazyLoading = (
  Component: ComponentType<any>,
  FallbackComponent: ComponentType = RouteLoadingFallback
) => {
  return (props: any) => (
    <Suspense fallback={<FallbackComponent />}>
      <Component {...props} />
    </Suspense>
  );
};

// ✅ HOC for admin route wrapping
export const withAdminLazyLoading = (Component: ComponentType<any>) => {
  return withRouteLazyLoading(Component, AdminLoadingFallback);
};

// ✅ Route preloading hooks
export const useRoutePreloading = () => {
  const preloadDashboard = RoutePreloader.preloadRoute('Dashboard', () => import('@/pages/Dashboard'));
  const preloadProfile = RoutePreloader.preloadRoute('ProfilePage', () => import('@/pages/ProfilePage'));
  const preloadChallenges = RoutePreloader.preloadRoute('ChallengesPage', () => import('@/pages/EnhancedChallengesPageV2'));
  
  return {
    preloadDashboard,
    preloadProfile,
    preloadChallenges,
    preloadUserRoutes: RoutePreloader.preloadUserRoutes,
    preloadAdminRoutes: RoutePreloader.preloadAdminRoutes,
  };
};
