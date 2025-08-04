import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import {
  MessageCircle,
  Share2,
  Heart,
  Users,
  Calendar,
  MapPin,
  Trophy,
  Target,
  MoreHorizontal,
  Bookmark,
  Flag,
} from 'lucide-react';
import { CommentModal } from './CommentModal';
import { ShareModal } from './ShareModal';
import { JoinEventModal } from './JoinEventModal';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

export interface FeedPostData {
  id: string;
  author: {
    id: string;
    username: string;
    avatar_url?: string;
    rank: string;
  };
  content: string;
  images?: string[];
  type: 'post' | 'event' | 'challenge' | 'achievement' | 'match_result';
  created_at: Date;
  location?: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  is_liked: boolean;
  is_bookmarked: boolean;

  // Event specific
  event?: {
    title: string;
    date: Date;
    location: string;
    participants_count: number;
    max_participants?: number;
    is_joined: boolean;
  };

  // Challenge specific
  challenge?: {
    title: string;
    bet_amount: number;
    opponent?: {
      id: string;
      username: string;
      avatar_url?: string;
    };
    status: 'open' | 'accepted' | 'completed';
  };

  // Achievement specific
  achievement?: {
    title: string;
    description: string;
    icon: string;
    points: number;
  };

  // Match result specific
  match_result?: {
    player1: {
      id: string;
      username: string;
      avatar_url?: string;
      score: number;
      rating_change: number;
    };
    player2: {
      id: string;
      username: string;
      avatar_url?: string;
      score: number;
      rating_change: number;
    };
    winner_id: string;
    match_type: string;
  };
}

interface FeedPostProps {
  post: FeedPostData;
  onLike: (postId: string) => void;
  onComment: (postId: string, comment: string) => void;
  onShare: (postId: string, shareType: 'public' | 'friends') => void;
  onJoin: (postId: string) => void;
  onBookmark: (postId: string) => void;
  onReport: (postId: string, reason: string) => void;
}

