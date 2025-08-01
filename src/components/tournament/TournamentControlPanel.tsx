import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  Clock,
  Trophy,
  Users,
  Zap,
  Settings,
  AlertTriangle,
} from 'lucide-react';
import { useTournaments } from '@/hooks/useTournaments';
import { useTournamentMatches } from '@/hooks/useTournamentMatches';
import { useRealtimeTournamentSync } from '@/hooks/useRealtimeTournamentSync';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TournamentControlPanelProps {
  tournamentId: string;
  isClubOwner?: boolean;
}

export const TournamentControlPanel: React.FC<TournamentControlPanelProps> = ({
  tournamentId,
  isClubOwner = false,
}) => {
  const [isStarting, setIsStarting] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);

  const { tournaments, refetch: refetchTournaments } = useTournaments();
  const {
    matches,
    loading: matchesLoading,
    refetch: refetchMatches,
  } = useTournamentMatches(tournamentId);
  const { isConnected, automationActivity } =
    useRealtimeTournamentSync(tournamentId);

  const tournament = tournaments.find(t => t.id === tournamentId);

  if (!tournament || !isClubOwner) {
    return null;
  }

  // Calculate tournament statistics
  const totalMatches = matches.length;
  const completedMatches = matches.filter(m => m.status === 'completed').length;
  const readyMatches = matches.filter(
    m => m.status === 'scheduled' && m.player1_id && m.player2_id
  ).length;
  const pendingPlayerAssignment = matches.filter(
    m => !m.player1_id || !m.player2_id
  ).length;

  const progressPercentage =
    totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0;

  const handleStartTournament = async () => {
    try {
      setIsStarting(true);

      // Update tournament status to ongoing
      const { error: statusError } = await supabase
        .from('tournaments')
        .update({
          status: 'ongoing',
          updated_at: new Date().toISOString(),
        })
        .eq('id', tournamentId);

      if (statusError) throw statusError;

      // Update first round matches to ready status
      const { error: matchError } = await supabase
        .from('tournament_matches')
        .update({
          status: 'scheduled',
          updated_at: new Date().toISOString(),
        })
        .eq('tournament_id', tournamentId)
        .eq('round_number', 1);

      if (matchError) throw matchError;

      toast.success('🚀 Giải đấu đã bắt đầu! Các trận vòng 1 đã sẵn sàng.');

      // Refresh data
      refetchTournaments();
      refetchMatches();
    } catch (error: any) {
      console.error('Error starting tournament:', error);
      toast.error('Lỗi bắt đầu giải đấu: ' + error.message);
    } finally {
      setIsStarting(false);
    }
  };

  const handleRecoverAutomation = async () => {
    try {
      setIsRecovering(true);

      // Call recovery function
      const { data, error } = await supabase.rpc(
        'recover_tournament_automation',
        {
          p_tournament_id: tournamentId,
        }
      );

      if (error) throw error;

      toast.success('🔧 Đã khôi phục automation thành công!');
      refetchMatches();
    } catch (error: any) {
      console.error('Error recovering automation:', error);
      toast.error('Lỗi khôi phục automation: ' + error.message);
    } finally {
      setIsRecovering(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ongoing':
        return 'bg-green-500/20 text-green-700 border-green-200';
      case 'registration_closed':
        return 'bg-blue-500/20 text-blue-700 border-blue-200';
      case 'completed':
        return 'bg-purple-500/20 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-500/20 text-gray-700 border-gray-200';
    }
  };

  const canStartTournament =
    tournament.status === 'registration_closed' && totalMatches > 0;
  const needsRecovery =
    tournament.status === 'ongoing' && pendingPlayerAssignment > 0;

  return (
    <Card className='bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2'>
            <Settings className='h-5 w-5 text-primary' />
            Tournament Control Panel
          </CardTitle>
          <div className='flex items-center gap-2'>
            <Badge
              variant='outline'
              className={getStatusColor(tournament.status)}
            >
              {tournament.status}
            </Badge>
            {isConnected && (
              <Badge
                variant='outline'
                className='bg-green-500/20 text-green-700 border-green-200'
              >
                <div className='w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse' />
                Live
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className='space-y-6'>
        {/* Tournament Statistics */}
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          <div className='flex items-center gap-2 p-3 bg-white/50 rounded-lg'>
            <Trophy className='h-4 w-4 text-yellow-600' />
            <div>
              <div className='text-sm font-medium'>
                {completedMatches}/{totalMatches}
              </div>
              <div className='text-xs text-muted-foreground'>Matches Done</div>
            </div>
          </div>

          <div className='flex items-center gap-2 p-3 bg-white/50 rounded-lg'>
            <Clock className='h-4 w-4 text-blue-600' />
            <div>
              <div className='text-sm font-medium'>{readyMatches}</div>
              <div className='text-xs text-muted-foreground'>Ready to Play</div>
            </div>
          </div>

          <div className='flex items-center gap-2 p-3 bg-white/50 rounded-lg'>
            <Users className='h-4 w-4 text-green-600' />
            <div>
              <div className='text-sm font-medium'>
                {pendingPlayerAssignment}
              </div>
              <div className='text-xs text-muted-foreground'>Need Players</div>
            </div>
          </div>

          <div className='flex items-center gap-2 p-3 bg-white/50 rounded-lg'>
            <Zap className='h-4 w-4 text-purple-600' />
            <div>
              <div className='text-sm font-medium'>{progressPercentage}%</div>
              <div className='text-xs text-muted-foreground'>Progress</div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div className='flex justify-between text-sm text-muted-foreground mb-2'>
            <span>Tournament Progress</span>
            <span>
              {completedMatches} of {totalMatches} matches
            </span>
          </div>
          <div className='w-full bg-secondary/30 rounded-full h-3'>
            <div
              className='bg-gradient-to-r from-primary to-primary/80 h-3 rounded-full transition-all duration-500'
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Automation Activity */}
        {automationActivity.isProcessing && (
          <div className='p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200'>
            <div className='flex items-center gap-2'>
              <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600' />
              <span className='text-sm font-medium text-blue-800 dark:text-blue-200'>
                {automationActivity.lastAction || 'Processing automation...'}
              </span>
            </div>
          </div>
        )}

        {/* Control Buttons */}
        <div className='flex flex-wrap gap-3'>
          {canStartTournament && (
            <Button
              onClick={handleStartTournament}
              disabled={isStarting}
              className='bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600'
            >
              {isStarting ? (
                <div className='flex items-center gap-2'>
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white' />
                  Đang bắt đầu...
                </div>
              ) : (
                <div className='flex items-center gap-2'>
                  <Play className='h-4 w-4' />
                  Bắt đầu giải đấu
                </div>
              )}
            </Button>
          )}

          {needsRecovery && (
            <Button
              onClick={handleRecoverAutomation}
              disabled={isRecovering}
              variant='outline'
              className='border-orange-200 text-orange-700 hover:bg-orange-50'
            >
              {isRecovering ? (
                <div className='flex items-center gap-2'>
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600' />
                  Đang khôi phục...
                </div>
              ) : (
                <div className='flex items-center gap-2'>
                  <RotateCcw className='h-4 w-4' />
                  Khôi phục automation
                </div>
              )}
            </Button>
          )}

          {tournament.status === 'ongoing' && (
            <Button
              variant='outline'
              className='border-blue-200 text-blue-700 hover:bg-blue-50'
            >
              <Pause className='h-4 w-4 mr-2' />
              Tạm dừng
            </Button>
          )}
        </div>

        {/* Warnings */}
        {needsRecovery && (
          <div className='p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200'>
            <div className='flex items-start gap-2'>
              <AlertTriangle className='h-4 w-4 text-orange-600 mt-0.5' />
              <div>
                <div className='text-sm font-medium text-orange-800 dark:text-orange-200'>
                  Automation Issue Detected
                </div>
                <div className='text-xs text-orange-700 dark:text-orange-300 mt-1'>
                  Some matches are missing player assignments. Click "Khôi phục
                  automation" to fix.
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
