import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, Trophy, Clock, MapPin, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ChallengeJoinedPopupProps {
  open: boolean;
  onClose: () => void;
  challengeData: {
    id: string;
    challenge_id: string;
    participant_name: string;
    participant_avatar?: string;
    participant_rank?: string;
    bet_points: number;
    race_to: number;
    message?: string;
    location?: string;
  };
  onAccept?: () => void;
}

export const ChallengeJoinedPopup: React.FC<ChallengeJoinedPopupProps> = ({
  open,
  onClose,
  challengeData,
  onAccept,
}) => {
  const [isAccepting, setIsAccepting] = useState(false);

  const handleAccept = async () => {
    if (isAccepting) return;

    setIsAccepting(true);
    try {
      // Mark notification as read
      const { error: markError } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', challengeData.id);

      if (markError) {
        console.error('Error marking notification as read:', markError);
      }

      toast.success('Đã xác nhận! Trận đấu sẵn sàng diễn ra 🎮');
      onAccept?.();
      onClose();
    } catch (error) {
      console.error('Error accepting challenge:', error);
      toast.error('Có lỗi xảy ra');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDismiss = async () => {
    try {
      // Mark notification as read
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', challengeData.id);

      if (error) {
        console.error('Error marking notification as read:', error);
      }
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleDismiss}>
      <DialogContent className='max-w-md mx-auto'>
        <DialogHeader className='text-center'>
          <div className='flex justify-center mb-4'>
            <div className='relative'>
              <div className='w-16 h-16 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center'>
                <Users className='w-8 h-8 text-white' />
              </div>
              <div className='absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center animate-bounce'>
                <span className='text-white text-xs font-bold'>!</span>
              </div>
            </div>
          </div>

          <DialogTitle className='text-xl font-bold text-gray-800'>
            🎯 Có người tham gia thách đấu!
          </DialogTitle>

          <DialogDescription className='text-gray-600 mt-2'>
            Một đối thủ vừa tham gia thách đấu mở của bạn
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          {/* Participant Info */}
          <div className='flex items-center gap-3 p-4 bg-emerald-50 rounded-lg border border-emerald-200'>
            <Avatar className='w-12 h-12 border-2 border-emerald-300'>
              <AvatarImage src={challengeData.participant_avatar} />
              <AvatarFallback className='bg-emerald-100 text-emerald-700 font-bold'>
                {challengeData.participant_name[0] || 'P'}
              </AvatarFallback>
            </Avatar>

            <div className='flex-1'>
              <div className='font-bold text-gray-800'>
                {challengeData.participant_name}
              </div>
              <div className='flex items-center gap-2'>
                <Badge variant='outline' className='text-xs'>
                  {challengeData.participant_rank || 'Unranked'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Challenge Details */}
          <div className='space-y-3 p-4 bg-gray-50 rounded-lg'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <Trophy className='w-4 h-4 text-amber-600' />
                <span className='text-sm font-medium'>Tiền cược:</span>
              </div>
              <span className='font-bold text-amber-700'>
                {challengeData.bet_points} SPA
              </span>
            </div>

            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <Clock className='w-4 h-4 text-blue-600' />
                <span className='text-sm font-medium'>Race to:</span>
              </div>
              <span className='font-bold text-blue-700'>
                {challengeData.race_to}
              </span>
            </div>

            {challengeData.location && (
              <div className='flex items-center gap-2'>
                <MapPin className='w-4 h-4 text-gray-600' />
                <span className='text-sm text-gray-600 truncate'>
                  {challengeData.location}
                </span>
              </div>
            )}

            {challengeData.message && (
              <div className='mt-3 p-3 bg-white rounded border border-gray-200'>
                <span className='text-sm text-gray-700 italic'>
                  "{challengeData.message}"
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className='flex gap-3 pt-4'>
          <Button
            variant='outline'
            onClick={handleDismiss}
            className='flex-1'
            disabled={isAccepting}
          >
            Đóng
          </Button>

          <Button
            onClick={handleAccept}
            disabled={isAccepting}
            className='flex-1 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white'
          >
            {isAccepting ? (
              <>
                <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                Đang xử lý...
              </>
            ) : (
              <>
                <Trophy className='w-4 h-4 mr-2' />
                Xác nhận
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
