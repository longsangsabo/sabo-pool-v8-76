import { useState, useEffect } from 'react';

interface FeedPost {
  id: string;
  content: string;
  post_type: string;
  metadata: any;
  image_url?: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  user_id: string;
  profile?: {
    full_name: string;
    avatar_url?: string;
    verified_rank?: string;
  };
}

export const useRealtimeFeedMock = () => {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    // Mock empty feed
    setPosts([]);
    setLoading(false);
    setIsConnected(true);
  }, []);

  const refreshFeed = async () => {
    console.log('Mock feed refresh');
  };

  const createPost = async (content: string, type: string = 'text', metadata: any = {}) => {
    console.log('Mock create post:', content, type, metadata);
  };

  const likePost = async (postId: string) => {
    console.log('Mock like post:', postId);
  };

  const unlikePost = async (postId: string) => {
    console.log('Mock unlike post:', postId);
  };

  const challengePlayer = (postId: string) => {
    console.log('Mock challenge player from post:', postId);
  };

  return {
    posts,
    loading,
    isConnected,
    refreshFeed,
    createPost,
    likePost,
    unlikePost,
    challengePlayer
  };
};