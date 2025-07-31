import React from 'react';
import { MapPin, Clock, Trophy, Users, Zap } from 'lucide-react';

import { Badge } from '@/components/ui/badge';

interface PlayerCardProps {
  player: {
    user_id: string;
    full_name: string;
    avatar_url?: string;
    current_rank: string;
    ranking_points: number;
    matches_played: number;
    matches_won: number;
    address?: string;
    preferred_play_times?: string[];
    min_bet_points: number;
    max_bet_points: number;
    age?: number;
    preferred_club?: {
      name: string;
      address: string;
    };
  };
  index?: number;
  onChallenge?: () => void;
}

const getTimeLabel = (time: string) => {
  const labels: Record<string, string> = {
    morning: 'Sáng',
    afternoon: 'Chiều',
    evening: 'Tối',
    night: 'Đêm',
  };
  return labels[time] || time;
};

const EnhancedPlayerCard = ({
  player,
  index = 0,
  onChallenge,
}: PlayerCardProps) => {
  const winRate =
    player.matches_played > 0
      ? Math.round((player.matches_won / player.matches_played) * 100)
      : 0;

  return (
    <div
      className='absolute inset-0 bg-white rounded-2xl shadow-2xl overflow-hidden'
      style={{
        transform: `scale(${1 - index * 0.05}) translateY(${index * 10}px)`,
        zIndex: 10 - index,
      }}
    >
      {/* Background & Avatar */}
      <div className='h-1/2 relative'>
        <img
          src={player.avatar_url || '/placeholder.svg'}
          className='w-full h-full object-cover'
          alt={player.full_name}
        />
        <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent' />

        {/* Online Status */}
        <div className='absolute top-4 right-4 flex items-center space-x-2'>
          <div className='w-3 h-3 bg-green-400 rounded-full animate-pulse'></div>
          <span className='text-white text-sm font-semibold bg-black/30 px-2 py-1 rounded-full'>
            Đang online
          </span>
        </div>

        {/* Basic Info */}
        <div className='absolute bottom-4 left-4 text-white'>
          <h2 className='text-2xl font-bold'>
            {player.full_name}
            {player.age ? `, ${player.age}` : ''}
          </h2>
          <div className='flex items-center space-x-2 mt-1'>
            <Badge className='bg-yellow-500 text-yellow-900 font-bold'>
              {player.current_rank}
            </Badge>
            <span className='text-sm'>{player.address}</span>
          </div>
        </div>
      </div>

      {/* Detailed Info */}
      <div className='h-1/2 p-4 space-y-4'>
        {/* Club Info */}
        <div className='bg-blue-50 rounded-lg p-3'>
          <div className='flex items-center space-x-2 mb-2'>
            <MapPin className='w-4 h-4 text-blue-600' />
            <span className='font-semibold text-blue-800'>CLB thường chơi</span>
          </div>
          <p className='text-sm text-blue-700'>
            {player.preferred_club?.name || 'Chưa có CLB ưa thích'}
          </p>
          {player.preferred_club?.address && (
            <p className='text-xs text-blue-600'>
              {player.preferred_club.address}
            </p>
          )}
        </div>

        {/* Playing Schedule */}
        <div className='bg-green-50 rounded-lg p-3'>
          <div className='flex items-center space-x-2 mb-2'>
            <Clock className='w-4 h-4 text-green-600' />
            <span className='font-semibold text-green-800'>Giờ hay chơi</span>
          </div>
          <div className='flex flex-wrap gap-1'>
            {player.preferred_play_times?.map(time => (
              <Badge
                key={time}
                variant='secondary'
                className='bg-green-200 text-green-800 text-xs'
              >
                {getTimeLabel(time)}
              </Badge>
            )) || <span className='text-xs text-green-700'>Chưa cập nhật</span>}
          </div>
        </div>

        {/* Betting Range */}
        <div className='bg-purple-50 rounded-lg p-3'>
          <div className='flex items-center space-x-2 mb-2'>
            <Trophy className='w-4 h-4 text-purple-600' />
            <span className='font-semibold text-purple-800'>
              Mức cược (Điểm Ranking)
            </span>
          </div>
          <div className='flex justify-between items-center'>
            <span className='text-sm text-purple-700'>
              {player.min_bet_points} - {player.max_bet_points} điểm
            </span>
            <Badge className='bg-purple-200 text-purple-800 font-bold text-xs'>
              Hiện có: {player.ranking_points} điểm
            </Badge>
          </div>
        </div>

        {/* Stats */}
        <div className='grid grid-cols-3 gap-3 text-center'>
          <div>
            <div className='text-lg font-bold text-blue-600'>
              {player.matches_played}
            </div>
            <div className='text-xs text-gray-500'>Trận đấu</div>
          </div>
          <div>
            <div className='text-lg font-bold text-green-600'>{winRate}%</div>
            <div className='text-xs text-gray-500'>Tỷ lệ thắng</div>
          </div>
          <div>
            <div className='text-lg font-bold text-orange-600'>
              {player.matches_won}
            </div>
            <div className='text-xs text-gray-500'>Thắng</div>
          </div>
        </div>

        {/* Challenge Button */}
        {onChallenge && (
          <button
            onClick={onChallenge}
            className='w-full mt-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 hover:from-blue-600 hover:to-purple-700 transition-colors'
          >
            <Zap className='w-5 h-5' />
            <span>Thách đấu</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default EnhancedPlayerCard;
