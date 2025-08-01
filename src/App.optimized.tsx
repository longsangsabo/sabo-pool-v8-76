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

// ✅ STAGE 3: Feature pages - load when navigation happens
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const LoginPage = lazy(() => import('@/pages/Login'));
const RegisterPage = lazy(() => import('@/pages/Register'));
const AuthPage = lazy(() => import('@/pages/AuthPage'));
const AuthCallbackPage = lazy(() => import('@/pages/AuthCallbackPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPassword'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const EnhancedChallengesPageV2 = lazy(
  () => import('@/pages/EnhancedChallengesPageV2')
);
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
const AdminRouter = lazy(() => import('@/router/AdminRouter'));
const AuthTestPage = lazy(() => import('@/pages/AuthTestPage'));

// ✅ Protected/Public route components - defer until auth system loads
let ProtectedRoute: any = null;
let PublicRoute: any = null;
let AdminRoute: any = null;
let MainLayout: any = null;

// ✅ Create minimal fast-loading shell
const AppShell = React.memo(() => {
  const [isProvidersLoaded, setIsProvidersLoaded] = useState(false);
  const [queryClient, setQueryClient] = useState<any>(null);

  // ✅ Load providers only when user starts interacting
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const loadProviders = async () => {
      try {
        // Load providers asynchronously
        const [
          { QueryClient, QueryClientProvider: QCP },
          { HelmetProvider: HP },
          { CombinedProviders: CP },
          { Toaster: T },
          { ProtectedRoute: PR },
          { PublicRoute: PubR },
          { AdminRoute: AR },
          MainLayoutModule,
        ] = await Promise.all([
          import('@tanstack/react-query'),
          import('react-helmet-async'),
          import('@/contexts/CombinedProviders'),
          import('@/components/ui/sonner'),
          import('@/components/auth/ProtectedRoute'),
          import('@/components/auth/PublicRoute'),
          import('@/components/auth/AdminRoute'),
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
        AdminRoute = AR;
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

  // ✅ Show loading screen until providers are ready
  if (!isProvidersLoaded || !QueryClientProvider || !queryClient) {
    return (
      <div className='min-h-screen bg-background'>
        <Suspense fallback={<AppLoadingFallback />}>
          <Router>
            <Routes>
              <Route path='/' element={<HomePage />} />
              <Route path='*' element={<AppLoadingFallback />} />
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
              <AppContent />
            </CombinedProviders>
            <Toaster />
          </Router>
        </HelmetProvider>
      </QueryClientProvider>
    </AppErrorBoundary>
  );
});

// ✅ App content with full routing
const AppContent = React.memo(() => {
  return (
    <div className='min-h-screen bg-background'>
      <Suspense fallback={<AppLoadingFallback />}>
        <Routes>
          {/* ✅ Most common public routes first */}
          <Route path='/' element={<HomePage />} />

          {/* Auth routes - only accessible when NOT logged in */}
          <Route
            path='/auth'
            element={
              <PublicRoute>
                <AuthPage />
              </PublicRoute>
            }
          />
          <Route
            path='/auth/login'
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path='/auth/register'
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            }
          />
          <Route
            path='/auth/forgot-password'
            element={
              <PublicRoute>
                <ForgotPasswordPage />
              </PublicRoute>
            }
          />
          <Route path='/auth/callback' element={<AuthCallbackPage />} />

          {/* Protected routes with MainLayout */}
          <Route
            path='/'
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path='dashboard' element={<Dashboard />} />
            <Route path='profile' element={<ProfilePage />} />
            <Route path='challenges' element={<EnhancedChallengesPageV2 />} />
            <Route path='community' element={<CommunityPage />} />
            <Route path='calendar' element={<CalendarPage />} />
            <Route path='settings' element={<SettingsPage />} />
            <Route path='wallet' element={<WalletPage />} />
            <Route
              path='club-registration'
              element={<ClubRegistrationPage />}
            />
            <Route path='feed' element={<FeedPage />} />
            <Route path='marketplace' element={<MarketplacePage />} />
            <Route path='auth-test' element={<AuthTestPage />} />
            <Route path='tournaments' element={<TournamentPage />} />
            <Route path='leaderboard' element={<LeaderboardPage />} />
            <Route path='clubs' element={<ClubsPage />} />
            <Route path='clubs/:id' element={<ClubDetailPage />} />
          </Route>

          {/* Public informational pages */}
          <Route path='/about' element={<AboutPage />} />
          <Route path='/contact' element={<ContactPage />} />
          <Route path='/privacy' element={<PrivacyPolicyPage />} />
          <Route path='/terms' element={<TermsOfServicePage />} />
          <Route path='/news' element={<NewsPage />} />

          {/* Admin routes */}
          <Route
            path='/admin/*'
            element={
              <AdminRoute>
                <AdminRouter />
              </AdminRoute>
            }
          />

          {/* Club management routes */}
          <Route
            path='/club-management'
            element={
              <ProtectedRoute>
                <ClubManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path='/club-management/tournaments'
            element={
              <ProtectedRoute>
                <ClubManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path='/club-management/challenges'
            element={
              <ProtectedRoute>
                <ClubManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path='/club-management/verification'
            element={
              <ProtectedRoute>
                <ClubManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path='/club-management/members'
            element={
              <ProtectedRoute>
                <ClubManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path='/club-management/notifications'
            element={
              <ProtectedRoute>
                <ClubManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path='/club-management/schedule'
            element={
              <ProtectedRoute>
                <ClubManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path='/club-management/payments'
            element={
              <ProtectedRoute>
                <ClubManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path='/club-management/settings'
            element={
              <ProtectedRoute>
                <ClubManagementPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback route */}
          <Route path='*' element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </div>
  );
});

const App = React.memo(() => {
  return <AppShell />;
});

export default App;
