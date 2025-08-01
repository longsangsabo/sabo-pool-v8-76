import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppErrorBoundary } from '@/components/error/AppErrorBoundary';
import { AppLoadingFallback } from '@/components/loading/AppLoadingFallback';

// ✅ ULTRA MINIMAL: Only load what's absolutely necessary for initial render
const HomePage = lazy(() => import('@/pages/Home'));

// ✅ Auth pages - super lightweight
const LoginPage = lazy(() => import('@/pages/Login'));
const RegisterPage = lazy(() => import('@/pages/Register'));
const AuthPage = lazy(() => import('@/pages/AuthPage'));
const AuthCallbackPage = lazy(() => import('@/pages/AuthCallbackPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPassword'));

// ✅ Essential pages only
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFound'));

// ✅ Static pages (small)
const AboutPage = lazy(() => import('@/pages/AboutPage'));
const ContactPage = lazy(() => import('@/pages/SimpleClubContactPage'));
const PrivacyPolicyPage = lazy(() => import('@/pages/PrivacyPage'));
const TermsOfServicePage = lazy(() => import('@/pages/TermsPage'));
const NewsPage = lazy(() => import('@/pages/BlogPage'));

// ✅ HEAVY PAGES - Load only when user really needs them
const TournamentPage = lazy(() => 
  import('@/pages/TournamentsPage').then(module => {
    console.log('🏆 Loading Tournament features...');
    return module;
  })
);
const EnhancedChallengesPageV2 = lazy(() => 
  import('@/pages/EnhancedChallengesPageV2').then(module => {
    console.log('⚔️ Loading Challenge system...');
    return module;
  })
);
const LeaderboardPage = lazy(() => 
  import('@/pages/LeaderboardPage').then(module => {
    console.log('🏅 Loading Leaderboard...');
    return module;
  })
);
const ClubManagementPage = lazy(() => 
  import('@/pages/ClubManagementPage').then(module => {
    console.log('🏢 Loading Club Management...');
    return module;
  })
);

// ✅ CLUB FEATURES - Separate load
const ClubsPage = lazy(() => 
  import('@/pages/ClubsPage').then(module => {
    console.log('🏛️ Loading Club features...');
    return module;
  })
);
const ClubDetailPage = lazy(() => import('@/pages/ClubDetailPage'));
const ClubRegistrationPage = lazy(() => import('@/pages/ClubRegistrationPage'));

// ✅ SOCIAL FEATURES - Separate load
const CommunityPage = lazy(() => 
  import('@/pages/CommunityPage').then(module => {
    console.log('👥 Loading Community features...');
    return module;
  })
);
const FeedPage = lazy(() => 
  import('@/pages/FeedPage').then(module => {
    console.log('📰 Loading Social Feed...');
    return module;
  })
);

// ✅ COMMERCE FEATURES - Separate load
const WalletPage = lazy(() => 
  import('@/pages/PaymentPage').then(module => {
    console.log('💳 Loading Payment system...');
    return module;
  })
);
const MarketplacePage = lazy(() => 
  import('@/pages/EnhancedMarketplacePage').then(module => {
    console.log('🛒 Loading Marketplace...');
    return module;
  })
);

// ✅ OPTIONAL FEATURES
const CalendarPage = lazy(() => import('@/pages/CalendarPage'));
const AuthTestPage = lazy(() => import('@/pages/AuthTestPage'));

// ✅ ADMIN - Completely isolated
let AdminRouter: any = null;
let AdminRoute: any = null;

// ✅ Core providers - load async
let QueryClientProvider: any = null;
let HelmetProvider: any = null;
let CombinedProviders: any = null;
let Toaster: any = null;
let ProtectedRoute: any = null;
let PublicRoute: any = null;
let UserMainLayout: any = null;

// ✅ Admin check function
const checkIsAdmin = async (userId: string): Promise<boolean> => {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    
    return data?.role === 'admin';
  } catch {
    return false;
  }
};

