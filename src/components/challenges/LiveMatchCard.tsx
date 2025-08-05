import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Eye, MapPin, Clock } from 'lucide-react';

interface LiveMatchCardProps {
  match: {
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
    score: {
      player1: number;
      player2: number;
    };
    raceToTarget: number;
    location?: string;
    startTime: string;
    estimatedEndTime?: string;
    betPoints?: number;
  };
  onWatch?: (matchId: string) => void;
}

const LiveMatchCard: React.FC<LiveMatchCardProps> = ({ match, onWatch }) => {
  const progress1 = (match.score.player1 / match.raceToTarget) * 100;
  const progress2 = (match.score.player2 / match.raceToTarget) * 100;

  return (
    <Card className='bg-gradient-to-br from-red-50/70 to-orange-50/70 border-red-200/50 hover:border-red-300/70 transition-all duration-200 hover:shadow-lg hover:shadow-red-500/10'>
      <CardContent className='p-4'>
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center gap-2'>
            <div className='relative'>
              <div className='w-3 h-3 bg-red-500 rounded-full animate-pulse'></div>
              <div className='absolute inset-0 w-3 h-3 bg-red-500 rounded-full animate-ping'></div>
            </div>
            <Badge variant='destructive' className='animate-pulse'>
              LIVE
            </Badge>
          </div>

          <div className='flex items-center gap-2'>
            {match.betPoints && (
              <Badge
                variant='outline'
                className='text-amber-700 border-amber-300'
              >
                {match.betPoints} SPA
              </Badge>
            )}
            <Button
              size='sm'
              variant='outline'
              onClick={() => onWatch?.(match.id)}
              className='gap-1'
            >
              <Eye className='w-4 h-4' />
              WATCH
            </Button>
          </div>
        </div>

        {/* Players and Score */}
        <div className='grid grid-cols-5 gap-3 items-center mb-4'>
          {/* Player 1 */}
          <div className='col-span-2 text-center'>
            <Avatar className='w-12 h-12 mx-auto mb-2'>
              <AvatarImage src={match.player1.avatar} />
              <AvatarFallback>{match.player1.name[0]}</AvatarFallback>
            </Avatar>
            <div className='text-sm font-semibold truncate'>
              {match.player1.name}
            </div>
            <div className='text-xs text-muted-foreground'>
              {match.player1.rank}
            </div>
          </div>

          {/* Score */}
          <div className='text-center'>
            <div className='text-2xl font-bold text-red-600'>
              {match.score.player1} - {match.score.player2}
            </div>
            <div className='text-xs text-muted-foreground'>
              Race to {match.raceToTarget}
            </div>
          </div>

          {/* Player 2 */}
          <div className='col-span-2 text-center'>
            <Avatar className='w-12 h-12 mx-auto mb-2'>
              <AvatarImage src={match.player2.avatar} />
              <AvatarFallback>{match.player2.name[0]}</AvatarFallback>
            </Avatar>
            <div className='text-sm font-semibold truncate'>
              {match.player2.name}
            </div>
            <div className='text-xs text-muted-foreground'>
              {match.player2.rank}
            </div>
          </div>
        </div>

        {/* Progress bars */}
        <div className='space-y-2 mb-4'>
          <div className='flex items-center gap-2'>
            <div className='text-xs font-medium w-20 truncate'>
              {match.player1.name}
            </div>
            <div className='flex-1 bg-gray-200 rounded-full h-2'>
              <div
                className='bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300'
                style={{ width: `${progress1}%` }}
              />
            </div>
            <div className='text-xs font-bold w-6'>{match.score.player1}</div>
          </div>

          <div className='flex items-center gap-2'>
            <div className='text-xs font-medium w-20 truncate'>
              {match.player2.name}
            </div>
            <div className='flex-1 bg-gray-200 rounded-full h-2'>
              <div
                className='bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-300'
                style={{ width: `${progress2}%` }}
              />
            </div>
            <div className='text-xs font-bold w-6'>{match.score.player2}</div>
          </div>
        </div>

        {/* Match info */}
        <div className='flex items-center justify-between text-xs text-muted-foreground'>
          <div className='flex items-center gap-1'>
            <Clock className='w-3 h-3' />
            <span>
              Bắt đầu: {new Date(match.startTime).toLocaleTimeString('vi-VN')}
            </span>
          </div>
          {match.location && (
            <div className='flex items-center gap-1'>
              <MapPin className='w-3 h-3' />
              <span className='truncate max-w-24'>{match.location}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveMatchCard;
