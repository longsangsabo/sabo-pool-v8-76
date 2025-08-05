import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Bug, Database, Users } from 'lucide-react';
import { useChallenges } from '@/hooks/useChallenges';
import { useAuth } from '@/hooks/useAuth';

interface ChallengeDebugPanelProps {
  onRefresh: () => void;
}

export const ChallengeDebugPanel: React.FC<ChallengeDebugPanelProps> = ({
  onRefresh,
}) => {
  const { challenges, loading, error } = useChallenges();
  const { user } = useAuth();

  const handleManualRefresh = async () => {
    console.log('🔄 [DebugPanel] Manual refresh triggered by user');
    await onRefresh();
  };

  // Calculate debug stats
  const debugStats = {
    total: challenges.length,
    pending: challenges.filter(c => c.status === 'pending').length,
    open: challenges.filter(c => !c.opponent_id && c.status === 'pending')
      .length,
    myOpen: challenges.filter(
      c =>
        !c.opponent_id && c.status === 'pending' && c.challenger_id === user?.id
    ).length,
    otherOpen: challenges.filter(
      c =>
        !c.opponent_id && c.status === 'pending' && c.challenger_id !== user?.id
    ).length,
    withProfiles: challenges.filter(c => c.challenger_profile?.full_name)
      .length,
  };

  return (
    <div className='flex items-center justify-between p-4 bg-blue-50/70 rounded-lg border border-blue-200/50 mb-6 backdrop-blur-sm'>
      <div className='space-y-2'>
        <div className='flex items-center gap-2'>
          <Bug className='w-5 h-5 text-blue-600' />
          <h3 className='font-semibold text-blue-900'>Challenge Debug Panel</h3>
        </div>

        <div className='grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm'>
          <div className='flex items-center gap-2'>
            <Database className='w-4 h-4 text-blue-600' />
            <span className='text-blue-700'>
              Total:{' '}
              <span className='font-mono font-bold'>{debugStats.total}</span>
            </span>
          </div>

          <div className='flex items-center gap-2'>
            <Users className='w-4 h-4 text-emerald-600' />
            <span className='text-emerald-700'>
              Open:{' '}
              <span className='font-mono font-bold'>{debugStats.open}</span>
            </span>
          </div>

          <div className='flex items-center gap-2'>
            <Users className='w-4 h-4 text-purple-600' />
            <span className='text-purple-700'>
              Others Open:{' '}
              <span className='font-mono font-bold'>
                {debugStats.otherOpen}
              </span>
            </span>
          </div>

          <div className='text-blue-700'>
            Loading: <span className='font-mono'>{loading.toString()}</span>
          </div>

          <div className='text-blue-700'>
            With Profiles:{' '}
            <span className='font-mono'>{debugStats.withProfiles}</span>
          </div>

          <div className='text-blue-700'>
            Error:{' '}
            <span className='font-mono text-red-600'>{error || 'none'}</span>
          </div>
        </div>

        <p className='text-xs text-blue-600'>
          Check browser console for detailed logs
        </p>
      </div>

      <Button
        onClick={handleManualRefresh}
        disabled={loading}
        variant='outline'
        size='sm'
        className='border-blue-300 text-blue-700 hover:bg-blue-100'
      >
        <RefreshCw
          className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`}
        />
        {loading ? 'Refreshing...' : 'Manual Refresh'}
      </Button>
    </div>
  );
};
