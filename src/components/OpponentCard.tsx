import { useState } from 'react';
import { Heart, X, Zap, MapPin, Trophy, Target } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import UserAvatar from './UserAvatar';
import { useSwipeGestures } from '@/hooks/useSwipeGestures';

interface OpponentCardProps {
  opponent: {
    id: string;
    name: string;
    avatar: string;
    rank: string;
    age: number;
    location: string;
    bio: string;
    stats: {
      matches_played: number;
      matches_won: number;
      win_rate: number;
      longest_run: number;
    };
    distance?: string;
    last_active: string;
    preferred_stakes?: number[];
  };
  onSwipeLeft: (opponentId: string) => void;
  onSwipeRight: (opponentId: string) => void;
  onChallenge: (opponentId: string) => void;
  onViewProfile?: (opponentId: string) => void;
}

const OpponentCard = ({
  opponent,
  onSwipeLeft,
  onSwipeRight,
  onChallenge,
  onViewProfile,
}: OpponentCardProps) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(
    null
  );

  const swipeCallbacks = {
    onSwipeLeft: (id: string) => {
      console.log('Swiped left - Pass');
      onSwipeLeft(id);
    },
    onSwipeRight: (id: string) => {
      console.log('Swiped right - Challenge');
      onChallenge(id);
    },
    onSwipeUp: (id: string) => {
      console.log('Swiped up - Super Like');
      onSwipeRight(id); // Treat as interest
    },
    onSwipeDown: (id: string) => {
      console.log('Swiped down - View Profile');
      onViewProfile?.(id);
    },
  };

  const {
    swipeActions,
    isAnimating: isSwipeAnimating,
    swipeDirection: currentSwipeDirection,
    getSwipeTransform,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = useSwipeGestures(opponent.id, swipeCallbacks);

  const handleSwipe = (direction: 'left' | 'right') => {
    setIsAnimating(true);
    setSwipeDirection(direction);

    setTimeout(() => {
      if (direction === 'left') {
        onSwipeLeft(opponent.id);
      } else {
        onSwipeRight(opponent.id);
      }
    }, 300);
  };

  const getRankColor = (rank: string) => {
    if (rank.startsWith('E')) return 'text-purple-600 font-bold';
    if (rank.startsWith('F')) return 'text-red-600 font-bold';
    if (rank.startsWith('G')) return 'text-yellow-600 font-bold';
    if (rank.startsWith('H')) return 'text-green-600 font-bold';
    if (rank.startsWith('I')) return 'text-blue-600 font-bold';
    if (rank.startsWith('K')) return 'text-gray-600';
    return 'text-primary-blue';
  };

  const getWinRateColor = (winRate: number) => {
    if (winRate >= 70) return 'text-primary-green';
    if (winRate >= 50) return 'text-primary-blue';
    return 'text-comment-gray';
  };

  return (
    <Card
      className={`relative bg-white shadow-lg hover:shadow-xl transition-all duration-300 ${
        isAnimating || isSwipeAnimating ? 'animate-pulse' : ''
      } max-w-sm mx-auto`}
      style={{
        transform: getSwipeTransform(),
        transition: isSwipeAnimating ? 'transform 0.3s ease-out' : 'none',
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <CardContent className='p-0'>
        {/* Swipe Instructions Overlay */}
        <div className='absolute top-2 left-2 right-2 z-10'>
          <div className='bg-black/50 text-white text-xs p-2 rounded-lg backdrop-blur-sm'>
            <p className='text-center'>
              ← Bỏ qua | ↑ Quan tâm đặc biệt | → Thách đấu | ↓ Xem hồ sơ
            </p>
          </div>
        </div>

        {/* Profile Header */}
        <div className='relative'>
          <div className='h-32 bg-gradient-to-br from-primary-blue to-primary-purple rounded-t-lg'></div>
          <div className='absolute -bottom-8 left-4'>
            <UserAvatar user={opponent} size='lg' showRank={false} />
          </div>
          {opponent.distance && (
            <div className='absolute top-3 right-3'>
              <Badge className='bg-white text-primary-blue border border-primary-blue'>
                <MapPin className='w-3 h-3 mr-1' />
                {opponent.distance}
              </Badge>
            </div>
          )}
        </div>

        <div className='pt-10 px-4 pb-4'>
          {/* Basic Info */}
          <div className='mb-4'>
            <div className='flex items-center justify-between mb-2'>
              <h3 className='text-xl font-bold text-gray-900'>
                {opponent.name}
              </h3>
              <Badge className={`${getRankColor(opponent.rank)} bg-gray-100`}>
                {opponent.rank}
              </Badge>
            </div>
            <div className='flex items-center space-x-4 text-sm text-comment-gray mb-2'>
              <span>{opponent.age} tuổi</span>
              <span>•</span>
              <span>{opponent.location}</span>
            </div>
            <p className='text-sm text-gray-600 line-clamp-2'>{opponent.bio}</p>
          </div>

          {/* Stats Grid */}
          <div className='grid grid-cols-2 gap-4 mb-4 p-3 bg-tertiary rounded-lg'>
            <div className='text-center'>
              <p className='text-xs text-comment-gray'>Trận đã đấu</p>
              <p className='text-lg font-bold text-primary-blue'>
                {opponent.stats.matches_played}
              </p>
            </div>
            <div className='text-center'>
              <p className='text-xs text-comment-gray'>Thắng</p>
              <p className='text-lg font-bold text-primary-green'>
                {opponent.stats.matches_won}
              </p>
            </div>
            <div className='text-center'>
              <p className='text-xs text-comment-gray'>Tỉ lệ thắng</p>
              <p
                className={`text-lg font-bold ${getWinRateColor(opponent.stats.win_rate)}`}
              >
                {opponent.stats.win_rate}%
              </p>
            </div>
            <div className='text-center'>
              <p className='text-xs text-comment-gray'>Run dài nhất</p>
              <p className='text-lg font-bold text-gold'>
                {opponent.stats.longest_run}
              </p>
            </div>
          </div>

          {/* Preferred Stakes */}
          {opponent.preferred_stakes && (
            <div className='mb-4'>
              <p className='text-xs text-comment-gray mb-2'>
                Mức cược ưa thích:
              </p>
              <div className='flex flex-wrap gap-2'>
                {opponent.preferred_stakes.map((stake, index) => (
                  <Badge key={index} variant='outline' className='text-xs'>
                    {stake.toLocaleString()} VNĐ
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Last Active */}
          <div className='mb-4'>
            <p className='text-xs text-comment-gray'>
              Hoạt động: {opponent.last_active}
            </p>
          </div>

          {/* Action Buttons */}
          <div className='flex space-x-3'>
            <Button
              variant='outline'
              size='lg'
              onClick={() => handleSwipe('left')}
              className='flex-1 border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            >
              <X className='w-5 h-5 mr-2 text-gray-500' />
              Bỏ qua
            </Button>

            <Button
              size='lg'
              onClick={() => onChallenge(opponent.id)}
              className='flex-1 bg-primary-blue hover:bg-primary-blue/90'
            >
              <Zap className='w-5 h-5 mr-2' />
              Thách đấu
            </Button>

            <Button
              variant='outline'
              size='lg'
              onClick={() => handleSwipe('right')}
              className='flex-1 border-like-red hover:border-like-red hover:bg-like-red hover:text-white text-like-red'
            >
              <Heart className='w-5 h-5' />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OpponentCard;
