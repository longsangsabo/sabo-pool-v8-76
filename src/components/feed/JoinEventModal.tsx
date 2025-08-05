import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/shared/components/ui/avatar';
import {
  Calendar,
  MapPin,
  Users,
  Target,
  Trophy,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { FeedPostData } from './FeedPost';

interface JoinEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: FeedPostData;
  onJoin: (postId: string) => void;
}

export const JoinEventModal: React.FC<JoinEventModalProps> = ({
  isOpen,
  onClose,
  post,
  onJoin,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleJoin = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      onJoin(post.id);
      onClose();
    } catch (error) {
      console.error('Failed to join:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderEventDetails = () => {
    if (post.type === 'event' && post.event) {
      return (
        <div className='space-y-4'>
          <div className='text-center'>
            <div className='w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3'>
              <Calendar className='h-8 w-8 text-blue-600' />
            </div>
            <h2 className='text-xl font-bold text-gray-900 mb-2'>
              {post.event.title}
            </h2>
            <Badge variant='secondary' className='bg-blue-100 text-blue-800'>
              Sự kiện
            </Badge>
          </div>

          <div className='space-y-3'>
            <div className='flex items-center gap-3 p-3 bg-gray-50 rounded-lg'>
              <Calendar className='h-5 w-5 text-blue-600' />
              <div>
                <div className='font-medium'>Thời gian</div>
                <div className='text-sm text-gray-600'>
                  {format(post.event.date, 'EEEE, dd/MM/yyyy HH:mm', {
                    locale: vi,
                  })}
                </div>
                <div className='text-xs text-gray-500'>
                  {formatDistanceToNow(post.event.date, {
                    addSuffix: true,
                    locale: vi,
                  })}
                </div>
              </div>
            </div>

            <div className='flex items-center gap-3 p-3 bg-gray-50 rounded-lg'>
              <MapPin className='h-5 w-5 text-green-600' />
              <div>
                <div className='font-medium'>Địa điểm</div>
                <div className='text-sm text-gray-600'>
                  {post.event.location}
                </div>
              </div>
            </div>

            <div className='flex items-center gap-3 p-3 bg-gray-50 rounded-lg'>
              <Users className='h-5 w-5 text-purple-600' />
              <div>
                <div className='font-medium'>Người tham gia</div>
                <div className='text-sm text-gray-600'>
                  {post.event.participants_count} người
                  {post.event.max_participants && (
                    <span> / {post.event.max_participants} tối đa</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {post.event.is_joined && (
            <div className='flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg'>
              <CheckCircle className='h-5 w-5 text-green-600' />
              <span className='text-green-800 font-medium'>
                Bạn đã tham gia sự kiện này
              </span>
            </div>
          )}

          {post.event.max_participants &&
            post.event.participants_count >= post.event.max_participants && (
              <div className='flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg'>
                <XCircle className='h-5 w-5 text-red-600' />
                <span className='text-red-800 font-medium'>
                  Sự kiện đã đầy người tham gia
                </span>
              </div>
            )}
        </div>
      );
    }

    if (post.type === 'challenge' && post.challenge) {
      return (
        <div className='space-y-4'>
          <div className='text-center'>
            <div className='w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3'>
              <Target className='h-8 w-8 text-red-600' />
            </div>
            <h2 className='text-xl font-bold text-gray-900 mb-2'>
              {post.challenge.title}
            </h2>
            <Badge variant='secondary' className='bg-red-100 text-red-800'>
              Thách đấu
            </Badge>
          </div>

          <div className='space-y-3'>
            <div className='flex items-center gap-3 p-3 bg-gray-50 rounded-lg'>
              <Trophy className='h-5 w-5 text-yellow-600' />
              <div>
                <div className='font-medium'>Tiền cược</div>
                <div className='text-lg font-bold text-green-600'>
                  {post.challenge.bet_amount.toLocaleString()} VNĐ
                </div>
              </div>
            </div>

            {post.challenge.opponent && (
              <div className='flex items-center gap-3 p-3 bg-gray-50 rounded-lg'>
                <Avatar className='h-8 w-8'>
                  <AvatarImage src={post.challenge.opponent.avatar_url} />
                  <AvatarFallback>
                    {post.challenge.opponent.username[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className='font-medium'>Đối thủ</div>
                  <div className='text-sm text-gray-600'>
                    {post.challenge.opponent.username}
                  </div>
                </div>
              </div>
            )}

            <div className='flex items-center gap-3 p-3 bg-gray-50 rounded-lg'>
              <Clock className='h-5 w-5 text-blue-600' />
              <div>
                <div className='font-medium'>Trạng thái</div>
                <div className='text-sm text-gray-600'>
                  {post.challenge.status === 'open' && 'Đang mở thách đấu'}
                  {post.challenge.status === 'accepted' && 'Đã được nhận'}
                  {post.challenge.status === 'completed' && 'Đã hoàn thành'}
                </div>
              </div>
            </div>
          </div>

          {post.challenge.status === 'accepted' && (
            <div className='flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
              <CheckCircle className='h-5 w-5 text-blue-600' />
              <span className='text-blue-800 font-medium'>
                Thách đấu đã được chấp nhận
              </span>
            </div>
          )}

          {post.challenge.status === 'completed' && (
            <div className='flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg'>
              <XCircle className='h-5 w-5 text-gray-600' />
              <span className='text-gray-800 font-medium'>
                Thách đấu đã hoàn thành
              </span>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  const canJoin = () => {
    if (post.type === 'event' && post.event) {
      return (
        !post.event.is_joined &&
        (!post.event.max_participants ||
          post.event.participants_count < post.event.max_participants)
      );
    }
    if (post.type === 'challenge' && post.challenge) {
      return post.challenge.status === 'open';
    }
    return false;
  };

  const getJoinButtonText = () => {
    if (post.type === 'event') {
      return 'Tham gia sự kiện';
    }
    if (post.type === 'challenge') {
      return 'Nhận thách đấu';
    }
    return 'Tham gia';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            {post.type === 'event' ? (
              <Calendar className='h-5 w-5' />
            ) : (
              <Target className='h-5 w-5' />
            )}
            {post.type === 'event' ? 'Tham gia sự kiện' : 'Nhận thách đấu'}
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-6'>
          {renderEventDetails()}

          {canJoin() && (
            <div className='space-y-3'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Tin nhắn (tùy chọn)
                </label>
                <Input
                  placeholder='Viết tin nhắn cho người tổ chức...'
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                />
              </div>

              <div className='flex gap-2'>
                <Button variant='outline' onClick={onClose} className='flex-1'>
                  Hủy
                </Button>
                <Button
                  onClick={handleJoin}
                  disabled={isLoading}
                  className='flex-1'
                >
                  {isLoading ? (
                    <div className='flex items-center gap-2'>
                      <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                      Đang xử lý...
                    </div>
                  ) : (
                    getJoinButtonText()
                  )}
                </Button>
              </div>
            </div>
          )}

          {!canJoin() && (
            <div className='flex gap-2'>
              <Button variant='outline' onClick={onClose} className='flex-1'>
                Đóng
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
