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
const AdminDashboardNew = lazy(
  () => import('@/features/admin/pages/AdminDashboardNew')
);
const AdminUsersNew = lazy(
  () => import('@/features/admin/pages/AdminUsersNew')
);
const AdminClubsNew = lazy(
  () => import('@/features/admin/pages/AdminClubsNew')
);
const AdminRankVerificationNew = lazy(
  () => import('@/features/admin/pages/AdminRankVerificationNew')
);
const AdminTransactionsNew = lazy(
  () => import('@/features/admin/pages/AdminTransactionsNew')
);
const AdminChallengesNew = lazy(
  () => import('@/features/admin/pages/AdminChallengesNewClean')
);
const AdminPaymentsNew = lazy(
  () => import('@/features/admin/pages/AdminPaymentsNew')
);
const AdminEmergencyNew = lazy(
  () => import('@/features/admin/pages/AdminEmergencyNew')
);
const AdminGuideNew = lazy(
  () => import('@/features/admin/pages/AdminGuideNew')
);
const AdminReportsNew = lazy(
  () => import('@/features/admin/pages/AdminReportsNew')
);
const AdminAnalyticsNew = lazy(
  () => import('@/features/admin/pages/AdminAnalyticsNew')
);
const AdminScheduleNew = lazy(
  () => import('@/features/admin/pages/AdminScheduleNew')
);
const AdminNotificationsNew = lazy(
  () => import('@/features/admin/pages/AdminNotificationsNew')
);
const AdminDatabaseNew = lazy(
  () => import('@/features/admin/pages/AdminDatabaseNew')
);
const AdminAutomationNew = lazy(
  () => import('@/features/admin/pages/AdminAutomationNew')
);
const AdminDevelopmentNew = lazy(
  () => import('@/features/admin/pages/AdminDevelopmentNew')
);
const AdminAIAssistantNew = lazy(
  () => import('@/features/admin/pages/AdminAIAssistantNew')
);
const AdminSettingsNew = lazy(
  () => import('@/features/admin/pages/AdminSettingsNew')
);

// Special Admin Pages - Keep
const AdminSystemReset = lazy(
  () => import('@/features/admin/pages/AdminSystemReset')
);
const AdminTestingDashboard = lazy(
  () => import('@/features/admin/pages/AdminTestingDashboard')
);
const AdminMigrationDashboard = lazy(
  () => import('@/features/admin/pages/AdminMigrationDashboard')
);

// Enhanced Tournament & Game Config
const AdminTournamentsNewEnhanced = lazy(
  () => import('@/features/admin/pages/AdminTournamentsNewEnhanced')
);
const AdminGameConfigNewEnhanced = lazy(
  () => import('@/features/admin/pages/AdminGameConfigNewEnhanced')
);

const AdminRouter = () => {
  return (
    <AdminResponsiveLayout>
      <Suspense fallback={<AdminLoadingFallback />}>
        <Routes>
          <Route index element={<AdminDashboardNew />} />
          <Route path='users' element={<AdminUsersNew />} />
          <Route path='clubs' element={<AdminClubsNew />} />
          <Route
            path='rank-verification'
            element={<AdminRankVerificationNew />}
          />
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
          <Route
            path='tournaments-new'
            element={<AdminTournamentsNewEnhanced />}
          />
          <Route path='analytics-new' element={<AdminAnalyticsNew />} />
          <Route path='settings-new' element={<AdminSettingsNew />} />
          <Route path='database-new' element={<AdminDatabaseNew />} />
          <Route path='automation-new' element={<AdminAutomationNew />} />
          <Route
            path='rank-verification-new'
            element={<AdminRankVerificationNew />}
          />
          <Route path='challenges-new' element={<AdminChallengesNew />} />
          <Route path='payments-new' element={<AdminPaymentsNew />} />
          <Route
            path='game-config-new'
            element={<AdminGameConfigNewEnhanced />}
          />
          <Route path='notifications-new' element={<AdminNotificationsNew />} />
          <Route path='schedule-new' element={<AdminScheduleNew />} />
          <Route path='reports-new' element={<AdminReportsNew />} />
          <Route path='emergency-new' element={<AdminEmergencyNew />} />
          <Route path='development-new' element={<AdminDevelopmentNew />} />
          <Route path='ai-assistant-new' element={<AdminAIAssistantNew />} />
          <Route path='guide-new' element={<AdminGuideNew />} />
          <Route path='dashboard-new' element={<AdminDashboardNew />} />

          <Route path='*' element={<Navigate to='/admin' replace />} />
        </Routes>
      </Suspense>
    </AdminResponsiveLayout>
  );
};

export default AdminRouter;
