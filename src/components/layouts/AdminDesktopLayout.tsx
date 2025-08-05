import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import AdminSidebar from '@/components/AdminSidebar';
import { AdminDesktopHeader } from '@/components/admin/AdminDesktopHeader';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

interface AdminDesktopLayoutProps {
  children?: React.ReactNode;
}

export const AdminDesktopLayout: React.FC<AdminDesktopLayoutProps> = ({
  children,
}) => {
  const { user, isAdmin, loading } = useAdminAuth();
  const { t } = useLanguage();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary'></div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className='flex min-h-screen bg-background'>
      {/* Sidebar */}
      <div
        className={`transition-all duration-300 ${isSidebarCollapsed ? 'w-16' : 'w-64'}`}
      >
        <AdminSidebar collapsed={isSidebarCollapsed} />
      </div>

      {/* Main Content */}
      <div className='flex-1 flex flex-col min-w-0'>
        <AdminDesktopHeader
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          sidebarCollapsed={isSidebarCollapsed}
        />

        <main className='flex-1 p-6 overflow-auto'>
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};
