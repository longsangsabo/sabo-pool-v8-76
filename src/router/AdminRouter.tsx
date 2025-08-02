import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from '@/components/AdminLayout';
import { Loader2 } from 'lucide-react';
import { ErrorBoundary } from 'react-error-boundary';

// Enhanced loading fallback with retry
const AdminLoadingFallback = () => (
  <div className="flex items-center justify-center h-64">
    <div className="text-center">
      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
      <p className="text-muted-foreground">Đang tải trang admin...</p>
    </div>
  </div>
);

// Chunk loading error fallback
const ChunkErrorFallback = ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => (
  <div className="flex items-center justify-center min-h-[400px] text-center">
    <div>
      <p className="text-destructive mb-2">Lỗi tải trang: {error.message}</p>
      <button 
        onClick={resetErrorBoundary}
        className="text-sm underline hover:no-underline"
      >
        Thử lại
      </button>
    </div>
  </div>
);

// Lazy load with better error handling
const createLazyComponent = (importFn: () => Promise<any>, fallbackName: string) => {
  return lazy(() => 
    importFn().catch(() => ({
      default: () => (
        <div className="flex items-center justify-center min-h-[400px] text-center">
          <div>
            <p className="text-destructive mb-2">Không thể tải {fallbackName}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="text-sm underline hover:no-underline"
            >
              Tải lại trang
            </button>
          </div>
        </div>
      )
    }))
  );
};

// Lazy loaded admin components
const AdminDashboard = createLazyComponent(() => import('@/pages/admin/AdminDashboard'), 'Dashboard');
const AdminUsers = createLazyComponent(() => import('@/pages/admin/AdminUsers'), 'Quản lý Users');
const AdminTournaments = createLazyComponent(() => import('@/pages/admin/AdminTournaments'), 'Quản lý Tournaments');
const AdminClubs = createLazyComponent(() => import('@/pages/admin/AdminClubs'), 'Quản lý Clubs');
const AdminRankVerification = createLazyComponent(() => import('@/pages/admin/AdminRankVerification'), 'Xác thực Rank');
const AdminTransactions = createLazyComponent(() => import('@/pages/admin/AdminTransactions'), 'Giao dịch');
const AdminGameConfig = createLazyComponent(() => import('@/pages/admin/AdminGameConfig'), 'Cấu hình Game');
const AdminChallenges = createLazyComponent(() => import('@/pages/admin/AdminChallenges'), 'Thách đấu');
const AdminPayments = createLazyComponent(() => import('@/pages/admin/AdminPayments'), 'Thanh toán');
const AdminEmergency = createLazyComponent(() => import('@/pages/admin/AdminEmergency'), 'Khẩn cấp');
const AdminGuide = createLazyComponent(() => import('@/pages/admin/AdminGuide'), 'Hướng dẫn');
const AdminReports = createLazyComponent(() => import('@/pages/admin/AdminReports'), 'Báo cáo');
const AdminAnalytics = createLazyComponent(() => import('@/pages/admin/AdminAnalytics'), 'Phân tích');
const AdminSchedule = createLazyComponent(() => import('@/pages/admin/AdminSchedule'), 'Lịch trình');
const AdminNotifications = createLazyComponent(() => import('@/pages/admin/AdminNotifications'), 'Thông báo');
const AdminDatabase = createLazyComponent(() => import('@/pages/admin/AdminDatabase'), 'Database');
const AdminAutomation = createLazyComponent(() => import('@/pages/admin/AdminAutomation'), 'Tự động hóa');
const AdminDevelopment = createLazyComponent(() => import('@/pages/admin/AdminDevelopment'), 'Development');
const AdminAIAssistant = createLazyComponent(() => import('@/pages/admin/AdminAIAssistant'), 'AI Assistant');
const AdminSettings = createLazyComponent(() => import('@/pages/admin/AdminSettings'), 'Cài đặt');
const AdminSystemReset = createLazyComponent(() => import('@/pages/admin/AdminSystemReset'), 'Reset hệ thống');
const AdminTestingDashboard = createLazyComponent(() => import('@/pages/admin/AdminTestingDashboard'), 'Testing');

const AdminRouter = () => {
  return (
    <AdminLayout>
      <ErrorBoundary FallbackComponent={ChunkErrorFallback}>
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
      </ErrorBoundary>
    </AdminLayout>
  );
};

export default AdminRouter;