import React from 'react';
import { useOptimizedResponsive } from '@/hooks/useOptimizedResponsive';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tablet, Monitor, Smartphone } from 'lucide-react';

interface TabletOptimizationProps {
  children: React.ReactNode;
  title?: string;
}

export const TabletOptimizedContainer: React.FC<TabletOptimizationProps> = ({
  children,
  title,
}) => {
  const { isTablet, width, height } = useOptimizedResponsive();

  if (!isTablet) {
    return <>{children}</>;
  }

  return (
    <div className='tablet-optimized-container'>
      {/* Tablet-specific enhancements */}
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-6'>
        {/* Main Content Area - 8 columns */}
        <div className='lg:col-span-8'>
          <div className='space-y-6'>
            {title && (
              <div className='flex items-center justify-between'>
                <h1 className='text-2xl font-bold'>{title}</h1>
                <Badge variant='outline' className='flex items-center gap-2'>
                  <Tablet className='w-4 h-4' />
                  Tablet View
                </Badge>
              </div>
            )}
            {children}
          </div>
        </div>

        {/* Sidebar Area - 4 columns */}
        <div className='lg:col-span-4'>
          <div className='sticky top-6 space-y-4'>
            <Card>
              <CardHeader>
                <CardTitle className='text-lg'>Tablet Info</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-2 text-sm'>
                  <div>
                    Screen: {width}×{height}
                  </div>
                  <div>Optimized for touch interaction</div>
                  <div>Enhanced spacing and typography</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced tablet-specific components
export const TabletGrid: React.FC<{
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
}> = ({ children, columns = 3 }) => {
  const { isTablet } = useOptimizedResponsive();

  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div
      className={`grid ${gridCols[columns]} gap-6 ${isTablet ? 'tablet-enhanced-grid' : ''}`}
    >
      {children}
    </div>
  );
};

export const TabletCard: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  const { isTablet } = useOptimizedResponsive();

  return (
    <Card
      className={`${isTablet ? 'tablet-enhanced-card p-6' : ''} ${className}`}
    >
      {children}
    </Card>
  );
};

export const TabletButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'sm' | 'default' | 'lg';
}> = ({ children, onClick, variant = 'default', size = 'default' }) => {
  const { isTablet } = useOptimizedResponsive();

  // Enhanced touch target for tablets
  const tabletSize = isTablet ? 'lg' : size;

  return (
    <Button
      variant={variant}
      size={tabletSize}
      onClick={onClick}
      className={isTablet ? 'tablet-enhanced-button min-h-[48px]' : ''}
    >
      {children}
    </Button>
  );
};
