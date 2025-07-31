import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Target, Clock, Trophy, Calculator } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { formatHandicapDisplay } from '@/utils/saboHandicap';
import type { SaboChallengeData } from '@/hooks/useSaboChallenge';

interface SaboChallengeCardProps {
  challenge: SaboChallengeData;
  isOwner: boolean;
  onAccept?: (challengeId: string) => void;
  onDecline?: (challengeId: string) => void;
  onCancel?: (challengeId: string) => void;
}

const SaboChallengeCard: React.FC<SaboChallengeCardProps> = ({
  challenge,
  isOwner,
  onAccept,
  onDecline,
  onCancel,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'declined': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Chờ phản hồi';
      case 'accepted': return 'Đã chấp nhận';
      case 'declined': return 'Đã từ chối';
      case 'completed': return 'Hoàn thành';
      default: return status;
    }
  };

  const handicapDisplay = challenge.handicap_data 
    ? formatHandicapDisplay({
        isValid: true,
        rankDifference: challenge.handicap_data.rank_difference,
        handicapChallenger: challenge.handicap_data.handicap_challenger,
        handicapOpponent: challenge.handicap_data.handicap_opponent,
        challengerRank: challenge.handicap_data.challenger_rank,
        opponentRank: challenge.handicap_data.opponent_rank,
        stakeAmount: challenge.bet_points,
        explanation: challenge.handicap_data.explanation,
        errorMessage: undefined
      })
    : null;

  const opponent = isOwner ? challenge.opponent : challenge.challenger;
  const opponentLabel = isOwner ? 'Đối thủ' : 'Thách đấu từ';

  return (
    <Card className="border-l-4 border-l-orange-500">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-orange-500" />
            <span className="font-semibold text-orange-700">SABO Challenge</span>
            <Badge className={`text-xs ${getStatusColor(challenge.status)}`}>
              {getStatusText(challenge.status)}
            </Badge>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <Clock className="h-4 w-4 inline mr-1" />
            {formatDistanceToNow(new Date(challenge.created_at), { 
              addSuffix: true, 
              locale: vi 
            })}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Opponent Info */}
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={opponent?.avatar_url} />
            <AvatarFallback>{opponent?.full_name?.[0] || '?'}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="font-medium">{opponentLabel}: {opponent?.full_name || 'Không xác định'}</div>
            <div className="text-sm text-muted-foreground">
              Hạng: <Badge variant="outline">{opponent?.current_rank || 'N/A'}</Badge>
            </div>
          </div>
        </div>

        {/* Challenge Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Mức cược:</span>
            <div className="font-medium">{challenge.bet_points} điểm</div>
          </div>
          <div>
            <span className="text-muted-foreground">Race to:</span>
            <div className="font-medium">{challenge.race_to} bàn</div>
          </div>
        </div>

        {/* Handicap Info */}
        {handicapDisplay && (
          <div className={`p-3 rounded-lg border ${
            handicapDisplay.color === 'green' ? 'bg-green-50 border-green-200' :
            handicapDisplay.color === 'blue' ? 'bg-blue-50 border-blue-200' :
            handicapDisplay.color === 'red' ? 'bg-red-50 border-red-200' :
            'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <Calculator className="h-4 w-4" />
              <span className="font-medium text-sm">{handicapDisplay.title}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {handicapDisplay.description}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {challenge.status === 'pending' && (
          <div className="flex gap-2 pt-2">
            {isOwner ? (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onCancel?.(challenge.id)}
                className="flex-1"
              >
                Hủy thách đấu
              </Button>
            ) : (
              <>
                <Button 
                  size="sm" 
                  onClick={() => onAccept?.(challenge.id)}
                  className="flex-1"
                >
                  Chấp nhận
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onDecline?.(challenge.id)}
                  className="flex-1"
                >
                  Từ chối
                </Button>
              </>
            )}
          </div>
        )}

        {challenge.status === 'accepted' && (
          <div className="flex items-center justify-center gap-2 py-2 px-4 bg-green-50 rounded-lg">
            <Trophy className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">
              Thách đấu đã được chấp nhận - Chuẩn bị thi đấu!
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SaboChallengeCard;