import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, Activity } from 'lucide-react';

interface HealthMetric {
  name: string;
  status: 'healthy' | 'warning' | 'error';
  value: string;
  description: string;
}

const SystemHealthSummary = () => {
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSystemHealth = async () => {
      const healthMetrics: HealthMetric[] = [];

      // Check JavaScript errors
      const jsErrorCount = (window as any).__jsErrors?.length || 0;
      healthMetrics.push({
        name: 'JavaScript Errors',
        status:
          jsErrorCount === 0
            ? 'healthy'
            : jsErrorCount < 5
              ? 'warning'
              : 'error',
        value: jsErrorCount.toString(),
        description: 'Number of JavaScript errors detected',
      });

      // Check network connectivity
      const isOnline = navigator.onLine;
      healthMetrics.push({
        name: 'Network Status',
        status: isOnline ? 'healthy' : 'error',
        value: isOnline ? 'Online' : 'Offline',
        description: 'Internet connectivity status',
      });

      // Check local storage
      try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        healthMetrics.push({
          name: 'Local Storage',
          status: 'healthy',
          value: 'Available',
          description: 'Browser storage functionality',
        });
      } catch {
        healthMetrics.push({
          name: 'Local Storage',
          status: 'error',
          value: 'Unavailable',
          description: 'Browser storage functionality',
        });
      }

      // Check DOM status
      const domReady = document.readyState === 'complete';
      healthMetrics.push({
        name: 'DOM Status',
        status: domReady ? 'healthy' : 'warning',
        value: document.readyState,
        description: 'Document loading status',
      });

      // Check for React
      const hasReact =
        !!(window as any).React || document.querySelector('[data-reactroot]');
      healthMetrics.push({
        name: 'React Framework',
        status: hasReact ? 'healthy' : 'error',
        value: hasReact ? 'Loaded' : 'Missing',
        description: 'React framework status',
      });

      setMetrics(healthMetrics);
      setLoading(false);
    };

    checkSystemHealth();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className='h-4 w-4 text-green-500' />;
      case 'warning':
        return <AlertTriangle className='h-4 w-4 text-yellow-500' />;
      case 'error':
        return <XCircle className='h-4 w-4 text-red-500' />;
      default:
        return <Activity className='h-4 w-4 text-gray-500' />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className='p-4'>
          <div className='flex items-center gap-2'>
            <Activity className='h-4 w-4 animate-spin' />
            <span>Checking system health...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-sm'>Quick Health Check</CardTitle>
      </CardHeader>
      <CardContent className='space-y-2'>
        {metrics.map((metric, index) => (
          <div key={index} className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              {getStatusIcon(metric.status)}
              <span className='text-sm'>{metric.name}</span>
            </div>
            <Badge
              variant={metric.status === 'healthy' ? 'default' : 'destructive'}
            >
              {metric.value}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default SystemHealthSummary;
