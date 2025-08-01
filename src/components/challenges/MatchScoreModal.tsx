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
import { useChallengeWorkflow } from '@/hooks/useChallengeWorkflow';

interface MatchScoreModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  challengeId: string;
  isChallenger: boolean;
  raceTo: number;
  challengerName?: string;
  opponentName?: string;
}

export function MatchScoreModal({
  open,
  onOpenChange,
  challengeId,
  isChallenger,
  raceTo,
  challengerName = 'Challenger',
  opponentName = 'Opponent',
}: MatchScoreModalProps) {
  const { submitScore, isSubmittingScore } = useChallengeWorkflow();
  const [challengerScore, setChallengerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (challengerScore === 0 && opponentScore === 0) {
      alert('Vui lòng nhập tỷ số hợp lệ');
      return;
    }

    if (challengerScore !== raceTo && opponentScore !== raceTo) {
      alert(`Một trong hai người chơi phải đạt ${raceTo} điểm để thắng`);
      return;
    }

    try {
      console.log('Submitting scores:', {
        challengerScore,
        opponentScore,
        raceTo,
      });
      await submitScore({
        challengeId,
        challengerScore,
        opponentScore,
        isChallenger,
      });
      onOpenChange(false);
      // Reset scores
      setChallengerScore(0);
      setOpponentScore(0);
    } catch (error) {
      console.error('Error submitting score:', error);
    }
  };

  const isValidScore =
    (challengerScore === raceTo && opponentScore < raceTo) ||
    (opponentScore === raceTo && challengerScore < raceTo);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className='max-w-md'
        aria-describedby='score-modal-description'
      >
        <DialogHeader>
          <DialogTitle>Nhập tỷ số trận đấu</DialogTitle>
        </DialogHeader>
        <div id='score-modal-description' className='sr-only'>
          Modal để nhập tỷ số kết quả trận đấu giữa hai người chơi
        </div>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='text-center text-sm text-muted-foreground mb-4'>
            Trận đấu đầu tiên đạt {raceTo} điểm sẽ thắng
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div>
              <Label htmlFor='challenger-score'>{challengerName}</Label>
              <Input
                id='challenger-score'
                type='number'
                value={challengerScore}
                onChange={e =>
                  setChallengerScore(parseInt(e.target.value) || 0)
                }
                min={0}
                max={raceTo}
                className='text-center text-lg'
              />
            </div>

            <div>
              <Label htmlFor='opponent-score'>{opponentName}</Label>
              <Input
                id='opponent-score'
                type='number'
                value={opponentScore}
                onChange={e => setOpponentScore(parseInt(e.target.value) || 0)}
                min={0}
                max={raceTo}
                className='text-center text-lg'
              />
            </div>
          </div>

          {challengerScore > 0 || opponentScore > 0 ? (
            <div className='text-center text-sm'>
              {challengerScore === raceTo ? (
                <span className='text-green-600 font-medium'>
                  {challengerName} thắng!
                </span>
              ) : opponentScore === raceTo ? (
                <span className='text-green-600 font-medium'>
                  {opponentName} thắng!
                </span>
              ) : (
                <span className='text-amber-600'>
                  Chưa có ai đạt {raceTo} điểm
                </span>
              )}
            </div>
          ) : null}

          <div className='flex gap-2 pt-2'>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              className='flex-1'
            >
              Hủy
            </Button>
            <Button
              type='submit'
              disabled={!isValidScore || isSubmittingScore}
              className='flex-1'
            >
              {isSubmittingScore ? 'Đang ghi...' : 'Ghi tỷ số'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
