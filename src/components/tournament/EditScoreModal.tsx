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
import { TournamentMatch } from '@/hooks/useMatchManagement';

interface EditScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: TournamentMatch;
  onEditScore: (
    matchId: string,
    newPlayer1Score: number,
    newPlayer2Score: number,
    editorId: string
  ) => Promise<void>;
  editorId: string;
  isLoading: boolean;
}

export const EditScoreModal: React.FC<EditScoreModalProps> = ({
  isOpen,
  onClose,
  match,
  onEditScore,
  editorId,
  isLoading,
}) => {
  const [player1Score, setPlayer1Score] = useState(
    match.player1_score.toString()
  );
  const [player2Score, setPlayer2Score] = useState(
    match.player2_score.toString()
  );
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newScore1 = parseInt(player1Score);
    const newScore2 = parseInt(player2Score);

    if (
      isNaN(newScore1) ||
      isNaN(newScore2) ||
      newScore1 < 0 ||
      newScore2 < 0
    ) {
      return;
    }

    if (
      newScore1 === match.player1_score &&
      newScore2 === match.player2_score
    ) {
      onClose();
      return;
    }

    setShowConfirmation(true);
  };

  const handleConfirm = async () => {
    try {
      await onEditScore(
        match.id,
        parseInt(player1Score),
        parseInt(player2Score),
        editorId
      );
      onClose();
      setShowConfirmation(false);
    } catch (error) {
      console.error('Edit score error:', error);
    }
  };

  const handleClose = () => {
    setShowConfirmation(false);
    setPlayer1Score(match.player1_score.toString());
    setPlayer2Score(match.player2_score.toString());
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Sửa tỷ số trận đấu</DialogTitle>
        </DialogHeader>

        {!showConfirmation ? (
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='text-sm text-muted-foreground mb-4'>
              <p className='font-medium'>Trận đấu:</p>
              <p>
                {match.player1?.display_name || 'TBD'} vs{' '}
                {match.player2?.display_name || 'TBD'}
              </p>
              <p className='mt-2'>
                <span className='text-primary font-medium'>
                  Tỷ số hiện tại:
                </span>{' '}
                {match.player1_score} - {match.player2_score}
                {match.winner_id && (
                  <span className='ml-2 text-green-600'>
                    (Thắng:{' '}
                    {match.winner_id === match.player1_id
                      ? match.player1?.display_name
                      : match.player2?.display_name}
                    )
                  </span>
                )}
              </p>
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='player1Score'>
                  {match.player1?.display_name || 'Người chơi 1'}
                </Label>
                <Input
                  id='player1Score'
                  type='number'
                  min='0'
                  value={player1Score}
                  onChange={e => setPlayer1Score(e.target.value)}
                  required
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='player2Score'>
                  {match.player2?.display_name || 'Người chơi 2'}
                </Label>
                <Input
                  id='player2Score'
                  type='number'
                  min='0'
                  value={player2Score}
                  onChange={e => setPlayer2Score(e.target.value)}
                  required
                />
              </div>
            </div>

            {parseInt(player1Score) !== match.player1_score ||
            parseInt(player2Score) !== match.player2_score ? (
              <div className='text-sm text-orange-600 bg-orange-50 p-3 rounded-lg'>
                <p className='font-medium'>
                  Tỷ số mới: {player1Score} - {player2Score}
                </p>
                <p>
                  Người thắng:{' '}
                  {parseInt(player1Score) > parseInt(player2Score)
                    ? match.player1?.display_name
                    : parseInt(player2Score) > parseInt(player1Score)
                      ? match.player2?.display_name
                      : 'Hòa (không hợp lệ trong giải đấu)'}
                </p>
              </div>
            ) : null}

            <div className='flex justify-end gap-2 pt-4'>
              <Button type='button' variant='outline' onClick={handleClose}>
                Hủy
              </Button>
              <Button
                type='submit'
                disabled={parseInt(player1Score) === parseInt(player2Score)}
                className='bg-orange-600 hover:bg-orange-700'
              >
                Cập nhật tỷ số
              </Button>
            </div>
          </form>
        ) : (
          <div className='space-y-4'>
            <div className='text-center space-y-3'>
              <div className='text-lg font-medium text-orange-600'>
                ⚠️ Xác nhận sửa tỷ số
              </div>

              <div className='space-y-2 text-sm'>
                <p>
                  <strong>Tỷ số cũ:</strong> {match.player1_score} -{' '}
                  {match.player2_score}
                </p>
                <p>
                  <strong>Tỷ số mới:</strong> {player1Score} - {player2Score}
                </p>
              </div>

              <div className='bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-left text-sm'>
                <p className='font-medium text-yellow-800 mb-1'>Lưu ý:</p>
                <ul className='text-yellow-700 space-y-1 list-disc list-inside'>
                  <li>Việc sửa tỷ số sẽ được ghi lại trong hệ thống</li>
                  <li>
                    Nếu người thắng thay đổi, bảng đấu sẽ được cập nhật tự động
                  </li>
                  <li>Các trận đấu ở vòng sau có thể bị reset nếu cần thiết</li>
                  <li>Người chơi sẽ nhận được thông báo về thay đổi này</li>
                </ul>
              </div>
            </div>

            <div className='flex justify-end gap-2'>
              <Button
                variant='outline'
                onClick={() => setShowConfirmation(false)}
                disabled={isLoading}
              >
                Quay lại
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={isLoading}
                className='bg-orange-600 hover:bg-orange-700'
              >
                {isLoading ? 'Đang cập nhật...' : 'Xác nhận sửa'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
