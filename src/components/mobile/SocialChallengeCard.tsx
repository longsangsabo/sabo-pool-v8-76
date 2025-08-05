import React from 'react';
import { Calendar, Users, Trophy, Clock, Star, Eye } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ChallengeCardProps {
  id: string;
  challenger: {
    name: string;
    avatar?: string;
    elo: number;
    winRate: number;
  };
  opponent?: {
    name: string;
    avatar?: string;
    elo: number;
    winRate: number;
  };
  gameFormat: string;
  stakeAmount?: number;
  stakeType?: 'points' | 'money';
  location?: string;
  scheduledTime?: string;
  expiresAt?: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed' | 'expired';
  isOpen?: boolean;
  message?: string;
  onAccept?: () => void;
  onDecline?: () => void;
  onView?: () => void;
  onChallenge?: () => void; // For open challenges
}

const SocialChallengeCard: React.FC<ChallengeCardProps> = ({
  challenger,
  opponent,
  gameFormat,
  stakeAmount,
  stakeType = 'points',
  location,
  scheduledTime,
  expiresAt,
  status,
  isOpen = false,
  message,
  onAccept,
  onDecline,
  onView,
  onChallenge,
}) => {
  const getStatusBadge = () => {
    switch (status) {
      case 'pending':
        return (
          <Badge className='bg-accent-blue text-white animate-pulse'>
            Chờ phản hồi
          </Badge>
        );
      case 'accepted':
        return (
          <Badge className='bg-accent-green text-white'>Đã chấp nhận</Badge>
        );
      case 'declined':
        return (
          <Badge className='bg-muted text-muted-foreground'>Đã từ chối</Badge>
        );
      case 'completed':
        return (
          <Badge className='bg-accent-purple text-white'>Đã hoàn thành</Badge>
        );
      case 'expired':
        return <Badge className='bg-accent-red text-white'>Đã hết hạn</Badge>;
      default:
        return null;
    }
  };

  const getELODifference = () => {
    if (!opponent) return 0;
    return Math.abs(challenger.elo - opponent.elo);
  };

  const isHighStakes = stakeAmount && stakeAmount > 1000;
  const isCloseELO = getELODifference() < 100;

  return (
    <Card className='social-card'>
      <div className='social-card-content'>
        {/* Header with Status */}
        <div className='social-card-header'>
          <div className='flex items-center space-x-2'>
            {isOpen ? (
              <Badge className='bg-accent-green text-white'>
                🌟 Thách đấu mở
              </Badge>
            ) : (
              getStatusBadge()
            )}
            {isHighStakes && (
              <Badge className='status-premium'>💎 HIGH STAKES</Badge>
            )}
            {isCloseELO && opponent && (
              <Badge className='status-hot'>🔥 BALANCED</Badge>
            )}
          </div>

          <Button variant='ghost' size='sm' onClick={onView}>
            <Eye className='h-4 w-4' />
          </Button>
        </div>

        {/* Players Section */}
        <div className='space-y-4'>
          {/* Challenger */}
          <div className='flex items-center space-x-3'>
            <Avatar className='avatar-medium border-2 border-primary'>
              <AvatarImage src={challenger.avatar} />
              <AvatarFallback className='bg-primary text-primary-foreground font-bebas'>
                {challenger.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className='flex-1 min-w-0'>
              <div className='flex items-center space-x-2'>
                <h3 className='font-epilogue font-semibold text-foreground truncate'>
                  {challenger.name}
                </h3>
                <span className='text-xs text-primary font-racing'>
                  Thách đấu
                </span>
              </div>
              <div className='flex items-center space-x-3 text-sm text-muted-foreground'>
                <span className='font-racing text-accent-blue'>
                  {challenger.elo} ELO
                </span>
                <span className='font-outfit'>{challenger.winRate}% thắng</span>
              </div>
            </div>
          </div>

          {/* VS Divider */}
          {opponent && (
            <>
              <div className='flex items-center justify-center'>
                <div className='flex-1 h-px bg-border'></div>
                <span className='px-3 text-xs font-bebas text-muted-foreground bg-background'>
                  VS
                </span>
                <div className='flex-1 h-px bg-border'></div>
              </div>

              {/* Opponent */}
              <div className='flex items-center space-x-3'>
                <Avatar className='avatar-medium border-2 border-accent-green'>
                  <AvatarImage src={opponent.avatar} />
                  <AvatarFallback className='bg-accent-green text-white font-bebas'>
                    {opponent.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className='flex-1 min-w-0'>
                  <div className='flex items-center space-x-2'>
                    <h3 className='font-epilogue font-semibold text-foreground truncate'>
                      {opponent.name}
                    </h3>
                    <span className='text-xs text-accent-green font-racing'>
                      Đối thủ
                    </span>
                  </div>
                  <div className='flex items-center space-x-3 text-sm text-muted-foreground'>
                    <span className='font-racing text-accent-blue'>
                      {opponent.elo} ELO
                    </span>
                    <span className='font-outfit'>
                      {opponent.winRate}% thắng
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Challenge Details */}
        <div className='space-y-3 border-t border-border pt-4'>
          {/* Game Format & Stakes */}
          <div className='flex items-center justify-between'>
            <div className='flex items-center text-sm text-muted-foreground'>
              <Trophy className='h-4 w-4 mr-2 text-primary' />
              <span className='font-outfit'>{gameFormat}</span>
            </div>

            {stakeAmount && (
              <div className='font-racing text-right'>
                <div className='text-lg text-primary'>
                  {stakeType === 'money'
                    ? `${stakeAmount.toLocaleString('vi-VN')} VNĐ`
                    : `${stakeAmount} điểm`}
                </div>
                <div className='text-xs text-muted-foreground'>Cược</div>
              </div>
            )}
          </div>

          {/* Time & Location */}
          <div className='grid grid-cols-1 gap-2'>
            {scheduledTime && (
              <div className='flex items-center text-sm text-muted-foreground'>
                <Clock className='h-4 w-4 mr-2 text-accent-blue' />
                <span className='font-outfit'>
                  {new Date(scheduledTime).toLocaleString('vi-VN')}
                </span>
              </div>
            )}

            {location && (
              <div className='flex items-center text-sm text-muted-foreground'>
                <Calendar className='h-4 w-4 mr-2 text-accent-green' />
                <span className='font-outfit'>{location}</span>
              </div>
            )}
          </div>

          {/* Message */}
          {message && (
            <div className='bg-muted/30 rounded-xl p-3'>
              <p className='message-text'>"{message}"</p>
            </div>
          )}

          {/* Expiry Warning */}
          {expiresAt && status === 'pending' && (
            <div className='flex items-center text-xs text-accent-red'>
              <Clock className='h-3 w-3 mr-1' />
              <span className='font-outfit'>
                Hết hạn: {new Date(expiresAt).toLocaleString('vi-VN')}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className='flex gap-2 pt-2'>
          {isOpen && onChallenge ? (
            <Button
              onClick={onChallenge}
              className='flex-1 social-button-primary'
            >
              <Star className='h-4 w-4 mr-2' />
              Thách đấu
            </Button>
          ) : status === 'pending' && onAccept && onDecline ? (
            <>
              <Button
                variant='outline'
                onClick={onDecline}
                className='flex-1 social-button-secondary'
              >
                Từ chối
              </Button>
              <Button
                onClick={onAccept}
                className='flex-1 social-button-primary'
              >
                Chấp nhận
              </Button>
            </>
          ) : (
            <Button
              variant='outline'
              onClick={onView}
              className='flex-1 social-button-secondary'
            >
              Chi tiết
            </Button>
          )}
        </div>
      </div>

      {/* Ripple effect */}
      <div className='absolute inset-0 rounded-2xl overflow-hidden pointer-events-none'>
        <div className='absolute inset-0 bg-primary/5 rounded-2xl opacity-0 transition-opacity duration-150 active:opacity-100' />
      </div>
    </Card>
  );
};

export default SocialChallengeCard;
