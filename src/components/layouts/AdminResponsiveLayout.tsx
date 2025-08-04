import React from 'react';
import { cn } from '@/lib/utils';

interface AdminResponsiveLayoutProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * AdminResponsiveLayout - Responsive layout specifically for admin users
 * Provides admin-specific layout structure with responsive behavior
 */
export const AdminResponsiveLayout: React.FC<AdminResponsiveLayoutProps> = ({
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        'min-h-screen bg-background',
        'flex flex-col',
        'admin-layout',
        className
      )}
    >
      {/* Admin Header - Fixed at top */}
      <header className='sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
        <div className='container flex h-14 items-center'>
          <div className='mr-4 hidden md:flex'>
            <span className='text-lg font-semibold text-orange-500'>
              SABO Admin
            </span>
          </div>
          <div className='flex flex-1 items-center justify-between space-x-2 md:justify-end'>
            <div className='w-full flex-1 md:w-auto md:flex-none'>
              <span className='text-sm text-muted-foreground'>
                Admin Dashboard
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className='flex-1 container mx-auto px-4 py-6'>{children}</main>

      {/* Admin Footer */}
      <footer className='border-t py-4'>
        <div className='container mx-auto px-4'>
          <div className='flex flex-col items-center justify-between gap-4 md:h-12 md:flex-row'>
            <p className='text-center text-sm leading-loose text-muted-foreground md:text-left'>
              SABO Pool Arena - Admin Panel
            </p>
            <div className='flex items-center space-x-4 text-sm text-muted-foreground'>
              <span>Admin Mode Active</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AdminResponsiveLayout;
