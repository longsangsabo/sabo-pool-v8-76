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

// ✅ Optimized: Conditional debug import to reduce bundle size  
if (process.env.NODE_ENV === 'development') {
  // Use dynamic import to avoid including in production bundle
  void import('@/utils/debugTournamentRefresh');
}

// ✅ Super optimized: Priority-based lazy loading with prefetch hints
// Critical path - load immediately
const HomePage = lazy(() => import('@/pages/Home'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));

// Auth flow - preload these for better UX
const LoginPage = lazy(() => 
  import('@/pages/Login').then(module => {
    // Prefetch register page since users often switch between them
    void import('@/pages/Register');
    return module;
  })
);
const RegisterPage = lazy(() => import('@/pages/Register'));
const AuthPage = lazy(() => import('@/pages/AuthPage'));
const AuthCallbackPage = lazy(() => import('@/pages/AuthCallbackPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPassword'));

// Main app features - medium priority
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const EnhancedChallengesPageV2 = lazy(() => import('@/pages/EnhancedChallengesPageV2'));
const TournamentPage = lazy(() => import('@/pages/TournamentsPage'));
const LeaderboardPage = lazy(() => import('@/pages/LeaderboardPage'));

// Secondary features - lower priority
const CommunityPage = lazy(() => import('@/pages/CommunityPage'));
const CalendarPage = lazy(() => import('@/pages/CalendarPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const WalletPage = lazy(() => import('@/pages/PaymentPage'));
const FeedPage = lazy(() => import('@/pages/FeedPage'));
const MarketplacePage = lazy(() => import('@/pages/EnhancedMarketplacePage'));

// Club features
const ClubsPage = lazy(() => import('@/pages/ClubsPage'));
const ClubDetailPage = lazy(() => import('@/pages/ClubDetailPage'));
const ClubRegistrationPage = lazy(() => import('@/pages/ClubRegistrationPage'));
const ClubManagementPage = lazy(() => import('@/pages/ClubManagementPage'));

// Static/info pages - lowest priority
const AboutPage = lazy(() => import('@/pages/AboutPage'));
const ContactPage = lazy(() => import('@/pages/SimpleClubContactPage'));
const PrivacyPolicyPage = lazy(() => import('@/pages/PrivacyPage'));
const TermsOfServicePage = lazy(() => import('@/pages/TermsPage'));
const NewsPage = lazy(() => import('@/pages/BlogPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFound'));

// Admin - conditional loading
const AdminRouter = lazy(() => import('@/router/AdminRouter'));
const AuthTestPage = lazy(() => import('@/pages/AuthTestPage'));

// ✅ Optimized: Reduced query client overhead
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      // ✅ Reduce network overhead
      refetchOnMount: false,
      refetchOnReconnect: false,
    },
  },
});

// ✅ Optimized: Memoized component to prevent unnecessary re-renders
const AppContent = React.memo(() => {
  // ✅ Initialize realtime notifications (now inside AuthProvider)
  const { PopupComponent } = useRealtimeNotifications();

  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={<AppLoadingFallback />}>
         <Routes>
           {/* ✅ Optimized: Most common public routes first */}
           <Route path="/" element={<HomePage />} />
           
           {/* Auth routes - only accessible when NOT logged in */}
           <Route path="/auth" element={<PublicRoute><AuthPage /></PublicRoute>} />
           <Route path="/auth/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
           <Route path="/auth/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
           <Route path="/auth/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
           <Route path="/auth/callback" element={<AuthCallbackPage />} />

           {/* Protected routes with MainLayout - these will show the sidebar */}
           <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
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
             
             {/* Public pages accessible through sidebar when logged in */}
             <Route path="tournaments" element={<TournamentPage />} />
             <Route path="leaderboard" element={<LeaderboardPage />} />
             <Route path="clubs" element={<ClubsPage />} />
             <Route path="clubs/:id" element={<ClubDetailPage />} />
           </Route>

           {/* Public informational pages - moved lower priority */}
           <Route path="/about" element={<AboutPage />} />
           <Route path="/contact" element={<ContactPage />} />
           <Route path="/privacy" element={<PrivacyPolicyPage />} />
           <Route path="/terms" element={<TermsOfServicePage />} />
           <Route path="/news" element={<NewsPage />} />

           {/* Admin routes - use wildcard to let AdminRouter handle sub-routes */}
           <Route path="/admin/*" element={<AdminRoute><AdminRouter /></AdminRoute>} />

            {/* Club management routes - protected and require club owner privileges */}
            <Route path="/club-management" element={<ProtectedRoute><ClubManagementPage /></ProtectedRoute>} />
            <Route path="/club-management/tournaments" element={<ProtectedRoute><ClubManagementPage /></ProtectedRoute>} />
            <Route path="/club-management/challenges" element={<ProtectedRoute><ClubManagementPage /></ProtectedRoute>} />
            <Route path="/club-management/verification" element={<ProtectedRoute><ClubManagementPage /></ProtectedRoute>} />
            <Route path="/club-management/members" element={<ProtectedRoute><ClubManagementPage /></ProtectedRoute>} />
            <Route path="/club-management/notifications" element={<ProtectedRoute><ClubManagementPage /></ProtectedRoute>} />
            <Route path="/club-management/schedule" element={<ProtectedRoute><ClubManagementPage /></ProtectedRoute>} />
            <Route path="/club-management/payments" element={<ProtectedRoute><ClubManagementPage /></ProtectedRoute>} />
            <Route path="/club-management/settings" element={<ProtectedRoute><ClubManagementPage /></ProtectedRoute>} />

           {/* Fallback route */}
           <Route path="*" element={<NotFoundPage />} />
         </Routes>
      </Suspense>
      {/* ✅ Render notification popup */}
      <PopupComponent />
    </div>
  );
});

const App = React.memo(() => {
  // ✅ Make query client available globally for debugging (dev only)
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      (window as any).queryClient = queryClient;
    }
  }, []);

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

export default App;