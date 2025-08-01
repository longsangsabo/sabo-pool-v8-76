import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Eye, Clock, MapPin, DollarSign } from 'lucide-react';

interface RecentResultCardProps {
  result: {
    id: string;
    player1: {
      name: string;
      avatar?: string;
      rank: string;
    };
    player2: {
      name: string;
      avatar?: string;
      rank: string;
    };
    finalScore: {
      player1: number;
      player2: number;
    };
    winner: 'player1' | 'player2';
    raceToTarget: number;
    completedAt: string;
    duration?: string;
    location?: string;
    betPoints?: number;
    eloChanges?: {
      player1: number;
      player2: number;
    };
  };
  onView?: (resultId: string) => void;
}

const RecentResultCard: React.FC<RecentResultCardProps> = ({
  result,
  onView,
}) => {
  const winner = result.winner === 'player1' ? result.player1 : result.player2;
  const loser = result.winner === 'player1' ? result.player2 : result.player1;

  const getTimeAgo = () => {
    const now = new Date();
    const completed = new Date(result.completedAt);
    const diffMs = now.getTime() - completed.getTime();

    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMinutes < 60) return `${diffMinutes} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} ngày trước`;
  };

  return (
    <Card className='bg-gradient-to-br from-green-50/70 to-emerald-50/70 border-green-200/50 hover:border-green-300/70 transition-all duration-200 hover:shadow-lg hover:shadow-green-500/10'>
      <CardContent className='p-4'>
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center gap-2'>
            <Trophy className='w-4 h-4 text-green-600' />
            <Badge className='bg-green-100 text-green-800 border-green-300'>
              Hoàn thành
            </Badge>
          </div>

          <div className='flex items-center gap-2'>
            {result.betPoints && (
              <Badge
                variant='outline'
                className='text-amber-700 border-amber-300'
              >
                <DollarSign className='w-3 h-3 mr-1' />
                {result.betPoints}
              </Badge>
            )}
            <Button
              size='sm'
              variant='outline'
              onClick={() => onView?.(result.id)}
              className='gap-1'
            >
              <Eye className='w-4 h-4' />
              VIEW
            </Button>
          </div>
        </div>

        {/* Players and Result */}
        <div className='grid grid-cols-5 gap-3 items-center mb-4'>
          {/* Player 1 */}
          <div className='col-span-2 text-center'>
            <div className='relative'>
              <Avatar
                className={`w-12 h-12 mx-auto mb-2 ${
                  result.winner === 'player1'
                    ? 'ring-2 ring-green-500'
                    : 'opacity-75'
                }`}
              >
                <AvatarImage src={result.player1.avatar} />
                <AvatarFallback>{result.player1.name[0]}</AvatarFallback>
              </Avatar>
              {result.winner === 'player1' && (
                <div className='absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center'>
                  <Trophy className='w-3 h-3 text-white' />
                </div>
              )}
            </div>
            <div
              className={`text-sm font-semibold truncate ${
                result.winner === 'player1'
                  ? 'text-green-700'
                  : 'text-muted-foreground'
              }`}
            >
              {result.player1.name}
            </div>
            <div className='text-xs text-muted-foreground'>
              {result.player1.rank}
            </div>
            {result.eloChanges && (
              <div
                className={`text-xs font-medium ${
                  result.eloChanges.player1 > 0
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {result.eloChanges.player1 > 0 ? '+' : ''}
                {result.eloChanges.player1} ELO
              </div>
            )}
          </div>

          {/* Score */}
          <div className='text-center'>
            <div className='text-2xl font-bold text-green-600'>
              {result.finalScore.player1} - {result.finalScore.player2}
            </div>
            <div className='text-xs text-muted-foreground'>
              Race to {result.raceToTarget}
            </div>
          </div>

          {/* Player 2 */}
          <div className='col-span-2 text-center'>
            <div className='relative'>
              <Avatar
                className={`w-12 h-12 mx-auto mb-2 ${
                  result.winner === 'player2'
                    ? 'ring-2 ring-green-500'
                    : 'opacity-75'
                }`}
              >
                <AvatarImage src={result.player2.avatar} />
                <AvatarFallback>{result.player2.name[0]}</AvatarFallback>
              </Avatar>
              {result.winner === 'player2' && (
                <div className='absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center'>
                  <Trophy className='w-3 h-3 text-white' />
                </div>
              )}
            </div>
            <div
              className={`text-sm font-semibold truncate ${
                result.winner === 'player2'
                  ? 'text-green-700'
                  : 'text-muted-foreground'
              }`}
            >
              {result.player2.name}
            </div>
            <div className='text-xs text-muted-foreground'>
              {result.player2.rank}
            </div>
            {result.eloChanges && (
              <div
                className={`text-xs font-medium ${
                  result.eloChanges.player2 > 0
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {result.eloChanges.player2 > 0 ? '+' : ''}
                {result.eloChanges.player2} ELO
              </div>
            )}
          </div>
        </div>

        {/* Match info */}
        <div className='flex items-center justify-between text-xs text-muted-foreground'>
          <div className='flex items-center gap-1'>
            <Clock className='w-3 h-3' />
            <span>{getTimeAgo()}</span>
            {result.duration && <span>• {result.duration}</span>}
          </div>
          {result.location && (
            <div className='flex items-center gap-1'>
              <MapPin className='w-3 h-3' />
              <span className='truncate max-w-24'>{result.location}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentResultCard;
