import React from 'react';
import {
  Heart,
  MessageCircle,
  Share2,
  Trophy,
  Target,
  Flame,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface FeedPost {
  id: string;
  user: {
    id: string;
    name: string;
    avatar: string;
    rank: string;
  };
  type: 'match_result' | 'achievement' | 'tournament_win' | 'streak' | 'text';
  content: string;
  stats?: any;
  timestamp: string;
  likes: number;
  comments: number;
  isLiked: boolean;
}

interface SocialFeedCardProps {
  post: FeedPost;
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
  onShare: (postId: string) => void;
  onChallenge?: (postId: string) => void;
}

const SocialFeedCard = ({
  post,
  onLike,
  onComment,
  onShare,
  onChallenge,
}: SocialFeedCardProps) => {
  const getPostIcon = () => {
    switch (post.type) {
      case 'match_result':
        return <Trophy className='w-5 h-5 text-yellow-500' />;
      case 'achievement':
        return <Target className='w-5 h-5 text-green-500' />;
      case 'streak':
        return <Flame className='w-5 h-5 text-orange-500' />;
      case 'tournament_win':
        return <Trophy className='w-5 h-5 text-purple-500' />;
      default:
        return null;
    }
  };

  const getPostTypeLabel = () => {
    switch (post.type) {
      case 'match_result':
        return 'Kết quả trận đấu';
      case 'achievement':
        return 'Thành tích mới';
      case 'streak':
        return 'Streak hôm nay';
      case 'tournament_win':
        return 'Chiến thắng giải đấu';
      default:
        return 'Bài viết';
    }
  };

  return (
    <Card className='w-full'>
      <CardContent className='p-4 space-y-4'>
        {/* User info and post type */}
        <div className='flex items-start justify-between'>
          <div className='flex items-center gap-3'>
            <Avatar className='h-10 w-10'>
              <AvatarImage src={post.user.avatar} />
              <AvatarFallback>
                {post.user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className='flex items-center gap-2'>
                <span className='font-semibold'>{post.user.name}</span>
                <Badge variant='secondary' className='text-xs'>
                  {post.user.rank}
                </Badge>
                {getPostIcon()}
              </div>
              <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                <span>{getPostTypeLabel()}</span>
                <span>•</span>
                <span>{post.timestamp}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Post content */}
        <div className='space-y-3'>
          <p className='text-sm'>{post.content}</p>

          {/* Post-specific stats */}
          {post.stats && (
            <div className='p-3 bg-muted rounded-lg space-y-1'>
              {post.stats.score && (
                <div className='text-sm'>
                  <span className='font-medium'>Tỷ số: </span>
                  <span>{post.stats.score}</span>
                </div>
              )}
              {post.stats.opponent && (
                <div className='text-sm'>
                  <span className='font-medium'>Đối thủ: </span>
                  <span>{post.stats.opponent}</span>
                </div>
              )}
              {post.stats.achievement && (
                <div className='text-sm'>
                  <span className='font-medium'>Thành tích: </span>
                  <span>{post.stats.achievement}</span>
                </div>
              )}
              {post.stats.streak_days && (
                <div className='text-sm'>
                  <span className='font-medium'>Streak: </span>
                  <span className='text-orange-600 font-bold'>
                    {post.stats.streak_days} ngày 🔥
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className='flex items-center justify-between pt-2 border-t'>
          <div className='flex items-center gap-4'>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => onLike(post.id)}
              className={`flex items-center gap-2 ${
                post.isLiked
                  ? 'text-red-500 hover:text-red-600'
                  : 'text-muted-foreground hover:text-red-500'
              }`}
            >
              <Heart
                className={`w-4 h-4 ${post.isLiked ? 'fill-current' : ''}`}
              />
              <span>{post.likes}</span>
            </Button>

            <Button
              variant='ghost'
              size='sm'
              onClick={() => onComment(post.id)}
              className='flex items-center gap-2 text-muted-foreground hover:text-blue-500'
            >
              <MessageCircle className='w-4 h-4' />
              <span>{post.comments}</span>
            </Button>

            <Button
              variant='ghost'
              size='sm'
              onClick={() => onShare(post.id)}
              className='flex items-center gap-2 text-muted-foreground hover:text-green-500'
            >
              <Share2 className='w-4 h-4' />
              <span>Chia sẻ</span>
            </Button>
          </div>

          {/* Challenge button for match results */}
          {post.type === 'match_result' && onChallenge && (
            <Button
              variant='outline'
              size='sm'
              onClick={() => onChallenge(post.id)}
              className='text-xs'
            >
              Thách đấu
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SocialFeedCard;
