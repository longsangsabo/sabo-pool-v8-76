import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useResponsive } from '@/hooks/useResponsive';

const ResponsiveDebugInfo: React.FC = () => {
  const { isDesktop, isMobile, isTablet, width, height, breakpoint } =
    useResponsive();

  return (
    <Card className='fixed top-4 right-4 z-50 bg-background/95 backdrop-blur-sm border border-border/50 shadow-lg'>
      <CardContent className='p-4 space-y-2 text-xs'>
        <div className='font-semibold text-primary'>🔍 Debug Info</div>
        <div>
          Screen: {width}x{height}
        </div>
        <div>Breakpoint: {breakpoint}</div>
        <div>
          States:
          {isMobile && <span className='text-green-600'> Mobile</span>}
          {isTablet && <span className='text-blue-600'> Tablet</span>}
          {isDesktop && <span className='text-purple-600'> Desktop</span>}
        </div>
        <div className='text-muted-foreground'>
          Layout: {isDesktop ? 'Desktop' : 'Mobile'}
        </div>
      </CardContent>
    </Card>
  );
};

export default ResponsiveDebugInfo;
