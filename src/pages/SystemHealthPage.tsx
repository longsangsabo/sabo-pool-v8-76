import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Database,
  RefreshCw,
  Server,
  Wifi,
  Shield,
  Activity,
  Clock,
} from 'lucide-react';
import DatabaseHealthCheck from '@/components/DatabaseHealthCheck';
import {
  runDatabaseConnectionTest,
  DatabaseConnectionReport,
} from '@/utils/databaseConnectionTest';
import {
  checkSupabaseConnection,
  checkDatabasePermissions,
  validateEnvironmentVariables,
} from '@/utils/supabaseHealth';

interface SystemStatus {
  database: boolean;
  authentication: boolean;
  storage: boolean;
  realtime: boolean;
  functions: boolean;
  environment: boolean;
}

interface PerformanceMetrics {
  responseTime: number;
  uptime: number;
  errorRate: number;
  activeConnections: number;
}

const SystemHealthPage: React.FC = () => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    database: false,
    authentication: false,
    storage: false,
    realtime: false,
    functions: false,
    environment: false,
  });
  const [performance, setPerformance] = useState<PerformanceMetrics>({
    responseTime: 0,
    uptime: 0,
    errorRate: 0,
    activeConnections: 0,
  });
  const [loading, setLoading] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [databaseReport, setDatabaseReport] =
    useState<DatabaseConnectionReport | null>(null);

  const runSystemCheck = async () => {
    setLoading(true);
    const startTime = Date.now();

    try {
      // Environment check
      const envCheck = validateEnvironmentVariables();

      // Database connection check
      const dbCheck = await checkSupabaseConnection();

      // Permissions check
      await checkDatabasePermissions();

      // Comprehensive database test
      const dbReport = await runDatabaseConnectionTest();
      setDatabaseReport(dbReport);

      // Calculate performance metrics
      const responseTime = Date.now() - startTime;
      const errorRate =
        (dbReport.tests.filter(t => !t.success).length /
          dbReport.tests.length) *
        100;

      setSystemStatus({
        database: dbCheck.success,
        authentication:
          dbReport.tests.find(t => t.test === 'Authentication')?.success ||
          false,
        storage:
          dbReport.tests.find(t => t.test === 'File Storage')?.success || false,
        realtime:
          dbReport.tests.find(t => t.test === 'Real-time Subscription')
            ?.success || false,
        functions:
          dbReport.tests.find(t => t.test === 'Database Functions')?.success ||
          false,
        environment: envCheck.success,
      });

      setPerformance({
        responseTime,
        uptime: 99.9, // Mock uptime
        errorRate,
        activeConnections: dbReport.tests.length,
      });

      setLastCheck(new Date());
    } catch (error) {
      console.error('System check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSystemCheck();
  }, []);

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className='h-4 w-4 text-green-500' />
    ) : (
      <XCircle className='h-4 w-4 text-red-500' />
    );
  };

  const getStatusBadge = (success: boolean) => {
    return success ? (
      <Badge variant='default' className='bg-green-100 text-green-800'>
        Healthy
      </Badge>
    ) : (
      <Badge variant='destructive'>Error</Badge>
    );
  };

  const getPerformanceColor = (value: number, threshold: number) => {
    return value <= threshold ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className='container mx-auto p-6 space-y-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-3xl font-bold'>System Health Dashboard</h1>
        <Button onClick={runSystemCheck} disabled={loading}>
          <RefreshCw
            className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`}
          />
          Refresh Status
        </Button>
      </div>

      {lastCheck && (
        <div className='text-sm text-gray-600'>
          Last checked: {lastCheck.toLocaleString()}
        </div>
      )}

      <Tabs defaultValue='overview' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='overview'>Overview</TabsTrigger>
          <TabsTrigger value='database'>Database</TabsTrigger>
          <TabsTrigger value='performance'>Performance</TabsTrigger>
          <TabsTrigger value='details'>Detailed Tests</TabsTrigger>
        </TabsList>

        <TabsContent value='overview' className='space-y-4'>
          {/* System Status Overview */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Database</CardTitle>
                <Database className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    {getStatusIcon(systemStatus.database)}
                    <span>Connection</span>
                  </div>
                  {getStatusBadge(systemStatus.database)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Authentication
                </CardTitle>
                <Shield className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    {getStatusIcon(systemStatus.authentication)}
                    <span>Auth Service</span>
                  </div>
                  {getStatusBadge(systemStatus.authentication)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Storage</CardTitle>
                <Server className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    {getStatusIcon(systemStatus.storage)}
                    <span>File Storage</span>
                  </div>
                  {getStatusBadge(systemStatus.storage)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Real-time</CardTitle>
                <Activity className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    {getStatusIcon(systemStatus.realtime)}
                    <span>WebSocket</span>
                  </div>
                  {getStatusBadge(systemStatus.realtime)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Functions</CardTitle>
                <Wifi className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    {getStatusIcon(systemStatus.functions)}
                    <span>Edge Functions</span>
                  </div>
                  {getStatusBadge(systemStatus.functions)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Environment
                </CardTitle>
                <AlertTriangle className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    {getStatusIcon(systemStatus.environment)}
                    <span>Config</span>
                  </div>
                  {getStatusBadge(systemStatus.environment)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Overall System Status */}
          <Card>
            <CardHeader>
              <CardTitle>Overall System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='flex items-center gap-4'>
                {Object.values(systemStatus).every(status => status) ? (
                  <Alert className='border-green-200 bg-green-50'>
                    <CheckCircle className='h-4 w-4 text-green-600' />
                    <AlertDescription className='text-green-800'>
                      All systems are operational and healthy.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert variant='destructive'>
                    <XCircle className='h-4 w-4' />
                    <AlertDescription>
                      Some systems are experiencing issues. Check the detailed
                      reports for more information.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='database' className='space-y-4'>
          <DatabaseHealthCheck />
        </TabsContent>

        <TabsContent value='performance' className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Response Time
                </CardTitle>
                <Clock className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${getPerformanceColor(performance.responseTime, 1000)}`}
                >
                  {performance.responseTime}ms
                </div>
                <p className='text-xs text-muted-foreground'>
                  Average response time
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Uptime</CardTitle>
                <Activity className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold text-green-600'>
                  {performance.uptime}%
                </div>
                <p className='text-xs text-muted-foreground'>
                  System availability
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Error Rate
                </CardTitle>
                <AlertTriangle className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${getPerformanceColor(performance.errorRate, 5)}`}
                >
                  {performance.errorRate.toFixed(1)}%
                </div>
                <p className='text-xs text-muted-foreground'>Failed requests</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Active Tests
                </CardTitle>
                <Database className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold text-blue-600'>
                  {performance.activeConnections}
                </div>
                <p className='text-xs text-muted-foreground'>
                  Database connections
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value='details' className='space-y-4'>
          {databaseReport && (
            <Card>
              <CardHeader>
                <CardTitle>Detailed Test Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-2'>
                  {databaseReport.tests.map((test, index) => (
                    <div
                      key={index}
                      className='flex items-center justify-between p-3 border rounded'
                    >
                      <div className='flex items-center gap-2'>
                        {getStatusIcon(test.success)}
                        <span className='text-sm'>{test.test}</span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <span className='text-xs text-gray-500'>
                          {test.duration}ms
                        </span>
                        {getStatusBadge(test.success)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className='mt-4 p-4 bg-gray-50 rounded-lg'>
                  <h4 className='font-medium mb-2'>Test Summary</h4>
                  <div className='grid grid-cols-2 gap-4 text-sm'>
                    <div>Total Tests: {databaseReport.summary.total}</div>
                    <div>Passed: {databaseReport.summary.passed}</div>
                    <div>Failed: {databaseReport.summary.failed}</div>
                    <div>
                      Avg Response: {databaseReport.summary.averageResponseTime}
                      ms
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SystemHealthPage;
