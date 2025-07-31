import React from 'react';
import { Trophy, MapPin, Zap, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface DiscoveryStatsProps {
  userPoints: number;
  userRank: string;
  remainingPlayers: number;
  currentPlayer?: any;
}

const DiscoveryStats = ({
  userPoints,
  userRank,
  remainingPlayers,
  currentPlayer,
}: DiscoveryStatsProps) => {
  return (
    <div className='px-4 mb-4 relative z-20'>
      {/* User Stats Row */}
      <div className='flex justify-center space-x-6 text-white text-sm mb-3'>
        <div className='text-center'>
          <div className='font-bold text-lg'>{userPoints}</div>
          <div className='opacity-80 text-xs'>Điểm của bạn</div>
        </div>
        <div className='text-center'>
          <Badge className='bg-yellow-500 text-yellow-900 font-bold px-2 py-1'>
            {userRank}
          </Badge>
          <div className='opacity-80 text-xs mt-1'>Hạng hiện tại</div>
        </div>
        <div className='text-center'>
          <div className='font-bold text-lg'>{remainingPlayers}</div>
          <div className='opacity-80 text-xs'>Người chơi</div>
        </div>
      </div>

      {/* Current Player Preview */}
      {currentPlayer && (
        <div className='bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 text-white'>
          <div className='flex items-center justify-between text-sm'>
            <div className='flex items-center space-x-2'>
              <div className='w-6 h-6 bg-white/20 rounded-full flex items-center justify-center'>
                <Users className='w-3 h-3' />
              </div>
              <span className='font-semibold'>{currentPlayer.full_name}</span>
              <Badge
                variant='secondary'
                className='text-xs bg-white/20 border-none'
              >
                {currentPlayer.current_rank}
              </Badge>
            </div>
            <div className='flex items-center space-x-3 text-xs opacity-80'>
              <div className='flex items-center space-x-1'>
                <Trophy className='w-3 h-3' />
                <span>{currentPlayer.ranking_points}đ</span>
              </div>
              {currentPlayer.preferred_club && (
                <div className='flex items-center space-x-1'>
                  <MapPin className='w-3 h-3' />
                  <span>{currentPlayer.preferred_club.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscoveryStats;
