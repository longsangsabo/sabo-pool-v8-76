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
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></div>
            </div>
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-xs px-2 py-0.5">
              🌟 Mở
            </Badge>
            {challenge.challenge_type === 'sabo' && (
              <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300 text-xs px-1.5 py-0.5">
                SABO
              </Badge>
            )}
          </div>
          
          <Button
            onClick={() => onJoin(challenge.id)}
            className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white mobile-touch-button"
            size={isCompact ? "sm" : "default"}
          >
            <Users className="w-3.5 h-3.5 mr-1.5" />
            <span className="text-xs font-semibold">THAM GIA</span>
          </Button>
        </div>

        {/* Challenger Info */}
        <div className="flex items-center justify-between mb-3">
          {/* Challenger */}
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12 border-2 border-emerald-200">
              <AvatarImage src={challenge.challenger_profile?.avatar_url} />
              <AvatarFallback className="bg-emerald-100 text-emerald-700 font-bold">
                {challenge.challenger_profile?.full_name?.[0] || 'C'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-gray-800 truncate">
                {challenge.challenger_profile?.display_name || challenge.challenger_profile?.full_name || 'Người thách đấu'}
              </div>
              <div className="text-xs text-gray-500 font-medium">
                {challenge.challenger_profile?.verified_rank || challenge.challenger_profile?.current_rank || 'K'}
              </div>
            </div>
          </div>

          {/* Bet Info - Compact */}
          <div className="text-right">
            <div className="flex items-center gap-1 justify-end mb-1">
              <DollarSign className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-lg font-black text-amber-800">
                {challenge.bet_points}
              </span>
            </div>
            <div className="text-xs text-amber-600 font-medium">SPA điểm</div>
            <div className="text-xs text-gray-500 mt-0.5">
              Race to {challenge.race_to || 5}
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