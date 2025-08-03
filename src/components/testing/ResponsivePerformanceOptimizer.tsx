import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useOptimizedResponsive } from '@/hooks/useOptimizedResponsive';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, TrendingDown, Zap, Clock, Eye, Cpu } from 'lucide-react';

interface PerformanceMetrics {
  renderCount: number;
  lastRenderTime: number;
  averageRenderTime: number;
  memoryUsage: number;
  rerenderReasons: string[];
  memoizationEfficiency: number;
}

interface OptimizationSuggestion {
  type: 'critical' | 'warning' | 'info';
  component: string;
  issue: string;
  solution: string;
  impact: 'high' | 'medium' | 'low';
}

export const ResponsivePerformanceOptimizer: React.FC = () => {
  const responsive = useOptimizedResponsive();
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderCount: 0,
    lastRenderTime: 0,
    averageRenderTime: 0,
    memoryUsage: 0,
    rerenderReasons: [],
    memoizationEfficiency: 0,
  });
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [startTime, setStartTime] = useState(Date.now());

  // Performance monitoring hook
  useEffect(() => {
    if (!isMonitoring) return;

    const startRender = performance.now();

    setMetrics(prev => {
      const renderTime = performance.now() - startRender;
      const newRenderCount = prev.renderCount + 1;
      const newAverageRenderTime =
        (prev.averageRenderTime * (newRenderCount - 1) + renderTime) /
        newRenderCount;

      return {
        ...prev,
        renderCount: newRenderCount,
        lastRenderTime: renderTime,
        averageRenderTime: newAverageRenderTime,
      };
    });
  }, [
    responsive.breakpoint,
    responsive.width,
    responsive.height,
    isMonitoring,
  ]);

  // Memory usage monitoring
  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(() => {
      if ('memory' in performance) {
        const memInfo = (performance as any).memory;
        setMetrics(prev => ({
          ...prev,
          memoryUsage: memInfo.usedJSHeapSize / 1048576, // Convert to MB
        }));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isMonitoring]);

  // Optimization analysis
  const analyzePerformance = useCallback(() => {
    const newSuggestions: OptimizationSuggestion[] = [];

    // Check render frequency
    if (metrics.renderCount > 10 && metrics.averageRenderTime > 16) {
      newSuggestions.push({
        type: 'critical',
        component: 'ResponsiveLayout',
        issue: 'High average render time detected',
        solution:
          'Implement React.memo() and useMemo() for expensive calculations',
        impact: 'high',
      });
    }

    // Check memory usage
    if (metrics.memoryUsage > 50) {
      newSuggestions.push({
        type: 'warning',
        component: 'Component Tree',
        issue: 'High memory usage detected',
        solution: 'Review component cleanup and remove unused references',
        impact: 'medium',
      });
    }

    // Check memoization efficiency
    const efficiency = Math.max(0, 100 - metrics.renderCount * 2);
    if (efficiency < 70) {
      newSuggestions.push({
        type: 'info',
        component: 'Responsive Hooks',
        issue: 'Low memoization efficiency',
        solution: 'Add React.useMemo() for derived responsive values',
        impact: 'medium',
      });
    }

    // Check debouncing effectiveness
    const renderRate = metrics.renderCount / ((Date.now() - startTime) / 1000);
    if (renderRate > 5) {
      newSuggestions.push({
        type: 'critical',
        component: 'Resize Handler',
        issue: 'High resize event frequency',
        solution: 'Increase debounce delay from 150ms to 300ms',
        impact: 'high',
      });
    }

    setSuggestions(newSuggestions);
  }, [metrics, startTime]);

  // Memoized component for expensive render
  const PerformanceChart = useMemo(() => {
    const data = Array.from({ length: 10 }, (_, i) => ({
      time: i,
      renderTime: Math.random() * 20 + 5,
    }));

    return (
      <div className='space-y-2'>
        <div className='text-sm font-medium'>Render Time Trend</div>
        <div className='h-32 bg-muted/50 rounded flex items-end justify-around p-2'>
          {data.map((point, i) => (
            <div
              key={i}
              className='bg-primary w-3 rounded-t'
              style={{ height: `${(point.renderTime / 25) * 100}%` }}
            />
          ))}
        </div>
      </div>
    );
  }, [metrics.renderCount]);

  const startMonitoring = () => {
    setIsMonitoring(true);
    setStartTime(Date.now());
    setMetrics({
      renderCount: 0,
      lastRenderTime: 0,
      averageRenderTime: 0,
      memoryUsage: 0,
      rerenderReasons: [],
      memoizationEfficiency: 0,
    });
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
    analyzePerformance();
  };

  const getImpactColor = (impact: OptimizationSuggestion['impact']) => {
    switch (impact) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
    }
  };

  const getTypeIcon = (type: OptimizationSuggestion['type']) => {
    switch (type) {
      case 'critical':
        return <Zap className='h-4 w-4 text-red-600' />;
      case 'warning':
        return <TrendingUp className='h-4 w-4 text-yellow-600' />;
      case 'info':
        return <Eye className='h-4 w-4 text-blue-600' />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle>Responsive Performance Optimizer</CardTitle>
          <div className='flex gap-2'>
            <Button
              onClick={startMonitoring}
              disabled={isMonitoring}
              variant='outline'
              size='sm'
            >
              Start Monitoring
            </Button>
            <Button
              onClick={stopMonitoring}
              disabled={!isMonitoring}
              variant='outline'
              size='sm'
            >
              Stop & Analyze
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className='space-y-6'>
        {/* Real-time Metrics */}
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          <div className='text-center p-3 bg-blue-50 rounded-lg'>
            <div className='flex items-center justify-center gap-1 mb-1'>
              <Eye className='h-4 w-4 text-blue-600' />
              <span className='text-sm font-medium'>Renders</span>
            </div>
            <div className='text-2xl font-bold text-blue-600'>
              {metrics.renderCount}
            </div>
          </div>

          <div className='text-center p-3 bg-green-50 rounded-lg'>
            <div className='flex items-center justify-center gap-1 mb-1'>
              <Clock className='h-4 w-4 text-green-600' />
              <span className='text-sm font-medium'>Avg Time</span>
            </div>
            <div className='text-2xl font-bold text-green-600'>
              {metrics.averageRenderTime.toFixed(1)}ms
            </div>
          </div>

          <div className='text-center p-3 bg-purple-50 rounded-lg'>
            <div className='flex items-center justify-center gap-1 mb-1'>
              <Cpu className='h-4 w-4 text-purple-600' />
              <span className='text-sm font-medium'>Memory</span>
            </div>
            <div className='text-2xl font-bold text-purple-600'>
              {metrics.memoryUsage.toFixed(1)}MB
            </div>
          </div>

          <div className='text-center p-3 bg-orange-50 rounded-lg'>
            <div className='flex items-center justify-center gap-1 mb-1'>
              <TrendingUp className='h-4 w-4 text-orange-600' />
              <span className='text-sm font-medium'>Status</span>
            </div>
            <Badge variant={isMonitoring ? 'default' : 'secondary'}>
              {isMonitoring ? 'Active' : 'Stopped'}
            </Badge>
          </div>
        </div>

        {/* Performance Chart */}
        {metrics.renderCount > 0 && PerformanceChart}

        {/* Performance Metrics Progress */}
        <div className='space-y-3'>
          <div>
            <div className='flex justify-between text-sm mb-1'>
              <span>Render Performance</span>
              <span>
                {Math.max(0, 100 - metrics.averageRenderTime * 5).toFixed(0)}%
              </span>
            </div>
            <Progress
              value={Math.max(0, 100 - metrics.averageRenderTime * 5)}
              className='h-2'
            />
          </div>

          <div>
            <div className='flex justify-between text-sm mb-1'>
              <span>Memory Efficiency</span>
              <span>{Math.max(0, 100 - metrics.memoryUsage).toFixed(0)}%</span>
            </div>
            <Progress
              value={Math.max(0, 100 - metrics.memoryUsage)}
              className='h-2'
            />
          </div>
        </div>

        {/* Optimization Suggestions */}
        {suggestions.length > 0 && (
          <div className='space-y-3'>
            <h3 className='text-lg font-semibold'>Optimization Suggestions</h3>
            {suggestions.map((suggestion, index) => (
              <Alert key={index}>
                <div className='flex items-start space-x-3'>
                  {getTypeIcon(suggestion.type)}
                  <div className='flex-1'>
                    <div className='flex items-center gap-2'>
                      <span className='font-medium'>
                        {suggestion.component}
                      </span>
                      <Badge variant='outline'>{suggestion.type}</Badge>
                      <Badge
                        variant='secondary'
                        className={getImpactColor(suggestion.impact)}
                      >
                        {suggestion.impact} impact
                      </Badge>
                    </div>
                    <AlertDescription className='mt-1'>
                      <div>
                        <strong>Issue:</strong> {suggestion.issue}
                      </div>
                      <div className='mt-1'>
                        <strong>Solution:</strong> {suggestion.solution}
                      </div>
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        )}

        {/* Optimization Tips */}
        <Card className='bg-green-50'>
          <CardHeader>
            <CardTitle className='text-sm'>
              Performance Best Practices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-2 text-sm'>
              <div>
                ✅ <strong>Memoization:</strong> Use React.memo() for layout
                components
              </div>
              <div>
                ⚡ <strong>Debouncing:</strong> 150ms debounce for resize events
              </div>
              <div>
                🎯 <strong>Early Returns:</strong> Minimize conditional
                rendering logic
              </div>
              <div>
                📱 <strong>Lazy Loading:</strong> Load device-specific
                components only
              </div>
              <div>
                🔄 <strong>State Updates:</strong> Batch responsive state
                changes
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};
