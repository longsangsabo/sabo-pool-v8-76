import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Target, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAdvancedSPAPoints } from '@/hooks/useAdvancedSPAPoints';
import { SPAPointsBreakdown } from '@/components/SPAPointsBreakdown';
import { DailyChallengeStatus } from '@/components/DailyChallengeStatus';

interface MatchCompletionHandlerProps {
  match: {
    id: string;
    player1_id: string;
    player2_id: string;
    challenge_id?: string;
    tournament_id?: string;
    score_player1: number;
    score_player2: number;
    status: string;
  };
  wagerPoints?: number;
  raceTo?: number;
  onComplete: () => void;
}

export const MatchCompletionHandler = ({
  match,
  wagerPoints = 100,
  raceTo = 5,
  onComplete,
}: MatchCompletionHandlerProps) => {
  const [completing, setCompleting] = useState(false);
  const [completedBreakdown, setCompletedBreakdown] = useState<any>(null);
  const { completeChallenge, completeChallengeWithLimits } =
    useAdvancedSPAPoints();

  const handleComplete = async (winnerId: string) => {
    if (completing) return;

    setCompleting(true);
    try {
      const loserId =
        winnerId === match.player1_id ? match.player2_id : match.player1_id;

      // Update match status - using challenges table for now since match_system doesn't exist in types
      const { error: matchError } = await supabase
        .from('challenges')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', match.id);

      if (matchError) throw matchError;

      // If this is a challenge match, award SPA points with daily limits
      if (match.challenge_id) {
        const breakdown = await completeChallengeWithLimits({
          matchId: match.id,
          winnerId,
          loserId,
          wagerAmount: wagerPoints,
          raceTo,
        });

        setCompletedBreakdown(breakdown);

        // Update challenge status
        const { error: challengeError } = await supabase
          .from('challenges')
          .update({ status: 'completed' })
          .eq('id', match.challenge_id);

        if (challengeError) throw challengeError;

        // Show detailed success message
        toast.success(
          <div className='space-y-1'>
            <p className='font-medium'>Thắng: +{breakdown.winner_spa} SPA</p>
            {breakdown.reduction_applied && (
              <p className='text-xs text-warning'>
                Đã giảm 70% - kèo thứ {breakdown.daily_count} trong ngày
              </p>
            )}
          </div>
        );
      } else {
        toast.success('Trận đấu đã hoàn thành!');
      }

      onComplete();
    } catch (error) {
      console.error('Error completing match:', error);
      toast.error('Lỗi khi hoàn thành trận đấu');
    } finally {
      setCompleting(false);
    }
  };

  if (match.status === 'completed') {
    return (
      <div className='space-y-4'>
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-center gap-2 text-green-600'>
              <Trophy className='h-5 w-5' />
              <span className='font-semibold'>Trận đấu đã hoàn thành</span>
            </div>
          </CardContent>
        </Card>

        {/* Show breakdown if available */}
        {completedBreakdown && <SPAPointsBreakdown matchId={match.id} />}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Target className='h-5 w-5' />
          Hoàn thành trận đấu
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {match.challenge_id && (
          <>
            <DailyChallengeStatus />

            <div className='p-3 bg-muted rounded-lg'>
              <div className='flex items-center justify-between'>
                <span className='text-sm font-medium'>Thách đấu</span>
                <Badge variant='secondary' className='flex items-center gap-1'>
                  <Zap className='h-3 w-3' />
                  {wagerPoints} SPA Points
                </Badge>
              </div>
              <div className='text-xs text-muted-foreground mt-1 space-y-1'>
                <p>
                  Người thắng sẽ nhận SPA points (có thể giảm nếu đã chơi 2+ kèo
                  hôm nay)
                </p>
                <p>Race to: {raceTo} • Người thua mất 50% tiền cược</p>
              </div>
            </div>
          </>
        )}

        <div className='space-y-2'>
          <p className='text-sm font-medium'>Chọn người thắng:</p>

          <div className='grid grid-cols-2 gap-3'>
            <Button
              onClick={() => handleComplete(match.player1_id)}
              disabled={completing}
              variant='outline'
              className='h-auto p-3 flex flex-col items-center gap-2'
            >
              <div className='font-semibold'>Người chơi 1</div>
              <div className='text-lg font-bold'>{match.score_player1}</div>
            </Button>

            <Button
              onClick={() => handleComplete(match.player2_id)}
              disabled={completing}
              variant='outline'
              className='h-auto p-3 flex flex-col items-center gap-2'
            >
              <div className='font-semibold'>Người chơi 2</div>
              <div className='text-lg font-bold'>{match.score_player2}</div>
            </Button>
          </div>
        </div>

        {completing && (
          <div className='text-center text-sm text-muted-foreground'>
            Đang xử lý kết quả trận đấu...
          </div>
        )}
      </CardContent>
    </Card>
  );
};
