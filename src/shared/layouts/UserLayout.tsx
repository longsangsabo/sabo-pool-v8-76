import React from 'react';
import { cn } from '@/lib/utils';
import { UserNavigation } from '@/shared/components/navigation/UserNavigation';
import { MobileNavigation } from '@/shared/components/navigation/MobileNavigation';
import { UserHeader } from '@/shared/components/headers/UserHeader';
import { useResponsiveLayout } from '@/contexts/ResponsiveLayoutContext';

interface UserLayoutProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * UserLayout - Layout for regular user dashboard and features
 * 
 * Features:
 * - Responsive sidebar navigation
 * - User-specific header with profile access
 * - Mobile-first design with collapsible navigation
 * - User permission-based navigation items
 */
export const UserLayout: React.FC<UserLayoutProps> = ({
  children,
  className
}) => {
  const { isMobile } = useResponsiveLayout();

  return (
    <div className={cn(
      'min-h-screen bg-background',
      'flex flex-col lg:flex-row',
      'user-layout',
      className
    )}>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 z-40">
          <div className="flex-1 flex flex-col min-h-0 bg-card border-r border-border">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                <div className="text-xl font-bold text-primary">
                  SABO Pool
                </div>
              </div>
              <nav className="mt-8 flex-1 px-2 space-y-1">
                <UserNavigation />
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
        <UserHeader />

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
      {isMobile && <MobileNavigation navigationComponent={<UserNavigation />} />}
    </div>
  );
};

export default UserLayout;
