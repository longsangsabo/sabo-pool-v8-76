import { useState, useEffect } from 'react';

// Temporary mock implementation for useRealtimeFeed
export const useRealtimeFeed = () => {
  const [feedItems, setFeedItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Mock implementation - in reality this would connect to Supabase realtime
    setLoading(false);
    setFeedItems([]);
  }, []);

  return {
    feedItems,
    feedPosts: [],
    loading,
    isConnected: true,
    refreshFeed: () => {
      setLoading(true);
      setTimeout(() => setLoading(false), 1000);
    },
    handleLike: () => {},
    handleComment: () => {},
    handleShare: () => {},
    handleChallenge: () => {},
    createPost: (content?: string) => {},
  };
};

export default useRealtimeFeed;
