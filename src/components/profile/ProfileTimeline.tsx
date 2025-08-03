import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Trophy,
  Target,
  Users,
  Calendar,
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
// Define ProfilePost type locally since it's not exported from ProfilePage
interface ProfilePost {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  post_type: string;
  type: string;
  likes_count: number;
  comments_count: number;
  images?: string[];
  achievement?: {
    title: string;
    description: string;
    icon: string;
    points: number;
  };
  match_result?: {
    opponent: string;
    result: string;
    score: string;
    rating_change: number;
  };
  event?: {
    title: string;
    date: Date;
    location: string;
  };
  metadata?: any;
}

interface ProfileTimelineProps {
  userId: string;
}

export const ProfileTimeline: React.FC<ProfileTimelineProps> = ({ userId }) => {
  const [posts, setPosts] = useState<ProfilePost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTimeline = async () => {
      setIsLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        setPosts([
          {
            id: '1',
            user_id: userId,
            type: 'achievement',
            post_type: 'achievement',
            content: 'Đã đạt được thành tích mới!',
            created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
            likes_count: 15,
            comments_count: 3,
            achievement: {
              title: 'Chiến thắng liên tiếp',
              description: 'Thắng 5 trận đấu liên tiếp',
              icon: '🏆',
              points: 100,
            },
          },
          {
            id: '2',
            user_id: userId,
            type: 'match_result',
            post_type: 'match_result',
            content: 'Vừa hoàn thành trận đấu',
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
            likes_count: 8,
            comments_count: 2,
            match_result: {
              opponent: 'player2',
              result: 'win',
              score: '7-3',
              rating_change: 25,
            },
          },
          {
            id: '3',
            user_id: userId,
            type: 'event',
            post_type: 'event',
            content: 'Tham gia sự kiện mới',
            created_at: new Date(
              Date.now() - 1000 * 60 * 60 * 24
            ).toISOString(), // 1 day ago
            likes_count: 12,
            comments_count: 5,
            event: {
              title: 'Giải đấu cuối tuần',
              date: new Date(Date.now() + 1000 * 60 * 60 * 48), // 2 days from now
              location: 'Club Pool Hà Nội',
            },
          },
          {
            id: '4',
            user_id: userId,
            type: 'post',
            post_type: 'post',
            content:
              'Hôm nay là một ngày tuyệt vời để chơi pool! Đã luyện tập được 3 tiếng và cảm thấy kỹ thuật đã cải thiện rất nhiều. Ai muốn thách đấu không? 🎱',
            created_at: new Date(
              Date.now() - 1000 * 60 * 60 * 24 * 2
            ).toISOString(), // 2 days ago
            likes_count: 23,
            comments_count: 7,
            images: ['/images/pool-practice.jpg'],
          },
        ]);
      } catch (error) {
        console.error('Failed to fetch timeline:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTimeline();
  }, [userId]);

  const renderPost = (post: ProfilePost) => {
    const getPostIcon = () => {
      switch (post.type) {
        case 'achievement':
          return <Trophy className='h-4 w-4 text-yellow-500' />;
        case 'match_result':
          return <Target className='h-4 w-4 text-red-500' />;
        case 'event':
          return <Calendar className='h-4 w-4 text-blue-500' />;
        default:
          return null;
      }
    };

    const getPostBadge = () => {
      switch (post.type) {
        case 'achievement':
          return (
            <Badge
              variant='secondary'
              className='bg-yellow-100 text-yellow-800'
            >
              Thành tích
            </Badge>
          );
        case 'match_result':
          return (
            <Badge variant='secondary' className='bg-red-100 text-red-800'>
              Trận đấu
            </Badge>
          );
        case 'event':
          return (
            <Badge variant='secondary' className='bg-blue-100 text-blue-800'>
              Sự kiện
            </Badge>
          );
        default:
          return null;
      }
    };

    const renderPostContent = () => {
      switch (post.type) {
        case 'achievement':
          return (
            <div className='space-y-3'>
              <div className='flex items-center gap-3'>
                <div className='w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center'>
                  <span className='text-2xl'>{post.achievement?.icon}</span>
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
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      post.match_result?.result === 'win'
                        ? 'bg-green-100'
                        : 'bg-red-100'
                    }`}
                  >
                    <span className='text-2xl'>
                      {post.match_result?.result === 'win' ? '🏆' : '😔'}
                    </span>
                  </div>
                  <div>
                    <div className='font-medium'>
                      {post.match_result?.result === 'win'
                        ? 'Chiến thắng'
                        : 'Thất bại'}{' '}
                      vs {post.match_result?.opponent}
                    </div>
                    <div className='text-sm text-gray-600'>
                      Tỷ số: {post.match_result?.score}
                    </div>
                    <div
                      className={`text-sm font-medium ${
                        (post.match_result?.rating_change || 0) > 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {(post.match_result?.rating_change || 0) > 0 ? '+' : ''}
                      {post.match_result?.rating_change} điểm
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );

        case 'event':
          return (
            <div className='space-y-3'>
              <div className='flex items-center gap-3'>
                <div className='w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center'>
                  <Calendar className='h-6 w-6 text-blue-600' />
                </div>
                <div>
                  <div className='font-medium'>{post.event?.title}</div>
                  <div className='text-sm text-gray-600'>
                    {post.event?.location}
                  </div>
                  <div className='text-sm text-blue-600'>
                    {formatDistanceToNow(post.event?.date || new Date(), {
                      addSuffix: true,
                      locale: vi,
                    })}
                  </div>
                </div>
              </div>
            </div>
          );

        default:
          return (
            <div className='space-y-3'>
              <p className='text-gray-800'>{post.content}</p>
              {post.images && post.images.length > 0 && (
                <div className='grid grid-cols-1 md:grid-cols-2 gap-2'>
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
            </div>
          );
      }
    };

    return (
      <Card key={post.id} className='mb-4'>
        <CardHeader className='pb-3'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <Avatar className='h-10 w-10'>
                <AvatarImage src='/avatars/player1.jpg' />
                <AvatarFallback>P</AvatarFallback>
              </Avatar>
              <div>
                <div className='flex items-center gap-2'>
                  <span className='font-medium'>player1</span>
                  {getPostIcon()}
                </div>
                <div className='flex items-center gap-2 text-sm text-gray-500'>
                  <span>
                    {formatDistanceToNow(new Date(post.created_at), {
                      addSuffix: true,
                      locale: vi,
                    })}
                  </span>
                  {getPostBadge()}
                </div>
              </div>
            </div>
            <Button variant='ghost' size='sm'>
              <MoreHorizontal className='h-4 w-4' />
            </Button>
          </div>
        </CardHeader>

        <CardContent className='pt-0'>
          {renderPostContent()}

          {/* Action Buttons */}
          <div className='flex items-center justify-between mt-4 pt-4 border-t'>
            <div className='flex items-center gap-4'>
              <Button
                variant='ghost'
                size='sm'
                className='flex items-center gap-2 text-gray-600'
              >
                <Heart className='h-4 w-4' />
                <span>{post.likes_count}</span>
              </Button>

              <Button
                variant='ghost'
                size='sm'
                className='flex items-center gap-2 text-gray-600'
              >
                <MessageCircle className='h-4 w-4' />
                <span>{post.comments_count}</span>
              </Button>

              <Button
                variant='ghost'
                size='sm'
                className='flex items-center gap-2 text-gray-600'
              >
                <Share2 className='h-4 w-4' />
                <span>Chia sẻ</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-8'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500'></div>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Calendar className='h-5 w-5' />
            Dòng thời gian
          </CardTitle>
        </CardHeader>
        <CardContent>
          {posts.length > 0 ? (
            <div className='space-y-4'>{posts.map(renderPost)}</div>
          ) : (
            <div className='text-center py-8 text-gray-500'>
              Chưa có hoạt động nào
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
