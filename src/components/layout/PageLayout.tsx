import React from 'react';
import { cn } from '@/lib/utils';

interface PageLayoutProps {
  children: React.ReactNode;
  variant?: 'dashboard' | 'content' | 'full';
  className?: string;
}

/**
 * Unified page layout component for consistent container widths and spacing
 *
 * Variants:
 * - dashboard: Full width with padding for admin/club management pages
 * - content: Contained width for content-focused pages (profile, settings)
 * - full: Full width edge-to-edge for marketing/landing pages
 */
const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  variant = 'dashboard',
  className = '',
}) => {
  const layoutClasses = {
    // Dashboard pages - full width with consistent background
    dashboard: 'w-full min-h-screen bg-background',

    // Content pages - contained width with background
    content: 'min-h-screen bg-background',

    // Marketing pages - full width no background constraints
    full: 'w-full min-h-screen',
  };

  const containerClasses = {
    // Dashboard: Full width with responsive padding
    dashboard: 'w-full px-4 md:px-6 py-4 md:py-6',

    // Content: Contained width optimized for reading
    content: 'container mx-auto max-w-4xl px-4 py-6 md:py-8',

    // Full: Marketing pages can handle their own constraints
    full: 'w-full',
  };

  return (
    <div className={cn(layoutClasses[variant], className)}>
      <div className={containerClasses[variant]}>{children}</div>
    </div>
  );
};

export default PageLayout;
