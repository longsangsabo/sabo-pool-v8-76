import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Challenge } from '@/types/challenge';
import { Target, Clock, CheckCircle, AlertCircle, Trophy } from 'lucide-react';

interface ScoreSubmissionFormProps {
  challenge: Challenge;
  isClubOwner: boolean;
  onScoreSubmitted: () => void;
}

const ScoreSubmissionForm: React.FC<ScoreSubmissionFormProps> = ({
  challenge,
  isClubOwner,
  onScoreSubmitted,
}) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [challengerScore, setChallengerScore] = useState<number>(
    challenge.challenger_submitted_score ||
      challenge.challenger_final_score ||
      0
  );
  const [opponentScore, setOpponentScore] = useState<number>(
    challenge.opponent_submitted_score || challenge.opponent_final_score || 0
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isChallenger = user?.id === challenge.challenger_id;
  const isOpponent = user?.id === challenge.opponent_id;
  const isParticipant = isChallenger || isOpponent;

  const canSubmitScore = isParticipant || isClubOwner;
  const canConfirmResult =
    isClubOwner && challenge.score_confirmation_status === 'score_confirmed';

  const getScoreStatus = () => {
    if (challenge.score_confirmation_status === 'completed') {
      return {
        text: 'Đã hoàn thành',
        variant: 'default' as const,
        icon: CheckCircle,
      };
    }
    if (challenge.score_confirmation_status === 'score_confirmed') {
      return {
        text: 'Chờ CLB xác nhận',
        variant: 'destructive' as const,
        icon: AlertCircle,
      };
    }
    return {
      text: 'Chờ nhập tỷ số',
      variant: 'secondary' as const,
      icon: Clock,
    };
  };

  const handleSubmitScore = async () => {
    if (!canSubmitScore) return;

    setIsSubmitting(true);
    try {
      const updates: any = {
        score_confirmation_status: 'waiting_confirmation',
        updated_at: new Date().toISOString(),
      };

      if (isClubOwner) {
        // Club owner can set both scores and confirm immediately
        updates.challenger_final_score = challengerScore;
        updates.opponent_final_score = opponentScore;
        updates.challenger_submitted_score = challengerScore;
        updates.opponent_submitted_score = opponentScore;
        updates.challenger_score_submitted_at = new Date().toISOString();
        updates.opponent_score_submitted_at = new Date().toISOString();
        updates.club_confirmed = true;
        updates.club_confirmed_by = user?.id;
        updates.club_confirmed_at = new Date().toISOString();
        updates.score_confirmation_status = 'completed';
        updates.status = 'completed';
        updates.score_confirmation_timestamp = new Date().toISOString();
        // Winner is determined by score comparison, not stored in challenges table
      } else {
        // Participants can only submit their own score
        if (isChallenger) {
          updates.challenger_submitted_score = challengerScore;
          updates.challenger_score_submitted_at = new Date().toISOString();
        } else if (isOpponent) {
          updates.opponent_submitted_score = opponentScore;
          updates.opponent_score_submitted_at = new Date().toISOString();
        }
      }

      const { error } = await supabase
        .from('challenges')
        .update(updates)
        .eq('id', challenge.id);

      if (error) throw error;

      // If club owner confirmed, notify both players
      if (isClubOwner && updates.club_confirmed) {
        const winner =
          challengerScore > opponentScore ? 'challenger' : 'opponent';
        const winnerName =
          winner === 'challenger'
            ? challenge.challenger_profile?.full_name || 'Người thách đấu'
            : challenge.opponent_profile?.full_name || 'Đối thủ';

        // Notify both players
        await Promise.all([
          supabase.from('notifications').insert({
            user_id: challenge.challenger_id,
            type: 'challenge_result_confirmed',
            title: 'Kết quả thách đấu đã được xác nhận',
            message: `Kết quả trận đấu: ${challengerScore}-${opponentScore}. ${winner === 'challenger' ? 'Bạn đã thắng!' : 'Bạn đã thua!'}`,
            metadata: {
              challenge_id: challenge.id,
              final_score: `${challengerScore}-${opponentScore}`,
              winner: winner === 'challenger' ? 'you' : 'opponent',
            },
          }),
          supabase.from('notifications').insert({
            user_id: challenge.opponent_id,
            type: 'challenge_result_confirmed',
            title: 'Kết quả thách đấu đã được xác nhận',
            message: `Kết quả trận đấu: ${challengerScore}-${opponentScore}. ${winner === 'opponent' ? 'Bạn đã thắng!' : 'Bạn đã thua!'}`,
            metadata: {
              challenge_id: challenge.id,
              final_score: `${challengerScore}-${opponentScore}`,
              winner: winner === 'opponent' ? 'you' : 'challenger',
            },
          }),
        ]);

        toast.success('Đã xác nhận kết quả thành công!');
      } else {
        toast.success('Đã gửi tỷ số thành công!');
      }

      setIsOpen(false);
      onScoreSubmitted();
    } catch (error: any) {
      console.error('Error submitting score:', error);
      toast.error('Lỗi khi gửi tỷ số: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const scoreStatus = getScoreStatus();
  const StatusIcon = scoreStatus.icon;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant={isClubOwner ? 'default' : 'outline'}
          className='gap-2'
          disabled={!canSubmitScore || challenge.status === 'completed'}
        >
          <Target className='w-4 h-4' />
          {isClubOwner ? 'Xác nhận tỷ số' : 'Nhập tỷ số'}
        </Button>
      </DialogTrigger>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Trophy className='w-5 h-5' />
            {isClubOwner ? 'Xác nhận tỷ số trận đấu' : 'Nhập tỷ số của bạn'}
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          {/* Status */}
          <Card>
            <CardContent className='pt-4'>
              <div className='flex items-center gap-2 text-sm'>
                <StatusIcon className='w-4 h-4' />
                <span>Trạng thái:</span>
                <Badge variant={scoreStatus.variant}>{scoreStatus.text}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Players */}
          <div className='grid grid-cols-2 gap-4'>
            <Card>
              <CardHeader className='pb-2'>
                <div className='flex items-center gap-2'>
                  <Avatar className='w-8 h-8'>
                    <AvatarImage
                      src={challenge.challenger_profile?.avatar_url}
                    />
                    <AvatarFallback>
                      {challenge.challenger_profile?.full_name?.[0] || 'C'}
                    </AvatarFallback>
                  </Avatar>
                  <div className='text-xs'>
                    <p className='font-medium'>
                      {challenge.challenger_profile?.full_name ||
                        'Người thách đấu'}
                    </p>
                    {challenge.challenger_score_submitted_at && (
                      <p className='text-muted-foreground'>Đã gửi tỷ số</p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className='pt-0'>
                <Label htmlFor='challenger-score' className='text-xs'>
                  Tỷ số
                </Label>
                <Input
                  id='challenger-score'
                  type='number'
                  min='0'
                  max={challenge.race_to || 22}
                  value={challengerScore}
                  onChange={e =>
                    setChallengerScore(parseInt(e.target.value) || 0)
                  }
                  disabled={!isClubOwner && !isChallenger}
                  className='text-center font-bold text-lg'
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='pb-2'>
                <div className='flex items-center gap-2'>
                  <Avatar className='w-8 h-8'>
                    <AvatarImage src={challenge.opponent_profile?.avatar_url} />
                    <AvatarFallback>
                      {challenge.opponent_profile?.full_name?.[0] || 'O'}
                    </AvatarFallback>
                  </Avatar>
                  <div className='text-xs'>
                    <p className='font-medium'>
                      {challenge.opponent_profile?.full_name || 'Đối thủ'}
                    </p>
                    {challenge.opponent_score_submitted_at && (
                      <p className='text-muted-foreground'>Đã gửi tỷ số</p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className='pt-0'>
                <Label htmlFor='opponent-score' className='text-xs'>
                  Tỷ số
                </Label>
                <Input
                  id='opponent-score'
                  type='number'
                  min='0'
                  max={challenge.race_to || 22}
                  value={opponentScore}
                  onChange={e =>
                    setOpponentScore(parseInt(e.target.value) || 0)
                  }
                  disabled={!isClubOwner && !isOpponent}
                  className='text-center font-bold text-lg'
                />
              </CardContent>
            </Card>
          </div>

          {/* Race to info */}
          <div className='text-center text-sm text-muted-foreground'>
            Race to {challenge.race_to || 8} • {challenge.bet_points} điểm SPA
          </div>

          {/* Submit button */}
          <Button
            onClick={handleSubmitScore}
            disabled={isSubmitting || challenge.status === 'completed'}
            className='w-full'
          >
            {isSubmitting
              ? 'Đang xử lý...'
              : isClubOwner
                ? 'Xác nhận kết quả'
                : 'Gửi tỷ số'}
          </Button>

          {isClubOwner && (
            <p className='text-xs text-muted-foreground text-center'>
              Xác nhận kết quả sẽ hoàn tất trận đấu và cập nhật ELO/SPA cho cả
              hai người chơi.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ScoreSubmissionForm;
