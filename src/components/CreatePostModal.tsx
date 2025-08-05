import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePost: (content: string, type: string) => Promise<void>;
}

const CreatePostModal = ({
  isOpen,
  onClose,
  onCreatePost,
}: CreatePostModalProps) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState('text');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;

    setIsLoading(true);
    try {
      await onCreatePost(content, postType);
      setContent('');
      setPostType('text');
      onClose();
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const postTypes = [
    { value: 'text', label: 'Bài viết thường' },
    { value: 'match_result', label: 'Kết quả trận đấu' },
    { value: 'achievement', label: 'Thành tích' },
    { value: 'streak', label: 'Chia sẻ streak' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Tạo bài viết mới</DialogTitle>
          <DialogDescription>
            Chia sẻ thành tích hoặc khoảnh khắc đáng nhớ với cộng đồng
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          {/* User info */}
          <div className='flex items-center gap-3'>
            <Avatar className='h-10 w-10'>
              <AvatarImage src='/placeholder.svg' />
              <AvatarFallback>
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className='font-medium'>{user?.email || 'Người dùng'}</div>
              <div className='text-sm text-muted-foreground'>
                Chia sẻ với cộng đồng
              </div>
            </div>
          </div>

          {/* Post type selector */}
          <div className='space-y-2'>
            <label className='text-sm font-medium'>Loại bài viết</label>
            <Select value={postType} onValueChange={setPostType}>
              <SelectTrigger>
                <SelectValue placeholder='Chọn loại bài viết' />
              </SelectTrigger>
              <SelectContent>
                {postTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Content textarea */}
          <div className='space-y-2'>
            <label className='text-sm font-medium'>Nội dung</label>
            <Textarea
              placeholder='Bạn đang nghĩ gì về trận đấu hôm nay...'
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={4}
              className='resize-none'
            />
            <div className='text-xs text-muted-foreground text-right'>
              {content.length}/500
            </div>
          </div>
        </div>

        <DialogFooter className='gap-2'>
          <Button variant='outline' onClick={onClose}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!content.trim() || isLoading}
          >
            {isLoading ? 'Đang đăng...' : 'Đăng bài'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePostModal;
