import React from 'react';
import { Heart, MessageCircle, Share2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SocialActionsProps {
  postId?: string;
  likes: number;
  comments: number;
  isLiked: boolean;
  onLike: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onChallenge?: (postId: string) => void;
  showChallenge?: boolean;
}

const SocialActions = ({
  postId = '',
  likes,
  comments,
  isLiked,
  onLike,
  onComment,
  onShare,
  onChallenge,
  showChallenge = true,
}: SocialActionsProps) => {
  return (
    <div className='flex items-center justify-between pt-3 border-t border-gray-100'>
      <Button
        variant='ghost'
        size='sm'
        onClick={() => onLike(postId)}
        className={`flex items-center space-x-2 transition-colors ${
          isLiked
            ? 'text-like-red hover:text-like-red'
            : 'text-comment-gray hover:text-like-red'
        }`}
      >
        <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
        <span className='text-sm font-medium'>{likes}</span>
      </Button>

      <Button
        variant='ghost'
        size='sm'
        onClick={() => {
          if (onComment) {
            onComment(postId);
          } else {
            // ...removed console.log('Comment functionality not implemented')
          }
        }}
        className='flex items-center space-x-2 text-comment-gray hover:text-share-blue transition-colors'
      >
        <MessageCircle className='w-5 h-5' />
        <span className='text-sm font-medium'>{comments}</span>
      </Button>

      <Button
        variant='ghost'
        size='sm'
        onClick={() => {
          if (onShare) {
            onShare(postId);
          } else {
            // Fallback share functionality
            if (navigator.share) {
              navigator.share({
                title: 'SABO ARENA',
                text: 'Xem bài viết này trên SABO ARENA',
                url: `${window.location.origin}/feed/post/${postId}`,
              });
            } else {
              navigator.clipboard.writeText(
                `${window.location.origin}/feed/post/${postId}`
              );
              alert('Đã sao chép link vào clipboard!');
            }
          }
        }}
        className='flex items-center space-x-2 text-comment-gray hover:text-primary-green transition-colors'
      >
        <Share2 className='w-5 h-5' />
        <span className='text-sm font-medium'>Chia sẻ</span>
      </Button>

      {showChallenge && (
        <Button
          variant='ghost'
          size='sm'
          onClick={() => {
            if (onChallenge) {
              onChallenge(postId);
            } else {
              // ...removed console.log('Challenge functionality not implemented')
            }
          }}
          className='flex items-center space-x-2 text-primary-blue hover:text-primary-blue/80 transition-colors font-semibold'
        >
          <Zap className='w-5 h-5' />
          <span className='text-sm'>Thách đấu</span>
        </Button>
      )}
    </div>
  );
};

export default SocialActions;
