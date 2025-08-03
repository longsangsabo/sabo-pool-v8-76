/**
 * Automated Migration Dashboard Component
 * Real-time monitoring and control interface for the automated migration system
 */

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Play,
  Square,
  CheckCircle,
  AlertCircle,
  RotateCcw,
  Trash2,
  Activity,
  Database,
  Code,
  Zap,
} from 'lucide-react';
import { useAutomatedMigration } from '@/hooks/useAutomatedMigration';

export const AutomatedMigrationDashboard: React.FC = () => {
  const {
    status,
    isLoading,
    error,
    logs,
    runMigration,
    verifyMigration,
    stopMigration,
    clearLogs,
    getHealthStatus,
    isComplete,
    isRunning,
    hasBackgroundQueue,
    formattedLogs,
    lastVerificationTime,
  } = useAutomatedMigration();

  const healthStatus = getHealthStatus();

  const getStatusIcon = () => {
    switch (healthStatus.status) {
      case 'complete':
        return <CheckCircle className='h-4 w-4 text-green-500' />;
      case 'running':
        return <Activity className='h-4 w-4 text-blue-500 animate-pulse' />;
      case 'background':
        return <RotateCcw className='h-4 w-4 text-yellow-500 animate-spin' />;
      case 'pending':
        return <AlertCircle className='h-4 w-4 text-orange-500' />;
      default:
        return <Activity className='h-4 w-4 text-gray-500' />;
    }
  };

  const getProgressValue = () => {
    if (isComplete) return 100;
    if (isRunning) return 65;
    if (hasBackgroundQueue) return 80;
    return 45; // Partial completion
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-3xl font-bold tracking-tight'>
            Automated Migration System
          </h2>
          <p className='text-muted-foreground'>
            Self-healing player_id → user_id conversion system
          </p>
        </div>
        <div className='flex items-center gap-2'>
          {getStatusIcon()}
          <Badge
            variant={
              healthStatus.status === 'complete' ? 'default' : 'secondary'
            }
            className={`${
              healthStatus.status === 'complete'
                ? 'bg-green-500'
                : healthStatus.status === 'running'
                  ? 'bg-blue-500'
                  : healthStatus.status === 'background'
                    ? 'bg-yellow-500'
                    : 'bg-gray-500'
            } text-white`}
          >
            {healthStatus.status.toUpperCase()}
          </Badge>
        </div>
      </div>

      {/* Status Overview */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Migration Progress
            </CardTitle>
            <Database className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='space-y-2'>
              <Progress value={getProgressValue()} className='h-2' />
              <p className='text-xs text-muted-foreground'>
                {getProgressValue()}% Complete
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Queue Status</CardTitle>
            <Code className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{status.queueLength}</div>
            <p className='text-xs text-muted-foreground'>Items in queue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Background Process
            </CardTitle>
            <Zap className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {status.hasBackgroundProcessor ? 'Active' : 'Idle'}
            </div>
            <p className='text-xs text-muted-foreground'>
              Auto-processing status
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Last Verification
            </CardTitle>
            <CheckCircle className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {lastVerificationTime || 'Never'}
            </div>
            <p className='text-xs text-muted-foreground'>Completion check</p>
          </CardContent>
        </Card>
      </div>

      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Migration Controls</CardTitle>
          <CardDescription>{healthStatus.message}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex flex-wrap gap-2'>
            <Button
              onClick={runMigration}
              disabled={isLoading || isRunning}
              className='flex items-center gap-2'
            >
              <Play className='h-4 w-4' />
              {isLoading ? 'Running...' : 'Start Migration'}
            </Button>

            <Button
              variant='outline'
              onClick={verifyMigration}
              disabled={isLoading}
              className='flex items-center gap-2'
            >
              <CheckCircle className='h-4 w-4' />
              Verify Completion
            </Button>

            <Button
              variant='destructive'
              onClick={stopMigration}
              disabled={!isRunning && !status.hasBackgroundProcessor}
              className='flex items-center gap-2'
            >
              <Square className='h-4 w-4' />
              Stop All Processes
            </Button>

            <Button
              variant='ghost'
              onClick={clearLogs}
              className='flex items-center gap-2'
            >
              <Trash2 className='h-4 w-4' />
              Clear Logs
            </Button>
          </div>

          {error && (
            <div className='mt-4 p-3 rounded-md bg-red-50 text-red-800 text-sm'>
              <strong>Error:</strong> {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Migration Status Details */}
      {isComplete && (
        <Card className='border-green-200 bg-green-50'>
          <CardHeader>
            <CardTitle className='text-green-800 flex items-center gap-2'>
              <CheckCircle className='h-5 w-5' />
              Migration Complete!
            </CardTitle>
            <CardDescription>
              All player_id references have been successfully migrated to
              user_id.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-2 text-sm text-green-700'>
              <p>✅ Database schema updated</p>
              <p>✅ Frontend code migrated</p>
              <p>✅ Edge functions updated</p>
              <p>✅ Foreign key constraints fixed</p>
              <p>✅ RLS policies updated</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Real-time Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Migration Logs</CardTitle>
          <CardDescription>
            Real-time migration process monitoring (last 50 entries)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className='h-64 w-full rounded-md border p-4'>
            {formattedLogs.length === 0 ? (
              <p className='text-muted-foreground text-sm'>No logs available</p>
            ) : (
              <div className='space-y-1'>
                {formattedLogs.map((log, index) => (
                  <div key={index} className='text-xs font-mono'>
                    <span
                      className={`${
                        log.includes('[ERROR]')
                          ? 'text-red-600'
                          : log.includes('[SUCCESS]')
                            ? 'text-green-600'
                            : log.includes('[INFO]')
                              ? 'text-blue-600'
                              : 'text-gray-600'
                      }`}
                    >
                      {log}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Migration Targets Information */}
      <Card>
        <CardHeader>
          <CardTitle>Migration Target Types</CardTitle>
          <CardDescription>
            Overview of the types of references the system can detect and fix
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid gap-4 md:grid-cols-3'>
            <div className='space-y-2'>
              <h4 className='font-semibold text-sm flex items-center gap-2'>
                <Database className='h-4 w-4' />
                Database Schema
              </h4>
              <ul className='text-xs text-muted-foreground space-y-1'>
                <li>• Column names (reported_player_id → reported_user_id)</li>
                <li>• Foreign key constraints</li>
                <li>• Function parameters</li>
                <li>• Index definitions</li>
              </ul>
            </div>

            <div className='space-y-2'>
              <h4 className='font-semibold text-sm flex items-center gap-2'>
                <Code className='h-4 w-4' />
                Frontend Code
              </h4>
              <ul className='text-xs text-muted-foreground space-y-1'>
                <li>• Query foreign key references</li>
                <li>• Function call parameters</li>
                <li>• Type definitions</li>
                <li>• Compatibility mappings</li>
              </ul>
            </div>

            <div className='space-y-2'>
              <h4 className='font-semibold text-sm flex items-center gap-2'>
                <Zap className='h-4 w-4' />
                Edge Functions
              </h4>
              <ul className='text-xs text-muted-foreground space-y-1'>
                <li>• RPC call parameters</li>
                <li>• Variable assignments</li>
                <li>• Function definitions</li>
                <li>• API integrations</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AutomatedMigrationDashboard;
