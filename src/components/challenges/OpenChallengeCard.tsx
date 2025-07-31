import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, DollarSign, MapPin, Clock, Trophy } from 'lucide-react';

interface OpenChallengeCardProps {
  challenge: {
    id: string;
    challenger_id: string;
    bet_points: number;
    race_to?: number;
    challenge_type?: string;
    created_at: string;
    challenger_profile?: {
      full_name?: string;
      display_name?: string;
      avatar_url?: string;
      current_rank?: string;
      verified_rank?: string;
      spa_points?: number;
    };
    club_profiles?: {
      club_name: string;
      address: string;
    };
    message?: string;
  };
  onJoin: (challengeId: string) => void;
  variant?: 'default' | 'compact';
}

const OpenChallengeCard: React.FC<OpenChallengeCardProps> = ({ 
  challenge, 
  onJoin, 
  variant = 'default' 
}) => {
  const isCompact = variant === 'compact';

  return (
    <Card className="bg-gradient-to-br from-emerald-50/70 to-green-50/70 border-emerald-200/50 hover:border-emerald-300/70 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-200">
      <CardContent className={isCompact ? "p-4" : "p-6"}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 w-3 h-3 bg-emerald-500 rounded-full animate-ping"></div>
            </div>
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">
              🌟 Mở - Chờ đối thủ
            </Badge>
            {challenge.challenge_type === 'sabo' && (
              <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                SABO
              </Badge>
            )}
          </div>
          
          <Button
            onClick={() => onJoin(challenge.id)}
            className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white"
            size={isCompact ? "sm" : "default"}
          >
            <Users className="w-4 h-4 mr-2" />
            THAM GIA
          </Button>
        </div>

        {/* Challenger Info */}
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
              {challenge.challenger_profile?.display_name || challenge.challenger_profile?.full_name || 'Người thách đấu'}
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

          {/* Waiting for opponent */}
          <div className={`${isCompact ? 'col-span-1' : 'col-span-2'} text-center`}>
            <div className={`${isCompact ? 'w-10 h-10' : 'w-12 h-12'} mx-auto mb-2 rounded-full border-2 border-dashed border-emerald-300 flex items-center justify-center`}>
              <Users className={`${isCompact ? 'w-4 h-4' : 'w-5 h-5'} text-emerald-500`} />
            </div>
            <div className={`${isCompact ? 'text-xs' : 'text-sm'} font-semibold text-emerald-600`}>
              Đang tìm đối thủ
            </div>
            <div className={`${isCompact ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
              Tham gia ngay!
            </div>
          </div>
        </div>

        {!isCompact && (
          <>
            {/* Details */}
            <div className="space-y-2 pt-3 border-t border-emerald-200/50">
              {challenge.club_profiles?.club_name && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate">{challenge.club_profiles.club_name}</span>
                </div>
              )}
              
              {challenge.message && (
                <div className="bg-emerald-50 rounded-md p-2 border border-emerald-200/50">
                  <span className="text-sm text-emerald-800 italic">"{challenge.message}"</span>
                </div>
              )}

              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Tạo: {new Date(challenge.created_at).toLocaleDateString('vi-VN')}</span>
                <span className="flex items-center gap-1">
                  <Trophy className="w-3 h-3" />
                  {challenge.challenger_profile?.spa_points || 0} SPA
                </span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default OpenChallengeCard;