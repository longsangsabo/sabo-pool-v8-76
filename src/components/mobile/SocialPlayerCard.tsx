import React from 'react';
import { Trophy, TrendingUp, TrendingDown, Medal, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface PlayerCardProps {
  id: string;
  name: string;
  avatar?: string;
  elo: number;
  rank: number;
  winRate: number;
  totalMatches: number;
  wins: number;
  losses: number;
  eloChange?: number; // Change in last week/month
  status: 'online' | 'offline' | 'in_game';
  tier?: string;
  isVerified?: boolean;
  onClick?: () => void;
}

const SocialPlayerCard: React.FC<PlayerCardProps> = ({
  name,
  avatar,
  elo,
  rank,
  winRate,
  totalMatches,
  wins,
  losses,
  eloChange,
  status,
  tier,
  isVerified = false,
  onClick,
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'online':
        return 'border-accent-green';
      case 'in_game':
        return 'border-accent-red';
      default:
        return 'border-muted';
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'online':
        return (
          <Badge className='bg-accent-green text-white text-xs'>Online</Badge>
        );
      case 'in_game':
        return (
          <Badge className='bg-accent-red text-white text-xs animate-pulse'>
            Đang chơi
          </Badge>
        );
      default:
        return (
          <Badge className='bg-muted text-muted-foreground text-xs'>
            Offline
          </Badge>
        );
    }
  };

  const getTierIcon = () => {
    if (!tier) return null;

    switch (tier.toLowerCase()) {
      case 'bronze':
        return <Medal className='h-4 w-4 text-amber-600' />;
      case 'silver':
        return <Medal className='h-4 w-4 text-slate-400' />;
      case 'gold':
        return <Medal className='h-4 w-4 text-yellow-400' />;
      case 'platinum':
        return <Medal className='h-4 w-4 text-cyan-400' />;
      case 'diamond':
        return <Medal className='h-4 w-4 text-blue-400' />;
      default:
        return <Trophy className='h-4 w-4 text-primary' />;
    }
  };

  return (
    <Card
      className='social-card cursor-pointer ripple-effect'
      onClick={onClick}
    >
      <div className='social-card-content'>
        {/* Header with Rank & Status */}
        <div className='social-card-header'>
          <div className='flex items-center space-x-2'>
            <div className='flex items-center space-x-1'>
              {getTierIcon()}
              <span className='font-racing text-lg text-primary'>#{rank}</span>
            </div>
            {isVerified && (
              <Badge className='bg-accent-blue text-white text-xs'>
                ✓ Verified
              </Badge>
            )}
          </div>

          {getStatusBadge()}
        </div>

        {/* Player Info */}
        <div className='flex items-center space-x-4'>
          <div className='relative'>
            <Avatar className={`avatar-large border-2 ${getStatusColor()}`}>
              <AvatarImage src={avatar} />
              <AvatarFallback className='bg-gradient-to-br from-primary to-primary-glow text-primary-foreground font-bebas text-xl'>
                {name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* Status indicator dot */}
            {status === 'online' && (
              <div className='absolute -bottom-1 -right-1 w-4 h-4 bg-accent-green rounded-full border-2 border-background animate-pulse' />
            )}
            {status === 'in_game' && (
              <div className='absolute -bottom-1 -right-1 w-4 h-4 bg-accent-red rounded-full border-2 border-background animate-pulse' />
            )}
          </div>

          <div className='flex-1 min-w-0'>
            <div className='flex items-center space-x-2'>
              <h3 className='font-epilogue font-bold text-lg text-foreground truncate'>
                {name}
              </h3>
              {tier && (
                <span className='text-xs text-muted-foreground font-outfit capitalize'>
                  {tier}
                </span>
              )}
            </div>

            <div className='flex items-center space-x-1 mt-1'>
              <span className='font-racing text-2xl text-accent-blue'>
                {elo}
              </span>
              <span className='text-sm text-muted-foreground font-outfit'>
                ELO
              </span>

              {eloChange !== undefined && (
                <div
                  className={`flex items-center space-x-1 ml-2 ${
                    eloChange > 0
                      ? 'text-accent-green'
                      : eloChange < 0
                        ? 'text-accent-red'
                        : 'text-muted-foreground'
                  }`}
                >
                  {eloChange > 0 ? (
                    <TrendingUp className='h-3 w-3' />
                  ) : eloChange < 0 ? (
                    <TrendingDown className='h-3 w-3' />
                  ) : null}
                  <span className='text-xs font-racing'>
                    {eloChange > 0 ? '+' : ''}
                    {eloChange}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className='grid grid-cols-3 gap-4 border-t border-border pt-4'>
          {/* Win Rate */}
          <div className='text-center'>
            <div className='font-racing text-lg text-foreground'>
              {winRate}%
            </div>
            <div className='text-xs text-muted-foreground font-outfit'>
              Tỷ lệ thắng
            </div>
          </div>

          {/* Total Matches */}
          <div className='text-center'>
            <div className='font-racing text-lg text-foreground'>
              {totalMatches}
            </div>
            <div className='text-xs text-muted-foreground font-outfit'>
              Trận đấu
            </div>
          </div>

          {/* Wins/Losses */}
          <div className='text-center'>
            <div className='flex items-center justify-center space-x-1'>
              <span className='font-racing text-sm text-accent-green'>
                {wins}W
              </span>
              <span className='text-muted-foreground'>/</span>
              <span className='font-racing text-sm text-accent-red'>
                {losses}L
              </span>
            </div>
            <div className='text-xs text-muted-foreground font-outfit'>
              Thắng/Thua
            </div>
          </div>
        </div>

        {/* Performance Indicator */}
        {eloChange !== undefined && Math.abs(eloChange) > 50 && (
          <div
            className={`flex items-center justify-center space-x-2 p-2 rounded-xl mt-2 ${
              eloChange > 50
                ? 'bg-accent-green/10 text-accent-green'
                : 'bg-accent-red/10 text-accent-red'
            }`}
          >
            <Zap className='h-4 w-4' />
            <span className='text-xs font-epilogue font-medium'>
              {eloChange > 50 ? 'Đang lên form' : 'Cần cải thiện'}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
};

export default SocialPlayerCard;