export const FeedPost: React.FC<FeedPostProps> = ({
  post,
  onLike,
  onComment,
  onShare,
  onJoin,
  onBookmark,
  onReport,
}) => {
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const handleLike = () => {
    onLike(post.id);
  };

  const handleComment = () => {
    setShowComments(true);
  };

  const handleShare = () => {
    setShowShare(true);
  };

  const handleJoin = () => {
    if (post.type === 'event' || post.type === 'challenge') {
      setShowJoin(true);
    }
  };

  const handleBookmark = () => {
    onBookmark(post.id);
  };

  const getPostIcon = () => {
    switch (post.type) {
      case 'event':
        return <Calendar className='h-4 w-4 text-blue-500' />;
      case 'challenge':
        return <Target className='h-4 w-4 text-red-500' />;
      case 'achievement':
        return <Trophy className='h-4 w-4 text-yellow-500' />;
      case 'match_result':
        return <Users className='h-4 w-4 text-green-500' />;
      default:
        return null;
    }
  };

  const getPostBadge = () => {
    switch (post.type) {
      case 'event':
        return (
          <Badge variant='secondary' className='bg-blue-100 text-blue-800'>
            Sự kiện
          </Badge>
        );
      case 'challenge':
        return (
          <Badge variant='secondary' className='bg-red-100 text-red-800'>
            Thách đấu
          </Badge>
        );
      case 'achievement':
        return (
          <Badge variant='secondary' className='bg-yellow-100 text-yellow-800'>
            Thành tích
          </Badge>
        );
      case 'match_result':
        return (
          <Badge variant='secondary' className='bg-green-100 text-green-800'>
            Kết quả trận
          </Badge>
        );
      default:
        return null;
    }
  };

  const renderPostContent = () => {
    switch (post.type) {
      case 'event':
        return (
          <div className='space-y-3'>
            <div className='flex items-center gap-2'>
              <Calendar className='h-4 w-4 text-blue-500' />
              <span className='font-medium'>{post.event?.title}</span>
            </div>
            <div className='flex items-center gap-2 text-sm text-gray-600'>
              <MapPin className='h-4 w-4' />
              <span>{post.event?.location}</span>
            </div>
            <div className='flex items-center gap-2 text-sm text-gray-600'>
              <Calendar className='h-4 w-4' />
              <span>
                {formatDistanceToNow(post.event?.date || new Date(), {
                  addSuffix: true,
                  locale: vi,
                })}
              </span>
            </div>
            <div className='flex items-center gap-2 text-sm text-gray-600'>
              <Users className='h-4 w-4' />
              <span>{post.event?.participants_count} tham gia</span>
              {post.event?.max_participants && (
                <span>/ {post.event.max_participants}</span>
              )}
            </div>
          </div>
        );

      case 'challenge':
        return (
          <div className='space-y-3'>
            <div className='flex items-center gap-2'>
              <Target className='h-4 w-4 text-red-500' />
              <span className='font-medium'>{post.challenge?.title}</span>
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-sm text-gray-600'>
                Tiền cược: {post.challenge?.bet_amount.toLocaleString()} VNĐ
              </span>
              <Badge
                variant={
                  post.challenge?.status === 'open' ? 'default' : 'secondary'
                }
              >
                {post.challenge?.status === 'open'
                  ? 'Mở'
                  : post.challenge?.status === 'accepted'
                    ? 'Đã nhận'
                    : 'Hoàn thành'}
              </Badge>
            </div>
            {post.challenge?.opponent && (
              <div className='flex items-center gap-2'>
                <span className='text-sm text-gray-600'>Đối thủ:</span>
                <Avatar className='h-6 w-6'>
                  <AvatarImage src={post.challenge.opponent.avatar_url} />
                  <AvatarFallback>
                    {post.challenge.opponent.username[0]}
                  </AvatarFallback>
                </Avatar>
                <span className='text-sm font-medium'>
                  {post.challenge.opponent.username}
                </span>
              </div>
            )}
          </div>
        );

      case 'achievement':
        return (
          <div className='space-y-3'>
            <div className='flex items-center gap-3'>
              <div className='w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center'>
                <Trophy className='h-6 w-6 text-yellow-600' />
              </div>
              <div>
                <div className='font-medium'>{post.achievement?.title}</div>
                <div className='text-sm text-gray-600'>
                  {post.achievement?.description}
                </div>
                <div className='text-sm text-yellow-600 font-medium'>
                  +{post.achievement?.points} điểm
                </div>
              </div>
            </div>
          </div>
        );

      case 'match_result':
        return (
          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <Avatar className='h-8 w-8'>
                  <AvatarImage src={post.match_result?.player1.avatar_url} />
                  <AvatarFallback>
                    {post.match_result?.player1.username[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className='font-medium'>
                    {post.match_result?.player1.username}
                  </div>
                  <div className='text-sm text-gray-600'>
                    Điểm: {post.match_result?.player1.score}
                  </div>
                </div>
              </div>
              <div className='text-2xl font-bold'>VS</div>
              <div className='flex items-center gap-3'>
                <div>
                  <div className='font-medium text-right'>
                    {post.match_result?.player2.username}
                  </div>
                  <div className='text-sm text-gray-600 text-right'>
                    Điểm: {post.match_result?.player2.score}
                  </div>
                </div>
                <Avatar className='h-8 w-8'>
                  <AvatarImage src={post.match_result?.player2.avatar_url} />
                  <AvatarFallback>
                    {post.match_result?.player2.username[0]}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
            <div className='flex justify-between text-sm'>
              <span
                className={
                  post.match_result?.player1.rating_change > 0
                    ? 'text-green-600'
                    : 'text-red-600'
                }
              >
                {post.match_result?.player1.rating_change > 0 ? '+' : ''}
                {post.match_result?.player1.rating_change}
              </span>
              <span className='text-gray-600'>
                {post.match_result?.match_type}
              </span>
              <span
                className={
                  post.match_result?.player2.rating_change > 0
                    ? 'text-green-600'
                    : 'text-red-600'
                }
              >
                {post.match_result?.player2.rating_change > 0 ? '+' : ''}
                {post.match_result?.player2.rating_change}
              </span>
            </div>
          </div>
        );

      default:
        return <p className='text-gray-800'>{post.content}</p>;
    }
  };

  return (
    <>
      <Card className='mb-4 hover:shadow-md transition-shadow'>
        <CardHeader className='pb-3'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <Avatar className='h-10 w-10'>
                <AvatarImage src={post.author.avatar_url} />
                <AvatarFallback>{post.author.username[0]}</AvatarFallback>
              </Avatar>
              <div>
                <div className='flex items-center gap-2'>
                  <span className='font-medium'>{post.author.username}</span>
                  <Badge variant='outline' className='text-xs'>
                    {post.author.rank}
                  </Badge>
                  {getPostIcon()}
                </div>
                <div className='flex items-center gap-2 text-sm text-gray-500'>
                  <span>
                    {formatDistanceToNow(post.created_at, {
                      addSuffix: true,
                      locale: vi,
                    })}
                  </span>
                  {post.location && (
                    <>
                      <span>•</span>
                      <span>{post.location}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              {getPostBadge()}
              <Button
                variant='ghost'
                size='sm'
                onClick={() => setShowOptions(!showOptions)}
              >
                <MoreHorizontal className='h-4 w-4' />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className='pt-0'>
          {renderPostContent()}

          {/* Images */}
          {post.images && post.images.length > 0 && (
            <div className='mt-4 grid grid-cols-1 md:grid-cols-2 gap-2'>
              {post.images.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`Post image ${index + 1}`}
                  className='w-full h-48 object-cover rounded-lg'
                />
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className='flex items-center justify-between mt-4 pt-4 border-t'>
            <div className='flex items-center gap-4'>
              <Button
                variant='ghost'
                size='sm'
                onClick={handleLike}
                className={`flex items-center gap-2 ${post.is_liked ? 'text-red-500' : 'text-gray-600'}`}
              >
                <Heart
                  className={`h-4 w-4 ${post.is_liked ? 'fill-current' : ''}`}
                />
                <span>{post.likes_count}</span>
              </Button>

              <Button
                variant='ghost'
                size='sm'
                onClick={handleComment}
                className='flex items-center gap-2 text-gray-600'
              >
                <MessageCircle className='h-4 w-4' />
                <span>{post.comments_count}</span>
              </Button>

              <Button
                variant='ghost'
                size='sm'
                onClick={handleShare}
                className='flex items-center gap-2 text-gray-600'
              >
                <Share2 className='h-4 w-4' />
                <span>{post.shares_count}</span>
              </Button>
            </div>

            <div className='flex items-center gap-2'>
              {(post.type === 'event' || post.type === 'challenge') && (
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleJoin}
                  className='flex items-center gap-2'
                >
                  <Users className='h-4 w-4' />
                  <span>
                    {post.type === 'event' && post.event?.is_joined
                      ? 'Đã tham gia'
                      : post.type === 'challenge' &&
                          post.challenge?.status === 'accepted'
                        ? 'Đã nhận'
                        : 'Tham gia'}
                  </span>
                </Button>
              )}

              <Button
                variant='ghost'
                size='sm'
                onClick={handleBookmark}
                className={`${post.is_bookmarked ? 'text-blue-500' : 'text-gray-600'}`}
              >
                <Bookmark
                  className={`h-4 w-4 ${post.is_bookmarked ? 'fill-current' : ''}`}
                />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <CommentModal
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        postId={post.id}
        commentsCount={post.comments_count}
        onComment={onComment}
      />

      <ShareModal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        postId={post.id}
        onShare={onShare}
      />

      <JoinEventModal
        isOpen={showJoin}
        onClose={() => setShowJoin(false)}
        post={post}
        onJoin={onJoin}
      />
    </>
  );
};
