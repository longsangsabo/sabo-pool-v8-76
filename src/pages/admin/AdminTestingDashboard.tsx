import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResponsiveTestSuite } from '@/components/testing/ResponsiveTestSuite';
import { PerformanceMonitor } from '@/components/testing/PerformanceMonitor';
import { IntegrationTestSuite } from '@/components/testing/IntegrationTestSuite';
import { ResponsiveAuditReport } from '@/components/testing/ResponsiveAuditReport';
import { CrossDeviceTestSuite } from '@/components/testing/CrossDeviceTestSuite';
import { ResponsivePerformanceOptimizer } from '@/components/testing/ResponsivePerformanceOptimizer';
import { ResponsiveSystemDocumentation } from '@/components/testing/ResponsiveSystemDocumentation';
import { ResponsiveAnalyticsTracker } from '@/components/testing/ResponsiveAnalyticsTracker';
import { UserExperienceValidator } from '@/components/testing/UserExperienceValidator';
import { ProductionDeploymentDashboard } from '@/components/testing/ProductionDeploymentDashboard';
import { PostDeploymentMonitoring } from '@/components/testing/PostDeploymentMonitoring';
import { AdminTestingGuide } from '@/components/testing/AdminTestingGuide';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { AlertTriangle, CheckCircle } from 'lucide-react';

export const AdminTestingDashboard: React.FC = () => {
  const { isAdmin, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <AlertTriangle className='h-12 w-12 text-destructive mx-auto mb-4' />
          <h1 className='text-2xl font-bold mb-2'>Access Denied</h1>
          <p className='text-muted-foreground'>
            You need admin privileges to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto py-6 space-y-6'>
      {/* Header */}
      <div className='space-y-2'>
        <h1 className='text-3xl font-bold'>🧪 Admin Testing Dashboard</h1>
        <p className='text-muted-foreground'>
          Comprehensive testing suite for responsive layout, performance, and
          integration validation.
        </p>
      </div>

      {/* Implementation Status */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Implementation Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4'>
            <div className='space-y-2'>
              <h3 className='font-semibold'>Phase 1: File System</h3>
              <Badge variant='default' className='w-full justify-center'>
                <CheckCircle className='h-3 w-3 mr-1' />
                Complete
              </Badge>
              <ul className='text-xs space-y-1'>
                <li>✅ Service standardization</li>
                <li>✅ Import conflicts fixed</li>
                <li>✅ File naming consistent</li>
              </ul>
            </div>

            <div className='space-y-2'>
              <h3 className='font-semibold'>Phase 2: Database</h3>
              <Badge variant='default' className='w-full justify-center'>
                <CheckCircle className='h-3 w-3 mr-1' />
                Complete
              </Badge>
              <ul className='text-xs space-y-1'>
                <li>✅ Missing tables created</li>
                <li>✅ Functions implemented</li>
                <li>✅ Types regenerated</li>
              </ul>
            </div>

            <div className='space-y-2'>
              <h3 className='font-semibold'>Phase 3: Components</h3>
              <Badge variant='default' className='w-full justify-center'>
                <CheckCircle className='h-3 w-3 mr-1' />
                Complete
              </Badge>
              <ul className='text-xs space-y-1'>
                <li>✅ Context exports fixed</li>
                <li>✅ Props interfaces aligned</li>
                <li>✅ Type definitions clean</li>
              </ul>
            </div>

            <div className='space-y-2'>
              <h3 className='font-semibold'>Phase 4: Responsive</h3>
              <Badge variant='default' className='w-full justify-center'>
                <CheckCircle className='h-3 w-3 mr-1' />
                Complete
              </Badge>
              <ul className='text-xs space-y-1'>
                <li>✅ Layout optimization</li>
                <li>✅ Navigation consistency</li>
                <li>✅ Breakpoint validation</li>
              </ul>
            </div>

            <div className='space-y-2'>
              <h3 className='font-semibold'>Phase 5: Testing</h3>
              <Badge variant='default' className='w-full justify-center'>
                <CheckCircle className='h-3 w-3 mr-1' />
                Complete
              </Badge>
              <ul className='text-xs space-y-1'>
                <li>✅ Integration testing</li>
                <li>✅ Performance testing</li>
                <li>✅ Validation complete</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Testing Tabs */}
      <Tabs defaultValue='guide' className='space-y-4'>
        <TabsList className='grid w-full grid-cols-9'>
          <TabsTrigger value='guide'>Hướng Dẫn</TabsTrigger>
          <TabsTrigger value='audit'>Audit</TabsTrigger>
          <TabsTrigger value='responsive'>Tests</TabsTrigger>
          <TabsTrigger value='cross-device'>Cross-Device</TabsTrigger>
          <TabsTrigger value='performance'>Performance</TabsTrigger>
          <TabsTrigger value='ux'>UX</TabsTrigger>
          <TabsTrigger value='deployment'>Deployment</TabsTrigger>
          <TabsTrigger value='monitoring'>Monitoring</TabsTrigger>
          <TabsTrigger value='docs'>Docs</TabsTrigger>
        </TabsList>

        <TabsContent value='guide' className='space-y-4'>
          <AdminTestingGuide />
        </TabsContent>

        <TabsContent value='audit' className='space-y-4'>
          <ResponsiveAuditReport />
        </TabsContent>

        <TabsContent value='responsive' className='space-y-4'>
          <ResponsiveTestSuite />
        </TabsContent>

        <TabsContent value='cross-device' className='space-y-4'>
          <CrossDeviceTestSuite />
        </TabsContent>

        <TabsContent value='performance' className='space-y-4'>
          <ResponsivePerformanceOptimizer />
          <PerformanceMonitor />
        </TabsContent>

        <TabsContent value='ux' className='space-y-4'>
          <UserExperienceValidator />
        </TabsContent>

        <TabsContent value='deployment' className='space-y-4'>
          <ProductionDeploymentDashboard />
        </TabsContent>

        <TabsContent value='monitoring' className='space-y-4'>
          <PostDeploymentMonitoring />
        </TabsContent>

        <TabsContent value='docs' className='space-y-4'>
          <ResponsiveSystemDocumentation />
          <ResponsiveAnalyticsTracker />
          <IntegrationTestSuite />
        </TabsContent>
      </Tabs>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>🎯 Project Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='prose prose-sm max-w-none'>
            <p>
              <strong>Comprehensive optimization complete!</strong> All 5 phases
              have been successfully implemented:
            </p>
            <ul>
              <li>
                <strong>File System:</strong> Standardized imports, cleaned
                duplicates, fixed conflicts
              </li>
              <li>
                <strong>Database:</strong> Created missing tables, implemented
                functions, synced types
              </li>
              <li>
                <strong>Components:</strong> Fixed interfaces, aligned props,
                optimized types
              </li>
              <li>
                <strong>Responsive:</strong> Optimized layouts, consistent
                navigation, validated breakpoints
              </li>
              <li>
                <strong>Testing:</strong> Integration tests, performance
                monitoring, validation complete
              </li>
            </ul>
            <p>
              The application now has a robust, optimized responsive system with
              comprehensive testing capabilities. Use the tabs above to monitor
              performance and validate functionality across different device
              sizes.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTestingDashboard;
