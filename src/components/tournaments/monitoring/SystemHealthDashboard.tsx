import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  RefreshCw,
  TrendingUp,
  Zap,
  Shield,
  Target,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface MonitoringStats {
  health_status: string;
  problem_tournaments: number;
  success_rate: number;
  total_logs_24h: number;
  triggers_active: number;
  last_check: string;
  issues: string[];
}

interface SystemHealthDashboardProps {
  className?: string;
}

export const SystemHealthDashboard: React.FC<SystemHealthDashboardProps> = ({
  className,
}) => {
  const [stats, setStats] = useState<MonitoringStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRunningAction, setIsRunningAction] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchSystemHealth = async () => {
    try {
      const { data, error } = await supabase.functions.invoke(
        'tournament-automation-monitor',
        {
          body: { action: 'health_check' },
        }
      );

      if (error) throw error;

      setStats(data.result);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('❌ Error fetching system health:', error);
      toast.error('Failed to fetch system health data');
    } finally {
      setLoading(false);
    }
  };

  const runAutoRecovery = async () => {
    setIsRunningAction(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        'tournament-automation-monitor',
        {
          body: { action: 'auto_recovery' },
        }
      );

      if (error) throw error;

      toast.success(
        `✅ Auto-recovery completed: ${data.result.recovered_tournaments} tournaments fixed`
      );
      await fetchSystemHealth(); // Refresh stats
    } catch (error) {
      console.error('❌ Error running auto-recovery:', error);
      toast.error('Failed to run auto-recovery');
    } finally {
      setIsRunningAction(false);
    }
  };

  useEffect(() => {
    fetchSystemHealth();

    // Set up periodic refresh
    const interval = setInterval(fetchSystemHealth, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'critical':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getHealthBadgeColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className='flex items-center justify-center p-8'>
          <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-primary'></div>
          <span className='ml-2'>Loading system health...</span>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card className={className}>
        <CardContent className='flex items-center justify-center p-8'>
          <AlertTriangle className='w-6 h-6 text-red-500 mr-2' />
          <span>Unable to load system health data</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <Shield className='w-6 h-6 text-accent-blue' />
          <h2 className='text-xl font-bold'>System Health Dashboard</h2>
          <Badge className={getHealthBadgeColor(stats.health_status)}>
            {stats.health_status.toUpperCase()}
          </Badge>
        </div>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={fetchSystemHealth}
            disabled={isRunningAction}
          >
            <RefreshCw
              className={cn('w-4 h-4 mr-1', isRunningAction && 'animate-spin')}
            />
            Refresh
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={runAutoRecovery}
            disabled={isRunningAction}
            className='text-orange-600 border-orange-200 hover:bg-orange-50'
          >
            <Target className='w-4 h-4 mr-1' />
            Auto Recovery
          </Button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <Card className='border-2 border-accent-blue/20'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-muted-foreground'>Success Rate</p>
                <p className='text-2xl font-bold text-accent-blue'>
                  {stats.success_rate}%
                </p>
              </div>
              <TrendingUp className='w-8 h-8 text-accent-blue' />
            </div>
            <Progress value={stats.success_rate} className='mt-2 h-1' />
          </CardContent>
        </Card>

        <Card
          className={cn(
            'border-2',
            stats.problem_tournaments > 0
              ? 'border-red-200'
              : 'border-green-200'
          )}
        >
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-muted-foreground'>
                  Problem Tournaments
                </p>
                <p
                  className={cn(
                    'text-2xl font-bold',
                    stats.problem_tournaments > 0
                      ? 'text-red-600'
                      : 'text-green-600'
                  )}
                >
                  {stats.problem_tournaments}
                </p>
              </div>
              {stats.problem_tournaments > 0 ? (
                <AlertTriangle className='w-8 h-8 text-red-500' />
              ) : (
                <CheckCircle className='w-8 h-8 text-green-500' />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className='border-2 border-purple-200'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-muted-foreground'>Active Triggers</p>
                <p className='text-2xl font-bold text-purple-600'>
                  {stats.triggers_active}
                </p>
              </div>
              <Database className='w-8 h-8 text-purple-500' />
            </div>
          </CardContent>
        </Card>

        <Card className='border-2 border-blue-200'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-muted-foreground'>24h Operations</p>
                <p className='text-2xl font-bold text-blue-600'>
                  {stats.total_logs_24h}
                </p>
              </div>
              <Activity className='w-8 h-8 text-blue-500' />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Issues Alert */}
      {stats.issues && stats.issues.length > 0 && (
        <Alert className='border-red-200 bg-red-50'>
          <AlertTriangle className='h-4 w-4' />
          <AlertDescription>
            <div className='font-medium mb-2'>System Issues Detected:</div>
            <ul className='list-disc list-inside space-y-1 text-sm'>
              {stats.issues.map((issue, index) => (
                <li key={index}>{issue}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Status Timeline */}
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='flex items-center gap-2 text-base'>
            <Clock className='w-4 h-4' />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-3'>
            <div className='flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg'>
              <div className='flex items-center gap-2'>
                <CheckCircle className='w-4 h-4 text-green-500' />
                <span className='font-medium'>Tournament Automation</span>
              </div>
              <Badge className='bg-green-100 text-green-800 border-green-200'>
                Active
              </Badge>
            </div>

            <div className='flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg'>
              <div className='flex items-center gap-2'>
                <Zap className='w-4 h-4 text-blue-500' />
                <span className='font-medium'>Real-time Updates</span>
              </div>
              <Badge className='bg-blue-100 text-blue-800 border-blue-200'>
                Online
              </Badge>
            </div>

            <div className='flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg'>
              <div className='flex items-center gap-2'>
                <Database className='w-4 h-4 text-purple-500' />
                <span className='font-medium'>Database Triggers</span>
              </div>
              <Badge className='bg-purple-100 text-purple-800 border-purple-200'>
                {stats.triggers_active} Active
              </Badge>
            </div>
          </div>

          <div className='mt-4 pt-3 border-t text-xs text-muted-foreground'>
            <div className='flex justify-between'>
              <span>
                Last health check:{' '}
                {new Date(stats.last_check).toLocaleTimeString()}
              </span>
              <span>Last update: {lastUpdate.toLocaleTimeString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
