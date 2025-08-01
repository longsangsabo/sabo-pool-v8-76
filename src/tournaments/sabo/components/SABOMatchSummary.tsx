import React from 'react';
import { Trophy } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface SABOMatchSummaryProps {
  match: {
    id: string;
    player1_score?: number;
    player2_score?: number;
    winner_id?: string;
    player1_id?: string;
    player2_id?: string;
    player1?: {
      user_id: string;
      display_name: string;
      avatar_url: string | null;
    } | null;
    player2?: {
      user_id: string;
      display_name: string;
      avatar_url: string | null;
    } | null;
  };
}

export const SABOMatchSummary: React.FC<SABOMatchSummaryProps> = ({
  match,
}) => {
  const {
    player1,
    player2,
    winner_id,
    player1_score = 0,
    player2_score = 0,
  } = match;
  const winner = winner_id === player1?.user_id ? player1 : player2;
  const isPlayer1Winner = winner_id === player1?.user_id;

  return (
    <div className='bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4'>
      {/* Winner Highlight */}
      <div className='flex items-center justify-center mb-3'>
        <Trophy className='w-6 h-6 text-yellow-500 mr-2' />
        <span className='text-lg font-bold text-green-700 dark:text-green-400'>
          {winner?.display_name || 'Winner'} Wins!
        </span>
      </div>

      {/* Score Display */}
      <div className='flex items-center justify-center space-x-4'>
        <div
          className={cn(
            'text-center',
            isPlayer1Winner
              ? 'text-green-600 dark:text-green-400'
              : 'text-gray-500 dark:text-gray-400'
          )}
        >
          <div className='flex items-center gap-2 mb-1'>
            <Avatar className='h-8 w-8'>
              <AvatarImage src={player1?.avatar_url || ''} />
              <AvatarFallback>
                {player1?.display_name?.[0] || '?'}
              </AvatarFallback>
            </Avatar>
            <div className='font-semibold'>
              {player1?.display_name || 'Player 1'}
            </div>
          </div>
          <div className='text-3xl font-bold'>{player1_score}</div>
        </div>

        <div className='text-gray-400 dark:text-gray-600 text-xl font-bold'>
          -
        </div>

        <div
          className={cn(
            'text-center',
            !isPlayer1Winner
              ? 'text-green-600 dark:text-green-400'
              : 'text-gray-500 dark:text-gray-400'
          )}
        >
          <div className='flex items-center gap-2 mb-1'>
            <Avatar className='h-8 w-8'>
              <AvatarImage src={player2?.avatar_url || ''} />
              <AvatarFallback>
                {player2?.display_name?.[0] || '?'}
              </AvatarFallback>
            </Avatar>
            <div className='font-semibold'>
              {player2?.display_name || 'Player 2'}
            </div>
          </div>
          <div className='text-3xl font-bold'>{player2_score}</div>
        </div>
      </div>
    </div>
  );
};