// ✅ Ultra minimal app shell
const AppShell = React.memo(() => {
  const [isProvidersLoaded, setIsProvidersLoaded] = React.useState(false);
  const [isAdminLoaded, setIsAdminLoaded] = React.useState(false);
  const [shouldLoadAdmin, setShouldLoadAdmin] = React.useState(false);
  const [queryClient, setQueryClient] = React.useState<any>(null);

  // ✅ Load only essential providers first
  React.useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const loadCoreProviders = async () => {
      try {
        console.log('⚡ Loading core providers...');
        
        const [
          { QueryClient, QueryClientProvider: QCP },
          { HelmetProvider: HP },
          { CombinedProviders: CP },
          { Toaster: T },
          { ProtectedRoute: PR },
          { PublicRoute: PubR },
          UserMainLayoutModule,
        ] = await Promise.all([
          import('@tanstack/react-query'),
          import('react-helmet-async'),
          import('@/contexts/CombinedProviders'),
          import('@/components/ui/sonner'),
          import('@/components/auth/ProtectedRoute'),
          import('@/components/auth/PublicRoute'),
          import('@/components/UserMainLayout'),
        ]);

        const client = new QueryClient({
          defaultOptions: {
            queries: {
              retry: 1,
              staleTime: 5 * 60 * 1000,
              refetchOnWindowFocus: false,
              refetchOnMount: false,
              refetchOnReconnect: false,
            },
          },
        });

        QueryClientProvider = QCP;
        HelmetProvider = HP;
        CombinedProviders = CP;
        Toaster = T;
        ProtectedRoute = PR;
        PublicRoute = PubR;
        UserMainLayout = UserMainLayoutModule.default;
        
        setQueryClient(client);
        setIsProvidersLoaded(true);

        if (process.env.NODE_ENV === 'development') {
          (window as any).queryClient = client;
        }
        
        console.log('✅ Core providers loaded');
      } catch (error) {
        console.error('❌ Failed to load core providers:', error);
        timeoutId = setTimeout(loadCoreProviders, 2000);
      }
    };

    timeoutId = setTimeout(loadCoreProviders, 100);
    return () => clearTimeout(timeoutId);
  }, []);

  // ✅ Admin loading (separate)
  React.useEffect(() => {
    if (!shouldLoadAdmin || isAdminLoaded) return;

    const loadAdminComponents = async () => {
      try {
        console.log('🔒 Loading admin system...');
        
        const [
          { default: AR },
          { AdminRoute: ARoute },
        ] = await Promise.all([
          import('@/router/AdminRouter'),
          import('@/components/auth/AdminRoute'),
        ]);

        AdminRouter = AR;
        AdminRoute = ARoute;
        setIsAdminLoaded(true);
        
        console.log('✅ Admin system loaded');
      } catch (error) {
        console.error('❌ Failed to load admin:', error);
        setIsAdminLoaded(true);
      }
    };

    loadAdminComponents();
  }, [shouldLoadAdmin, isAdminLoaded]);

  // ✅ Show minimal loading until ready
  if (!isProvidersLoaded || !QueryClientProvider || !queryClient) {
    return (
      <div className="min-h-screen bg-background">
        <Suspense fallback={<AppLoadingFallback />}>
          <Router>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="*" element={<AppLoadingFallback />} />
            </Routes>
          </Router>
        </Suspense>
      </div>
    );
  }

  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <HelmetProvider>
          <Router>
            <CombinedProviders>
              <AppContent 
                onAdminNeeded={() => setShouldLoadAdmin(true)}
                isAdminLoaded={isAdminLoaded}
              />
            </CombinedProviders>
            <Toaster />
          </Router>
        </HelmetProvider>
      </QueryClientProvider>
    </AppErrorBoundary>
  );
});

