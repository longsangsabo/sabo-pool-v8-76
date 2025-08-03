import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface CancelChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  challengerName?: string;
  opponentName?: string;
}

const CancelChallengeModal: React.FC<CancelChallengeModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  challengerName,
  opponentName,
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      return;
    }

    try {
      setIsSubmitting(true);
      await onConfirm(reason.trim());
      setReason('');
      onClose();
    } catch (error) {
      console.error('Error cancelling challenge:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setReason('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <div className='flex items-center gap-2'>
            <AlertTriangle className='h-5 w-5 text-yellow-500' />
            <DialogTitle>Hủy thách đấu</DialogTitle>
          </div>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='text-sm text-muted-foreground'>
            Bạn có chắc chắn muốn hủy thách đấu với{' '}
            <span className='font-medium text-foreground'>
              {opponentName || challengerName || 'đối thủ này'}
            </span>
            ?
          </div>

          <div className='space-y-2'>
            <Label htmlFor='reason'>Lý do hủy thách đấu *</Label>
            <Textarea
              id='reason'
              placeholder='Vui lòng nhập lý do hủy thách đấu...'
              value={reason}
              onChange={e => setReason(e.target.value)}
              className='min-h-[80px]'
              disabled={isSubmitting}
            />
            <div className='text-xs text-muted-foreground'>
              Lý do này sẽ được gửi thông báo cho đối thủ
            </div>
          </div>
        </div>

        <DialogFooter className='flex gap-2'>
          <Button
            variant='outline'
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Đóng
          </Button>
          <Button
            variant='destructive'
            onClick={handleSubmit}
            disabled={!reason.trim() || isSubmitting}
            className='gap-2'
          >
            {isSubmitting && <Loader2 className='h-4 w-4 animate-spin' />}
            Xác nhận hủy
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CancelChallengeModal;
