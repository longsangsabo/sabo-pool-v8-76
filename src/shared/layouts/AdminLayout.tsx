import React from 'react';
import { cn } from '@/lib/utils';
import { AdminNavigation } from '@/shared/components/navigation/AdminNavigation';
import { MobileNavigation } from '@/shared/components/navigation/MobileNavigation';
import { AdminHeader } from '@/shared/components/headers/AdminHeader';
import { useResponsiveLayout } from '@/contexts/ResponsiveLayoutContext';

interface AdminLayoutProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * AdminLayout - Layout for admin dashboard and tools
 * 
 * Features:
 * - Enhanced sidebar with admin tools
 * - Admin-specific header with system controls
 * - System monitoring indicators
 * - Admin permission-based navigation
 */
export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  className
}) => {
  const { isMobile } = useResponsiveLayout();

  return (
    <div className={cn(
      'min-h-screen bg-background',
      'flex flex-col lg:flex-row',
      'admin-layout',
      className
    )}>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 z-40">
          <div className="flex-1 flex flex-col min-h-0 bg-card border-r border-border">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                <div className="text-xl font-bold text-orange-500">
                  SABO Admin
                </div>
              </div>
              <nav className="mt-8 flex-1 px-2 space-y-1">
                <AdminNavigation />
              </nav>
            </div>
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <div className={cn(
        'flex-1 flex flex-col',
        !isMobile && 'lg:pl-64'
      )}>
        {/* Header */}
        <AdminHeader />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Navigation */}
      {isMobile && <MobileNavigation navigationComponent={<AdminNavigation />} />}
    </div>
  );
};

export default AdminLayout;
