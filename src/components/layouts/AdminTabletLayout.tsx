import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { AdminMobileHeader } from '@/components/admin/AdminMobileHeader';
import { AdminTabletNavigation } from '@/components/admin/AdminTabletNavigation';
import { AdminMobileDrawer } from '@/components/admin/AdminMobileDrawer';

interface AdminTabletLayoutProps {
  children?: React.ReactNode;
}

export const AdminTabletLayout: React.FC<AdminTabletLayoutProps> = ({
  children,
}) => {
  const { user, isAdmin, loading } = useAdminAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-10 w-10 border-b-2 border-primary'></div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className='min-h-screen bg-background'>
      <AdminMobileHeader onMenuClick={() => setIsDrawerOpen(true)} />

      <main className='pb-20 pt-4 px-6 max-w-6xl mx-auto'>
        {children || <Outlet />}
      </main>

      <AdminTabletNavigation />

      <AdminMobileDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  );
};
