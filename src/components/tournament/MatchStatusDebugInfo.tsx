import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Clock, Users } from 'lucide-react';

interface Match {
  id: string;
  status: string;
  player1_id: string | null;
  player2_id: string | null;
  winner_id: string | null;
  bracket_type?: string;
  round_number: number;
  match_number: number;
}

interface MatchStatusDebugInfoProps {
  match: Match;
  isClubOwner?: boolean;
}

export const MatchStatusDebugInfo: React.FC<MatchStatusDebugInfoProps> = ({
  match,
  isClubOwner = false,
}) => {
  const getStatusInfo = () => {
    const hasPlayers = match.player1_id && match.player2_id;
    const playersAreDifferent = match.player1_id !== match.player2_id;
    const hasWinner = !!match.winner_id;

    const isMatchReady =
      match.status === 'scheduled' &&
      hasPlayers &&
      playersAreDifferent &&
      !hasWinner;

    return {
      isMatchReady,
      hasPlayers,
      playersAreDifferent,
      hasWinner,
      status: match.status,
    };
  };

  const statusInfo = getStatusInfo();

  if (!isClubOwner) return null;

  return (
    <div className='mt-2 p-2 bg-gray-50 rounded border text-xs space-y-1'>
      <div className='font-medium text-gray-700'>
        🔍 Debug Info (Club Owner Only)
      </div>

      <div className='flex items-center gap-2'>
        <span>Status:</span>
        <Badge variant={match.status === 'scheduled' ? 'default' : 'secondary'}>
          {match.status}
        </Badge>
      </div>

      <div className='flex items-center gap-2'>
        <Users className='w-3 h-3' />
        <span>Players:</span>
        {statusInfo.hasPlayers ? (
          <CheckCircle className='w-3 h-3 text-green-600' />
        ) : (
          <AlertCircle className='w-3 h-3 text-red-600' />
        )}
        <span
          className={statusInfo.hasPlayers ? 'text-green-600' : 'text-red-600'}
        >
          {statusInfo.hasPlayers ? 'OK' : 'Missing'}
        </span>
      </div>

      <div className='flex items-center gap-2'>
        <span>Different Players:</span>
        {statusInfo.playersAreDifferent ? (
          <CheckCircle className='w-3 h-3 text-green-600' />
        ) : (
          <AlertCircle className='w-3 h-3 text-red-600' />
        )}
        <span
          className={
            statusInfo.playersAreDifferent ? 'text-green-600' : 'text-red-600'
          }
        >
          {statusInfo.playersAreDifferent ? 'OK' : 'Same player!'}
        </span>
      </div>

      <div className='flex items-center gap-2'>
        <span>Winner:</span>
        {!statusInfo.hasWinner ? (
          <CheckCircle className='w-3 h-3 text-green-600' />
        ) : (
          <Clock className='w-3 h-3 text-yellow-600' />
        )}
        <span
          className={
            !statusInfo.hasWinner ? 'text-green-600' : 'text-yellow-600'
          }
        >
          {!statusInfo.hasWinner ? 'None (Ready)' : 'Already decided'}
        </span>
      </div>

      <div className='flex items-center gap-2'>
        <span className='font-medium'>Ready for Score:</span>
        {statusInfo.isMatchReady ? (
          <Badge variant='default' className='bg-green-600'>
            ✅ YES
          </Badge>
        ) : (
          <Badge variant='destructive'>❌ NO</Badge>
        )}
      </div>

      {!statusInfo.isMatchReady && (
        <div className='text-red-600 text-xs'>
          Reasons:
          {match.status !== 'scheduled' && ' Status not scheduled.'}
          {!statusInfo.hasPlayers && ' Missing players.'}
          {!statusInfo.playersAreDifferent && ' Same player assigned.'}
          {statusInfo.hasWinner && ' Winner already decided.'}
        </div>
      )}
    </div>
  );
};
