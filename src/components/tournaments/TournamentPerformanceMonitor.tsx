import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Zap, Clock, AlertTriangle } from 'lucide-react';

interface TournamentPerformanceMonitorProps {
  tournamentId: string;
  onPerformanceIssue?: (issue: string) => void;
}

interface PerformanceMetrics {
  renderTime: number;
  updateCount: number;
  lastUpdate: Date;
  errors: string[];
  warnings: string[];
}

export const TournamentPerformanceMonitor: React.FC<
  TournamentPerformanceMonitorProps
> = ({ tournamentId, onPerformanceIssue }) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    updateCount: 0,
    lastUpdate: new Date(),
    errors: [],
    warnings: [],
  });

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const startTime = performance.now();

    // Monitor for performance issues
    const checkPerformance = () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      setMetrics(prev => ({
        ...prev,
        renderTime,
        updateCount: prev.updateCount + 1,
        lastUpdate: new Date(),
      }));

      // Flag slow renders
      if (renderTime > 100) {
        const warning = `Slow render: ${renderTime.toFixed(2)}ms`;
        setMetrics(prev => ({
          ...prev,
          warnings: [...prev.warnings.slice(-4), warning],
        }));
        onPerformanceIssue?.(warning);
      }
    };

    // Check performance after component updates
    const timeoutId = setTimeout(checkPerformance, 0);

    return () => clearTimeout(timeoutId);
  }, [onPerformanceIssue]);

  // Monitor console errors related to tournament
  useEffect(() => {
    const originalError = console.error;
    const originalWarn = console.warn;

    console.error = (...args) => {
      const message = args.join(' ');
      if (message.includes(tournamentId) || message.includes('tournament')) {
        setMetrics(prev => ({
          ...prev,
          errors: [...prev.errors.slice(-2), message],
        }));
      }
      originalError(...args);
    };

    console.warn = (...args) => {
      const message = args.join(' ');
      if (message.includes(tournamentId) || message.includes('tournament')) {
        setMetrics(prev => ({
          ...prev,
          warnings: [...prev.warnings.slice(-4), message],
        }));
      }
      originalWarn(...args);
    };

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, [tournamentId]);

  // Show/hide based on development mode or admin
  useEffect(() => {
    setIsVisible(
      process.env.NODE_ENV === 'development' ||
        window.location.search.includes('debug=true')
    );
  }, []);

  if (!isVisible) return null;

  const getPerformanceStatus = () => {
    if (metrics.errors.length > 0)
      return { status: 'error', color: 'destructive' };
    if (metrics.warnings.length > 0)
      return { status: 'warning', color: 'secondary' };
    if (metrics.renderTime > 50) return { status: 'slow', color: 'secondary' };
    return { status: 'good', color: 'default' };
  };

  const { status, color } = getPerformanceStatus();

  return (
    <Card className='fixed bottom-4 right-4 w-80 shadow-lg border-2 opacity-90 hover:opacity-100 transition-opacity'>
      <CardHeader className='pb-2'>
        <CardTitle className='text-sm flex items-center gap-2'>
          <Activity className='w-4 h-4' />
          Performance Monitor
          <Badge variant={color as any} className='text-xs'>
            {status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-2 text-xs'>
        <div className='grid grid-cols-2 gap-2'>
          <div className='flex items-center gap-1'>
            <Zap className='w-3 h-3' />
            <span>Render: {metrics.renderTime.toFixed(1)}ms</span>
          </div>
          <div className='flex items-center gap-1'>
            <Clock className='w-3 h-3' />
            <span>Updates: {metrics.updateCount}</span>
          </div>
        </div>

        <div className='text-xs text-muted-foreground'>
          Last: {metrics.lastUpdate.toLocaleTimeString()}
        </div>

        {metrics.errors.length > 0 && (
          <div className='space-y-1'>
            <div className='flex items-center gap-1 text-destructive'>
              <AlertTriangle className='w-3 h-3' />
              <span className='font-medium'>Errors:</span>
            </div>
            {metrics.errors.map((error, i) => (
              <div
                key={i}
                className='text-xs text-destructive opacity-80 truncate'
              >
                {error}
              </div>
            ))}
          </div>
        )}

        {metrics.warnings.length > 0 && (
          <div className='space-y-1'>
            <div className='flex items-center gap-1 text-orange-600'>
              <AlertTriangle className='w-3 h-3' />
              <span className='font-medium'>Warnings:</span>
            </div>
            {metrics.warnings.slice(-2).map((warning, i) => (
              <div
                key={i}
                className='text-xs text-orange-600 opacity-80 truncate'
              >
                {warning}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
