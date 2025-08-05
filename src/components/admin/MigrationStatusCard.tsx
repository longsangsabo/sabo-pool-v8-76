import React from 'react';
import { useAutomatedMigration } from '@/hooks/useAutomatedMigration';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Play, Square, RotateCcw, CheckCircle } from 'lucide-react';

export const MigrationStatusCard: React.FC = () => {
  const {
    status,
    isLoading,
    isComplete,
    isRunning,
    hasBackgroundQueue,
    runMigration,
    stopMigration,
    verifyMigration,
    getHealthStatus,
    lastVerificationTime,
    formattedLogs,
  } = useAutomatedMigration();

  const healthStatus = getHealthStatus();

  const getStatusColor = () => {
    switch (healthStatus.status) {
      case 'complete':
        return 'bg-green-500';
      case 'running':
        return 'bg-blue-500';
      case 'background':
        return 'bg-yellow-500';
      case 'pending':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card className='w-full'>
      <CardHeader className='pb-3'>
        <CardTitle className='text-lg flex items-center justify-between'>
          Migration Service Status
          <Badge
            variant='outline'
            className={`${getStatusColor()} text-white border-none`}
          >
            {healthStatus.status.toUpperCase()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Status Information */}
        <div className='grid grid-cols-2 gap-4 text-sm'>
          <div>
            <span className='text-muted-foreground'>Queue Length:</span>
            <span className='ml-2 font-medium'>{status.queueLength}</span>
          </div>
          <div>
            <span className='text-muted-foreground'>Running:</span>
            <span className='ml-2 font-medium'>{isRunning ? 'Yes' : 'No'}</span>
          </div>
          <div>
            <span className='text-muted-foreground'>Background Processor:</span>
            <span className='ml-2 font-medium'>
              {status.hasBackgroundProcessor ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div>
            <span className='text-muted-foreground'>Last Verification:</span>
            <span className='ml-2 font-medium'>
              {lastVerificationTime || 'Never'}
            </span>
          </div>
        </div>

        {/* Progress Indicator */}
        {isRunning && (
          <div className='space-y-2'>
            <div className='flex justify-between text-sm'>
              <span>Processing migration...</span>
              <span className='text-muted-foreground'>In progress</span>
            </div>
            <Progress value={undefined} className='h-2' />
          </div>
        )}

        {/* Status Message */}
        <div className='p-3 rounded-lg bg-muted/50'>
          <p className='text-sm font-medium text-muted-foreground'>
            {healthStatus.message}
          </p>
        </div>

        {/* Action Buttons */}
        <div className='flex gap-2'>
          {!isComplete && (
            <Button
              onClick={runMigration}
              disabled={isLoading || isRunning}
              size='sm'
              className='flex items-center gap-2'
            >
              <Play className='h-4 w-4' />
              {isRunning ? 'Running...' : 'Run Migration'}
            </Button>
          )}

          {isRunning && (
            <Button
              onClick={stopMigration}
              variant='outline'
              size='sm'
              className='flex items-center gap-2'
            >
              <Square className='h-4 w-4' />
              Stop
            </Button>
          )}

          <Button
            onClick={verifyMigration}
            variant='outline'
            size='sm'
            className='flex items-center gap-2'
          >
            <RotateCcw className='h-4 w-4' />
            Verify
          </Button>

          {isComplete && (
            <Button
              variant='outline'
              size='sm'
              className='flex items-center gap-2 text-green-600'
              disabled
            >
              <CheckCircle className='h-4 w-4' />
              Complete
            </Button>
          )}
        </div>

        {/* Recent Logs */}
        {formattedLogs.length > 0 && (
          <div className='space-y-2'>
            <h4 className='text-sm font-medium'>Recent Activity:</h4>
            <div className='max-h-32 overflow-y-auto space-y-1 text-xs font-mono bg-muted/30 rounded p-2'>
              {formattedLogs.slice(-5).map((log, index) => (
                <div
                  key={index}
                  className={`${
                    log.includes('[ERROR]')
                      ? 'text-red-600'
                      : log.includes('[SUCCESS]')
                        ? 'text-green-600'
                        : 'text-muted-foreground'
                  }`}
                >
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MigrationStatusCard;
