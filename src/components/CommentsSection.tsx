import React, { useState } from 'react';
import { Send, Heart, MoreHorizontal } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import UserAvatar from './UserAvatar';

interface Comment {
  id: string;
  user: {
    id: string;
    name: string;
    avatar: string;
    rank: string;
  };
  content: string;
  timestamp: string;
  likes: number;
  isLiked: boolean;
  replies?: Comment[];
}

interface CommentsSectionProps {
  postId: string;
  comments: Comment[];
  onAddComment: (postId: string, content: string) => void;
  onLikeComment: (commentId: string) => void;
  onReplyComment: (commentId: string, content: string) => void;
}

const CommentsSection = ({
  postId,
  comments,
  onAddComment,
  onLikeComment,
  onReplyComment,
}: CommentsSectionProps) => {
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const handleSubmitComment = () => {
    if (newComment.trim()) {
      onAddComment(postId, newComment);
      setNewComment('');
    }
  };

  const handleSubmitReply = (commentId: string) => {
    if (replyContent.trim()) {
      onReplyComment(commentId, replyContent);
      setReplyContent('');
      setReplyingTo(null);
    }
  };

  const CommentItem = ({
    comment,
    isReply = false,
  }: {
    comment: Comment;
    isReply?: boolean;
  }) => (
    <div className={`flex gap-3 ${isReply ? 'ml-8 mt-2' : 'mb-4'}`}>
      <UserAvatar user={comment.user} size='sm' />
      <div className='flex-1'>
        <div className='bg-gray-50 rounded-lg p-3'>
          <div className='flex items-center gap-2 mb-1'>
            <span className='font-medium text-sm'>{comment.user.name}</span>
            <span className='text-xs text-gray-500'>{comment.user.rank}</span>
            <span className='text-xs text-gray-400'>{comment.timestamp}</span>
          </div>
          <p className='text-gray-800 text-sm'>{comment.content}</p>
        </div>

        <div className='flex items-center gap-4 mt-2 text-sm text-gray-500'>
          <button
            onClick={() => onLikeComment(comment.id)}
            className={`flex items-center gap-1 hover:text-like-red transition-colors ${
              comment.isLiked ? 'text-like-red' : ''
            }`}
          >
            <Heart
              className={`w-4 h-4 ${comment.isLiked ? 'fill-current' : ''}`}
            />
            <span>{comment.likes}</span>
          </button>

          {!isReply && (
            <button
              onClick={() => setReplyingTo(comment.id)}
              className='hover:text-primary-blue transition-colors'
            >
              Trả lời
            </button>
          )}

          <button className='hover:text-gray-700 transition-colors'>
            <MoreHorizontal className='w-4 h-4' />
          </button>
        </div>

        {/* Reply Form */}
        {replyingTo === comment.id && (
          <div className='flex gap-2 mt-3'>
            <Input
              placeholder='Viết trả lời...'
              value={replyContent}
              onChange={e => setReplyContent(e.target.value)}
              className='flex-1'
              onKeyPress={e =>
                e.key === 'Enter' && handleSubmitReply(comment.id)
              }
            />
            <Button
              size='sm'
              onClick={() => handleSubmitReply(comment.id)}
              disabled={!replyContent.trim()}
            >
              <Send className='w-4 h-4' />
            </Button>
          </div>
        )}

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className='mt-3'>
            {comment.replies.map(reply => (
              <CommentItem key={reply.id} comment={reply} isReply={true} />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className='space-y-4'>
      {/* Comments List */}
      <div className='max-h-96 overflow-y-auto'>
        {comments.map(comment => (
          <CommentItem key={comment.id} comment={comment} />
        ))}

        {comments.length === 0 && (
          <div className='text-center py-8 text-gray-500'>
            <p>Chưa có bình luận nào</p>
            <p className='text-sm'>Hãy là người đầu tiên bình luận!</p>
          </div>
        )}
      </div>

      {/* Add Comment Form */}
      <div className='flex gap-3 pt-4 border-t border-gray-100'>
        <UserAvatar
          user={{
            name: 'You',
            avatar: '/placeholder.svg',
            rank: 'I+',
          }}
          size='sm'
        />
        <div className='flex-1 flex gap-2'>
          <Input
            placeholder='Viết bình luận...'
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSubmitComment()}
            className='flex-1'
          />
          <Button
            onClick={handleSubmitComment}
            disabled={!newComment.trim()}
            size='sm'
          >
            <Send className='w-4 h-4' />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CommentsSection;
