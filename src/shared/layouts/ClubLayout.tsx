import React from 'react';
import { cn } from '@/lib/utils';
import { ClubNavigation } from '@/shared/components/navigation/ClubNavigation';
import { MobileNavigation } from '@/shared/components/navigation/MobileNavigation';
import { ClubHeader } from '@/shared/components/headers/ClubHeader';
import { useResponsiveLayout } from '@/contexts/ResponsiveLayoutContext';

interface ClubLayoutProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * ClubLayout - Layout for club management and features
 * 
 * Features:
 * - Club-specific sidebar navigation
 * - Club management header with club switcher
 * - Member management tools
 * - Club owner permission-based navigation
 */
export const ClubLayout: React.FC<ClubLayoutProps> = ({
  children,
  className
}) => {
  const { isMobile } = useResponsiveLayout();

  return (
    <div className={cn(
      'min-h-screen bg-background',
      'flex flex-col lg:flex-row',
      'club-layout',
      className
    )}>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 z-40">
          <div className="flex-1 flex flex-col min-h-0 bg-card border-r border-border">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                <div className="text-xl font-bold text-blue-600">
                  Club Manager
                </div>
              </div>
              <nav className="mt-8 flex-1 px-2 space-y-1">
                <ClubNavigation />
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
        <ClubHeader />

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
      {isMobile && <MobileNavigation navigationComponent={<ClubNavigation />} />}
    </div>
  );
};

export default ClubLayout;
