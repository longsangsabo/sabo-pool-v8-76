import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, X, Heart, Reply, Flag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

export interface Comment {
  id: string;
  author: {
    id: string;
    username: string;
    avatar_url?: string;
    rank: string;
  };
  content: string;
  created_at: Date;
  likes_count: number;
  is_liked: boolean;
  replies?: Comment[];
}

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  commentsCount: number;
  onComment: (postId: string, comment: string) => void;
}

export const CommentModal: React.FC<CommentModalProps> = ({
  isOpen,
  onClose,
  postId,
  commentsCount,
  onComment,
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);

  // Mock data - replace with actual API call
  useEffect(() => {
    if (isOpen) {
      // Simulate loading comments
      setIsLoading(true);
      setTimeout(() => {
        setComments([
          {
            id: '1',
            author: {
              id: '1',
              username: 'player1',
              avatar_url: '/avatars/player1.jpg',
              rank: 'A+',
            },
            content: 'Trận đấu hay quá! Chúc mừng chiến thắng!',
            created_at: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
            likes_count: 5,
            is_liked: false,
            replies: [
              {
                id: '1-1',
                author: {
                  id: '2',
                  username: 'player2',
                  avatar_url: '/avatars/player2.jpg',
                  rank: 'B+',
                },
                content: 'Cảm ơn bạn! Trận đấu rất thú vị.',
                created_at: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
                likes_count: 2,
                is_liked: true,
              },
            ],
          },
          {
            id: '2',
            author: {
              id: '3',
              username: 'pool_master',
              avatar_url: '/avatars/pool_master.jpg',
              rank: 'G',
            },
            content: 'Kỹ thuật đánh rất tốt, đặc biệt là cú đánh ở frame 15.',
            created_at: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
            likes_count: 8,
            is_liked: false,
          },
        ]);
        setIsLoading(false);
      }, 500);
    }
  }, [isOpen]);

  const handleSubmitComment = () => {
    if (newComment.trim()) {
      onComment(postId, newComment);
      setNewComment('');
      // Add new comment to the list
      const newCommentObj: Comment = {
        id: Date.now().toString(),
        author: {
          id: 'current-user',
          username: 'You',
          rank: 'A+',
        },
        content: newComment,
        created_at: new Date(),
        likes_count: 0,
        is_liked: false,
      };
      setComments(prev => [newCommentObj, ...prev]);
    }
  };

  const handleLikeComment = (commentId: string) => {
    setComments(prev =>
      prev.map(comment => {
        if (comment.id === commentId) {
          return {
            ...comment,
            is_liked: !comment.is_liked,
            likes_count: comment.is_liked
              ? comment.likes_count - 1
              : comment.likes_count + 1,
          };
        }
        return comment;
      })
    );
  };

  const handleReply = (commentId: string) => {
    setReplyTo(replyTo === commentId ? null : commentId);
  };

  const handleReportComment = (commentId: string) => {
    // Handle report comment

  };

  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment.id} className={`flex gap-3 ${isReply ? 'ml-8' : ''}`}>
      <Avatar className='h-8 w-8 flex-shrink-0'>
        <AvatarImage src={comment.author.avatar_url} />
        <AvatarFallback>{comment.author.username[0]}</AvatarFallback>
      </Avatar>

      <div className='flex-1 min-w-0'>
        <div className='bg-gray-50 rounded-lg p-3'>
          <div className='flex items-center gap-2 mb-1'>
            <span className='font-medium text-sm'>
              {comment.author.username}
            </span>
            <Badge variant='outline' className='text-xs'>
              {comment.author.rank}
            </Badge>
            <span className='text-xs text-gray-500'>
              {formatDistanceToNow(comment.created_at, {
                addSuffix: true,
                locale: vi,
              })}
            </span>
          </div>

          <p className='text-sm text-gray-800 mb-2'>{comment.content}</p>

          <div className='flex items-center gap-4'>
            <button
              onClick={() => handleLikeComment(comment.id)}
              className={`flex items-center gap-1 text-xs ${
                comment.is_liked ? 'text-red-500' : 'text-gray-500'
              } hover:text-red-500 transition-colors`}
            >
              <Heart
                className={`h-3 w-3 ${comment.is_liked ? 'fill-current' : ''}`}
              />
              <span>{comment.likes_count}</span>
            </button>

            {!isReply && (
              <button
                onClick={() => handleReply(comment.id)}
                className='flex items-center gap-1 text-xs text-gray-500 hover:text-blue-500 transition-colors'
              >
                <Reply className='h-3 w-3' />
                <span>Trả lời</span>
              </button>
            )}

            <button
              onClick={() => handleReportComment(comment.id)}
              className='flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors'
            >
              <Flag className='h-3 w-3' />
              <span>Báo cáo</span>
            </button>
          </div>
        </div>

        {/* Reply input */}
        {replyTo === comment.id && !isReply && (
          <div className='mt-3 flex gap-2'>
            <Input
              placeholder='Viết trả lời...'
              className='flex-1 text-sm'
              onKeyPress={e => {
                if (e.key === 'Enter') {
                  // Handle reply submission
                  setReplyTo(null);
                }
              }}
            />
            <Button
              size='sm'
              variant='outline'
              onClick={() => setReplyTo(null)}
            >
              <X className='h-3 w-3' />
            </Button>
          </div>
        )}

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className='mt-3 space-y-3'>
            {comment.replies.map(reply => renderComment(reply, true))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-2xl max-h-[80vh] flex flex-col'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <span>Bình luận ({commentsCount})</span>
          </DialogTitle>
        </DialogHeader>

        <div className='flex-1 flex flex-col'>
          {/* Comments list */}
          <ScrollArea className='flex-1 pr-4'>
            {isLoading ? (
              <div className='flex items-center justify-center py-8'>
                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500'></div>
              </div>
            ) : comments.length > 0 ? (
              <div className='space-y-4'>
                {comments.map(comment => renderComment(comment))}
              </div>
            ) : (
              <div className='text-center py-8 text-gray-500'>
                Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
              </div>
            )}
          </ScrollArea>

          {/* Comment input */}
          <div className='border-t pt-4 mt-4'>
            <div className='flex gap-2'>
              <Input
                placeholder='Viết bình luận...'
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                onKeyPress={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmitComment();
                  }
                }}
                className='flex-1'
              />
              <Button
                onClick={handleSubmitComment}
                disabled={!newComment.trim()}
                size='sm'
              >
                <Send className='h-4 w-4' />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
