import React, { useState, useEffect } from 'react';
import { useOptimizedResponsive } from '@/hooks/useOptimizedResponsive';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Activity,
  TrendingUp,
  Users,
  Clock,
  Smartphone,
  Tablet,
  Monitor,
} from 'lucide-react';

interface AnalyticsData {
  deviceType: 'mobile' | 'tablet' | 'desktop';
  sessionId: string;
  timestamp: number;
  screenDimensions: { width: number; height: number };
  userAgent: string;
  pageUrl: string;
  timeOnPage: number;
  breakpointChanges: number;
  renderCount: number;
  performanceMetrics: {
    renderTime: number;
    layoutShifts: number;
    memoryUsage: number;
  };
}

interface ResponsiveBehaviorStats {
  totalSessions: number;
  deviceDistribution: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  averageTimeOnPage: number;
  commonBreakpointTransitions: Array<{
    from: string;
    to: string;
    frequency: number;
  }>;
  performanceIssues: number;
}

export const ResponsiveAnalyticsTracker: React.FC = () => {
  const responsive = useOptimizedResponsive();
  const [isTracking, setIsTracking] = useState(false);
  const [sessionData, setSessionData] = useState<AnalyticsData | null>(null);
  const [stats, setStats] = useState<ResponsiveBehaviorStats>({
    totalSessions: 0,
    deviceDistribution: { mobile: 0, tablet: 0, desktop: 0 },
    averageTimeOnPage: 0,
    commonBreakpointTransitions: [],
    performanceIssues: 0,
  });
  const [sessionStartTime] = useState(Date.now());
  const [renderCount, setRenderCount] = useState(0);
  const [breakpointChanges, setBreakpointChanges] = useState(0);
  const [previousBreakpoint, setPreviousBreakpoint] = useState(
    responsive.breakpoint
  );

  // Generate unique session ID
  const generateSessionId = () => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Track responsive behavior
  useEffect(() => {
    if (!isTracking) return;

    // Increment render count
    setRenderCount(prev => prev + 1);

    // Track breakpoint changes
    if (previousBreakpoint !== responsive.breakpoint) {
      setBreakpointChanges(prev => prev + 1);
      setPreviousBreakpoint(responsive.breakpoint);

      // Log breakpoint transition
      console.log(
        `📊 Breakpoint transition: ${previousBreakpoint} → ${responsive.breakpoint}`
      );
    }

    // Update session data
    const currentSessionData: AnalyticsData = {
      deviceType: responsive.breakpoint as 'mobile' | 'tablet' | 'desktop',
      sessionId: sessionData?.sessionId || generateSessionId(),
      timestamp: Date.now(),
      screenDimensions: {
        width: responsive.width,
        height: responsive.height,
      },
      userAgent: navigator.userAgent,
      pageUrl: window.location.href,
      timeOnPage: Date.now() - sessionStartTime,
      breakpointChanges,
      renderCount,
      performanceMetrics: {
        renderTime: performance.now(),
        layoutShifts: 0, // Would be tracked via PerformanceObserver
        memoryUsage:
          'memory' in performance
            ? (performance as any).memory?.usedJSHeapSize / 1048576 || 0
            : 0,
      },
    };

    setSessionData(currentSessionData);
  }, [responsive.breakpoint, responsive.width, responsive.height, isTracking]);

  // Start tracking
  const startTracking = () => {
    setIsTracking(true);
    setSessionData({
      deviceType: responsive.breakpoint as 'mobile' | 'tablet' | 'desktop',
      sessionId: generateSessionId(),
      timestamp: Date.now(),
      screenDimensions: { width: responsive.width, height: responsive.height },
      userAgent: navigator.userAgent,
      pageUrl: window.location.href,
      timeOnPage: 0,
      breakpointChanges: 0,
      renderCount: 0,
      performanceMetrics: {
        renderTime: 0,
        layoutShifts: 0,
        memoryUsage: 0,
      },
    });

    console.log('📊 Started responsive analytics tracking');
  };

  // Stop tracking and generate report
  const stopTrackingAndReport = () => {
    setIsTracking(false);

    if (sessionData) {
      // Generate analytics report
      const report = {
        ...sessionData,
        timeOnPage: Date.now() - sessionStartTime,
        finalBreakpoint: responsive.breakpoint,
        totalBreakpointChanges: breakpointChanges,
        totalRenders: renderCount,
      };

      console.log('📊 Responsive Analytics Report:', report);

      // Send to analytics service (example)
      sendToAnalyticsService(report);

      // Update local stats
      updateLocalStats(report);
    }
  };

  // Simulate sending data to analytics service
  const sendToAnalyticsService = (data: any) => {
    // Example: Send to Google Analytics, Mixpanel, etc.
    console.log('📤 Sending to analytics service:', data);

    // Example implementation:
    // gtag('event', 'responsive_behavior', {
    //   device_type: data.deviceType,
    //   session_duration: data.timeOnPage,
    //   breakpoint_changes: data.totalBreakpointChanges,
    //   render_count: data.totalRenders
    // });
  };

  // Update local statistics
  const updateLocalStats = (data: any) => {
    setStats(prev => ({
      totalSessions: prev.totalSessions + 1,
      deviceDistribution: {
        ...prev.deviceDistribution,
        [data.deviceType]: prev.deviceDistribution[data.deviceType] + 1,
      },
      averageTimeOnPage:
        (prev.averageTimeOnPage * prev.totalSessions + data.timeOnPage) /
        (prev.totalSessions + 1),
      commonBreakpointTransitions: prev.commonBreakpointTransitions,
      performanceIssues:
        prev.performanceIssues + (data.totalRenders > 20 ? 1 : 0),
    }));
  };

  const getDeviceIcon = (device: string) => {
    switch (device) {
      case 'mobile':
        return <Smartphone className='h-4 w-4' />;
      case 'tablet':
        return <Tablet className='h-4 w-4' />;
      case 'desktop':
        return <Monitor className='h-4 w-4' />;
      default:
        return <Activity className='h-4 w-4' />;
    }
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Activity className='h-5 w-5' />
            <CardTitle>Responsive Analytics Tracker</CardTitle>
          </div>
          <div className='flex gap-2'>
            <Button
              onClick={startTracking}
              disabled={isTracking}
              variant='default'
              size='sm'
            >
              Start Tracking
            </Button>
            <Button
              onClick={stopTrackingAndReport}
              disabled={!isTracking}
              variant='outline'
              size='sm'
            >
              Stop & Report
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className='space-y-6'>
        {/* Current Session */}
        {sessionData && (
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold'>Current Session</h3>

            <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
              <div className='text-center p-3 bg-blue-50 rounded-lg'>
                <div className='flex items-center justify-center gap-1 mb-1'>
                  {getDeviceIcon(sessionData.deviceType)}
                  <span className='text-sm font-medium'>Device</span>
                </div>
                <Badge variant='outline'>{sessionData.deviceType}</Badge>
              </div>

              <div className='text-center p-3 bg-green-50 rounded-lg'>
                <div className='flex items-center justify-center gap-1 mb-1'>
                  <Clock className='h-4 w-4 text-green-600' />
                  <span className='text-sm font-medium'>Time</span>
                </div>
                <div className='text-lg font-bold text-green-600'>
                  {formatTime(Date.now() - sessionStartTime)}
                </div>
              </div>

              <div className='text-center p-3 bg-orange-50 rounded-lg'>
                <div className='flex items-center justify-center gap-1 mb-1'>
                  <TrendingUp className='h-4 w-4 text-orange-600' />
                  <span className='text-sm font-medium'>Changes</span>
                </div>
                <div className='text-lg font-bold text-orange-600'>
                  {breakpointChanges}
                </div>
              </div>

              <div className='text-center p-3 bg-purple-50 rounded-lg'>
                <div className='flex items-center justify-center gap-1 mb-1'>
                  <Activity className='h-4 w-4 text-purple-600' />
                  <span className='text-sm font-medium'>Renders</span>
                </div>
                <div className='text-lg font-bold text-purple-600'>
                  {renderCount}
                </div>
              </div>
            </div>

            <div className='text-sm text-muted-foreground'>
              <div>Session ID: {sessionData.sessionId}</div>
              <div>
                Screen: {sessionData.screenDimensions.width}×
                {sessionData.screenDimensions.height}
              </div>
            </div>
          </div>
        )}

        {/* Historical Stats */}
        {stats.totalSessions > 0 && (
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold'>Session Statistics</h3>

            <div className='grid grid-cols-3 gap-4'>
              <div className='text-center p-3 bg-muted/50 rounded-lg'>
                <div className='text-2xl font-bold'>{stats.totalSessions}</div>
                <div className='text-sm text-muted-foreground'>
                  Total Sessions
                </div>
              </div>

              <div className='text-center p-3 bg-muted/50 rounded-lg'>
                <div className='text-2xl font-bold'>
                  {formatTime(stats.averageTimeOnPage)}
                </div>
                <div className='text-sm text-muted-foreground'>Avg Time</div>
              </div>

              <div className='text-center p-3 bg-muted/50 rounded-lg'>
                <div className='text-2xl font-bold'>
                  {stats.performanceIssues}
                </div>
                <div className='text-sm text-muted-foreground'>
                  Performance Issues
                </div>
              </div>
            </div>

            {/* Device Distribution */}
            <div className='space-y-3'>
              <h4 className='font-medium'>Device Distribution</h4>

              <div className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <Smartphone className='h-4 w-4' />
                    <span>Mobile</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Progress
                      value={
                        (stats.deviceDistribution.mobile /
                          stats.totalSessions) *
                        100
                      }
                      className='w-24 h-2'
                    />
                    <span className='text-sm'>
                      {stats.deviceDistribution.mobile}
                    </span>
                  </div>
                </div>

                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <Tablet className='h-4 w-4' />
                    <span>Tablet</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Progress
                      value={
                        (stats.deviceDistribution.tablet /
                          stats.totalSessions) *
                        100
                      }
                      className='w-24 h-2'
                    />
                    <span className='text-sm'>
                      {stats.deviceDistribution.tablet}
                    </span>
                  </div>
                </div>

                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <Monitor className='h-4 w-4' />
                    <span>Desktop</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Progress
                      value={
                        (stats.deviceDistribution.desktop /
                          stats.totalSessions) *
                        100
                      }
                      className='w-24 h-2'
                    />
                    <span className='text-sm'>
                      {stats.deviceDistribution.desktop}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tracking Instructions */}
        <Alert>
          <Activity className='h-4 w-4' />
          <AlertDescription>
            <div className='space-y-2'>
              <strong>How to use:</strong>
              <ol className='list-decimal list-inside space-y-1 text-sm'>
                <li>
                  Click "Start Tracking" to begin monitoring responsive behavior
                </li>
                <li>
                  Resize your browser window to test different breakpoints
                </li>
                <li>Navigate through the application normally</li>
                <li>Click "Stop & Report" to generate analytics data</li>
              </ol>
            </div>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
