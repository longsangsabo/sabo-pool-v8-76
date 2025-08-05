import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Calendar, Target, DollarSign } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

interface CompletedChallengeCardProps {
  challenge: any;
  onView: () => void;
}

export const CompletedChallengeCard: React.FC<CompletedChallengeCardProps> = ({
  challenge,
  onView,
}) => {
  const timeAgo = challenge.completed_at
    ? formatDistanceToNow(parseISO(challenge.completed_at), {
        addSuffix: true,
        locale: vi,
      })
    : 'Vừa xong';

  const isWinner = (userId: string) => challenge.winner_id === userId;

  const challengerWon = isWinner(challenge.challenger_id);
  const opponentWon = isWinner(challenge.opponent_id);

  return (
    <Card className='bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 hover:shadow-md transition-all duration-300'>
      <CardContent className='p-4'>
        {/* Header */}
        <div className='flex items-center justify-between mb-3'>
          <div className='flex items-center gap-2'>
            <Badge variant='default' className='bg-green-600 text-white'>
              <Trophy className='w-3 h-3 mr-1' />
              Hoàn thành
            </Badge>
            <Badge
              variant='outline'
              className='border-orange-300 text-orange-700'
            >
              <Target className='w-3 h-3 mr-1' />
              Race to {challenge.race_to}
            </Badge>
          </div>
          <div className='text-xs text-gray-500 flex items-center gap-1'>
            <Calendar className='w-3 h-3' />
            {timeAgo}
          </div>
        </div>

        {/* Players and Score */}
        <div className='flex items-center justify-between mb-4'>
          {/* Challenger */}
          <div className='flex items-center gap-3'>
            <Avatar
              className={`w-10 h-10 border-2 ${challengerWon ? 'border-yellow-400' : 'border-gray-300'}`}
            >
              <AvatarImage src={challenge.challenger_profile?.avatar_url} />
              <AvatarFallback
                className={
                  challengerWon
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100'
                }
              >
                {challenge.challenger_profile?.full_name?.charAt(0) || 'C'}
              </AvatarFallback>
            </Avatar>
            <div>
              <div
                className={`font-semibold ${challengerWon ? 'text-yellow-700' : 'text-gray-800'}`}
              >
                {challenge.challenger_profile?.full_name || 'Challenger'}
                {challengerWon && ' 🏆'}
              </div>
              <div className='text-xs text-gray-500'>Challenger</div>
            </div>
          </div>

          {/* Score Display */}
          <div className='flex flex-col items-center'>
            <div className='text-2xl font-bold text-gray-800'>
              {challenge.challenger_score} - {challenge.opponent_score}
            </div>
            <div className='text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded'>
              Tỷ số cuối
            </div>
          </div>

          {/* Opponent */}
          <div className='flex items-center gap-3'>
            <div className='text-right'>
              <div
                className={`font-semibold ${opponentWon ? 'text-yellow-700' : 'text-gray-800'}`}
              >
                {opponentWon && '🏆 '}
                {challenge.opponent_profile?.full_name || 'Opponent'}
              </div>
              <div className='text-xs text-gray-500'>Opponent</div>
            </div>
            <Avatar
              className={`w-10 h-10 border-2 ${opponentWon ? 'border-yellow-400' : 'border-gray-300'}`}
            >
              <AvatarImage src={challenge.opponent_profile?.avatar_url} />
              <AvatarFallback
                className={
                  opponentWon ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100'
                }
              >
                {challenge.opponent_profile?.full_name?.charAt(0) || 'O'}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Bet Points Display */}
        {challenge.bet_points && (
          <div className='flex items-center justify-center mb-3'>
            <Badge
              variant='outline'
              className='border-orange-300 text-orange-700'
            >
              <DollarSign className='w-3 h-3 mr-1' />
              {challenge.bet_points} SPA điểm
            </Badge>
          </div>
        )}

        {/* Winner Display */}
        <div className='text-center mb-3'>
          <div className='text-sm font-medium text-green-700'>
            🎉 Người thắng:{' '}
            {challenge.winner_profile?.full_name || 'Chưa xác định'}
          </div>
        </div>

        {/* Action Button */}
        <Button
          variant='outline'
          onClick={onView}
          className='w-full border-green-300 text-green-700 hover:bg-green-50'
        >
          Xem chi tiết kết quả
        </Button>

        {/* Challenge Message */}
        {challenge.message && (
          <div className='mt-3 p-2 bg-green-50 rounded text-xs text-green-700 border-l-2 border-green-400'>
            💬 {challenge.message}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
