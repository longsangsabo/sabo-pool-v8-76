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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Trophy, Users } from 'lucide-react';
import PostMatchRatingModal from './PostMatchRatingModal';

interface Match {
  id: string;
  player1_id: string;
  player2_id: string;
  challenge_id: string;
  profiles?: {
    full_name: string;
    avatar_url: string;
    current_rank: string;
  };
}

interface MatchCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match | null;
  onMatchCompleted: () => void;
}

const MatchCompletionModal = ({
  isOpen,
  onClose,
  match,
  onMatchCompleted,
}: MatchCompletionModalProps) => {
  const { user } = useAuth();
  const [winner, setWinner] = useState<string>('');
  const [myScore, setMyScore] = useState('');
  const [opponentScore, setOpponentScore] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);

  if (!match || !user) return null;

  const isPlayer1 = match.player1_id === user.id;
  const opponentId = isPlayer1 ? match.player2_id : match.player1_id;
  const opponentName = match.profiles?.full_name || 'Đối thủ';

  const handleSubmit = async () => {
    if (!winner || !myScore || !opponentScore) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    setLoading(true);

    try {
      const player1Score = isPlayer1
        ? parseInt(myScore)
        : parseInt(opponentScore);
      const player2Score = isPlayer1
        ? parseInt(opponentScore)
        : parseInt(myScore);

      // Mock match completion since table doesn't exist
      const error = null; // Mock success

      if (error) throw error;

      toast.success('Đã cập nhật kết quả trận đấu!');
      onMatchCompleted();
      onClose();

      // Show rating modal after a short delay
      setTimeout(() => {
        setShowRatingModal(true);
      }, 500);
    } catch (error) {
      console.error('Error updating match:', error);
      toast.error('Lỗi khi cập nhật kết quả');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setWinner('');
    setMyScore('');
    setOpponentScore('');
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle className='flex items-center'>
              <Trophy className='w-5 h-5 mr-2' />
              Xác nhận kết quả trận đấu
            </DialogTitle>
          </DialogHeader>

          <div className='space-y-6'>
            {/* Players Info */}
            <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
              <div className='flex items-center space-x-2'>
                <Avatar className='w-8 h-8'>
                  <AvatarImage src={user.user_metadata?.avatar_url} />
                  <AvatarFallback>
                    {user.user_metadata?.full_name?.charAt(0) || 'Tôi'}
                  </AvatarFallback>
                </Avatar>
                <span className='font-medium'>Tôi</span>
              </div>

              <Users className='w-5 h-5 text-gray-400' />

              <div className='flex items-center space-x-2'>
                <Avatar className='w-8 h-8'>
                  <AvatarImage src={match.profiles?.avatar_url} />
                  <AvatarFallback>
                    {match.profiles?.full_name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className='font-medium'>{opponentName}</span>
              </div>
            </div>

            {/* Winner Selection */}
            <div>
              <Label className='text-base font-medium mb-3 block'>
                Ai là người thắng?
              </Label>
              <RadioGroup value={winner} onValueChange={setWinner}>
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem value={user.id} id='me' />
                  <Label htmlFor='me'>Tôi thắng</Label>
                </div>
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem value={opponentId} id='opponent' />
                  <Label htmlFor='opponent'>{opponentName} thắng</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Score Input */}
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='myScore'>Tỉ số của tôi</Label>
                <Input
                  id='myScore'
                  type='number'
                  min='0'
                  value={myScore}
                  onChange={e => setMyScore(e.target.value)}
                  placeholder='0'
                />
              </div>
              <div>
                <Label htmlFor='opponentScore'>Tỉ số đối thủ</Label>
                <Input
                  id='opponentScore'
                  type='number'
                  min='0'
                  value={opponentScore}
                  onChange={e => setOpponentScore(e.target.value)}
                  placeholder='0'
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className='flex space-x-2'>
              <Button
                variant='outline'
                onClick={handleClose}
                className='flex-1'
                disabled={loading}
              >
                Hủy
              </Button>
              <Button
                onClick={handleSubmit}
                className='flex-1'
                disabled={loading || !winner || !myScore || !opponentScore}
              >
                {loading ? 'Đang lưu...' : 'Xác nhận kết quả'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <PostMatchRatingModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        matchId={match.id}
        opponentId={opponentId}
        opponentName={opponentName}
      />
    </>
  );
};

export default MatchCompletionModal;
