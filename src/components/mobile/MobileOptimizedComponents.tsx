import React from 'react';
import { useOptimizedResponsive } from '@/hooks/useOptimizedResponsive';
import { cn } from '@/lib/utils';

interface MobileOptimizedProps {
  children: React.ReactNode;
  className?: string;
  touchOptimized?: boolean;
  safeArea?: boolean;
}

export const MobileOptimizedContainer: React.FC<MobileOptimizedProps> = ({
  children,
  className = '',
  touchOptimized = true,
  safeArea = true,
}) => {
  const { isMobile } = useOptimizedResponsive();

  if (!isMobile) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      className={cn(
        'mobile-optimized-container',
        touchOptimized && 'touch-optimized',
        safeArea && 'safe-area-optimized',
        className
      )}
    >
      {children}
    </div>
  );
};

export const MobileTouchButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  className = '',
}) => {
  const { isMobile } = useOptimizedResponsive();

  const baseClasses =
    'mobile-touch-button transition-all duration-200 font-semibold rounded-xl';
  const variantClasses = {
    primary:
      'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80',
    secondary:
      'bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/70',
    ghost: 'bg-transparent text-foreground hover:bg-accent active:bg-accent/80',
  };
  const sizeClasses = {
    sm: isMobile ? 'px-4 py-3 text-sm min-h-[44px]' : 'px-3 py-2 text-sm',
    md: isMobile ? 'px-6 py-4 text-base min-h-[48px]' : 'px-4 py-2 text-base',
    lg: isMobile ? 'px-8 py-5 text-lg min-h-[52px]' : 'px-6 py-3 text-lg',
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        isMobile && 'active:scale-95',
        className
      )}
    >
      {children}
    </button>
  );
};

export const MobileCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  padding?: 'sm' | 'md' | 'lg';
}> = ({ children, className = '', interactive = false, padding = 'md' }) => {
  const { isMobile } = useOptimizedResponsive();

  const paddingClasses = {
    sm: isMobile ? 'p-4' : 'p-3',
    md: isMobile ? 'p-6' : 'p-4',
    lg: isMobile ? 'p-8' : 'p-6',
  };

  return (
    <div
      className={cn(
        'mobile-card bg-card border border-border rounded-2xl shadow-sm',
        paddingClasses[padding],
        interactive &&
          isMobile &&
          'active:scale-[0.98] transition-transform duration-200',
        className
      )}
    >
      {children}
    </div>
  );
};

export const MobileList: React.FC<{
  children: React.ReactNode;
  spacing?: 'sm' | 'md' | 'lg';
}> = ({ children, spacing = 'md' }) => {
  const { isMobile } = useOptimizedResponsive();

  const spacingClasses = {
    sm: isMobile ? 'space-y-3' : 'space-y-2',
    md: isMobile ? 'space-y-4' : 'space-y-3',
    lg: isMobile ? 'space-y-6' : 'space-y-4',
  };

  return (
    <div className={cn('mobile-list', spacingClasses[spacing])}>{children}</div>
  );
};

export const MobileListItem: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}> = ({ children, onClick, className = '' }) => {
  const { isMobile } = useOptimizedResponsive();

  return (
    <div
      onClick={onClick}
      className={cn(
        'mobile-list-item bg-card border border-border rounded-xl',
        isMobile ? 'p-4 min-h-[60px]' : 'p-3 min-h-[50px]',
        onClick && 'cursor-pointer hover:bg-accent/50',
        isMobile &&
          onClick &&
          'active:scale-[0.98] transition-transform duration-200',
        className
      )}
    >
      {children}
    </div>
  );
};

export const MobileGrid: React.FC<{
  children: React.ReactNode;
  columns?: 1 | 2 | 3;
  gap?: 'sm' | 'md' | 'lg';
}> = ({ children, columns = 2, gap = 'md' }) => {
  const { isMobile } = useOptimizedResponsive();

  const columnClasses = {
    1: 'grid-cols-1',
    2: isMobile ? 'grid-cols-1' : 'grid-cols-2',
    3: isMobile ? 'grid-cols-1' : 'grid-cols-3',
  };

  const gapClasses = {
    sm: isMobile ? 'gap-3' : 'gap-2',
    md: isMobile ? 'gap-4' : 'gap-3',
    lg: isMobile ? 'gap-6' : 'gap-4',
  };

  return (
    <div
      className={cn(
        'mobile-grid grid',
        columnClasses[columns],
        gapClasses[gap]
      )}
    >
      {children}
    </div>
  );
};

export const MobileSheet: React.FC<{
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}> = ({ children, isOpen, onClose, title }) => {
  const { isMobile } = useOptimizedResponsive();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className='fixed inset-0 bg-background/80 backdrop-blur-sm z-50'
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50',
          'rounded-t-3xl shadow-2xl',
          isMobile ? 'max-h-[90vh]' : 'max-h-[80vh]',
          'animate-slide-up safe-area-pb'
        )}
      >
        {/* Handle */}
        <div className='w-12 h-1.5 bg-muted rounded-full mx-auto mt-3 mb-4' />

        {/* Header */}
        {title && (
          <div className='px-6 pb-4 border-b border-border'>
            <h2 className='text-lg font-semibold'>{title}</h2>
          </div>
        )}

        {/* Content */}
        <div className='p-6 overflow-y-auto'>{children}</div>
      </div>
    </>
  );
};
