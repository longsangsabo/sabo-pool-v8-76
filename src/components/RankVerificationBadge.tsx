import React from 'react';
import { Trophy, Shield, Star, Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface RankVerificationBadgeProps {
  rank: string;
  verified?: boolean;
  size?: 'sm' | 'md' | 'lg';
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  showIcon?: boolean;
}

const RankVerificationBadge: React.FC<RankVerificationBadgeProps> = ({
  rank,
  verified = true,
  size = 'md',
  position = 'top-right',
  showIcon = true,
}) => {
  if (!rank || rank === 'K') return null;

  const getRankColor = (rank: string) => {
    if (rank.startsWith('E'))
      return 'bg-gradient-to-r from-purple-400 to-purple-500 text-purple-900';
    if (rank.startsWith('F'))
      return 'bg-gradient-to-r from-red-400 to-red-500 text-red-900';
    if (rank.startsWith('G'))
      return 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900';
    if (rank.startsWith('H'))
      return 'bg-gradient-to-r from-green-400 to-green-500 text-green-900';
    if (rank.startsWith('I'))
      return 'bg-gradient-to-r from-blue-400 to-blue-500 text-blue-900';
    if (rank.startsWith('K'))
      return 'bg-gradient-to-r from-gray-400 to-gray-500 text-gray-900';
    return 'bg-gradient-to-r from-gray-400 to-gray-500 text-gray-900';
  };

  const getRankIcon = (rank: string) => {
    if (rank.startsWith('E')) return <Crown className='w-3 h-3' />;
    if (rank.startsWith('F')) return <Trophy className='w-3 h-3' />;
    if (rank.startsWith('G')) return <Star className='w-3 h-3' />;
    if (rank.startsWith('H')) return <Shield className='w-3 h-3' />;
    return <Shield className='w-3 h-3' />;
  };

  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-xs';
      case 'lg':
        return 'px-4 py-2 text-sm';
      default:
        return 'px-3 py-1 text-xs';
    }
  };

  const getPositionClasses = (position: string) => {
    switch (position) {
      case 'top-left':
        return 'top-2 left-2';
      case 'bottom-right':
        return 'bottom-2 right-2';
      case 'bottom-left':
        return 'bottom-2 left-2';
      default:
        return 'top-2 right-2';
    }
  };

  return (
    <div className={`absolute ${getPositionClasses(position)} z-10`}>
      <Badge
        className={`${getRankColor(rank)} ${getSizeClasses(size)} font-bold flex items-center gap-1 shadow-lg border-2 border-white/20 backdrop-blur-sm`}
      >
        {showIcon && getRankIcon(rank)}
        <span>Hạng {rank}</span>
        {verified && (
          <div className='w-2 h-2 bg-white rounded-full flex items-center justify-center'>
            <div className='w-1 h-1 bg-green-500 rounded-full'></div>
          </div>
        )}
      </Badge>
    </div>
  );
};

export default RankVerificationBadge;