// ✅ Main app content with minimal routes
const AppContent = React.memo(({ 
  onAdminNeeded, 
  isAdminLoaded 
}: { 
  onAdminNeeded: () => void;
  isAdminLoaded: boolean;
}) => {
  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={<AppLoadingFallback />}>
        <Routes>
          {/* ✅ PUBLIC ROUTES - Immediate load */}
          <Route path="/" element={<HomePage />} />
          
          {/* ✅ AUTH ROUTES - Lightweight */}
          <Route
            path="/auth"
            element={
              <PublicRoute>
                <AuthPage />
              </PublicRoute>
            }
          />
          <Route
            path="/auth/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/auth/register"
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            }
          />
          <Route
            path="/auth/forgot-password"
            element={
              <PublicRoute>
                <ForgotPasswordPage />
              </PublicRoute>
            }
          />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />

          {/* ✅ PROTECTED CORE ROUTES - Essential only */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <UserMainLayout />
              </ProtectedRoute>
            }
          >
            {/* ESSENTIAL USER FEATURES */}
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="settings" element={<SettingsPage />} />
            
            {/* HEAVY FEATURES - Load on demand */}
            <Route path="tournaments" element={<TournamentPage />} />
            <Route path="challenges" element={<EnhancedChallengesPageV2 />} />
            <Route path="leaderboard" element={<LeaderboardPage />} />
            
            {/* CLUB FEATURES */}
            <Route path="clubs" element={<ClubsPage />} />
            <Route path="clubs/:id" element={<ClubDetailPage />} />
            <Route path="club-registration" element={<ClubRegistrationPage />} />
            
            {/* SOCIAL FEATURES */}
            <Route path="community" element={<CommunityPage />} />
            <Route path="feed" element={<FeedPage />} />
            
            {/* COMMERCE FEATURES */}
            <Route path="wallet" element={<WalletPage />} />
            <Route path="marketplace" element={<MarketplacePage />} />
            
            {/* OPTIONAL FEATURES */}
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="auth-test" element={<AuthTestPage />} />
          </Route>

          {/* ✅ STATIC PAGES */}
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsOfServicePage />} />
          <Route path="/news" element={<NewsPage />} />

          {/* ✅ ADMIN - Smart loading */}
          <Route
            path="/admin/*"
            element={
              <AdminLoader 
                onAdminNeeded={onAdminNeeded}
                isAdminLoaded={isAdminLoaded}
              />
            }
          />

          {/* ✅ CLUB MANAGEMENT - Heavy feature */}
          <Route
            path="/club-management"
            element={
              <ProtectedRoute>
                <ClubManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/club-management/*"
            element={
              <ProtectedRoute>
                <ClubManagementPage />
              </ProtectedRoute>
            }
          />

          {/* ✅ FALLBACK */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </div>
  );
});

// ✅ Smart admin loader (unchanged)
const AdminLoader = React.memo(({ 
  onAdminNeeded, 
  isAdminLoaded 
}: { 
  onAdminNeeded: () => void;
  isAdminLoaded: boolean;
}) => {
  const [isCheckingAdmin, setIsCheckingAdmin] = React.useState(true);
  const [isUserAdmin, setIsUserAdmin] = React.useState(false);

  React.useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setIsCheckingAdmin(false);
          return;
        }

        const adminStatus = await checkIsAdmin(user.id);
        setIsUserAdmin(adminStatus);
        
        if (adminStatus) {
          onAdminNeeded();
        }
      } catch (error) {
        console.error('Admin check failed:', error);
      } finally {
        setIsCheckingAdmin(false);
      }
    };

    checkAdmin();
  }, [onAdminNeeded]);

  if (isCheckingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!isUserAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md p-8 border rounded-lg">
          <h1 className="text-2xl font-bold text-destructive mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            Bạn không có quyền truy cập vào khu vực admin.
          </p>
          <button 
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  if (!isAdminLoaded || !AdminRouter || !AdminRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminRoute>
      <AdminRouter />
    </AdminRoute>
  );
});

const App = React.memo(() => {
  return <AppShell />;
});

export default App;
