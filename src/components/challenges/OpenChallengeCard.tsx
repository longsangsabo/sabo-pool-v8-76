import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Trophy, DollarSign, Users } from 'lucide-react';
import { Challenge } from '@/types/challenge';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface OpenChallengeCardProps {
  challenge: Challenge;
  onJoin: (challengeId: string) => void;
  currentUser?: any;
  isJoining?: boolean;
}

export const OpenChallengeCard: React.FC<OpenChallengeCardProps> = ({
  challenge,
  onJoin,
  currentUser,
  isJoining = false,
}) => {
  const canJoin = currentUser && challenge.challenger_id !== currentUser.id;
  const isExpired =
    challenge.expires_at && new Date(challenge.expires_at) < new Date();

  const handleJoin = () => {
    if (canJoin && !isExpired) {
      onJoin(challenge.id);
    }
  };

  return (
    <Card className='border border-border/50 hover:border-primary/30 transition-colors'>
      <CardContent className='p-4'>
        <div className='flex items-start justify-between mb-3'>
          <div className='flex items-center gap-3'>
            <Avatar className='w-10 h-10'>
              <AvatarImage src={challenge.challenger_profile?.avatar_url} />
              <AvatarFallback>
                {challenge.challenger_profile?.full_name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className='font-semibold text-sm'>
                {challenge.challenger_profile?.full_name || 'Unknown Player'}
              </h3>
              <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                <span>
                  Rank: {challenge.challenger_profile?.current_rank || 'K'}
                </span>
                <span>•</span>
                <span>
                  {(challenge.challenger_profile as any)?.spa_points || 0} SPA
                </span>
              </div>
            </div>
          </div>

          <Badge
            variant={isExpired ? 'destructive' : 'secondary'}
            className='text-xs'
          >
            {isExpired ? 'Hết hạn' : 'Mở'}
          </Badge>
        </div>

        {/* Challenge Details */}
        <div className='space-y-2 mb-4'>
          <div className='flex items-center justify-between text-sm'>
            <div className='flex items-center gap-1 text-primary'>
              <DollarSign className='w-4 h-4' />
              <span className='font-semibold'>{challenge.bet_points} điểm</span>
            </div>
            <div className='flex items-center gap-1 text-orange-600'>
              <Trophy className='w-4 h-4' />
              <span>Race to {challenge.race_to}</span>
            </div>
          </div>

          {challenge.message && (
            <p className='text-sm text-muted-foreground bg-muted/50 p-2 rounded text-center italic'>
              "{challenge.message}"
            </p>
          )}

          <div className='flex items-center justify-between text-xs text-muted-foreground'>
            <div className='flex items-center gap-1'>
              <Clock className='w-3 h-3' />
              <span>
                {formatDistanceToNow(new Date(challenge.created_at), {
                  addSuffix: true,
                  locale: vi,
                })}
              </span>
            </div>
            {challenge.expires_at && (
              <span className={isExpired ? 'text-destructive' : ''}>
                Hết hạn{' '}
                {formatDistanceToNow(new Date(challenge.expires_at), {
                  addSuffix: true,
                  locale: vi,
                })}
              </span>
            )}
          </div>
        </div>

        {/* Action Button */}
        <Button
          onClick={handleJoin}
          disabled={!canJoin || isExpired || isJoining}
          className='w-full'
          variant={canJoin && !isExpired ? 'default' : 'secondary'}
          size='sm'
        >
          {isJoining ? (
            'Đang tham gia...'
          ) : !canJoin ? (
            challenge.challenger_id === currentUser?.id ? (
              'Thách đấu của bạn'
            ) : (
              'Không thể tham gia'
            )
          ) : isExpired ? (
            'Đã hết hạn'
          ) : (
            <>
              <Users className='w-4 h-4 mr-1' />
              Tham gia thách đấu
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
