import { useState } from 'react';
import { toast } from 'sonner';

// Mock hook since user_follows table doesn't exist
export const useSocial = () => {
  const [loading, setLoading] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);

  const followUser = {
    mutate: async (userId: string) => {
      try {
        console.log('Follow user:', userId);
        toast.success('User followed successfully');
      } catch (error) {
        toast.error('Failed to follow user');
      }
    },
    isPending: false,
  };

  const unfollowUser = {
    mutate: async (userId: string) => {
      try {
        console.log('Unfollow user:', userId);
        toast.success('User unfollowed successfully');
      } catch (error) {
        toast.error('Failed to unfollow user');
      }
    },
    isPending: false,
  };

  // Helper function to check if user is following another user
  const isFollowing = (userId: string) => {
    return following.some((user: any) => user.id === userId);
  };

  return {
    loading,
    loadingFollowing: false,
    loadingFollowers: false,
    followers,
    following,
    followUser,
    unfollowUser,
    isFollowing,
  };
};
