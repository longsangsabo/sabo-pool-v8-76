import React from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, UserMinus } from 'lucide-react';
import { useSocial } from '@/hooks/useSocial';

interface FollowButtonProps {
  userId: string;
  isFollowing?: boolean;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  showIcon?: boolean;
}

const FollowButton = ({
  userId,
  isFollowing: propIsFollowing,
  size = 'sm',
  variant = 'outline',
  showIcon = true,
}: FollowButtonProps) => {
  const {
    isFollowing: hookIsFollowing,
    followUser,
    unfollowUser,
  } = useSocial();

  // Use prop first, then fallback to hook
  const isFollowing = propIsFollowing ?? hookIsFollowing(userId);

  const handleToggleFollow = () => {
    if (isFollowing) {
      unfollowUser.mutate(userId);
    } else {
      followUser.mutate(userId);
    }
  };

  const isLoading = followUser.isPending || unfollowUser.isPending;

  return (
    <Button
      variant={isFollowing ? 'outline' : variant}
      size={size}
      onClick={handleToggleFollow}
      disabled={isLoading}
      className='flex items-center gap-2'
    >
      {showIcon &&
        (isFollowing ? (
          <UserMinus className='w-4 h-4' />
        ) : (
          <UserPlus className='w-4 h-4' />
        ))}
      <span>
        {isLoading ? 'Đang xử lý...' : isFollowing ? 'Bỏ theo dõi' : 'Theo dõi'}
      </span>
    </Button>
  );
};

export default FollowButton;
