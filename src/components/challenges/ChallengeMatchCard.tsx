import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clock, Trophy, Target } from 'lucide-react';
import { Challenge } from '@/types/challenge';
import { ScoreEntryModal } from './ScoreEntryModal';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface ChallengeMatchCardProps {
  challenge: Challenge;
  currentUserId: string;
  onSubmitScore: (challengeId: string, challengerScore: number, opponentScore: number) => Promise<void>;
  isSubmittingScore: boolean;
}

export const ChallengeMatchCard: React.FC<ChallengeMatchCardProps> = ({
  challenge,
  currentUserId,
  onSubmitScore,
  isSubmittingScore
}) => {
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);

  const challengerName = challenge.challenger_profile?.display_name || challenge.challenger_profile?.full_name || 'Người thách đấu';
  const opponentName = challenge.opponent_profile?.display_name || challenge.opponent_profile?.full_name || 'Đối thủ';
  
  const isChallenger = currentUserId === challenge.challenger_id;
  const isOpponent = currentUserId === challenge.opponent_id;
  const isParticipant = isChallenger || isOpponent;

  // Determine match status
  const getMatchStatus = () => {
    if (challenge.status === 'completed') {
      const challengerScore = challenge.challenger_score || 0;
      const opponentScore = challenge.opponent_score || 0;
      const winnerId = challengerScore > opponentScore ? challenge.challenger_id : challenge.opponent_id;
      const isWinner = winnerId === currentUserId;
      
      return {
        badge: isWinner ? 'Thắng' : 'Thua',
        variant: isWinner ? 'default' : 'destructive' as const,
        score: `${challengerScore} - ${opponentScore}`
      };
    }
    
    if (challenge.status === 'accepted') {
      const scheduledTime = challenge.scheduled_time ? new Date(challenge.scheduled_time) : null;
      const now = new Date();
      
      if (scheduledTime && scheduledTime < now) {
        return {
          badge: 'Đang diễn ra',
          variant: 'default' as const
        };
      }
      
      return {
        badge: 'Sắp diễn ra',
        variant: 'secondary' as const
      };
    }

    return {
      badge: 'Chờ xử lý',
      variant: 'outline' as const
    };
  };

  const matchStatus = getMatchStatus();
  const canEnterScore = challenge.status === 'accepted' && isParticipant;

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          {/* Header with status */}
          <div className="flex justify-between items-center mb-4">
            <Badge variant={matchStatus.variant as "default" | "destructive" | "secondary" | "outline"} className="text-xs">
              {matchStatus.badge}
            </Badge>
            
            {challenge.scheduled_time && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {formatDistanceToNow(new Date(challenge.scheduled_time), { 
                  addSuffix: true, 
                  locale: vi 
                })}
              </div>
            )}
          </div>

          {/* Players */}
          <div className="flex items-center justify-between mb-4">
            {/* Challenger */}
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={challenge.challenger_profile?.avatar_url} />
                <AvatarFallback>{challengerName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">
                  {challengerName}
                  {isChallenger && <span className="text-primary ml-1">(Bạn)</span>}
                </p>
                <p className="text-xs text-muted-foreground">
                  {challenge.challenger_profile?.verified_rank || 'Chưa xác định'}
                </p>
              </div>
            </div>

            {/* VS / Score */}
            <div className="text-center px-4">
              {challenge.status === 'completed' && matchStatus.score ? (
                <div className="text-lg font-bold">{matchStatus.score}</div>
              ) : (
                <div className="text-lg font-bold text-muted-foreground">VS</div>
              )}
            </div>

            {/* Opponent */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="font-medium text-sm">
                  {opponentName}
                  {isOpponent && <span className="text-primary ml-1">(Bạn)</span>}
                </p>
                <p className="text-xs text-muted-foreground">
                  {challenge.opponent_profile?.verified_rank || 'Chưa xác định'}
                </p>
              </div>
              <Avatar className="w-10 h-10">
                <AvatarImage src={challenge.opponent_profile?.avatar_url} />
                <AvatarFallback>{opponentName.charAt(0)}</AvatarFallback>
              </Avatar>
            </div>
          </div>

          {/* Match Info */}
          <div className="grid grid-cols-3 gap-4 mb-4 text-center">
            <div className="flex flex-col items-center gap-1">
              <Target className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Race to</span>
              <span className="font-semibold">{challenge.race_to || 8}</span>
            </div>
            
            <div className="flex flex-col items-center gap-1">
              <span className="text-sm font-bold text-muted-foreground">SPA</span>
              <span className="text-xs text-muted-foreground">Cược</span>
              <span className="font-semibold">{challenge.bet_points || 100}</span>
            </div>
            
            <div className="flex flex-col items-center gap-1">
              <Trophy className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Câu lạc bộ</span>
              <span className="font-semibold capitalize">{challenge.club?.name || 'CLB SABO'}</span>
            </div>
          </div>

          {/* Action Button */}
          {canEnterScore && (
            <Button
              onClick={() => setIsScoreModalOpen(true)}
              disabled={isSubmittingScore}
              className="w-full"
              variant="default"
            >
              {isSubmittingScore ? 'Đang ghi nhận...' : '📊 Nhập Tỷ Số'}
            </Button>
          )}

          {/* Match Notes */}
          {challenge.message && (
            <div className="mt-3 p-2 bg-muted/30 rounded text-xs">
              <strong>Ghi chú:</strong> {challenge.message}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Score Entry Modal */}
      <ScoreEntryModal
        challenge={challenge}
        isOpen={isScoreModalOpen}
        onClose={() => setIsScoreModalOpen(false)}
        onSubmitScore={onSubmitScore}
        currentUserId={currentUserId}
      />
    </>
  );
};