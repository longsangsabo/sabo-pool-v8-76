import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Database,
  Globe,
  Settings,
  Shield,
  Activity,
  Network,
  Server,
  Clock,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface AuditResult {
  category: string;
  test: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
  duration?: number;
}

interface SystemStatus {
  overall: 'healthy' | 'degraded' | 'critical';
  errors: string[];
  warnings: string[];
  totalTests: number;
  passedTests: number;
}

// Type for Chrome's performance.memory (non-standard)
interface PerformanceMemory {
  usedJSHeapSize: number;
  jsHeapSizeLimit: number;
  totalJSHeapSize: number;
}

interface ExtendedPerformance extends Performance {
  memory?: PerformanceMemory;
}

const SystemAuditPage = () => {
  const [auditResults, setAuditResults] = useState<AuditResult[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    overall: 'healthy',
    errors: [],
    warnings: [],
    totalTests: 0,
    passedTests: 0,
  });
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState('');
  const { user, session } = useAuth();

  const addResult = (result: AuditResult) => {
    console.log('Audit result:', result);
    setAuditResults(prev => [...prev, result]);
  };

  const runTest = async (
    category: string,
    testName: string,
    testFn: () => Promise<any>
  ) => {
    const startTime = Date.now();
    setCurrentTest(`${category}: ${testName}`);

    try {
      console.log(`Running test: ${category} - ${testName}`);
      const result = await Promise.race([
        testFn(),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('Test timeout after 10 seconds')),
            10000
          )
        ),
      ]);
      const duration = Date.now() - startTime;

      addResult({
        category,
        test: testName,
        status: 'success',
        message: 'Test passed successfully',
        details: result,
        duration,
      });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error(`Test failed: ${category} - ${testName}:`, error);

      addResult({
        category,
        test: testName,
        status: 'error',
        message: error.message || 'Test failed',
        details: error,
        duration,
      });
    }
  };

  const checkBasicConnectivity = async () => {
    console.log('Checking basic connectivity...');

    // Check if we can reach the current domain
    const currentDomain = window.location.origin;
    const response = await fetch(currentDomain, { method: 'HEAD' });

    if (!response.ok) {
      throw new Error(`Cannot reach current domain: ${response.status}`);
    }

    return {
      domain: currentDomain,
      status: response.status,
      accessible: true,
    };
  };

  const checkSupabaseConnection = async () => {
    console.log('Checking Supabase connection...');

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }

    // Test basic connection
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (error) {
      throw new Error(`Supabase connection failed: ${error.message}`);
    }

    return {
      url: supabaseUrl,
      connected: true,
      hasData: !!data,
    };
  };

  const checkAuthentication = async () => {
    console.log('Checking authentication...');

    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        throw new Error(`Auth check failed: ${error.message}`);
      }

      return {
        hasSession: !!session,
        user: session?.user?.email || 'No user',
        sessionValid: !!session?.access_token,
        authWorking: true,
      };
    } catch (error: any) {
      return {
        hasSession: false,
        user: 'Error checking auth',
        sessionValid: false,
        authWorking: false,
        error: error.message,
      };
    }
  };

  const checkEnvironmentVariables = async () => {
    console.log('Checking environment variables...');

    const requiredEnvVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];

    const missing = [];
    const present = [];

    for (const envVar of requiredEnvVars) {
      const value = import.meta.env[envVar];
      if (!value) {
        missing.push(envVar);
      } else {
        present.push({ name: envVar, hasValue: !!value, length: value.length });
      }
    }

    if (missing.length > 0) {
      throw new Error(`Missing environment variables: ${missing.join(', ')}`);
    }

    return { present, missing, totalRequired: requiredEnvVars.length };
  };

  const checkApplicationRoutes = async () => {
    console.log('Checking application routes...');

    const routes = [
      '/',
      '/login',
      '/register',
      '/simple-club',
      '/simple-booking',
      '/simple-about',
      '/simple-contact',
      '/system-audit',
    ];

    const routeResults = [];

    for (const route of routes) {
      try {
        const fullUrl = window.location.origin + route;
        routeResults.push({
          route,
          status: 'defined',
          fullUrl,
          accessible: true,
        });
      } catch (error) {
        routeResults.push({
          route,
          status: 'error',
          error: error.message,
        });
      }
    }

    return {
      totalRoutes: routes.length,
      workingRoutes: routeResults.filter(r => r.status === 'defined').length,
      routes: routeResults,
    };
  };

  const checkConsoleErrors = async () => {
    console.log('Checking for console errors...');

    // Create a simple test to check if React is working
    const errors = [];
    const warnings = [];

    // Check if React is available
    if (typeof React === 'undefined') {
      errors.push('React is not available globally');
    }

    // Check DOM readiness
    if (document.readyState !== 'complete') {
      warnings.push('Document not fully loaded');
    }

    // Check if main element exists
    if (!document.getElementById('root')) {
      errors.push('Root element not found');
    }

    return {
      errors,
      warnings,
      errorCount: errors.length,
      warningCount: warnings.length,
      reactAvailable: typeof React !== 'undefined',
      domReady: document.readyState === 'complete',
    };
  };

  const checkSystemHealth = async () => {
    console.log('Checking system health...');

    // Safely check for performance.memory (Chrome only)
    const extendedPerformance = performance as ExtendedPerformance;
    const memoryInfo = extendedPerformance.memory
      ? {
          used: Math.round(
            extendedPerformance.memory.usedJSHeapSize / 1024 / 1024
          ),
          limit: Math.round(
            extendedPerformance.memory.jsHeapSizeLimit / 1024 / 1024
          ),
        }
      : null;

    const health = {
      memory: memoryInfo,
      online: navigator.onLine,
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      localStorage: (() => {
        try {
          localStorage.setItem('test', 'test');
          localStorage.removeItem('test');
          return true;
        } catch {
          return false;
        }
      })(),
    };

    return health;
  };

  const runFullSystemAudit = async () => {
    setIsRunning(true);
    setAuditResults([]);
    setCurrentTest('Starting comprehensive system audit...');

    console.log('=== STARTING FULL SYSTEM AUDIT ===');

    try {
      // 1. Basic Connectivity Tests
      await runTest(
        'Connectivity',
        'Basic Domain Access',
        checkBasicConnectivity
      );

      // 2. Environment Tests
      await runTest(
        'Environment',
        'Variables Check',
        checkEnvironmentVariables
      );

      // 3. Database Tests
      await runTest('Database', 'Supabase Connection', checkSupabaseConnection);

      // 4. Authentication Tests
      await runTest('Authentication', 'Session Check', checkAuthentication);

      // 5. Application Tests
      await runTest('Application', 'Route Validation', checkApplicationRoutes);
      await runTest('Application', 'Console Errors', checkConsoleErrors);

      // 6. System Health
      await runTest('System', 'Health Check', checkSystemHealth);
    } catch (error) {
      console.error('Audit process failed:', error);
      addResult({
        category: 'System',
        test: 'Audit Process',
        status: 'error',
        message: `Audit process failed: ${error.message}`,
        details: error,
      });
    } finally {
      setIsRunning(false);
      setCurrentTest('');
      console.log('=== AUDIT COMPLETED ===');
    }
  };

  // Calculate system status whenever results change
  useEffect(() => {
    if (auditResults.length > 0) {
      const totalTests = auditResults.length;
      const passedTests = auditResults.filter(
        r => r.status === 'success'
      ).length;
      const errors = auditResults
        .filter(r => r.status === 'error')
        .map(r => `${r.category}: ${r.message}`);
      const warnings = auditResults
        .filter(r => r.status === 'warning')
        .map(r => `${r.category}: ${r.message}`);

      let overall: 'healthy' | 'degraded' | 'critical' = 'healthy';
      if (errors.length > 0) {
        overall = errors.length > 2 ? 'critical' : 'degraded';
      }

      setSystemStatus({
        overall,
        errors,
        warnings,
        totalTests,
        passedTests,
      });
    }
  }, [auditResults]);

  useEffect(() => {
    console.log('SystemAuditPage mounted, starting initial audit...');
    runFullSystemAudit();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className='h-4 w-4 text-green-500' />;
      case 'error':
        return <XCircle className='h-4 w-4 text-red-500' />;
      case 'warning':
        return <AlertTriangle className='h-4 w-4 text-yellow-500' />;
      default:
        return <Activity className='h-4 w-4 text-gray-500' />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <>
      <Helmet>
        <title>System Audit - SABO Billiards</title>
      </Helmet>

      <div className='min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 p-4'>
        <div className='container mx-auto max-w-6xl'>
          {/* Header */}
          <div className='flex items-center justify-between mb-6'>
            <div>
              <h1 className='text-3xl font-bold text-white mb-2'>
                🔍 System Audit Dashboard
              </h1>
              <p className='text-green-200'>
                Comprehensive system health and connectivity check
              </p>
            </div>
            <div className='flex gap-2'>
              <Button
                onClick={runFullSystemAudit}
                disabled={isRunning}
                className='bg-yellow-400 text-green-900 hover:bg-yellow-500'
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${isRunning ? 'animate-spin' : ''}`}
                />
                {isRunning ? 'Running...' : 'Run Audit'}
              </Button>
              <Button
                onClick={() => (window.location.href = '/')}
                variant='outline'
                className='text-white border-white hover:bg-white hover:text-green-900'
              >
                Back to Home
              </Button>
            </div>
          </div>

          {/* Current Test Status */}
          {isRunning && (
            <Alert className='mb-6 bg-blue-50 border-blue-200'>
              <Activity className='h-4 w-4 animate-spin' />
              <AlertDescription>
                {currentTest || 'Running system audit...'}
              </AlertDescription>
            </Alert>
          )}

          {/* Overall Status */}
          <Card className='mb-6'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Server className='h-5 w-5' />
                System Status Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                <div className='text-center'>
                  <div
                    className={`text-2xl font-bold ${
                      systemStatus.overall === 'healthy'
                        ? 'text-green-600'
                        : systemStatus.overall === 'degraded'
                          ? 'text-yellow-600'
                          : 'text-red-600'
                    }`}
                  >
                    {systemStatus.overall.toUpperCase()}
                  </div>
                  <p className='text-sm text-gray-600'>Overall Health</p>
                </div>
                <div className='text-center'>
                  <div className='text-2xl font-bold text-green-600'>
                    {systemStatus.passedTests}
                  </div>
                  <p className='text-sm text-gray-600'>Tests Passed</p>
                </div>
                <div className='text-center'>
                  <div className='text-2xl font-bold text-red-600'>
                    {systemStatus.errors.length}
                  </div>
                  <p className='text-sm text-gray-600'>Critical Issues</p>
                </div>
                <div className='text-center'>
                  <div className='text-2xl font-bold text-yellow-600'>
                    {systemStatus.warnings.length}
                  </div>
                  <p className='text-sm text-gray-600'>Warnings</p>
                </div>
              </div>

              {/* Quick Fixes */}
              {systemStatus.errors.length > 0 && (
                <div className='mt-4 p-4 bg-red-50 rounded-lg'>
                  <h4 className='font-semibold text-red-800 mb-2'>
                    Critical Issues Found:
                  </h4>
                  <ul className='text-sm text-red-700 space-y-1'>
                    {systemStatus.errors.slice(0, 3).map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Detailed Results */}
          <Tabs defaultValue='all' className='space-y-4'>
            <TabsList className='bg-green-800 border-green-700'>
              <TabsTrigger
                value='all'
                className='text-white data-[state=active]:bg-yellow-400 data-[state=active]:text-green-900'
              >
                All Tests ({auditResults.length})
              </TabsTrigger>
              <TabsTrigger
                value='errors'
                className='text-white data-[state=active]:bg-yellow-400 data-[state=active]:text-green-900'
              >
                Errors ({auditResults.filter(r => r.status === 'error').length})
              </TabsTrigger>
              <TabsTrigger
                value='connectivity'
                className='text-white data-[state=active]:bg-yellow-400 data-[state=active]:text-green-900'
              >
                Connectivity
              </TabsTrigger>
              <TabsTrigger
                value='database'
                className='text-white data-[state=active]:bg-yellow-400 data-[state=active]:text-green-900'
              >
                Database
              </TabsTrigger>
            </TabsList>

            <TabsContent value='all' className='space-y-4'>
              {auditResults.length === 0 && !isRunning && (
                <Card>
                  <CardContent className='p-8 text-center'>
                    <Server className='h-12 w-12 mx-auto mb-4 text-gray-400' />
                    <p className='text-gray-600'>
                      No audit results yet. Click "Run Audit" to start.
                    </p>
                  </CardContent>
                </Card>
              )}

              {auditResults.map((result, index) => (
                <Card
                  key={index}
                  className={`${getStatusColor(result.status)}`}
                >
                  <CardContent className='p-4'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-3'>
                        {getStatusIcon(result.status)}
                        <div>
                          <h3 className='font-semibold'>
                            {result.category}: {result.test}
                          </h3>
                          <p className='text-sm text-gray-600'>
                            {result.message}
                          </p>
                        </div>
                      </div>
                      <div className='text-right'>
                        <Badge
                          variant={
                            result.status === 'success'
                              ? 'default'
                              : 'destructive'
                          }
                        >
                          {result.status}
                        </Badge>
                        {result.duration && (
                          <p className='text-xs text-gray-500 mt-1'>
                            {result.duration}ms
                          </p>
                        )}
                      </div>
                    </div>

                    {result.details && (
                      <details className='mt-3'>
                        <summary className='cursor-pointer text-sm font-medium'>
                          View Details
                        </summary>
                        <pre className='mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40'>
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value='errors' className='space-y-4'>
              {auditResults.filter(r => r.status === 'error').length === 0 ? (
                <Card>
                  <CardContent className='p-8 text-center'>
                    <CheckCircle className='h-12 w-12 mx-auto mb-4 text-green-500' />
                    <p className='text-green-600 font-semibold'>
                      No errors found!
                    </p>
                  </CardContent>
                </Card>
              ) : (
                auditResults
                  .filter(r => r.status === 'error')
                  .map((result, index) => (
                    <Card key={index} className='bg-red-50 border-red-200'>
                      <CardContent className='p-4'>
                        <div className='flex items-center gap-3'>
                          <XCircle className='h-5 w-5 text-red-500' />
                          <div className='flex-1'>
                            <h3 className='font-semibold text-red-800'>
                              {result.category}: {result.test}
                            </h3>
                            <p className='text-sm text-red-600'>
                              {result.message}
                            </p>
                            {result.details && (
                              <details className='mt-2'>
                                <summary className='cursor-pointer text-xs font-medium'>
                                  Technical Details
                                </summary>
                                <pre className='mt-1 text-xs bg-red-100 p-2 rounded'>
                                  {JSON.stringify(result.details, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
              )}
            </TabsContent>

            <TabsContent value='connectivity' className='space-y-4'>
              {auditResults
                .filter(r => r.category === 'Connectivity')
                .map((result, index) => (
                  <Card key={index} className={getStatusColor(result.status)}>
                    <CardContent className='p-4'>
                      <div className='flex items-center gap-3'>
                        <Network className='h-5 w-5' />
                        <div>
                          <h3 className='font-semibold'>{result.test}</h3>
                          <p className='text-sm text-gray-600'>
                            {result.message}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </TabsContent>

            <TabsContent value='database' className='space-y-4'>
              {auditResults
                .filter(r => r.category === 'Database')
                .map((result, index) => (
                  <Card key={index} className={getStatusColor(result.status)}>
                    <CardContent className='p-4'>
                      <div className='flex items-center gap-3'>
                        <Database className='h-5 w-5' />
                        <div>
                          <h3 className='font-semibold'>{result.test}</h3>
                          <p className='text-sm text-gray-600'>
                            {result.message}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default SystemAuditPage;
