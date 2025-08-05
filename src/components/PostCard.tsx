import { useState } from 'react';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import UserAvatar from './UserAvatar';
import SocialActions from './SocialActions';
import CommentsSection from './CommentsSection';

interface PostCardProps {
  post: {
    id: string;
    user: {
      id: string;
      name: string;
      avatar: string;
      rank: string;
    };
    type: 'match_result' | 'achievement' | 'tournament_win' | 'streak';
    content: string;
    image?: string;
    stats?: {
      score?: string;
      opponent?: string;
      achievement?: string;
    };
    timestamp: string;
    likes: number;
    comments: number;
    isLiked: boolean;
  };
  onLike: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onChallenge?: (postId: string) => void;
}

const PostCard = ({
  post,
  onLike,
  onComment,
  onShare,
  onChallenge,
}: PostCardProps) => {
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);

  // Mock comments data
  const [comments, setComments] = useState([
    {
      id: '1',
      user: {
        id: '2',
        name: 'Người chơi B',
        avatar: '/placeholder.svg',
        rank: 'F+',
      },
      content: 'Chúc mừng! Trận đấu hay lắm!',
      timestamp: '2 giờ trước',
      likes: 5,
      isLiked: false,
      replies: [
        {
          id: '2',
          user: {
            id: '1',
            name: post.user.name,
            avatar: post.user.avatar,
            rank: post.user.rank,
          },
          content: 'Cảm ơn bạn! 😊',
          timestamp: '1 giờ trước',
          likes: 2,
          isLiked: true,
        },
      ],
    },
  ]);

  const handleCommentClick = () => {
    setIsCommentsOpen(true);
    onComment?.(post.id);
  };

  const handleAddComment = (postId: string, content: string) => {
    const newComment = {
      id: Date.now().toString(),
      user: {
        id: 'current_user',
        name: 'Bạn',
        avatar: '/placeholder.svg',
        rank: 'G+',
      },
      content,
      timestamp: 'Vừa xong',
      likes: 0,
      isLiked: false,
      replies: [],
    };
    setComments(prev => [...prev, newComment]);
  };

  const handleLikeComment = (commentId: string) => {
    setComments(prev =>
      prev.map(comment =>
        comment.id === commentId
          ? {
              ...comment,
              isLiked: !comment.isLiked,
              likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
            }
          : comment
      )
    );
  };

  const handleReplyComment = (commentId: string, content: string) => {
    const newReply = {
      id: Date.now().toString(),
      user: {
        id: 'current_user',
        name: 'Bạn',
        avatar: '/placeholder.svg',
        rank: 'E+',
      },
      content,
      timestamp: 'Vừa xong',
      likes: 0,
      isLiked: false,
    };

    setComments(prev =>
      prev.map(comment =>
        comment.id === commentId
          ? { ...comment, replies: [...(comment.replies || []), newReply] }
          : comment
      )
    );
  };

  const getPostTypeIcon = () => {
    switch (post.type) {
      case 'match_result':
        return '🎱';
      case 'achievement':
        return '🏆';
      case 'tournament_win':
        return '👑';
      case 'streak':
        return '🔥';
      default:
        return '🎯';
    }
  };

  const getStatsBackground = () => {
    switch (post.type) {
      case 'match_result':
        return 'bg-primary-blue';
      case 'achievement':
        return 'bg-primary-purple';
      case 'tournament_win':
        return 'bg-gold';
      default:
        return 'bg-primary-green';
    }
  };

  return (
    <>
      <Card className='bg-white shadow-sm hover:shadow-md transition-shadow duration-200'>
        <CardContent className='p-4'>
          {/* Post Header */}
          <div className='flex items-center justify-between mb-3'>
            <UserAvatar user={post.user} size='md' showRank={true} />
            <div className='flex items-center space-x-2'>
              <span className='text-2xl'>{getPostTypeIcon()}</span>
              <p className='text-xs text-comment-gray'>{post.timestamp}</p>
            </div>
          </div>

          {/* Post Content */}
          <div className='mb-4'>
            <p className='post-text text-gray-800 mb-3'>{post.content}</p>

            {/* Post Stats */}
            {post.stats && (
              <div
                className={`${getStatsBackground()} rounded-lg p-4 text-white`}
              >
                {post.type === 'match_result' && (
                  <div className='text-center'>
                    <p className='text-3xl font-bold mb-1'>
                      {post.stats.score}
                    </p>
                    <p className='text-sm opacity-90'>
                      vs {post.stats.opponent}
                    </p>
                  </div>
                )}
                {post.type === 'achievement' && (
                  <div className='text-center'>
                    <p className='text-lg font-bold'>
                      {post.stats.achievement}
                    </p>
                  </div>
                )}
              </div>
            )}

            {post.image && (
              <img
                src={post.image}
                alt='Post content'
                className='w-full h-48 object-cover rounded-lg mt-3'
              />
            )}
          </div>

          {/* Social Actions */}
          <SocialActions
            postId={post.id}
            likes={post.likes}
            comments={post.comments}
            isLiked={post.isLiked}
            onLike={onLike}
            onComment={handleCommentClick}
            onShare={onShare}
            onChallenge={onChallenge}
            showChallenge={true}
          />
        </CardContent>
      </Card>

      {/* Comments Modal */}
      <Dialog open={isCommentsOpen} onOpenChange={setIsCommentsOpen}>
        <DialogContent className='sm:max-w-lg max-h-[80vh]'>
          <DialogHeader>
            <DialogTitle>Bình luận</DialogTitle>
          </DialogHeader>
          <CommentsSection
            postId={post.id}
            comments={comments}
            onAddComment={handleAddComment}
            onLikeComment={handleLikeComment}
            onReplyComment={handleReplyComment}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PostCard;
