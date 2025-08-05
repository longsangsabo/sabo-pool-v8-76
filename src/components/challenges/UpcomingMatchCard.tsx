import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clock, MapPin, Bell, DollarSign } from 'lucide-react';

interface UpcomingMatchCardProps {
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
    scheduledTime: string;
    raceToTarget: number;
    location?: string;
    betPoints?: number;
    timeUntilStart?: string;
  };
  onRemind?: (matchId: string) => void;
  onReschedule?: (matchId: string) => void;
}

const UpcomingMatchCard: React.FC<UpcomingMatchCardProps> = ({
  match,
  onRemind,
  onReschedule,
}) => {
  const getTimeColor = () => {
    const now = new Date();
    const scheduled = new Date(match.scheduledTime);
    const diffHours = (scheduled.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffHours < 1) return 'text-red-600';
    if (diffHours < 24) return 'text-amber-600';
    return 'text-green-600';
  };

  const formatTimeUntil = () => {
    const now = new Date();
    const scheduled = new Date(match.scheduledTime);
    const diffMs = scheduled.getTime() - now.getTime();

    if (diffMs < 0) return 'Đã quá giờ';

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours === 0) return `${diffMinutes} phút`;
    if (diffHours < 24) return `${diffHours}h ${diffMinutes}m`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} ngày`;
  };

  return (
    <Card className='bg-gradient-to-br from-amber-50/70 to-yellow-50/70 border-amber-200/50 hover:border-amber-300/70 transition-all duration-200 hover:shadow-lg hover:shadow-amber-500/10'>
      <CardContent className='p-4'>
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center gap-2'>
            <Clock className={`w-4 h-4 ${getTimeColor()}`} />
            <Badge
              variant='outline'
              className={`${getTimeColor()} border-current`}
            >
              {formatTimeUntil()}
            </Badge>
          </div>

          <div className='flex items-center gap-2'>
            {match.betPoints && (
              <Badge
                variant='outline'
                className='text-amber-700 border-amber-300'
              >
                <DollarSign className='w-3 h-3 mr-1' />
                {match.betPoints}
              </Badge>
            )}
            <Button
              size='sm'
              variant='outline'
              onClick={() => onRemind?.(match.id)}
              className='gap-1'
            >
              <Bell className='w-4 h-4' />
              REMIND
            </Button>
          </div>
        </div>

        {/* Players */}
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

          {/* VS */}
          <div className='text-center'>
            <div className='text-xl font-bold text-muted-foreground'>VS</div>
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

        {/* Schedule info */}
        <div className='space-y-2 text-xs text-muted-foreground'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-1'>
              <Clock className='w-3 h-3' />
              <span>
                {new Date(match.scheduledTime).toLocaleString('vi-VN')}
              </span>
            </div>
            {match.location && (
              <div className='flex items-center gap-1'>
                <MapPin className='w-3 h-3' />
                <span className='truncate max-w-24'>{match.location}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UpcomingMatchCard;
