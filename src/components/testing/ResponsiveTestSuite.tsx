import React, { useState, useEffect } from 'react';
import { useOptimizedResponsive } from '@/hooks/useOptimizedResponsive';
import { BREAKPOINTS, MEDIA_QUERIES } from '@/constants/breakpoints';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const ResponsiveTestSuite: React.FC = () => {
  const responsive = useOptimizedResponsive();

  const [renderCount, setRenderCount] = useState(0);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    renderTime: 0,
    lastUpdate: Date.now(),
  });

  // Simple media query check
  const checkMediaQuery = (query: string) => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  };

  // Track render performance
  useEffect(() => {
    const start = performance.now();
    setRenderCount(prev => prev + 1);

    const end = performance.now();
    setPerformanceMetrics({
      renderTime: end - start,
      lastUpdate: Date.now(),
    });
  }, [responsive.breakpoint]);

  const getBreakpointColor = (bp: string) => {
    switch (bp) {
      case 'mobile':
        return 'destructive';
      case 'tablet':
        return 'secondary';
      case 'desktop':
        return 'default';
      default:
        return 'outline';
    }
  };

  return (
    <div className='p-6 space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle>📱 Responsive Layout Test Suite</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          {/* Current State */}
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <div>
              <label className='text-sm font-medium'>Width</label>
              <div className='text-2xl font-bold'>{responsive.width}px</div>
            </div>
            <div>
              <label className='text-sm font-medium'>Height</label>
              <div className='text-2xl font-bold'>{responsive.height}px</div>
            </div>
            <div>
              <label className='text-sm font-medium'>Breakpoint</label>
              <Badge variant={getBreakpointColor(responsive.breakpoint)}>
                {responsive.breakpoint}
              </Badge>
            </div>
            <div>
              <label className='text-sm font-medium'>Renders</label>
              <div className='text-2xl font-bold'>{renderCount}</div>
            </div>
          </div>

          {/* Breakpoint Tests */}
          <div className='space-y-2'>
            <h3 className='font-semibold'>Breakpoint Detection</h3>
            <div className='grid grid-cols-3 gap-2'>
              <Badge variant={responsive.isMobile ? 'default' : 'outline'}>
                Mobile: {responsive.isMobile ? '✅' : '❌'}
              </Badge>
              <Badge variant={responsive.isTablet ? 'default' : 'outline'}>
                Tablet: {responsive.isTablet ? '✅' : '❌'}
              </Badge>
              <Badge variant={responsive.isDesktop ? 'default' : 'outline'}>
                Desktop: {responsive.isDesktop ? '✅' : '❌'}
              </Badge>
            </div>
          </div>

          {/* Media Query Tests */}
          <div className='space-y-2'>
            <h3 className='font-semibold'>Media Query Validation</h3>
            <div className='grid grid-cols-3 gap-2'>
              <Badge
                variant={
                  checkMediaQuery(MEDIA_QUERIES.mobile) ? 'default' : 'outline'
                }
              >
                Mobile Query:{' '}
                {checkMediaQuery(MEDIA_QUERIES.mobile) ? '✅' : '❌'}
              </Badge>
              <Badge
                variant={
                  checkMediaQuery(MEDIA_QUERIES.tablet) ? 'default' : 'outline'
                }
              >
                Tablet Query:{' '}
                {checkMediaQuery(MEDIA_QUERIES.tablet) ? '✅' : '❌'}
              </Badge>
              <Badge
                variant={
                  checkMediaQuery(MEDIA_QUERIES.desktop) ? 'default' : 'outline'
                }
              >
                Desktop Query:{' '}
                {checkMediaQuery(MEDIA_QUERIES.desktop) ? '✅' : '❌'}
              </Badge>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className='space-y-2'>
            <h3 className='font-semibold'>Performance Metrics</h3>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <label className='text-sm'>Last Render Time</label>
                <div className='font-mono'>
                  {performanceMetrics.renderTime.toFixed(2)}ms
                </div>
              </div>
              <div>
                <label className='text-sm'>Last Update</label>
                <div className='font-mono'>
                  {new Date(performanceMetrics.lastUpdate).toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>

          {/* Breakpoint Definitions */}
          <div className='space-y-2'>
            <h3 className='font-semibold'>Breakpoint Configuration</h3>
            <div className='grid grid-cols-2 gap-2 text-sm font-mono'>
              <div>Mobile: &lt; {BREAKPOINTS.mobile}px</div>
              <div>
                Tablet: {BREAKPOINTS.mobile}px - {BREAKPOINTS.tablet - 1}px
              </div>
              <div>Desktop: ≥ {BREAKPOINTS.tablet}px</div>
            </div>
          </div>

          {/* Test Actions */}
          <div className='flex gap-2'>
            <Button
              variant='outline'
              onClick={() => setRenderCount(0)}
              size='sm'
            >
              Reset Counter
            </Button>
            <Button
              variant='outline'
              onClick={() => window.dispatchEvent(new Event('resize'))}
              size='sm'
            >
              Trigger Resize
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
