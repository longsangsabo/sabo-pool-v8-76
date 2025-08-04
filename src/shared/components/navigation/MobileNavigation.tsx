import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Menu, X } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';

interface MobileNavigationProps {
  navigationComponent: React.ReactNode;
  className?: string;
}

/**
 * MobileNavigation - Collapsible mobile navigation wrapper
 * Provides a slide-out navigation menu for mobile devices
 */
export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  navigationComponent,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleNavigation = () => {
    setIsOpen(!isOpen);
  };

  const closeNavigation = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed bottom-4 right-4 z-50">
        <Button
          onClick={toggleNavigation}
          size="lg"
          className="rounded-full w-14 h-14 shadow-lg"
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </Button>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50"
          onClick={closeNavigation}
        />
      )}

      {/* Mobile navigation panel */}
      <div
        className={cn(
          'lg:hidden fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out',
          'bg-card border-r border-border',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          className
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="text-lg font-semibold text-primary">
              Menu
            </div>
            <Button
              onClick={closeNavigation}
              size="sm"
              variant="ghost"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation Content */}
          <div className="flex-1 overflow-y-auto p-4">
            <div onClick={closeNavigation}>
              {navigationComponent}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileNavigation;
