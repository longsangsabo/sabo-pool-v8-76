import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from '@/shared/components/ui/sonner';
import { CombinedProviders } from '@/contexts/CombinedProviders';
import { AppErrorBoundary } from '@/components/error/AppErrorBoundary';
import { AppLoadingFallback } from '@/components/loading/AppLoadingFallback';
import { ProtectedRoute } from '@/core/auth/ProtectedRoute';
import { PublicRoute } from '@/core/auth/PublicRoute';
import { AdminProtectedRoute } from '@/core/auth/AdminProtectedRoute';
import MainLayout from '@/components/MainLayout';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';

// ✅ Import Admin Router for admin system integration
import AdminRouter from '@/router/AdminRouter';

// ✅ Import debug utilities for tournament refresh
import '@/utils/debugTournamentRefresh';

// Lazy load components - Public pages
const HomePage = lazy(() => import('@/pages/Home'));
const LoginPage = lazy(() => import('@/pages/Login'));
const RegisterPage = lazy(() => import('@/pages/Register'));
const AboutPage = lazy(() => import('@/pages/AboutPage'));
const ContactPage = lazy(() => import('@/pages/SimpleClubContactPage'));
const PrivacyPolicyPage = lazy(() => import('@/pages/PrivacyPage'));
const TermsOfServicePage = lazy(() => import('@/pages/TermsPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFound'));
const NewsPage = lazy(() => import('@/pages/BlogPage'));

// Public pages that should also be accessible to logged-in users
const ClubsPage = lazy(() => import('@/pages/ClubsPage'));
const ClubDetailPage = lazy(() => import('@/pages/ClubDetailPage'));
const LeaderboardPage = lazy(() => import('@/pages/LeaderboardPage'));
const TournamentPage = lazy(() => import('@/pages/TournamentsPage'));

// Protected pages - User dashboard and features
const UnifiedDashboard = lazy(() => import('@/pages/UnifiedDashboard'));
const CLBManagement = lazy(
  () => import('@/features/club/components/SimpleCLBManagement')
);
const UnifiedProfilePage = lazy(() => import('@/pages/UnifiedProfilePage'));
const CommunityPage = lazy(() => import('@/pages/CommunityPage'));
const EnhancedChallengesPageV2 = lazy(
  () => import('@/pages/EnhancedChallengesPageV2')
);
const CalendarPage = lazy(() => import('@/pages/CalendarPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const WalletPage = lazy(() => import('@/pages/PaymentPage'));
const ClubRegistrationPage = lazy(() => import('@/pages/ClubRegistrationPage'));
const FeedPage = lazy(() => import('@/pages/FeedPage'));
const MarketplacePage = lazy(() => import('@/pages/EnhancedMarketplacePage'));

// Club components
const ClubManagementPage = lazy(() => import('@/pages/ClubManagementPage'));

// Auth pages
const AuthPage = lazy(() => import('@/pages/AuthPage'));
const AuthTestPage = lazy(() => import('@/pages/AuthTestPage'));
const AuthCallbackPage = lazy(() => import('@/pages/AuthCallbackPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPassword'));

// Create a stable query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

// Component để sử dụng hooks bên trong providers
const AppContent = () => {
  return (
    <div className='min-h-screen bg-background'>
      <AppContentWithHooks />
    </div>
  );
};

// Separate component for hooks that require AuthProvider
const AppContentWithHooks = () => {
  // ✅ Initialize realtime notifications (now inside AuthProvider)
  const { PopupComponent } = useRealtimeNotifications();

  return (
    <>
      <Suspense fallback={<AppLoadingFallback />}>
        <Routes>
          {/* Public routes - no authentication required */}
          <Route path='/' element={<HomePage />} />
          <Route path='/about' element={<AboutPage />} />
          <Route path='/contact' element={<ContactPage />} />
          <Route path='/privacy' element={<PrivacyPolicyPage />} />
          <Route path='/terms' element={<TermsOfServicePage />} />
          <Route path='/news' element={<NewsPage />} />

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

          {/* Protected routes with MainLayout - these will show the sidebar */}
          <Route
            path='/'
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path='dashboard' element={<UnifiedDashboard />} />

            {/* CLB Routes - NOW INSIDE MainLayout for sidebar navigation */}
            <Route path='clb' element={<CLBManagement />} />

            <Route path='profile' element={<UnifiedProfilePage />} />
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

            {/* Public pages accessible through sidebar when logged in */}
            <Route path='tournaments' element={<TournamentPage />} />
            <Route path='leaderboard' element={<LeaderboardPage />} />
            <Route path='clubs' element={<ClubsPage />} />
            <Route path='clubs/:id' element={<ClubDetailPage />} />
          </Route>

          {/* Club management routes - protected and require club owner privileges */}
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

          {/* Admin routes - protected and require admin privileges */}
          <Route
            path='/admin/*'
            element={
              <AdminProtectedRoute>
                <AdminRouter />
              </AdminProtectedRoute>
            }
          />

          {/* Fallback route */}
          <Route path='*' element={<NotFoundPage />} />
        </Routes>
      </Suspense>
      {/* ✅ Render notification popup */}
      <PopupComponent />
    </>
  );
};

const App = () => {
  // ✅ Make query client available globally for debugging
  React.useEffect(() => {
    (window as any).queryClient = queryClient;
  }, []);

  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <HelmetProvider>
          <Router>
            <CombinedProviders>
              <AppContentWithHooks />
            </CombinedProviders>
            <Toaster />
          </Router>
        </HelmetProvider>
      </QueryClientProvider>
    </AppErrorBoundary>
  );
};

export default App;
