import React, { useState } from 'react';
import { Calendar, MapPin, Clock, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import UserAvatar from './UserAvatar';
import { Challenge, ChallengeProposal } from '@/types/common';

interface ChallengeResponseModalProps {
  challenge: Challenge | null;
  suggestedClubs: Array<{ id: string; name: string; address: string }>;
  isOpen: boolean;
  onClose: () => void;
  onRespond: (
    status: 'accepted' | 'declined',
    proposalData?: ChallengeProposal
  ) => void;
}

const ChallengeResponseModal = ({
  challenge,
  suggestedClubs,
  isOpen,
  onClose,
  onRespond,
}: ChallengeResponseModalProps) => {
  const [proposedDate, setProposedDate] = useState('');
  const [proposedTime, setProposedTime] = useState('');
  const [selectedClub, setSelectedClub] = useState('');
  const [responseMessage, setResponseMessage] = useState('');

  if (!challenge) return null;

  const handleAccept = () => {
    const proposalData: ChallengeProposal = {
      proposed_datetime:
        proposedDate && proposedTime
          ? `${proposedDate}T${proposedTime}`
          : undefined,
      club_id: selectedClub || undefined,
      message: responseMessage || undefined,
    };

    onRespond('accepted', proposalData);
    resetForm();
  };

  const handleDecline = () => {
    onRespond('declined', { message: responseMessage });
    resetForm();
  };

  const resetForm = () => {
    setProposedDate('');
    setProposedTime('');
    setSelectedClub('');
    setResponseMessage('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Phản hồi thách đấu</DialogTitle>
        </DialogHeader>

        <div className='space-y-6'>
          {/* Challenge Info */}
          <div className='flex items-center space-x-3 p-3 bg-blue-50 rounded-lg'>
            <UserAvatar
              user={{
                id: challenge.challenger?.user_id || '',
                name: challenge.challenger?.full_name || 'Unknown',
                avatar: challenge.challenger?.avatar_url || '/placeholder.svg',
                rank: challenge.challenger?.verified_rank || 'Unranked',
              }}
              size='md'
            />
            <div>
              <h3 className='font-semibold'>
                {challenge.challenger?.full_name}
              </h3>
              <p className='text-sm text-gray-600'>
                Cược: {challenge.bet_points} điểm
              </p>
              {challenge.message && (
                <p className='message-text mt-1'>"{challenge.message}"</p>
              )}
            </div>
          </div>

          {/* Match Proposal Form */}
          <div className='space-y-4'>
            <h4 className='font-medium flex items-center gap-2'>
              <Calendar className='w-4 h-4' />
              Đề xuất lịch thi đấu
            </h4>

            <div className='grid grid-cols-2 gap-3'>
              <div>
                <Label htmlFor='date'>Ngày</Label>
                <Input
                  id='date'
                  type='date'
                  value={proposedDate}
                  onChange={e => setProposedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <Label htmlFor='time'>Giờ</Label>
                <Input
                  id='time'
                  type='time'
                  value={proposedTime}
                  onChange={e => setProposedTime(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor='club'>Câu lạc bộ (tùy chọn)</Label>
              <Select value={selectedClub} onValueChange={setSelectedClub}>
                <SelectTrigger>
                  <SelectValue placeholder='Chọn câu lạc bộ' />
                </SelectTrigger>
                <SelectContent>
                  {suggestedClubs.map(club => (
                    <SelectItem key={club.id} value={club.id}>
                      <div>
                        <div className='font-medium'>{club.name}</div>
                        <div className='text-sm text-gray-500'>
                          {club.address}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor='message'>Lời nhắn (tùy chọn)</Label>
              <Textarea
                id='message'
                value={responseMessage}
                onChange={e => setResponseMessage(e.target.value)}
                placeholder='Gửi lời nhắn phản hồi...'
                rows={3}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className='flex space-x-3'>
            <Button
              variant='outline'
              onClick={handleDecline}
              className='flex-1 text-red-600 border-red-300 hover:bg-red-50'
            >
              Từ chối
            </Button>
            <Button
              onClick={handleAccept}
              className='flex-1 bg-green-500 hover:bg-green-600'
            >
              Chấp nhận
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChallengeResponseModal;
