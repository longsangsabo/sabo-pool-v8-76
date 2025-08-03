import React, { useState, useEffect } from 'react';
import { useFeatureFlags, useABTest } from '@/contexts/FeatureFlagsContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Flag,
  Users,
  TrendingUp,
  Shield,
  Rocket,
  BarChart3,
  CheckCircle,
  AlertTriangle,
  Settings,
} from 'lucide-react';

export const ProductionDeploymentDashboard: React.FC = () => {
  const {
    flags,
    isEnabled,
    enableFlag,
    disableFlag,
    rolloutPercentage,
    userGroup,
    environment,
  } = useFeatureFlags();

  const responsiveABTest = useABTest('responsive_system_v2');
  const [deploymentStatus, setDeploymentStatus] = useState<
    'planning' | 'rolling' | 'complete'
  >('planning');
  const [healthMetrics, setHealthMetrics] = useState({
    errorRate: 0.2,
    performanceScore: 95,
    userSatisfaction: 4.7,
    rolloutCoverage: 85,
  });

  // Simulate real-time metrics
  useEffect(() => {
    const interval = setInterval(() => {
      setHealthMetrics(prev => ({
        errorRate: Math.max(0, prev.errorRate + (Math.random() - 0.5) * 0.1),
        performanceScore: Math.min(
          100,
          Math.max(80, prev.performanceScore + (Math.random() - 0.5) * 2)
        ),
        userSatisfaction: Math.min(
          5,
          Math.max(3, prev.userSatisfaction + (Math.random() - 0.5) * 0.1)
        ),
        rolloutCoverage: Math.min(
          100,
          prev.rolloutCoverage + Math.random() * 1
        ),
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const flagsInfo = [
    {
      key: 'optimizedResponsive' as keyof typeof flags,
      name: 'Optimized Responsive System',
      description:
        'Core 3-mode responsive system with performance optimizations',
      risk: 'low',
      impact: 'high',
    },
    {
      key: 'mobileEnhancements' as keyof typeof flags,
      name: 'Mobile Enhancements',
      description:
        'Enhanced touch targets, safe areas, and mobile-specific optimizations',
      risk: 'low',
      impact: 'medium',
    },
    {
      key: 'tabletOptimizations' as keyof typeof flags,
      name: 'Tablet Optimizations',
      description: 'Tablet-specific layouts and enhanced spacing',
      risk: 'low',
      impact: 'medium',
    },
    {
      key: 'performanceMonitoring' as keyof typeof flags,
      name: 'Performance Monitoring',
      description: 'Real-time performance tracking and analytics',
      risk: 'medium',
      impact: 'low',
    },
    {
      key: 'responsiveAnalytics' as keyof typeof flags,
      name: 'Responsive Analytics',
      description: 'User behavior tracking for responsive interactions',
      risk: 'medium',
      impact: 'low',
    },
    {
      key: 'experimentalLayouts' as keyof typeof flags,
      name: 'Experimental Layouts',
      description: 'New layout patterns and responsive components',
      risk: 'high',
      impact: 'medium',
    },
  ];

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'text-green-600 bg-green-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'high':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'text-blue-600 bg-blue-100';
      case 'medium':
        return 'text-purple-600 bg-purple-100';
      case 'low':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getHealthStatus = (
    metric: number,
    type: 'error' | 'performance' | 'satisfaction' | 'coverage'
  ) => {
    switch (type) {
      case 'error':
        return metric < 1 ? 'good' : metric < 3 ? 'warning' : 'critical';
      case 'performance':
        return metric > 90 ? 'good' : metric > 70 ? 'warning' : 'critical';
      case 'satisfaction':
        return metric > 4.5 ? 'good' : metric > 3.5 ? 'warning' : 'critical';
      case 'coverage':
        return metric > 80 ? 'good' : metric > 50 ? 'warning' : 'critical';
      default:
        return 'good';
    }
  };

  const initiateRollout = () => {
    setDeploymentStatus('rolling');
    console.log('🚀 Starting gradual rollout of responsive system v2');
  };

  const completeRollout = () => {
    setDeploymentStatus('complete');
    console.log('✅ Responsive system v2 rollout completed');
  };

  const emergencyRollback = () => {
    setDeploymentStatus('planning');
    // Disable risky features
    disableFlag('experimentalLayouts');
    disableFlag('responsiveAnalytics');
    console.log('🚨 Emergency rollback initiated');
  };

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center gap-2'>
          <Rocket className='h-5 w-5' />
          <CardTitle>Production Deployment Dashboard</CardTitle>
          <Badge variant='outline'>{environment}</Badge>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue='overview' className='space-y-4'>
          <TabsList className='grid w-full grid-cols-5'>
            <TabsTrigger value='overview'>Overview</TabsTrigger>
            <TabsTrigger value='feature-flags'>Feature Flags</TabsTrigger>
            <TabsTrigger value='ab-testing'>A/B Testing</TabsTrigger>
            <TabsTrigger value='monitoring'>Monitoring</TabsTrigger>
            <TabsTrigger value='rollback'>Emergency</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value='overview' className='space-y-6'>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
              <div className='text-center p-4 bg-blue-50 rounded-lg'>
                <div className='text-2xl font-bold text-blue-600'>
                  {rolloutPercentage}%
                </div>
                <div className='text-sm text-blue-600'>Rollout Coverage</div>
              </div>

              <div className='text-center p-4 bg-green-50 rounded-lg'>
                <div className='text-2xl font-bold text-green-600'>
                  {healthMetrics.performanceScore}
                </div>
                <div className='text-sm text-green-600'>Performance Score</div>
              </div>

              <div className='text-center p-4 bg-yellow-50 rounded-lg'>
                <div className='text-2xl font-bold text-yellow-600'>
                  {healthMetrics.errorRate.toFixed(1)}%
                </div>
                <div className='text-sm text-yellow-600'>Error Rate</div>
              </div>

              <div className='text-center p-4 bg-purple-50 rounded-lg'>
                <div className='text-2xl font-bold text-purple-600'>
                  {healthMetrics.userSatisfaction.toFixed(1)}
                </div>
                <div className='text-sm text-purple-600'>User Rating</div>
              </div>
            </div>

            {/* Deployment Status */}
            <Card className='bg-muted/50'>
              <CardHeader>
                <CardTitle className='text-lg'>Deployment Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <span>Current Phase:</span>
                    <Badge
                      variant={
                        deploymentStatus === 'complete'
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {deploymentStatus === 'planning' && 'Planning Phase'}
                      {deploymentStatus === 'rolling' && 'Rolling Out'}
                      {deploymentStatus === 'complete' && 'Completed'}
                    </Badge>
                  </div>

                  <div className='flex items-center justify-between'>
                    <span>User Group:</span>
                    <Badge
                      variant={
                        userGroup === 'treatment' ? 'default' : 'outline'
                      }
                    >
                      {userGroup === 'treatment'
                        ? 'Treatment (New)'
                        : 'Control (Legacy)'}
                    </Badge>
                  </div>

                  <Progress
                    value={healthMetrics.rolloutCoverage}
                    className='h-3'
                  />

                  <div className='flex gap-2'>
                    <Button
                      onClick={initiateRollout}
                      disabled={deploymentStatus !== 'planning'}
                      size='sm'
                    >
                      Start Rollout
                    </Button>
                    <Button
                      onClick={completeRollout}
                      disabled={deploymentStatus !== 'rolling'}
                      variant='outline'
                      size='sm'
                    >
                      Complete Rollout
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Feature Flags Tab */}
          <TabsContent value='feature-flags' className='space-y-4'>
            <div className='space-y-4'>
              {flagsInfo.map(flagInfo => (
                <Card key={flagInfo.key}>
                  <CardContent className='pt-4'>
                    <div className='flex items-center justify-between'>
                      <div className='space-y-2'>
                        <div className='flex items-center gap-3'>
                          <Flag className='h-4 w-4' />
                          <span className='font-medium'>{flagInfo.name}</span>
                          <Badge className={getRiskColor(flagInfo.risk)}>
                            {flagInfo.risk} risk
                          </Badge>
                          <Badge className={getImpactColor(flagInfo.impact)}>
                            {flagInfo.impact} impact
                          </Badge>
                        </div>
                        <p className='text-sm text-muted-foreground'>
                          {flagInfo.description}
                        </p>
                      </div>

                      <Switch
                        checked={isEnabled(flagInfo.key)}
                        onCheckedChange={checked => {
                          if (checked) {
                            enableFlag(flagInfo.key);
                          } else {
                            disableFlag(flagInfo.key);
                          }
                        }}
                        disabled={flagInfo.key === 'optimizedResponsive'} // Core feature always enabled
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* A/B Testing Tab */}
          <TabsContent value='ab-testing' className='space-y-4'>
            <Card>
              <CardHeader>
                <CardTitle className='text-lg'>
                  Responsive System A/B Test
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='p-4 border rounded-lg'>
                    <div className='flex items-center gap-2 mb-2'>
                      <Users className='h-4 w-4' />
                      <span className='font-medium'>Control Group</span>
                    </div>
                    <div className='text-sm text-muted-foreground'>
                      Legacy responsive system with basic mobile/desktop
                      breakpoints
                    </div>
                    <div className='mt-2'>
                      <Badge variant='outline'>50% of users</Badge>
                    </div>
                  </div>

                  <div className='p-4 border rounded-lg bg-blue-50'>
                    <div className='flex items-center gap-2 mb-2'>
                      <Users className='h-4 w-4' />
                      <span className='font-medium'>Treatment Group</span>
                    </div>
                    <div className='text-sm text-muted-foreground'>
                      Optimized 3-mode responsive system with enhancements
                    </div>
                    <div className='mt-2'>
                      <Badge>50% of users</Badge>
                    </div>
                  </div>
                </div>

                <Alert>
                  <TrendingUp className='h-4 w-4' />
                  <AlertDescription>
                    <strong>Your Assignment:</strong> You are in the{' '}
                    <strong>{responsiveABTest.group}</strong> group.
                    {responsiveABTest.isTreatment &&
                      ' You are testing the new responsive system!'}
                    {responsiveABTest.isControl &&
                      ' You are using the legacy system for comparison.'}
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Monitoring Tab */}
          <TabsContent value='monitoring' className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <Card>
                <CardHeader>
                  <CardTitle className='text-lg'>System Health</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='space-y-3'>
                    <div className='flex items-center justify-between'>
                      <span>Error Rate</span>
                      <div className='flex items-center gap-2'>
                        <div
                          className={`w-3 h-3 rounded-full ${
                            getHealthStatus(
                              healthMetrics.errorRate,
                              'error'
                            ) === 'good'
                              ? 'bg-green-500'
                              : getHealthStatus(
                                    healthMetrics.errorRate,
                                    'error'
                                  ) === 'warning'
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                          }`}
                        />
                        <span>{healthMetrics.errorRate.toFixed(2)}%</span>
                      </div>
                    </div>

                    <div className='flex items-center justify-between'>
                      <span>Performance</span>
                      <div className='flex items-center gap-2'>
                        <div
                          className={`w-3 h-3 rounded-full ${
                            getHealthStatus(
                              healthMetrics.performanceScore,
                              'performance'
                            ) === 'good'
                              ? 'bg-green-500'
                              : getHealthStatus(
                                    healthMetrics.performanceScore,
                                    'performance'
                                  ) === 'warning'
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                          }`}
                        />
                        <span>{healthMetrics.performanceScore}</span>
                      </div>
                    </div>

                    <div className='flex items-center justify-between'>
                      <span>User Satisfaction</span>
                      <div className='flex items-center gap-2'>
                        <div
                          className={`w-3 h-3 rounded-full ${
                            getHealthStatus(
                              healthMetrics.userSatisfaction,
                              'satisfaction'
                            ) === 'good'
                              ? 'bg-green-500'
                              : getHealthStatus(
                                    healthMetrics.userSatisfaction,
                                    'satisfaction'
                                  ) === 'warning'
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                          }`}
                        />
                        <span>
                          {healthMetrics.userSatisfaction.toFixed(1)}/5
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className='text-lg'>Rollout Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    <div>
                      <div className='flex justify-between text-sm mb-1'>
                        <span>Coverage</span>
                        <span>{healthMetrics.rolloutCoverage.toFixed(1)}%</span>
                      </div>
                      <Progress
                        value={healthMetrics.rolloutCoverage}
                        className='h-3'
                      />
                    </div>

                    <div className='text-sm text-muted-foreground'>
                      <div>Target: 100% of users</div>
                      <div>
                        Current: ~
                        {Math.floor(healthMetrics.rolloutCoverage * 1000)} users
                      </div>
                      <div>Estimated completion: 2-3 days</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Emergency Rollback Tab */}
          <TabsContent value='rollback' className='space-y-4'>
            <Alert>
              <AlertTriangle className='h-4 w-4' />
              <AlertDescription>
                <strong>Emergency Controls:</strong> Use these controls only if
                critical issues are detected in production.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle className='text-lg text-red-600'>
                  Emergency Rollback
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-2'>
                  <p className='text-sm text-muted-foreground'>
                    This will immediately disable experimental features and
                    revert to stable configurations.
                  </p>

                  <div className='bg-red-50 p-4 rounded-lg'>
                    <h4 className='font-medium text-red-800 mb-2'>
                      Rollback Actions:
                    </h4>
                    <ul className='text-sm text-red-700 space-y-1'>
                      <li>• Disable experimental layouts</li>
                      <li>• Turn off responsive analytics</li>
                      <li>• Reset to core responsive system only</li>
                      <li>• Notify development team</li>
                    </ul>
                  </div>
                </div>

                <Button
                  onClick={emergencyRollback}
                  variant='destructive'
                  className='w-full'
                >
                  <Shield className='h-4 w-4 mr-2' />
                  Execute Emergency Rollback
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
