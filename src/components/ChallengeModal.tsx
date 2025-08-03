import React, { useState } from 'react';
import { X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import UserAvatar from './UserAvatar';
import { ChallengeStatusBanner } from './ranking/ChallengeStatusBanner';

interface ChallengeModalProps {
  opponent: {
    user_id: string;
    full_name: string;
    avatar_url?: string;
    current_rank: string;
    ranking_points: number;
    min_bet_points: number;
    max_bet_points: number;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onSendChallenge: (data: { betPoints: number; message: string }) => void;
}

const ChallengeModal = ({
  opponent,
  isOpen,
  onClose,
  onSendChallenge,
}: ChallengeModalProps) => {
  const [betPoints, setBetPoints] = useState(50);
  const [message, setMessage] = useState('');

  if (!opponent) return null;

  const handleSubmit = () => {
    onSendChallenge({ betPoints, message });
    setMessage('');
    setBetPoints(50);
    onClose();
  };

  const minBet = Math.max(10, opponent.min_bet_points);
  const maxBet = Math.min(200, opponent.max_bet_points);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Thách đấu {opponent.full_name}</DialogTitle>
        </DialogHeader>

        <div className='space-y-6'>
          {/* Challenge Status Banner */}
          <ChallengeStatusBanner />

          {/* Opponent Info */}
          <div className='flex items-center space-x-3 p-3 bg-gray-50 rounded-lg'>
            <UserAvatar
              user={{
                name: opponent.full_name,
                avatar: opponent.avatar_url || '/placeholder.svg',
                rank: opponent.current_rank,
              }}
              size='md'
            />
            <div>
              <h3 className='font-semibold'>{opponent.full_name}</h3>
              <p className='text-sm text-gray-600'>
                {opponent.current_rank} • {opponent.ranking_points} điểm
              </p>
            </div>
          </div>

          {/* Bet Points Selector */}
          <div>
            <label className='block text-sm font-semibold mb-3'>
              Mức cược (Điểm Ranking)
            </label>
            <div className='grid grid-cols-4 gap-2 mb-3'>
              {[10, 25, 50, 100].map(points => (
                <Button
                  key={points}
                  variant={betPoints === points ? 'default' : 'outline'}
                  onClick={() => setBetPoints(points)}
                  className='font-semibold'
                  disabled={points < minBet || points > maxBet}
                >
                  {points}
                </Button>
              ))}
            </div>
            <Input
              type='range'
              min={minBet}
              max={maxBet}
              value={betPoints}
              onChange={e => setBetPoints(parseInt(e.target.value))}
              className='w-full'
            />
            <div className='flex justify-between text-xs text-gray-500 mt-1'>
              <span>Min: {minBet}</span>
              <span className='font-semibold'>Chọn: {betPoints} điểm</span>
              <span>Max: {maxBet}</span>
            </div>
          </div>

          {/* Message */}
          <div>
            <label className='block text-sm font-semibold mb-2'>
              Lời nhắn (tùy chọn)
            </label>
            <Textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder='Gửi lời thách đấu...'
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className='flex space-x-3'>
            <Button variant='outline' onClick={onClose} className='flex-1'>
              Hủy
            </Button>
            <Button
              onClick={handleSubmit}
              className='flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
            >
              <Send className='w-4 h-4 mr-2' />
              Gửi thách đấu
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChallengeModal;
