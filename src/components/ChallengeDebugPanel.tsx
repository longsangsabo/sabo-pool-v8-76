import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface ChallengeDebugPanelProps {
  challengeCount: number;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export const ChallengeDebugPanel: React.FC<ChallengeDebugPanelProps> = ({
  challengeCount,
  loading,
  error,
  onRefresh
}) => {
  const handleManualRefresh = async () => {
    console.log('🔄 Manual refresh triggered by user');
    await onRefresh();
  };

  return (
    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200 mb-6">
      <div className="space-y-1">
        <h3 className="font-semibold text-blue-900">Challenge Debug Info</h3>
        <div className="text-sm text-blue-700 space-y-1">
          <p>Challenges loaded: <span className="font-mono">{challengeCount}</span></p>
          <p>Loading: <span className="font-mono">{loading.toString()}</span></p>
          <p>Error: <span className="font-mono">{error || 'none'}</span></p>
          <p className="text-xs text-blue-600">Check browser console for detailed logs</p>
        </div>
      </div>
      <Button
        onClick={handleManualRefresh}
        disabled={loading}
        variant="outline"
        size="sm"
        className="border-blue-300 text-blue-700 hover:bg-blue-100"
      >
        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
        {loading ? 'Refreshing...' : 'Manual Refresh'}
      </Button>
    </div>
  );
};