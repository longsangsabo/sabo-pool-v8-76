import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Zap, AlertCircle } from 'lucide-react';
import { useTournamentRewardSync } from '@/hooks/useTournamentRewardSync';
import { toast } from 'sonner';

interface TournamentRewardsSyncProps {
  tournamentId?: string;
  tournamentName?: string;
  onSyncCompleted?: () => void;
}

export const TournamentRewardsSync: React.FC<TournamentRewardsSyncProps> = ({
  tournamentId,
  tournamentName,
  onSyncCompleted,
}) => {
  const { syncTournamentRewards, syncing, error } = useTournamentRewardSync();

  const handleSync = async (syncAll = false) => {
    try {
      const result = await syncTournamentRewards(
        syncAll ? undefined : tournamentId
      );

      if (result?.success) {
        toast.success(
          syncAll
            ? `Synced ${result.data?.synced_tournaments || 0} tournaments`
            : `Synced ${tournamentName || 'tournament'} successfully`
        );
        onSyncCompleted?.();
      } else {
        toast.error(result?.error || 'Sync failed');
      }
    } catch (err: any) {
      toast.error(err.message || 'Sync failed');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Zap className='h-5 w-5 text-primary' />
          Tournament Rewards Sync
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {error && (
          <div className='flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg'>
            <AlertCircle className='h-4 w-4 text-destructive' />
            <span className='text-sm text-destructive'>{error}</span>
          </div>
        )}

        <div className='space-y-3'>
          {tournamentId && (
            <div className='flex items-center justify-between'>
              <div>
                <p className='font-medium'>Current Tournament</p>
                <p className='text-sm text-muted-foreground'>
                  {tournamentName || tournamentId}
                </p>
              </div>
              <Button
                onClick={() => handleSync(false)}
                disabled={syncing}
                size='sm'
                variant='outline'
              >
                {syncing ? (
                  <RefreshCw className='h-4 w-4 animate-spin mr-2' />
                ) : (
                  <RefreshCw className='h-4 w-4 mr-2' />
                )}
                Sync This Tournament
              </Button>
            </div>
          )}

          <div className='flex items-center justify-between'>
            <div>
              <p className='font-medium'>All Tournaments</p>
              <p className='text-sm text-muted-foreground'>
                Sync rewards for all completed tournaments
              </p>
            </div>
            <Button
              onClick={() => handleSync(true)}
              disabled={syncing}
              size='sm'
            >
              {syncing ? (
                <RefreshCw className='h-4 w-4 animate-spin mr-2' />
              ) : (
                <RefreshCw className='h-4 w-4 mr-2' />
              )}
              Sync All
            </Button>
          </div>
        </div>

        <div className='pt-3 border-t'>
          <Badge variant='secondary' className='text-xs'>
            This will update tournament results to match prize tier
            configurations
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};
