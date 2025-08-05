import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Activity, Clock, Database, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  status: 'good' | 'warning' | 'critical';
  threshold: number;
}

export const PerformanceProfiler: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [lastRun, setLastRun] = useState<Date | null>(null);

  const runPerformanceProfile = async () => {
    setIsRunning(true);
    const startTime = performance.now();
    const results: PerformanceMetric[] = [];

    try {
      // Test 1: Database Query Performance
      const dbStart = performance.now();
      await supabase.from('tournaments').select('*').limit(50);
      const dbTime = performance.now() - dbStart;

      results.push({
        name: 'Database Query Time',
        value: dbTime,
        unit: 'ms',
        status: dbTime < 100 ? 'good' : dbTime < 300 ? 'warning' : 'critical',
        threshold: 100,
      });

      // Test 2: Tournament Matches Query
      const matchStart = performance.now();
      await supabase
        .from('tournament_matches')
        .select('*')
        .eq('tournament_id', 'd528882d-bf18-4db7-b4d6-7b9f80cc7939');
      const matchTime = performance.now() - matchStart;

      results.push({
        name: 'Match Query Time',
        value: matchTime,
        unit: 'ms',
        status:
          matchTime < 150 ? 'good' : matchTime < 400 ? 'warning' : 'critical',
        threshold: 150,
      });

      // Test 3: Function Call Performance
      const funcStart = performance.now();
      await supabase.rpc('calculate_admin_dashboard_stats');
      const funcTime = performance.now() - funcStart;

      results.push({
        name: 'Function Execution',
        value: funcTime,
        unit: 'ms',
        status:
          funcTime < 200 ? 'good' : funcTime < 500 ? 'warning' : 'critical',
        threshold: 200,
      });

      // Test 4: Memory Usage (if available)
      if ('memory' in performance) {
        const memInfo = (performance as any).memory;
        const memUsage = memInfo.usedJSHeapSize / 1024 / 1024; // MB

        results.push({
          name: 'Memory Usage',
          value: memUsage,
          unit: 'MB',
          status:
            memUsage < 50 ? 'good' : memUsage < 100 ? 'warning' : 'critical',
          threshold: 50,
        });
      }

      // Test 5: Overall Response Time
      const totalTime = performance.now() - startTime;
      results.push({
        name: 'Total Test Duration',
        value: totalTime,
        unit: 'ms',
        status:
          totalTime < 1000 ? 'good' : totalTime < 2000 ? 'warning' : 'critical',
        threshold: 1000,
      });

      setMetrics(results);
      setLastRun(new Date());
    } catch (error) {
      console.error('Performance profiling failed:', error);
    }

    setIsRunning(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-green-600 bg-green-50';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      case 'critical':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <Zap className='h-4 w-4 text-green-600' />;
      case 'warning':
        return <Clock className='h-4 w-4 text-yellow-600' />;
      case 'critical':
        return <Activity className='h-4 w-4 text-red-600' />;
      default:
        return <Database className='h-4 w-4 text-gray-600' />;
    }
  };

  const overallScore =
    metrics.length > 0
      ? Math.round(
          (metrics.filter(m => m.status === 'good').length / metrics.length) *
            100
        )
      : 0;

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2'>
            <Activity className='h-5 w-5' />
            Performance Profiler
          </CardTitle>
          <Button
            onClick={runPerformanceProfile}
            disabled={isRunning}
            size='sm'
          >
            {isRunning ? 'Profiling...' : 'Run Profile'}
          </Button>
        </div>
        {lastRun && (
          <p className='text-sm text-muted-foreground'>
            Last run: {lastRun.toLocaleTimeString()}
          </p>
        )}
      </CardHeader>

      <CardContent className='space-y-4'>
        {/* Overall Score */}
        {metrics.length > 0 && (
          <div className='text-center p-4 border rounded-lg'>
            <div className='text-3xl font-bold mb-2'>{overallScore}%</div>
            <div className='text-sm text-muted-foreground'>
              Performance Score
            </div>
            <Progress value={overallScore} className='mt-2' />
          </div>
        )}

        {/* Metrics */}
        <div className='space-y-3'>
          {metrics.map((metric, index) => (
            <div
              key={index}
              className='flex items-center justify-between p-3 border rounded'
            >
              <div className='flex items-center gap-3'>
                {getStatusIcon(metric.status)}
                <div>
                  <div className='font-medium'>{metric.name}</div>
                  <div className='text-sm text-muted-foreground'>
                    Threshold: {metric.threshold}
                    {metric.unit}
                  </div>
                </div>
              </div>

              <div className='flex items-center gap-2'>
                <span className='font-mono text-lg'>
                  {metric.value.toFixed(1)}
                  {metric.unit}
                </span>
                <Badge className={getStatusColor(metric.status)}>
                  {metric.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {metrics.length === 0 && !isRunning && (
          <Alert>
            <AlertDescription>
              Click "Run Profile" to analyze system performance
            </AlertDescription>
          </Alert>
        )}

        {/* Performance Tips */}
        <Alert>
          <AlertDescription>
            <strong>Performance Guidelines:</strong>
            <br />
            • Database queries should complete under 100ms
            <br />
            • Function calls should execute within 200ms
            <br />
            • Memory usage should stay below 50MB
            <br />• Total operations should finish within 1 second
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
