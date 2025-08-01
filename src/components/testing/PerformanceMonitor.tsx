import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useOptimizedResponsive } from '@/hooks/useOptimizedResponsive';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  status: 'good' | 'warning' | 'error';
  threshold: number;
}

interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

export const PerformanceMonitor: React.FC = () => {
  const responsive = useOptimizedResponsive();
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [memoryInfo, setMemoryInfo] = useState<MemoryInfo | null>(null);
  const [layoutShift, setLayoutShift] = useState(0);
  const [renderCount, setRenderCount] = useState(0);
  const [isMonitoring, setIsMonitoring] = useState(false);

  // Performance thresholds
  const thresholds = {
    renderTime: 16, // 60fps = 16ms per frame
    memoryUsage: 50 * 1024 * 1024, // 50MB
    layoutShift: 0.1, // CLS threshold
    resizeDelay: 100, // Resize debounce delay
  };

  const measurePerformance = useCallback(() => {
    const start = performance.now();

    // Measure render time
    requestAnimationFrame(() => {
      const renderTime = performance.now() - start;

      // Get memory info if available
      const memory = (performance as any).memory;
      if (memory) {
        setMemoryInfo({
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
        });
      }

      // Update metrics
      const newMetrics: PerformanceMetric[] = [
        {
          name: 'Render Time',
          value: renderTime,
          unit: 'ms',
          status:
            renderTime < thresholds.renderTime
              ? 'good'
              : renderTime < 33
                ? 'warning'
                : 'error',
          threshold: thresholds.renderTime,
        },
        {
          name: 'Memory Usage',
          value: memory ? memory.usedJSHeapSize / (1024 * 1024) : 0,
          unit: 'MB',
          status: memory
            ? memory.usedJSHeapSize < thresholds.memoryUsage
              ? 'good'
              : memory.usedJSHeapSize < thresholds.memoryUsage * 2
                ? 'warning'
                : 'error'
            : 'good',
          threshold: thresholds.memoryUsage / (1024 * 1024),
        },
        {
          name: 'Render Count',
          value: renderCount,
          unit: 'renders',
          status:
            renderCount < 10 ? 'good' : renderCount < 50 ? 'warning' : 'error',
          threshold: 10,
        },
      ];

      setMetrics(newMetrics);
      setRenderCount(prev => prev + 1);
    });
  }, [renderCount]);

  // Measure Layout Shift
  useEffect(() => {
    let observer: PerformanceObserver | null = null;

    if ('PerformanceObserver' in window) {
      observer = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'layout-shift') {
            setLayoutShift(prev => prev + (entry as any).value);
          }
        }
      });

      try {
        observer.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        console.warn('Layout shift monitoring not supported');
      }
    }

    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, []);

  // Track responsive changes
  useEffect(() => {
    if (isMonitoring) {
      measurePerformance();
    }
  }, [responsive.breakpoint, measurePerformance, isMonitoring]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'default';
      case 'warning':
        return 'secondary';
      case 'error':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatBytes = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(2);
  };

  const resetMetrics = () => {
    setLayoutShift(0);
    setRenderCount(0);
    setMetrics([]);
  };

  const runStressTest = () => {
    setIsMonitoring(true);

    // Simulate rapid resize events
    let count = 0;
    const interval = setInterval(() => {
      window.dispatchEvent(new Event('resize'));
      count++;

      if (count >= 20) {
        clearInterval(interval);
        setIsMonitoring(false);
      }
    }, 50);
  };

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle>⚡ Performance Monitor</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          {/* Control Buttons */}
          <div className='flex gap-2'>
            <Button
              variant={isMonitoring ? 'destructive' : 'default'}
              onClick={() => setIsMonitoring(!isMonitoring)}
              size='sm'
            >
              {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
            </Button>
            <Button variant='outline' onClick={resetMetrics} size='sm'>
              Reset Metrics
            </Button>
            <Button variant='outline' onClick={runStressTest} size='sm'>
              Stress Test
            </Button>
          </div>

          {/* Performance Metrics */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            {metrics.map(metric => (
              <div key={metric.name} className='space-y-2'>
                <label className='text-sm font-medium'>{metric.name}</label>
                <div className='flex items-center gap-2'>
                  <span className='text-2xl font-bold'>
                    {metric.value.toFixed(2)}
                  </span>
                  <span className='text-sm text-muted-foreground'>
                    {metric.unit}
                  </span>
                  <Badge variant={getStatusColor(metric.status)}>
                    {metric.status}
                  </Badge>
                </div>
                <div className='text-xs text-muted-foreground'>
                  Threshold: {metric.threshold} {metric.unit}
                </div>
              </div>
            ))}
          </div>

          {/* Memory Information */}
          {memoryInfo && (
            <div className='space-y-2'>
              <h3 className='font-semibold'>Memory Usage</h3>
              <div className='grid grid-cols-3 gap-4 text-sm'>
                <div>
                  <label>Used Heap</label>
                  <div className='font-mono'>
                    {formatBytes(memoryInfo.usedJSHeapSize)} MB
                  </div>
                </div>
                <div>
                  <label>Total Heap</label>
                  <div className='font-mono'>
                    {formatBytes(memoryInfo.totalJSHeapSize)} MB
                  </div>
                </div>
                <div>
                  <label>Heap Limit</label>
                  <div className='font-mono'>
                    {formatBytes(memoryInfo.jsHeapSizeLimit)} MB
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Layout Shift */}
          <div className='space-y-2'>
            <h3 className='font-semibold'>Layout Stability</h3>
            <div className='flex items-center gap-2'>
              <span className='text-lg font-bold'>
                {layoutShift.toFixed(4)}
              </span>
              <Badge
                variant={
                  layoutShift < 0.1
                    ? 'default'
                    : layoutShift < 0.25
                      ? 'secondary'
                      : 'destructive'
                }
              >
                CLS Score
              </Badge>
            </div>
            <div className='text-xs text-muted-foreground'>
              Good: &lt; 0.1, Poor: ≥ 0.25
            </div>
          </div>

          {/* Performance Warnings */}
          {metrics.some(m => m.status === 'error') && (
            <Alert variant='destructive'>
              <AlertDescription>
                Performance issues detected! Check render times and memory
                usage.
              </AlertDescription>
            </Alert>
          )}

          {layoutShift > 0.25 && (
            <Alert variant='destructive'>
              <AlertDescription>
                High layout shift detected! This may cause poor user experience.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
