import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FileText, AlertTriangle } from 'lucide-react';

interface PenaltyAppealModalProps {
  isOpen: boolean;
  onClose: () => void;
  penaltyId: string;
  penaltyReason: string;
  onAppealSubmitted: () => void;
}

const PenaltyAppealModal = ({
  isOpen,
  onClose,
  penaltyId,
  penaltyReason,
  onAppealSubmitted,
}: PenaltyAppealModalProps) => {
  const { user } = useAuth();
  const [appealReason, setAppealReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!user || !appealReason.trim()) {
      toast.error('Vui lòng nhập lý do kháng cáo');
      return;
    }

    if (appealReason.length < 50) {
      toast.error('Lý do kháng cáo phải có ít nhất 50 ký tự');
      return;
    }

    setLoading(true);

    try {
      const { error } = await (supabase as any)
        .from('notifications')
        .update({
          title: appealReason.trim(),
          updated_at: new Date().toISOString(),
          is_read: true,
        })
        .eq('id', penaltyId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success(
        'Đã gửi kháng cáo! Admin sẽ xem xét trong 3-5 ngày làm việc.'
      );
      onAppealSubmitted();
      onClose();
    } catch (error: any) {
      console.error('Error submitting appeal:', error);
      toast.error('Lỗi khi gửi kháng cáo: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAppealReason('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center'>
            <FileText className='w-5 h-5 mr-2' />
            Kháng cáo hình phạt
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          {/* Current Penalty Info */}
          <div className='bg-red-50 border border-red-200 rounded-lg p-3'>
            <h4 className='font-medium text-red-900 mb-1'>
              Hình phạt hiện tại:
            </h4>
            <p className='text-sm text-red-800'>{penaltyReason}</p>
          </div>

          {/* Appeal Form */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Lý do kháng cáo *
            </label>
            <Textarea
              value={appealReason}
              onChange={e => setAppealReason(e.target.value.slice(0, 1000))}
              placeholder='Giải thích chi tiết lý do bạn cho rằng hình phạt này không công bằng. Cung cấp bằng chứng nếu có (link video, ảnh chụp, nhân chứng)...'
              className='min-h-[120px]'
              maxLength={1000}
            />
            <p className='text-xs text-gray-500 mt-1'>
              {appealReason.length}/1000 ký tự (tối thiểu 50 ký tự)
            </p>
          </div>

          {/* Warning */}
          <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-3'>
            <div className='flex'>
              <AlertTriangle className='w-4 h-4 text-yellow-600 mr-2 flex-shrink-0 mt-0.5' />
              <div className='text-xs text-yellow-800'>
                <div className='font-medium mb-1'>Lưu ý quan trọng:</div>
                <ul className='space-y-0.5'>
                  <li>• Bạn chỉ có thể kháng cáo MỘT LẦN cho mỗi hình phạt</li>
                  <li>
                    • Kháng cáo sai sự thật có thể dẫn đến hình phạt nặng hơn
                  </li>
                  <li>• Admin sẽ xem xét trong 3-5 ngày làm việc</li>
                  <li>
                    • Cung cấp bằng chứng rõ ràng để tăng cơ hội thành công
                  </li>
                </ul>
              </div>
            </div>
          </div>

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
              disabled={loading || appealReason.length < 50}
              className='flex-1'
            >
              {loading ? 'Đang gửi...' : 'Gửi kháng cáo'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PenaltyAppealModal;
