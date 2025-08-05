import React, { useState } from 'react';
import { X, Camera, Trophy, Zap, Star } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import UserAvatar from './UserAvatar';
import { useAuth } from '@/hooks/useAuth';

interface PostData {
  content: string;
  type: 'general' | 'match_result' | 'achievement' | 'tournament_win';
  stats?: {
    score?: string;
    opponent?: string;
    achievement?: string;
  };
}

interface PostCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (postData: PostData) => void;
}

const PostCreationModal = ({
  isOpen,
  onClose,
  onSubmit,
}: PostCreationModalProps) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState<
    'general' | 'match_result' | 'achievement' | 'tournament_win'
  >('general');
  const [matchData, setMatchData] = useState({
    opponent: '',
    score: '',
    result: 'win' as 'win' | 'loss',
  });
  const [achievementData, setAchievementData] = useState({
    title: '',
    description: '',
  });

  const mockUser = {
    id: '1',
    name: 'Người chơi',
    avatar: '/placeholder.svg',
    rank: 'H+',
  };

  const handleSubmit = () => {
    const postData: PostData = {
      content,
      type: postType,
      stats:
        postType === 'match_result'
          ? {
              score: matchData.score,
              opponent: matchData.opponent,
            }
          : postType === 'achievement'
            ? {
                achievement: achievementData.title,
              }
            : undefined,
    };

    onSubmit(postData);
    setContent('');
    setPostType('general');
    setMatchData({ opponent: '', score: '', result: 'win' });
    setAchievementData({ title: '', description: '' });
    onClose();
  };

  const getPostTypeIcon = () => {
    switch (postType) {
      case 'match_result':
        return <Trophy className='w-5 h-5' />;
      case 'achievement':
        return <Star className='w-5 h-5' />;
      case 'tournament_win':
        return <Zap className='w-5 h-5' />;
      default:
        return <Camera className='w-5 h-5' />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            {getPostTypeIcon()}
            Tạo bài viết mới
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          {/* User Info */}
          <div className='flex items-center gap-3'>
            <UserAvatar user={mockUser} size='md' />
            <div>
              <p className='font-medium'>{mockUser.name}</p>
              <Badge variant='secondary' className='text-xs'>
                {mockUser.rank}
              </Badge>
            </div>
          </div>

          {/* Post Type Selection */}
          <Select
            value={postType}
            onValueChange={(
              value:
                | 'general'
                | 'match_result'
                | 'achievement'
                | 'tournament_win'
            ) => setPostType(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder='Chọn loại bài viết' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='general'>Bài viết thường</SelectItem>
              <SelectItem value='match_result'>Kết quả trận đấu</SelectItem>
              <SelectItem value='achievement'>Thành tích mới</SelectItem>
              <SelectItem value='tournament_win'>
                Chiến thắng giải đấu
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Content */}
          <Textarea
            placeholder='Chia sẻ điều gì đó với cộng đồng...'
            value={content}
            onChange={e => setContent(e.target.value)}
            className='min-h-[100px] resize-none'
          />

          {/* Match Result Form */}
          {postType === 'match_result' && (
            <div className='space-y-3 p-4 bg-blue-50 rounded-lg'>
              <h4 className='font-medium text-blue-800'>Chi tiết trận đấu</h4>
              <div className='grid grid-cols-2 gap-3'>
                <input
                  placeholder='Tên đối thủ'
                  value={matchData.opponent}
                  onChange={e =>
                    setMatchData(prev => ({
                      ...prev,
                      opponent: e.target.value,
                    }))
                  }
                  className='px-3 py-2 border rounded-md'
                />
                <input
                  placeholder='Tỷ số (8-6)'
                  value={matchData.score}
                  onChange={e =>
                    setMatchData(prev => ({ ...prev, score: e.target.value }))
                  }
                  className='px-3 py-2 border rounded-md'
                />
              </div>
              <Select
                value={matchData.result}
                onValueChange={(value: 'win' | 'loss') =>
                  setMatchData(prev => ({ ...prev, result: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='win'>Thắng</SelectItem>
                  <SelectItem value='loss'>Thua</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Achievement Form */}
          {postType === 'achievement' && (
            <div className='space-y-3 p-4 bg-purple-50 rounded-lg'>
              <h4 className='font-medium text-purple-800'>Thành tích mới</h4>
              <input
                placeholder='Tên thành tích'
                value={achievementData.title}
                onChange={e =>
                  setAchievementData(prev => ({
                    ...prev,
                    title: e.target.value,
                  }))
                }
                className='w-full px-3 py-2 border rounded-md'
              />
              <input
                placeholder='Mô tả thành tích'
                value={achievementData.description}
                onChange={e =>
                  setAchievementData(prev => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className='w-full px-3 py-2 border rounded-md'
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className='flex justify-between pt-4'>
            <Button variant='outline' onClick={onClose}>
              Hủy
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!content.trim()}
              className='bg-primary-blue hover:bg-primary-blue/90'
            >
              Đăng bài
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PostCreationModal;
