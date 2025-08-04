/**
 * Migration Control Panel Component
 * Simple interface to trigger and monitor the automated migration system
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
import { AlertCircle, CheckCircle, Play, RotateCcw } from 'lucide-react';
import { useAutomatedMigration } from '@/hooks/useAutomatedMigration';

export const MigrationControlPanel: React.FC = () => {
  const {
    runMigration,
    verifyMigration,
    isLoading,
    isComplete,
    isRunning,
    getHealthStatus,
    error,
  } = useAutomatedMigration();

  const healthStatus = getHealthStatus();

  const getStatusBadge = () => {
    if (isComplete) {
      return <Badge className='bg-green-500 text-white'>Complete</Badge>;
    }
    if (isRunning) {
      return <Badge className='bg-blue-500 text-white'>Running</Badge>;
    }
    return <Badge variant='secondary'>Available</Badge>;
  };

  const getStatusIcon = () => {
    if (isComplete) {
      return <CheckCircle className='h-5 w-5 text-green-500' />;
    }
    return <AlertCircle className='h-5 w-5 text-orange-500' />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          {getStatusIcon()}
          Automated Migration System
          {getStatusBadge()}
        </CardTitle>
        <CardDescription>
          Self-healing player_id → user_id conversion system
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='flex items-center justify-between p-3 rounded-md bg-muted'>
          <div>
            <p className='font-medium'>System Status</p>
            <p className='text-sm text-muted-foreground'>
              {healthStatus.message}
            </p>
          </div>
          <Badge variant='outline' className='capitalize'>
            {healthStatus.status}
          </Badge>
        </div>

        {error && (
          <div className='p-3 rounded-md bg-red-50 text-red-800 text-sm'>
            <strong>Error:</strong> {error}
          </div>
        )}

        <div className='flex gap-2'>
          <Button
            onClick={runMigration}
            disabled={isLoading || isRunning || isComplete}
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
            <RotateCcw className='h-4 w-4' />
            Verify Status
          </Button>
        </div>

        {isComplete && (
          <div className='p-3 rounded-md bg-green-50 text-green-800 text-sm'>
            <strong>✅ Success!</strong> All player_id references have been
            migrated to user_id.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MigrationControlPanel;
