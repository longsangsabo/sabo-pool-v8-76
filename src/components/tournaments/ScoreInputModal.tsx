import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ScoreInputModalProps {
  match: any;
  isOpen: boolean;
  onClose: () => void;
  tournamentType: string;
  onSuccess: () => void;
}

export const ScoreInputModal: React.FC<ScoreInputModalProps> = ({
  match,
  isOpen,
  onClose,
  tournamentType,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [player1Score, setPlayer1Score] = useState(match?.score_player1 || 0);
  const [player2Score, setPlayer2Score] = useState(match?.score_player2 || 0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!match || !user) {
      console.error('❌ Missing match or user data');
      return;
    }

    if (player1Score === player2Score) {
      toast.error('Không thể hòa trong giải đấu loại trực tiếp!');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('🎯 Submitting score for match:', {
        matchId: match.id,
        tournamentId: match.tournament_id,
        player1Score,
        player2Score,
        tournamentType,
        player1Name: match.player1?.full_name,
        player2Name: match.player2?.full_name,
        roundNumber: match.round_number,
        matchNumber: match.match_number,
      });

      // Submit match score using the new safe RPC function
      const { data: scoreResult, error: scoreError } = await supabase.rpc(
        'update_match_score_safe',
        {
          p_match_id: match.id,
          p_player1_score: player1Score,
          p_player2_score: player2Score,
          p_submitted_by: user.id,
        }
      );

      if (scoreError) {
        console.error('❌ Error submitting score:', scoreError);
        toast.error('Lỗi khi cập nhật tỷ số: ' + scoreError.message);
        return;
      }

      if (
        scoreResult &&
        typeof scoreResult === 'object' &&
        'error' in scoreResult &&
        scoreResult.error
      ) {
        console.error('❌ Function returned error:', scoreResult.error);
        toast.error('Lỗi khi cập nhật tỷ số: ' + scoreResult.error);
        return;
      }

      console.log('✅ Score submitted successfully:', scoreResult);

      // Check server response for final match status and tournament completion
      const result = scoreResult as any;
      if (result?.tournament_completed && result?.is_final_match) {
        console.log('🏆 Final match completed!');
        toast.success(
          '🏆 Trận chung kết đã hoàn thành! Chúc mừng nhà vô địch!'
        );
      } else if (
        tournamentType === 'single_elimination' &&
        result?.winner_id &&
        !result?.is_final_match
      ) {
        // For single elimination and non-final matches, advance winner to next round
        console.log('🎯 Advancing winner to next round...');

        const { data: advanceResult, error: advanceError } = await supabase.rpc(
          'advance_winner_safe',
          {
            p_match_id: match.id,
          }
        );

        if (advanceError) {
          console.error('❌ Error advancing winner:', advanceError);
          toast.error(
            'Đã cập nhật tỷ số nhưng không thể chuyển vòng: ' +
              advanceError.message
          );
        } else {
          console.log('✅ Winner advanced successfully:', advanceResult);
          toast.success(
            '✅ Đã cập nhật tỷ số và chuyển người thắng lên vòng tiếp theo!'
          );
        }
      } else if (tournamentType === 'double_elimination' && result?.winner_id) {
        // For double elimination, use the new corrected advancement
        console.log('🎯 Advancing with corrected double elimination logic...');

        const { data: advanceResult, error: advanceError } = await supabase.rpc(
          'repair_double_elimination_bracket',
          {
            p_tournament_id: match.tournament_id,
          }
        );

        if (advanceError) {
          console.error(
            '❌ Error advancing in double elimination:',
            advanceError
          );
          toast.error(
            'Đã cập nhật tỷ số nhưng không thể chuyển vòng: ' +
              advanceError.message
          );
        } else {
          console.log(
            '✅ Enhanced double elimination advancement successful:',
            advanceResult
          );
          const advanceData = advanceResult as any;
          if (advanceData?.success) {
            const advancements = advanceData?.advancements || 0;
            toast.success(
              `✅ Đã cập nhật tỷ số và chuyển ${advancements} người chơi!`
            );
          } else {
            toast.success('✅ Đã cập nhật tỷ số thành công!');
          }
        }
      } else {
        toast.success('✅ Đã cập nhật tỷ số thành công!');
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('❌ Error in handleSubmit:', error);
      toast.error(
        'Lỗi khi cập nhật tỷ số: ' + (error.message || 'Unknown error')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!match) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Nhập tỷ số trận đấu</DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label>{match.player1?.full_name || 'Player 1'}</Label>
              <Input
                type='number'
                value={player1Score}
                onChange={e => setPlayer1Score(parseInt(e.target.value) || 0)}
                min='0'
                className='text-center text-lg font-bold'
              />
            </div>

            <div className='space-y-2'>
              <Label>{match.player2?.full_name || 'Player 2'}</Label>
              <Input
                type='number'
                value={player2Score}
                onChange={e => setPlayer2Score(parseInt(e.target.value) || 0)}
                min='0'
                className='text-center text-lg font-bold'
              />
            </div>
          </div>

          <div className='flex justify-between items-center pt-4'>
            <Button variant='outline' onClick={onClose} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Đang cập nhật...' : 'Cập nhật tỷ số'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
