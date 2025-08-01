import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Star, AlertTriangle } from 'lucide-react';

interface PostMatchRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: string;
  opponentId: string;
  opponentName: string;
}

const PostMatchRatingModal = ({
  isOpen,
  onClose,
  matchId,
  opponentId,
  opponentName,
}: PostMatchRatingModalProps) => {
  const { user } = useAuth();
  const [selectedRating, setSelectedRating] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const ratingOptions = [
    {
      value: 'accurate',
      label: 'Đúng hạng',
      description: 'Trình độ phù hợp với hạng đăng ký',
      color: 'bg-green-50 border-green-200 text-green-800',
    },
    {
      value: 'higher_than_registered',
      label: 'Cao hơn hạng đăng ký',
      description: 'Chơi tốt hơn hạng hiện tại',
      color: 'bg-blue-50 border-blue-200 text-blue-800',
    },
    {
      value: 'lower_than_registered',
      label: 'Thấp hơn hạng đăng ký',
      description: 'Trình độ không phù hợp với hạng',
      color: 'bg-red-50 border-red-200 text-red-800',
    },
  ];

  const handleSubmit = async () => {
    if (!user || !selectedRating) {
      toast.error('Vui lòng chọn đánh giá');
      return;
    }

    setLoading(true);

    try {
      const { error } = await (supabase as any).from('notifications').insert({
        user_id: opponentId,
        type: 'rating',
        title: `Đánh giá từ trận đấu`,
        message: comment.trim() || `Kỹ năng: ${selectedRating}/5`,
      });

      if (error) throw error;

      toast.success('Đã gửi đánh giá!');
      onClose();
    } catch (error: any) {
      console.error('Error submitting rating:', error);
      toast.error('Lỗi khi gửi đánh giá: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedRating('');
    setComment('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center'>
            <Star className='w-5 h-5 mr-2' />
            Đánh giá trình độ đối thủ
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          <div>
            <p className='text-sm text-gray-600 mb-3'>
              Đánh giá trình độ của <strong>{opponentName}</strong>
            </p>

            <div className='space-y-2'>
              {ratingOptions.map(option => (
                <Card
                  key={option.value}
                  className={`cursor-pointer transition-all ${
                    selectedRating === option.value
                      ? option.color + ' ring-2 ring-offset-2 ring-primary'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedRating(option.value)}
                >
                  <CardContent className='p-3'>
                    <div className='flex items-center'>
                      <div
                        className={`w-4 h-4 rounded-full border-2 mr-3 ${
                          selectedRating === option.value
                            ? 'bg-primary border-primary'
                            : 'border-gray-300'
                        }`}
                      >
                        {selectedRating === option.value && (
                          <div className='w-2 h-2 bg-white rounded-full m-0.5'></div>
                        )}
                      </div>
                      <div>
                        <p className='font-medium'>{option.label}</p>
                        <p className='text-xs text-gray-600'>
                          {option.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Ghi chú (tùy chọn)
            </label>
            <Textarea
              value={comment}
              onChange={e => setComment(e.target.value.slice(0, 200))}
              placeholder='Chia sẻ thêm về trận đấu...'
              className='min-h-[80px]'
              maxLength={200}
            />
            <p className='text-xs text-gray-500 mt-1'>
              {comment.length}/200 ký tự
            </p>
          </div>

          {/* Warning */}
          <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-3'>
            <div className='flex'>
              <AlertTriangle className='w-4 h-4 text-yellow-600 mr-2 flex-shrink-0 mt-0.5' />
              <div className='text-xs text-yellow-800'>
                Đánh giá này sẽ ẩn danh với người được đánh giá nhưng được hệ
                thống ghi nhận để duy trì tính công bằng.
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
              Bỏ qua
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || !selectedRating}
              className='flex-1'
            >
              {loading ? 'Đang gửi...' : 'Gửi đánh giá'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PostMatchRatingModal;
