import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RotateCcw, Zap } from 'lucide-react';
import { useTournamentAutomation } from '@/hooks/useTournamentAutomation';
import { cn } from '@/lib/utils';

interface TournamentAutomationDashboardProps {
  tournamentId: string;
  isAdmin?: boolean;
  className?: string;
}

export const TournamentAutomationDashboard: React.FC<
  TournamentAutomationDashboardProps
> = ({ tournamentId, isAdmin = false, className }) => {
  const { automationStatus, fixTournamentProgression, isFixing } =
    useTournamentAutomation(tournamentId);

  const getStatusColor = () => {
    switch (automationStatus.currentStatus) {
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'idle':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      <Card className='border-2 border-accent-blue/20'>
        <CardHeader className='pb-3'>
          <CardTitle className='flex items-center gap-2 text-lg'>
            <Zap className='w-5 h-5 text-accent-blue' />
            Tournament Automation Status
            <Badge className={getStatusColor()}>
              {automationStatus.currentStatus}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-2 lg:grid-cols-3 gap-4'>
            <div className='text-center p-3 bg-green-50 rounded-lg border border-green-200'>
              <div className='text-2xl font-bold text-green-600'>
                {automationStatus.successCount}
              </div>
              <div className='text-sm text-muted-foreground'>
                Successful Operations
              </div>
            </div>

            <div className='text-center p-3 bg-red-50 rounded-lg border border-red-200'>
              <div className='text-2xl font-bold text-red-600'>
                {automationStatus.errorCount}
              </div>
              <div className='text-sm text-muted-foreground'>Errors</div>
            </div>

            <div className='text-center p-3 bg-blue-50 rounded-lg border border-blue-200'>
              <div className='text-2xl font-bold text-blue-600'>
                {automationStatus.isActive ? 'Active' : 'Inactive'}
              </div>
              <div className='text-sm text-muted-foreground'>Status</div>
            </div>
          </div>

          {automationStatus.lastTriggered && (
            <div className='text-sm text-muted-foreground'>
              Last triggered: {automationStatus.lastTriggered.toLocaleString()}
            </div>
          )}
        </CardContent>
      </Card>

      {isAdmin && (
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='flex items-center gap-2 text-base'>
              <RotateCcw className='w-4 h-4' />
              Manual Controls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant='outline'
              size='sm'
              onClick={fixTournamentProgression}
              disabled={isFixing}
              className='flex items-center gap-1'
            >
              <RotateCcw className='w-3 h-3' />
              {isFixing ? 'Fixing...' : 'Fix Tournament Progression'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
