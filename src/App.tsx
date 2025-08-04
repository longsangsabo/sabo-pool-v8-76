import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from '@/components/ui/sonner';
import { CombinedProviders } from '@/contexts/CombinedProviders';
import { AppErrorBoundary } from '@/components/error/AppErrorBoundary';
import { AppLoadingFallback } from '@/components/loading/AppLoadingFallback';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PublicRoute } from '@/components/auth/PublicRoute';
import { AdminRoute } from '@/components/auth/AdminRoute';
import MainLayout from '@/components/MainLayout';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';

// ✅ Import debug utilities for tournament refresh
import '@/utils/debugTournamentRefresh';

// ===== PUBLIC PAGES =====
const HomePage = lazy(() => import('@/pages/public/Home'));
const AboutPage = lazy(() => import('@/pages/public/AboutPage'));
const ContactPage = lazy(() => import('@/pages/club/SimpleClubContactPage'));
const PrivacyPolicyPage = lazy(() => import('@/pages/public/PrivacyPage'));
const TermsOfServicePage = lazy(() => import('@/pages/public/TermsPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFound'));
const NewsPage = lazy(() => import('@/pages/public/BlogPage'));
const ClubsPage = lazy(() => import('@/pages/public/ClubsPage'));
const LeaderboardPage = lazy(() => import('@/pages/public/LeaderboardPage'));

// Navigation Test Page - temporary
// const NavigationTestPage = lazy(() => import('@/pages/NavigationTestPage'));

// ===== CLUB PAGES =====
const ClubDetailPage = lazy(() => import('@/pages/club/ClubDetailPage'));
const ClubManagementPage = lazy(() => import('@/pages/club/ClubManagementPage'));
const ClubRegistrationPage = lazy(() => import('@/pages/club/ClubRegistrationPage'));

// ===== USER HUBS =====
const DashboardHub = lazy(() => import('@/pages/user/hubs/DashboardHub'));
const TournamentHub = lazy(() => import('@/pages/user/hubs/TournamentHub'));
const ChallengesHub = lazy(() => import('@/pages/user/hubs/ChallengesHub'));
const PlayerProfileHub = lazy(() => import('@/pages/user/hubs/PlayerProfileHub'));
const FinancialHub = lazy(() => import('@/pages/user/hubs/FinancialHub'));
const MessageCenter = lazy(() => import('@/pages/user/hubs/MessageCenter'));
const ExploreHub = lazy(() => import('@/pages/user/hubs/ExploreHub'));
// ===== USER SETTINGS & PROFILE =====
const SettingsPage = lazy(() => import('@/pages/user/settings/SettingsPage'));
const SecurityPage = lazy(() => import('@/pages/user/settings/SecurityPage'));
const RankingPage = lazy(() => import('@/pages/user/profile/RankingPage'));
const RankRegistrationPage = lazy(() => import('@/pages/user/profile/RankRegistrationPage'));

// ===== OTHER USER PAGES =====
// const UnifiedProfilePage = lazy(() => import('@/pages/UnifiedProfilePage')); // Moved to PlayerProfileHub
const CommunityPage = lazy(() => import('@/pages/CommunityPage'));
// const EnhancedChallengesPageV2 = lazy(
//   () => import('@/pages/EnhancedChallengesPageV2')
// ); // Replaced by ChallengesHub
const CalendarPage = lazy(() => import('@/pages/CalendarPage'));
const WalletPage = lazy(() => import('@/pages/user/hubs/FinancialHub')); // Payment functionality consolidated in FinancialHub
const FeedPage = lazy(() => import('@/pages/FeedPage'));
// const MarketplacePage = lazy(() => import('@/pages/EnhancedMarketplacePage')); // Moved to ExploreHub
// const RankingDashboardPage = lazy(() => import('@/pages/RankingDashboardPage')); // Moved to PlayerProfileHub
// const DiscoveryPage = lazy(() => import('@/pages/DiscoveryPage')); // Moved to ExploreHub
const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage'));
// const NotificationsPage = lazy(() => import('@/pages/NotificationsPage')); // Moved to MessageCenter
// const ChatPage = lazy(() => import('@/pages/ChatPage')); // Moved to MessageCenter
// const MembershipPage = lazy(() => import('@/pages/MembershipPage')); // Moved to FinancialHub
// const MatchHistoryPage = lazy(() => import('@/pages/MatchHistoryPage')); // Moved to TournamentHub
// const InboxPage = lazy(() => import('@/pages/InboxPage')); // Moved to MessageCenter
const HelpPage = lazy(() => import('@/pages/public/HelpPage'));

// Admin components
const AdminRouter = lazy(() => import('@/router/AdminRouter'));

// Auth pages
const AuthPage = lazy(() => import('@/pages/AuthPage'));
// const AuthTestPage = lazy(() => import('@/pages/AuthTestPage')); // Test page - can be removed
const AuthCallbackPage = lazy(() => import('@/pages/AuthCallbackPage'));
// const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPassword')); // Functionality moved to AuthPage

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
                <AuthPage />
              </PublicRoute>
            }
          />
          <Route
            path='/auth/register'
            element={
              <PublicRoute>
                <AuthPage />
              </PublicRoute>
            }
          />
          <Route
            path='/auth/forgot-password'
            element={
              <PublicRoute>
                <AuthPage />
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
            <Route path='dashboard' element={<DashboardHub />} />
            <Route path='tournaments' element={<TournamentHub />} />
            <Route path='challenges' element={<ChallengesHub />} />
            <Route path='enhanced-challenges' element={<ChallengesHub />} />
            <Route path='profile' element={<PlayerProfileHub />} />
            <Route path='financial' element={<FinancialHub />} />
            <Route path='messages' element={<MessageCenter />} />
            <Route path='explore' element={<ExploreHub />} />
            <Route path='community' element={<CommunityPage />} />
            <Route path='calendar' element={<CalendarPage />} />
            <Route path='settings' element={<SettingsPage />} />
            <Route path='wallet' element={<WalletPage />} />
            <Route path='feed' element={<FeedPage />} />
            <Route path='marketplace' element={<MarketplacePage />} />
            <Route path='blog' element={<BlogPage />} />
            <Route path='ranking' element={<RankingDashboardPage />} />
            <Route path='discovery' element={<DiscoveryPage />} />
            <Route path='analytics' element={<AnalyticsPage />} />
            <Route path='notifications' element={<NotificationsPage />} />
            <Route path='chat' element={<ChatPage />} />
            <Route path='membership' element={<MembershipPage />} />
            <Route path='matches' element={<MatchHistoryPage />} />
            <Route path='inbox' element={<InboxPage />} />
            <Route path='help' element={<HelpPage />} />
            <Route
              path='club-registration'
              element={<ClubRegistrationPage />}
            />
            {/* <Route path='auth-test' element={<AuthTestPage />} /> */} {/* Test page removed */}

            {/* Navigation Test Page - Temporarily disabled */}
            {/* <Route path='navigation-test' element={<NavigationTestPage />} /> */}

            {/* Public pages accessible through sidebar when logged in */}
            <Route path='tournaments-list' element={<TournamentHub />} />
            <Route path='leaderboard' element={<LeaderboardPage />} />
            <Route path='clubs' element={<ClubsPage />} />
            <Route path='clubs/:id' element={<ClubDetailPage />} />
          </Route>

          {/* Admin routes - use wildcard to let AdminRouter handle sub-routes */}
          <Route
            path='/admin/*'
            element={
              <AdminRoute>
                <AdminRouter />
              </AdminRoute>
            }
          />

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
