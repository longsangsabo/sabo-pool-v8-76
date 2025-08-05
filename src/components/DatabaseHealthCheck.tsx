import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface HealthCheck {
  name: string;
  status: 'healthy' | 'unhealthy' | 'warning';
  message: string;
  responseTime?: number;
}

export const DatabaseHealthCheck: React.FC = () => {
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const runHealthChecks = async () => {
    setIsChecking(true);
    const checks: HealthCheck[] = [];

    try {
      // Database connection check
      const startTime = Date.now();
      const { error: dbError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
      const responseTime = Date.now() - startTime;

      checks.push({
        name: 'Database Connection',
        status: dbError ? 'unhealthy' : 'healthy',
        message: dbError ? dbError.message : 'Connection successful',
        responseTime,
      });

      // Auth service check
      const { error: authError } = await supabase.auth.getSession();
      checks.push({
        name: 'Authentication Service',
        status: authError ? 'unhealthy' : 'healthy',
        message: authError ? authError.message : 'Auth service operational',
      });

      // Real-time check
      const channel = supabase.channel('health-check');
      const realtimeStatus = channel.state;
      checks.push({
        name: 'Real-time Service',
        status: realtimeStatus === 'joined' ? 'healthy' : 'warning',
        message: `Real-time status: ${realtimeStatus}`,
      });

      setHealthChecks(checks);
      setLastCheck(new Date());
    } catch (error) {
      console.error('Health check failed:', error);
      checks.push({
        name: 'System Health',
        status: 'unhealthy',
        message: 'Failed to perform health checks',
      });
      setHealthChecks(checks);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    runHealthChecks();
  }, []);

  const getStatusIcon = (status: HealthCheck['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className='w-5 h-5 text-green-500' />;
      case 'unhealthy':
        return <XCircle className='w-5 h-5 text-red-500' />;
      case 'warning':
        return <AlertCircle className='w-5 h-5 text-yellow-500' />;
    }
  };

  const getStatusBadge = (status: HealthCheck['status']) => {
    switch (status) {
      case 'healthy':
        return <Badge className='bg-green-100 text-green-800'>Healthy</Badge>;
      case 'unhealthy':
        return <Badge className='bg-red-100 text-red-800'>Unhealthy</Badge>;
      case 'warning':
        return <Badge className='bg-yellow-100 text-yellow-800'>Warning</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle>Database Health Check</CardTitle>
          <Button
            onClick={runHealthChecks}
            disabled={isChecking}
            size='sm'
            variant='outline'
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${isChecking ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
        </div>
        {lastCheck && (
          <p className='text-sm text-gray-600'>
            Last checked: {lastCheck.toLocaleString()}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {healthChecks.map((check, index) => (
            <div
              key={index}
              className='flex items-center justify-between p-3 border rounded-lg'
            >
              <div className='flex items-center space-x-3'>
                {getStatusIcon(check.status)}
                <div>
                  <h4 className='font-medium'>{check.name}</h4>
                  <p className='text-sm text-gray-600'>{check.message}</p>
                  {check.responseTime && (
                    <p className='text-xs text-gray-500'>
                      Response time: {check.responseTime}ms
                    </p>
                  )}
                </div>
              </div>
              {getStatusBadge(check.status)}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default DatabaseHealthCheck;
