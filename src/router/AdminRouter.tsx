import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from '@/components/AdminLayout';
import { Loader2 } from 'lucide-react';

// Simple loading fallback
const AdminLoadingFallback = () => (
  <div className="flex items-center justify-center h-64">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

// Direct lazy imports to avoid circular dependencies
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const AdminUsers = lazy(() => import('@/pages/admin/AdminUsers'));
const AdminTournaments = lazy(() => import('@/pages/admin/AdminTournaments'));
const AdminClubs = lazy(() => import('@/pages/admin/AdminClubs'));
const AdminRankVerification = lazy(() => import('@/pages/admin/AdminRankVerification'));
const AdminTransactions = lazy(() => import('@/pages/admin/AdminTransactions'));
const AdminGameConfig = lazy(() => import('@/pages/admin/AdminGameConfig'));
const AdminChallenges = lazy(() => import('@/pages/admin/AdminChallenges'));
const AdminPayments = lazy(() => import('@/pages/admin/AdminPayments'));
const AdminEmergency = lazy(() => import('@/pages/admin/AdminEmergency'));
const AdminGuide = lazy(() => import('@/pages/admin/AdminGuide'));
const AdminReports = lazy(() => import('@/pages/admin/AdminReports'));
const AdminAnalytics = lazy(() => import('@/pages/admin/AdminAnalytics'));
const AdminSchedule = lazy(() => import('@/pages/admin/AdminSchedule'));
const AdminNotifications = lazy(() => import('@/pages/admin/AdminNotifications'));
const AdminDatabase = lazy(() => import('@/pages/admin/AdminDatabase'));
const AdminAutomation = lazy(() => import('@/pages/admin/AdminAutomation'));
const AdminDevelopment = lazy(() => import('@/pages/admin/AdminDevelopment'));
const AdminAIAssistant = lazy(() => import('@/pages/admin/AdminAIAssistant'));
const AdminSettings = lazy(() => import('@/pages/admin/AdminSettings'));
const AdminSystemReset = lazy(() => import('@/pages/admin/AdminSystemReset'));
const AdminTestingDashboard = lazy(() => import('@/pages/admin/AdminTestingDashboard'));

const AdminRouter = () => {
  return (
    <AdminLayout>
      <Suspense fallback={<AdminLoadingFallback />}>
        <Routes>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="tournaments" element={<AdminTournaments />} />
          <Route path="clubs" element={<AdminClubs />} />
          <Route path="rank-verification" element={<AdminRankVerification />} />
          <Route path="transactions" element={<AdminTransactions />} />
          <Route path="game-config" element={<AdminGameConfig />} />
          <Route path="challenges" element={<AdminChallenges />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="emergency" element={<AdminEmergency />} />
          <Route path="guide" element={<AdminGuide />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="schedule" element={<AdminSchedule />} />
          <Route path="notifications" element={<AdminNotifications />} />
          <Route path="database" element={<AdminDatabase />} />
          <Route path="automation" element={<AdminAutomation />} />
          <Route path="development" element={<AdminDevelopment />} />
          <Route path="ai-assistant" element={<AdminAIAssistant />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="system-reset" element={<AdminSystemReset />} />
          <Route path="testing" element={<AdminTestingDashboard />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </Suspense>
    </AdminLayout>
  );
};

export default AdminRouter;