import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Clock, Trophy, DollarSign } from 'lucide-react';

interface OngoingChallengeCardProps {
  challenge: {
    id: string;
    challenger_id: string;
    opponent_id?: string;
    bet_points: number;
    race_to?: number;
    challenge_type?: string;
    challenger_profile?: {
      full_name: string;
      avatar_url?: string;
      current_rank?: string;
      verified_rank?: string;
    };
    opponent_profile?: {
      full_name: string;
      avatar_url?: string;
      current_rank?: string;
      verified_rank?: string;
    };
    message?: string;
  };
  variant?: 'default' | 'compact';
}

const OngoingChallengeCard: React.FC<OngoingChallengeCardProps> = ({ 
  challenge, 
  variant = 'default' 
}) => {
  const isCompact = variant === 'compact';

  return (
    <Card className="bg-gradient-to-br from-blue-50/70 to-indigo-50/70 border-blue-200/50 hover:border-blue-300/70 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-200">
      <CardContent className={isCompact ? "p-4" : "p-6"}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 w-3 h-3 bg-blue-500 rounded-full animate-ping"></div>
            </div>
            <Badge className="bg-blue-100 text-blue-800 border-blue-300">
              ⚡ Đang diễn ra
            </Badge>
          </div>
          
          <div className="text-xs text-blue-600 font-medium">
            LIVE
          </div>
        </div>

        <div className={`grid ${isCompact ? 'grid-cols-3' : 'grid-cols-5'} gap-3 items-center mb-4`}>
          {/* Challenger */}
          <div className={`${isCompact ? 'col-span-1' : 'col-span-2'} text-center`}>
            <Avatar className={`${isCompact ? 'w-10 h-10' : 'w-12 h-12'} mx-auto mb-2`}>
              <AvatarImage src={challenge.challenger_profile?.avatar_url} />
              <AvatarFallback>
                {challenge.challenger_profile?.full_name?.[0] || 'C'}
              </AvatarFallback>
            </Avatar>
            <div className={`${isCompact ? 'text-xs' : 'text-sm'} font-semibold truncate`}>
              {challenge.challenger_profile?.full_name || 'Thách đấu'}
            </div>
            <div className={`${isCompact ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
              {challenge.challenger_profile?.verified_rank || challenge.challenger_profile?.current_rank || 'K'}
            </div>
          </div>

          {/* Bet Info */}
          <div className={`${isCompact ? 'col-span-1' : 'col-span-1'} text-center`}>
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200/50 rounded-lg p-2">
              <div className="flex items-center justify-center gap-1 mb-1">
                <DollarSign className="w-3 h-3 text-amber-600" />
                <span className={`${isCompact ? 'text-xs' : 'text-sm'} font-bold text-amber-800`}>
                  {challenge.bet_points}
                </span>
              </div>
              <div className="text-xs text-amber-600">SPA điểm</div>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Race to {challenge.race_to || 5}
            </div>
          </div>

          {/* Opponent */}
          <div className={`${isCompact ? 'col-span-1' : 'col-span-2'} text-center`}>
            <Avatar className={`${isCompact ? 'w-10 h-10' : 'w-12 h-12'} mx-auto mb-2`}>
              <AvatarImage src={challenge.opponent_profile?.avatar_url} />
              <AvatarFallback>
                {challenge.opponent_profile?.full_name?.[0] || 'O'}
              </AvatarFallback>
            </Avatar>
            <div className={`${isCompact ? 'text-xs' : 'text-sm'} font-semibold truncate`}>
              {challenge.opponent_profile?.full_name || 'Đối thủ'}
            </div>
            <div className={`${isCompact ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
              {challenge.opponent_profile?.verified_rank || challenge.opponent_profile?.current_rank || 'K'}
            </div>
          </div>
        </div>

        {!isCompact && challenge.message && (
          <div className="bg-blue-50 rounded-md p-2 border border-blue-200/50 mt-3">
            <span className="text-sm text-blue-800 italic">"{challenge.message}"</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OngoingChallengeCard;