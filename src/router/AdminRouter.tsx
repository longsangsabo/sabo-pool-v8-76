import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminResponsiveLayout } from '@/components/layouts/AdminResponsiveLayout';
import { Loader2 } from 'lucide-react';

// Simple loading fallback
const AdminLoadingFallback = () => (
  <div className='flex items-center justify-center h-64'>
    <Loader2 className='h-8 w-8 animate-spin text-primary' />
  </div>
);

// Direct lazy imports to avoid circular dependencies
// Enhanced New Admin Pages - Primary
const AdminDashboardNew = lazy(() => import('@/pages/admin/AdminDashboardNew'));
const AdminUsersNew = lazy(() => import('@/pages/admin/AdminUsersNew'));
const AdminClubsNew = lazy(() => import('@/pages/admin/AdminClubsNew'));
const AdminRankVerificationNew = lazy(() => import('@/pages/admin/AdminRankVerificationNew'));
const AdminTransactionsNew = lazy(() => import('@/pages/admin/AdminTransactionsNew'));
const AdminChallengesNew = lazy(() => import('@/pages/admin/AdminChallengesNewClean'));
const AdminPaymentsNew = lazy(() => import('@/pages/admin/AdminPaymentsNew'));
const AdminEmergencyNew = lazy(() => import('@/pages/admin/AdminEmergencyNew'));
const AdminGuideNew = lazy(() => import('@/pages/admin/AdminGuideNew'));
const AdminReportsNew = lazy(() => import('@/pages/admin/AdminReportsNew'));
const AdminAnalyticsNew = lazy(() => import('@/pages/admin/AdminAnalyticsNew'));
const AdminScheduleNew = lazy(() => import('@/pages/admin/AdminScheduleNew'));
const AdminNotificationsNew = lazy(() => import('@/pages/admin/AdminNotificationsNew'));
const AdminDatabaseNew = lazy(() => import('@/pages/admin/AdminDatabaseNew'));
const AdminAutomationNew = lazy(() => import('@/pages/admin/AdminAutomationNew'));
const AdminDevelopmentNew = lazy(() => import('@/pages/admin/AdminDevelopmentNew'));
const AdminAIAssistantNew = lazy(() => import('@/pages/admin/AdminAIAssistantNew'));
const AdminSettingsNew = lazy(() => import('@/pages/admin/AdminSettingsNew'));

// Special Admin Pages - Keep
const AdminSystemReset = lazy(() => import('@/pages/admin/AdminSystemReset'));
const AdminTestingDashboard = lazy(() => import('@/pages/admin/AdminTestingDashboard'));
const AdminMigrationDashboard = lazy(() => import('@/pages/admin/AdminMigrationDashboard'));

// Enhanced Tournament & Game Config
const AdminTournamentsNewEnhanced = lazy(() => import('@/pages/admin/AdminTournamentsNewEnhanced'));
const AdminGameConfigNewEnhanced = lazy(() => import('@/pages/admin/AdminGameConfigNewEnhanced'));

const AdminRouter = () => {
  return (
    <AdminResponsiveLayout>
      <Suspense fallback={<AdminLoadingFallback />}>
        <Routes>
          <Route index element={<AdminDashboardNew />} />
          <Route path='users' element={<AdminUsersNew />} />
          <Route path='clubs' element={<AdminClubsNew />} />
          <Route path='rank-verification' element={<AdminRankVerificationNew />} />
          <Route path='transactions' element={<AdminTransactionsNew />} />
          <Route path='challenges' element={<AdminChallengesNew />} />
          <Route path='payments' element={<AdminPaymentsNew />} />
          <Route path='emergency' element={<AdminEmergencyNew />} />
          <Route path='guide' element={<AdminGuideNew />} />
          <Route path='reports' element={<AdminReportsNew />} />
          <Route path='analytics' element={<AdminAnalyticsNew />} />
          <Route path='schedule' element={<AdminScheduleNew />} />
          <Route path='notifications' element={<AdminNotificationsNew />} />
          <Route path='database' element={<AdminDatabaseNew />} />
          <Route path='automation' element={<AdminAutomationNew />} />
          <Route path='development' element={<AdminDevelopmentNew />} />
          <Route path='ai-assistant' element={<AdminAIAssistantNew />} />
          <Route path='settings' element={<AdminSettingsNew />} />
          
          {/* Special Admin Tools */}
          <Route path='system-reset' element={<AdminSystemReset />} />
          <Route path='testing' element={<AdminTestingDashboard />} />
          <Route path='migration' element={<AdminMigrationDashboard />} />
          
          {/* Enhanced Tournament & Game Config */}
          <Route path='tournaments' element={<AdminTournamentsNewEnhanced />} />
          <Route path='game-config' element={<AdminGameConfigNewEnhanced />} />
          
          {/* Legacy New Routes (for backward compatibility) */}
          <Route path='clubs-new' element={<AdminClubsNew />} />
          <Route path='users-new' element={<AdminUsersNew />} />
          <Route path='transactions-new' element={<AdminTransactionsNew />} />
          <Route path='tournaments-new' element={<AdminTournamentsNewEnhanced />} />
          <Route path='analytics-new' element={<AdminAnalyticsNew />} />
          <Route path='settings-new' element={<AdminSettingsNew />} />
          <Route path='database-new' element={<AdminDatabaseNew />} />
          <Route path='automation-new' element={<AdminAutomationNew />} />
          <Route path='rank-verification-new' element={<AdminRankVerificationNew />} />
          <Route path='challenges-new' element={<AdminChallengesNew />} />
          <Route path='payments-new' element={<AdminPaymentsNew />} />
          <Route path='game-config-new' element={<AdminGameConfigNewEnhanced />} />
          <Route path='notifications-new' element={<AdminNotificationsNew />} />
          <Route path='schedule-new' element={<AdminScheduleNew />} />
          <Route path="reports-new" element={<AdminReportsNew />} />
          <Route path="emergency-new" element={<AdminEmergencyNew />} />
          <Route path="development-new" element={<AdminDevelopmentNew />} />
          <Route path="ai-assistant-new" element={<AdminAIAssistantNew />} />
          <Route path="guide-new" element={<AdminGuideNew />} />
          <Route path="dashboard-new" element={<AdminDashboardNew />} />
          
          <Route path='*' element={<Navigate to='/admin' replace />} />
        </Routes>
      </Suspense>
    </AdminResponsiveLayout>
  );
};

export default AdminRouter;
