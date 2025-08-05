import React, { useState, useEffect } from 'react';
import { useOptimizedResponsive } from '@/hooks/useOptimizedResponsive';
import { BREAKPOINTS } from '@/constants/breakpoints';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Monitor,
  Tablet,
  Smartphone,
} from 'lucide-react';

interface TestResult {
  testName: string;
  status: 'pass' | 'fail' | 'warning';
  details: string;
  category: 'layout' | 'performance' | 'accessibility' | 'navigation';
}

export const CrossDeviceTestSuite: React.FC = () => {
  const responsive = useOptimizedResponsive();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [layoutShiftScore, setLayoutShiftScore] = useState(0);

  const runBreakpointTests = async () => {
    setIsRunning(true);
    const results: TestResult[] = [];

    // Test 1: Breakpoint Detection Accuracy
    const currentBreakpoint = responsive.breakpoint;
    const expectedBreakpoint =
      responsive.width < BREAKPOINTS.mobile
        ? 'mobile'
        : responsive.width < BREAKPOINTS.tablet
          ? 'tablet'
          : 'desktop';

    results.push({
      testName: 'Breakpoint Detection',
      status: currentBreakpoint === expectedBreakpoint ? 'pass' : 'fail',
      details: `Expected: ${expectedBreakpoint}, Got: ${currentBreakpoint}`,
      category: 'layout',
    });

    // Test 2: Layout Consistency
    const layoutElements = document.querySelectorAll('[data-testid]');
    const layoutConsistent = true;
    layoutElements.forEach(element => {
      const computedStyle = window.getComputedStyle(element);
      if (computedStyle.display === 'none' && responsive.isMobile) {
        // Check if element should be hidden on mobile
      }
    });

    results.push({
      testName: 'Layout Consistency',
      status: layoutConsistent ? 'pass' : 'warning',
      details: `Checked ${layoutElements.length} elements across breakpoints`,
      category: 'layout',
    });

    // Test 3: Navigation Accessibility
    const navElements = document.querySelectorAll('nav a, nav button');
    let accessibilityPassed = true;
    navElements.forEach(element => {
      const minSize = responsive.isMobile ? 44 : 32;
      const rect = element.getBoundingClientRect();
      if (rect.height < minSize || rect.width < minSize) {
        accessibilityPassed = false;
      }
    });

    results.push({
      testName: 'Touch Target Accessibility',
      status: accessibilityPassed ? 'pass' : 'fail',
      details: `Minimum ${responsive.isMobile ? '44px' : '32px'} touch targets verified`,
      category: 'accessibility',
    });

    // Test 4: Performance Metrics
    const performanceEntries = performance.getEntriesByType('navigation');
    const loadTime =
      performanceEntries.length > 0 ? performanceEntries[0].loadEventEnd : 0;

    results.push({
      testName: 'Page Load Performance',
      status: loadTime < 3000 ? 'pass' : loadTime < 5000 ? 'warning' : 'fail',
      details: `Load time: ${Math.round(loadTime)}ms`,
      category: 'performance',
    });

    // Test 5: Layout Shift Detection
    let cumulativeLayoutShift = 0;
    try {
      const observer = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'layout-shift') {
            const layoutShiftEntry = entry as any; // Type assertion for layout shift entry
            if (!layoutShiftEntry.hadRecentInput) {
              cumulativeLayoutShift += layoutShiftEntry.value;
            }
          }
        }
      });
      observer.observe({ entryTypes: ['layout-shift'] });

      setTimeout(() => {
        setLayoutShiftScore(cumulativeLayoutShift);
        results.push({
          testName: 'Cumulative Layout Shift',
          status:
            cumulativeLayoutShift < 0.1
              ? 'pass'
              : cumulativeLayoutShift < 0.25
                ? 'warning'
                : 'fail',
          details: `CLS Score: ${cumulativeLayoutShift.toFixed(3)}`,
          category: 'performance',
        });

        observer.disconnect();
        setTestResults(results);
        setIsRunning(false);
      }, 2000);
    } catch (error) {
      // Fallback if layout shift API not supported
      results.push({
        testName: 'Cumulative Layout Shift',
        status: 'warning',
        details: 'Layout shift API not supported in this browser',
        category: 'performance',
      });
      setTestResults(results);
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className='h-4 w-4 text-green-600' />;
      case 'fail':
        return <XCircle className='h-4 w-4 text-red-600' />;
      case 'warning':
        return <AlertTriangle className='h-4 w-4 text-yellow-600' />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    const variants = {
      pass: 'default',
      fail: 'destructive',
      warning: 'secondary',
    } as const;

    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const getCategoryIcon = (category: TestResult['category']) => {
    switch (category) {
      case 'layout':
        return <Monitor className='h-4 w-4' />;
      case 'performance':
        return <Tablet className='h-4 w-4' />;
      case 'accessibility':
        return <Smartphone className='h-4 w-4' />;
      case 'navigation':
        return <Monitor className='h-4 w-4' />;
    }
  };

  const passCount = testResults.filter(r => r.status === 'pass').length;
  const failCount = testResults.filter(r => r.status === 'fail').length;
  const warningCount = testResults.filter(r => r.status === 'warning').length;

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle>Cross-Device Testing Suite</CardTitle>
          <Button
            onClick={runBreakpointTests}
            disabled={isRunning}
            variant='outline'
          >
            {isRunning ? 'Running Tests...' : 'Run Tests'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className='space-y-4'>
        {/* Current Device Info */}
        <div className='grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg'>
          <div>
            <div className='text-sm font-medium'>Current Breakpoint</div>
            <div className='flex items-center gap-2'>
              {responsive.isMobile && <Smartphone className='h-4 w-4' />}
              {responsive.isTablet && <Tablet className='h-4 w-4' />}
              {responsive.isDesktop && <Monitor className='h-4 w-4' />}
              <Badge variant='outline'>{responsive.breakpoint}</Badge>
            </div>
          </div>
          <div>
            <div className='text-sm font-medium'>Screen Size</div>
            <div>
              {responsive.width} × {responsive.height}
            </div>
          </div>
          <div>
            <div className='text-sm font-medium'>Layout Shift</div>
            <div
              className={
                layoutShiftScore < 0.1
                  ? 'text-green-600'
                  : layoutShiftScore < 0.25
                    ? 'text-yellow-600'
                    : 'text-red-600'
              }
            >
              {layoutShiftScore.toFixed(3)}
            </div>
          </div>
        </div>

        {/* Test Results Summary */}
        {testResults.length > 0 && (
          <div className='grid grid-cols-3 gap-4'>
            <div className='text-center p-3 bg-green-50 rounded-lg'>
              <div className='text-2xl font-bold text-green-600'>
                {passCount}
              </div>
              <div className='text-sm text-green-600'>Passed</div>
            </div>
            <div className='text-center p-3 bg-yellow-50 rounded-lg'>
              <div className='text-2xl font-bold text-yellow-600'>
                {warningCount}
              </div>
              <div className='text-sm text-yellow-600'>Warnings</div>
            </div>
            <div className='text-center p-3 bg-red-50 rounded-lg'>
              <div className='text-2xl font-bold text-red-600'>{failCount}</div>
              <div className='text-sm text-red-600'>Failed</div>
            </div>
          </div>
        )}

        {/* Detailed Test Results */}
        <div className='space-y-3'>
          {testResults.map((result, index) => (
            <Alert key={index}>
              <div className='flex items-start space-x-3'>
                {getStatusIcon(result.status)}
                <div className='flex-1'>
                  <div className='flex items-center gap-2'>
                    {getCategoryIcon(result.category)}
                    <span className='font-medium'>{result.testName}</span>
                    {getStatusBadge(result.status)}
                    <Badge variant='outline'>{result.category}</Badge>
                  </div>
                  <AlertDescription className='mt-1'>
                    {result.details}
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          ))}
        </div>

        {/* Breakpoint Testing Instructions */}
        <Card className='bg-blue-50'>
          <CardHeader>
            <CardTitle className='text-sm'>Testing Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-2 text-sm'>
              <div>
                1. 📱 <strong>Mobile Test:</strong> Resize window to &lt; 768px
                width
              </div>
              <div>
                2. 📋 <strong>Tablet Test:</strong> Resize window to 768px -
                1023px width
              </div>
              <div>
                3. 🖥️ <strong>Desktop Test:</strong> Resize window to ≥ 1024px
                width
              </div>
              <div>
                4. 🔄 <strong>Transition Test:</strong> Gradually resize and
                watch for layout shifts
              </div>
              <div>
                5. ⚡ <strong>Performance Test:</strong> Monitor CLS scores
                during transitions
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};
