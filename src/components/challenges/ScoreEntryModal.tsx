import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Challenge } from '@/types/challenge';

interface ScoreEntryModalProps {
  challenge: Challenge;
  isOpen: boolean;
  onClose: () => void;
  onSubmitScore: (challengeId: string, challengerScore: number, opponentScore: number) => Promise<void>;
  currentUserId: string;
}

export const ScoreEntryModal: React.FC<ScoreEntryModalProps> = ({
  challenge,
  isOpen,
  onClose,
  onSubmitScore,
  currentUserId
}) => {
  const [challengerScore, setChallengerScore] = useState<number>(0);
  const [opponentScore, setOpponentScore] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isChallenger = currentUserId === challenge.challenger_id;
  const raceToTarget = challenge.race_to || 8;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (challengerScore < 0 || opponentScore < 0) {
      toast.error('Tỷ số không thể âm');
      return;
    }

    if (challengerScore === opponentScore) {
      toast.error('Trận đấu không thể hòa');
      return;
    }

    const maxScore = Math.max(challengerScore, opponentScore);
    if (maxScore !== raceToTarget) {
      toast.error(`Người thắng phải đạt đúng ${raceToTarget} điểm`);
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmitScore(challenge.id, challengerScore, opponentScore);
      toast.success('Đã ghi nhận tỷ số thành công!');
      onClose();
      setChallengerScore(0);
      setOpponentScore(0);
    } catch (error) {
      console.error('Error submitting score:', error);
      toast.error('Lỗi khi ghi nhận tỷ số');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setChallengerScore(0);
    setOpponentScore(0);
  };

  const challengerName = challenge.challenger_profile?.display_name || challenge.challenger_profile?.full_name || 'Người thách đấu';
  const opponentName = challenge.opponent_profile?.display_name || challenge.opponent_profile?.full_name || 'Đối thủ';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
        resetForm();
      }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            📊 Nhập Tỷ Số Trận Đấu
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Match Info */}
          <div className="bg-muted/30 p-4 rounded-lg">
            <div className="text-center">
              <p className="font-semibold text-lg">
                {challengerName} vs {opponentName}
              </p>
              <p className="text-sm text-muted-foreground">
                Race to {raceToTarget} • Cược: {challenge.bet_points} điểm
              </p>
            </div>
          </div>

          {/* Score Entry Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="challenger-score" className="font-medium">
                  {challengerName}
                  {isChallenger && <span className="text-primary ml-1">(Bạn)</span>}
                </Label>
                <Input
                  id="challenger-score"
                  type="number"
                  min="0"
                  max={raceToTarget}
                  value={challengerScore}
                  onChange={(e) => setChallengerScore(Number(e.target.value))}
                  className="text-center text-lg font-bold"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="opponent-score" className="font-medium">
                  {opponentName}
                  {!isChallenger && <span className="text-primary ml-1">(Bạn)</span>}
                </Label>
                <Input
                  id="opponent-score"
                  type="number"
                  min="0"
                  max={raceToTarget}
                  value={opponentScore}
                  onChange={(e) => setOpponentScore(Number(e.target.value))}
                  className="text-center text-lg font-bold"
                  required
                />
              </div>
            </div>

            {/* Quick Score Buttons */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Tỷ số thông dụng:</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setChallengerScore(raceToTarget);
                    setOpponentScore(raceToTarget - 1);
                  }}
                >
                  {challengerName} thắng {raceToTarget}-{raceToTarget - 1}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setChallengerScore(raceToTarget - 1);
                    setOpponentScore(raceToTarget);
                  }}
                >
                  {opponentName} thắng {raceToTarget}-{raceToTarget - 1}
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onClose();
                  resetForm();
                }}
                className="flex-1"
                disabled={isSubmitting}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Đang ghi nhận...' : 'Ghi nhận tỷ số'}
              </Button>
            </div>
          </form>

          {/* Warning Note */}
          <div className="text-xs text-muted-foreground bg-yellow-50 p-3 rounded border-l-4 border-yellow-400">
            ⚠️ <strong>Lưu ý:</strong> Tỷ số một khi đã ghi nhận sẽ cần được xác nhận từ đối thủ.
            Hãy đảm bảo nhập chính xác.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};