import React, { Suspense, lazy, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppErrorBoundary } from '@/components/error/AppErrorBoundary';
import { AppLoadingFallback } from '@/components/loading/AppLoadingFallback';

// ✅ STAGE 1: Critical path - load immediately for initial render
const HomePage = lazy(() => import('@/pages/Home'));

// ✅ STAGE 2: Auth flow - defer providers until needed
let QueryClientProvider: any = null;
let HelmetProvider: any = null;
let CombinedProviders: any = null;
let Toaster: any = null;

// ✅ STAGE 3: User pages - NO ADMIN CODE HERE
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const LoginPage = lazy(() => import('@/pages/Login'));
const RegisterPage = lazy(() => import('@/pages/Register'));
const AuthPage = lazy(() => import('@/pages/AuthPage'));
const AuthCallbackPage = lazy(() => import('@/pages/AuthCallbackPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPassword'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const EnhancedChallengesPageV2 = lazy(() => import('@/pages/EnhancedChallengesPageV2'));
const TournamentPage = lazy(() => import('@/pages/TournamentsPage'));
const LeaderboardPage = lazy(() => import('@/pages/LeaderboardPage'));
const CommunityPage = lazy(() => import('@/pages/CommunityPage'));
const CalendarPage = lazy(() => import('@/pages/CalendarPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const WalletPage = lazy(() => import('@/pages/PaymentPage'));
const FeedPage = lazy(() => import('@/pages/FeedPage'));
const MarketplacePage = lazy(() => import('@/pages/EnhancedMarketplacePage'));
const ClubsPage = lazy(() => import('@/pages/ClubsPage'));
const ClubDetailPage = lazy(() => import('@/pages/ClubDetailPage'));
const ClubRegistrationPage = lazy(() => import('@/pages/ClubRegistrationPage'));
const ClubManagementPage = lazy(() => import('@/pages/ClubManagementPage'));
const AboutPage = lazy(() => import('@/pages/AboutPage'));
const ContactPage = lazy(() => import('@/pages/SimpleClubContactPage'));
const PrivacyPolicyPage = lazy(() => import('@/pages/PrivacyPage'));
const TermsOfServicePage = lazy(() => import('@/pages/TermsPage'));
const NewsPage = lazy(() => import('@/pages/BlogPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFound'));
const AuthTestPage = lazy(() => import('@/pages/AuthTestPage'));

// ✅ Admin components - COMPLETELY SEPARATE, only load when needed
let AdminRouter: any = null;
let AdminRoute: any = null;

// ✅ Protected/Public route components - defer until auth system loads
let ProtectedRoute: any = null;
let PublicRoute: any = null;
let MainLayout: any = null;

// ✅ Admin detection utility
const checkIsAdmin = async (userId: string): Promise<boolean> => {
  try {
    // Fast admin check without loading admin components
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

// ✅ Create minimal fast-loading shell
const AppShell = React.memo(() => {
  const [isProvidersLoaded, setIsProvidersLoaded] = useState(false);
  const [isAdminLoaded, setIsAdminLoaded] = useState(false);
  const [shouldLoadAdmin, setShouldLoadAdmin] = useState(false);
  const [queryClient, setQueryClient] = useState<any>(null);

  // ✅ Load providers only when user starts interacting
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const loadProviders = async () => {
      try {
        // Load core providers asynchronously
        const [
          { QueryClient, QueryClientProvider: QCP },
          { HelmetProvider: HP },
          { CombinedProviders: CP },
          { Toaster: T },
          { ProtectedRoute: PR },
          { PublicRoute: PubR },
          MainLayoutModule,
        ] = await Promise.all([
          import('@tanstack/react-query'),
          import('react-helmet-async'),
          import('@/contexts/CombinedProviders'),
          import('@/components/ui/sonner'),
          import('@/components/auth/ProtectedRoute'),
          import('@/components/auth/PublicRoute'),
          import('@/components/MainLayout'),
        ]);

        // ✅ Create query client with optimized settings
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

        // Assign to module-level variables
        QueryClientProvider = QCP;
        HelmetProvider = HP;
        CombinedProviders = CP;
        Toaster = T;
        ProtectedRoute = PR;
        PublicRoute = PubR;
        MainLayout = MainLayoutModule.default;
        
        setQueryClient(client);
        setIsProvidersLoaded(true);

        // ✅ Make query client available globally for debugging (dev only)
        if (process.env.NODE_ENV === 'development') {
          (window as any).queryClient = client;
        }
      } catch (error) {
        console.error('Failed to load providers:', error);
        // Fallback - try again after delay
        timeoutId = setTimeout(loadProviders, 2000);
      }
    };

    // ✅ Start loading providers immediately but don't block initial render
    timeoutId = setTimeout(loadProviders, 100);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  // ✅ Admin loading effect - only when needed
  useEffect(() => {
    if (!shouldLoadAdmin || isAdminLoaded) return;

    const loadAdminComponents = async () => {
      try {
        console.log('🔒 Loading admin components...');
        
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
        
        console.log('✅ Admin components loaded successfully');
      } catch (error) {
        console.error('❌ Failed to load admin components:', error);
        setIsAdminLoaded(true); // Set as loaded to prevent infinite loading
      }
    };

    loadAdminComponents();
  }, [shouldLoadAdmin, isAdminLoaded]);

  // ✅ Show loading screen until core providers are ready
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

  // ✅ Full app with all providers loaded
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

// ✅ App content with smart admin loading
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
          {/* ✅ Most common public routes first */}
          <Route path="/" element={<HomePage />} />

          {/* Auth routes - only accessible when NOT logged in */}
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

          {/* Protected routes with MainLayout - USER ONLY */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="challenges" element={<EnhancedChallengesPageV2 />} />
            <Route path="community" element={<CommunityPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="wallet" element={<WalletPage />} />
            <Route path="club-registration" element={<ClubRegistrationPage />} />
            <Route path="feed" element={<FeedPage />} />
            <Route path="marketplace" element={<MarketplacePage />} />
            <Route path="auth-test" element={<AuthTestPage />} />
            <Route path="tournaments" element={<TournamentPage />} />
            <Route path="leaderboard" element={<LeaderboardPage />} />
            <Route path="clubs" element={<ClubsPage />} />
            <Route path="clubs/:id" element={<ClubDetailPage />} />
          </Route>

          {/* Public informational pages */}
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsOfServicePage />} />
          <Route path="/news" element={<NewsPage />} />

          {/* ✅ ADMIN ROUTES - Smart loading */}
          <Route
            path="/admin/*"
            element={
              <AdminLoader 
                onAdminNeeded={onAdminNeeded}
                isAdminLoaded={isAdminLoaded}
              />
            }
          />

          {/* Club management routes */}
          <Route
            path="/club-management"
            element={
              <ProtectedRoute>
                <ClubManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/club-management/tournaments"
            element={
              <ProtectedRoute>
                <ClubManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/club-management/challenges"
            element={
              <ProtectedRoute>
                <ClubManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/club-management/verification"
            element={
              <ProtectedRoute>
                <ClubManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/club-management/members"
            element={
              <ProtectedRoute>
                <ClubManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/club-management/notifications"
            element={
              <ProtectedRoute>
                <ClubManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/club-management/schedule"
            element={
              <ProtectedRoute>
                <ClubManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/club-management/payments"
            element={
              <ProtectedRoute>
                <ClubManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/club-management/settings"
            element={
              <ProtectedRoute>
                <ClubManagementPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </div>
  );
});

// ✅ Smart admin loader component
const AdminLoader = React.memo(({ 
  onAdminNeeded, 
  isAdminLoaded 
}: { 
  onAdminNeeded: () => void;
  isAdminLoaded: boolean;
}) => {
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [isUserAdmin, setIsUserAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        // Get current user first
        const { supabase } = await import('@/integrations/supabase/client');
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setIsCheckingAdmin(false);
          return;
        }

        const adminStatus = await checkIsAdmin(user.id);
        setIsUserAdmin(adminStatus);
        
        if (adminStatus) {
          onAdminNeeded(); // Trigger admin components loading
        }
      } catch (error) {
        console.error('Admin check failed:', error);
      } finally {
        setIsCheckingAdmin(false);
      }
    };

    checkAdmin();
  }, [onAdminNeeded]);

  // Show loading while checking admin status
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

  // Not admin - show access denied
  if (!isUserAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md p-8 border rounded-lg">
          <h1 className="text-2xl font-bold text-destructive mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            Bạn không có quyền truy cập vào khu vực admin. 
            Chỉ có administrator mới có thể truy cập trang này.
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

  // Admin but components not loaded yet
  if (!isAdminLoaded || !AdminRouter || !AdminRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin panel...</p>
          <p className="text-xs text-muted-foreground mt-2">This may take a moment on first load</p>
        </div>
      </div>
    );
  }

  // Admin and everything loaded
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
