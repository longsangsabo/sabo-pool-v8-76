import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Post {
  id: string;
  author_id: string;
  author: {
    id: string;
    username: string;
    avatar_url?: string;
    rank: string;
  };
  content: string;
  images?: string[];
  video_url?: string;
  location?: {
    name: string;
    address: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  tags: string[];
  likes_count: number;
  comments_count: number;
  shares_count: number;
  is_liked: boolean;
  is_shared: boolean;
  visibility: 'public' | 'friends' | 'private';
  created_at: Date;
  updated_at: Date;
  metadata?: {
    match_result?: {
      opponent: string;
      score: string;
      venue: string;
    };
    tournament_info?: {
      name: string;
      position: number;
      prize: number;
    };
    achievement?: {
      name: string;
      description: string;
      icon_url: string;
    };
  };
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  author: {
    id: string;
    username: string;
    avatar_url?: string;
    rank: string;
  };
  content: string;
  likes_count: number;
  is_liked: boolean;
  created_at: Date;
  replies?: Comment[];
}

export interface CreatePostData {
  content: string;
  images?: File[];
  video_url?: string;
  location?: {
    name: string;
    address: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  tags: string[];
  visibility: 'public' | 'friends' | 'private';
  metadata?: {
    match_result?: {
      opponent: string;
      score: string;
      venue: string;
    };
    tournament_info?: {
      name: string;
      position: number;
      prize: number;
    };
    achievement?: {
      name: string;
      description: string;
      icon_url: string;
    };
  };
}

export const usePosts = (userId?: string) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  // Fetch posts
  const fetchPosts = useCallback(
    async (pageNum: number = 1, limit: number = 10) => {
      try {
        setLoading(true);
        setError(null);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Mock posts data
        const mockPosts: Post[] = [
          {
            id: '1',
            author_id: '1',
            author: {
              id: '1',
              username: 'pool_master',
              avatar_url: '/avatars/pool_master.jpg',
              rank: 'A+',
            },
            content:
              'Vừa thắng trận đấu căng thẳng với @champion_player! Kết quả 7-5. Cảm ơn tất cả mọi người đã ủng hộ! 🎱🏆',
            images: ['/posts/match_win_1.jpg', '/posts/match_win_2.jpg'],
            location: {
              name: 'Club Bida ABC',
              address: '123 Đường ABC, Quận 1, TP.HCM',
            },
            tags: ['victory', '8ball', 'excited'],
            likes_count: 45,
            comments_count: 12,
            shares_count: 3,
            is_liked: false,
            is_shared: false,
            visibility: 'public',
            created_at: new Date(Date.now() - 1000 * 60 * 30),
            updated_at: new Date(),
            metadata: {
              match_result: {
                opponent: 'champion_player',
                score: '7-5',
                venue: 'Club Bida ABC',
              },
            },
          },
          {
            id: '2',
            author_id: '2',
            author: {
              id: '2',
              username: 'champion',
              avatar_url: '/avatars/champion.jpg',
              rank: 'G',
            },
            content:
              'Chia sẻ một số tips chơi 9-ball cho các bạn mới. Điểm quan trọng nhất là phải có chiến thuật rõ ràng! 📚🎯',
            video_url: 'https://youtube.com/watch?v=example',
            tags: ['tips', '9ball', 'tutorial'],
            likes_count: 78,
            comments_count: 23,
            shares_count: 15,
            is_liked: true,
            is_shared: false,
            visibility: 'public',
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 2),
            updated_at: new Date(),
          },
          {
            id: '3',
            author_id: '3',
            author: {
              id: '3',
              username: 'veteran',
              avatar_url: '/avatars/veteran.jpg',
              rank: 'A+',
            },
            content:
              'Đạt được thành tích mới: "Vô địch giải đấu"! Cảm ơn tất cả đồng đội và người hâm mộ! 🏆✨',
            images: ['/posts/tournament_win.jpg'],
            tags: ['achievement', 'tournament', 'champion'],
            likes_count: 156,
            comments_count: 34,
            shares_count: 28,
            is_liked: false,
            is_shared: true,
            visibility: 'public',
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 6),
            updated_at: new Date(),
            metadata: {
              achievement: {
                name: 'Vô địch giải đấu',
                description: 'Vô địch giải đấu cấp thành phố',
                icon_url: '/achievements/tournament_winner.png',
              },
            },
          },
        ];

        if (pageNum === 1) {
          setPosts(mockPosts);
        } else {
          setPosts(prev => [...prev, ...mockPosts]);
        }

        setHasMore(mockPosts.length === limit);
        setPage(pageNum);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không thể tải bài viết');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Create new post
  const createPost = useCallback(
    async (data: CreatePostData) => {
      if (!userId) return;

      try {
        setLoading(true);
        setError(null);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Mock author data
        const author = {
          id: userId,
          username: 'current_user',
          avatar_url: '/avatars/current_user.jpg',
          rank: 'F+',
        };

        const newPost: Post = {
          id: Date.now().toString(),
          author_id: userId,
          author,
          content: data.content,
          images: data.images
            ? data.images.map(file => URL.createObjectURL(file))
            : undefined,
          video_url: data.video_url,
          location: data.location,
          tags: data.tags,
          likes_count: 0,
          comments_count: 0,
          shares_count: 0,
          is_liked: false,
          is_shared: false,
          visibility: data.visibility,
          created_at: new Date(),
          updated_at: new Date(),
          metadata: data.metadata,
        };

        setPosts(prev => [newPost, ...prev]);
        return newPost;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không thể tạo bài viết');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  // Like/unlike post
  const toggleLike = useCallback(async (postId: string) => {
    try {
      setPosts(prev =>
        prev.map(post =>
          post.id === postId
            ? {
                ...post,
                is_liked: !post.is_liked,
                likes_count: post.is_liked
                  ? post.likes_count - 1
                  : post.likes_count + 1,
              }
            : post
        )
      );
    } catch (err) {
      console.error('Failed to toggle like:', err);
    }
  }, []);

  // Share post
  const sharePost = useCallback(async (postId: string) => {
    try {
      setPosts(prev =>
        prev.map(post =>
          post.id === postId
            ? {
                ...post,
                is_shared: !post.is_shared,
                shares_count: post.is_shared
                  ? post.shares_count - 1
                  : post.shares_count + 1,
              }
            : post
        )
      );
    } catch (err) {
      console.error('Failed to share post:', err);
    }
  }, []);

  // Delete post
  const deletePost = useCallback(async (postId: string) => {
    try {
      setPosts(prev => prev.filter(post => post.id !== postId));
    } catch (err) {
      console.error('Failed to delete post:', err);
    }
  }, []);

  // Get posts by user
  const getPostsByUser = useCallback(
    (targetUserId: string) => {
      return posts.filter(post => post.author_id === targetUserId);
    },
    [posts]
  );

  // Get posts by tag
  const getPostsByTag = useCallback(
    (tag: string) => {
      return posts.filter(post => post.tags.includes(tag));
    },
    [posts]
  );

  // Search posts
  const searchPosts = useCallback(
    (query: string) => {
      const lowercaseQuery = query.toLowerCase();
      return posts.filter(
        post =>
          post.content.toLowerCase().includes(lowercaseQuery) ||
          post.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
          post.author.username.toLowerCase().includes(lowercaseQuery)
      );
    },
    [posts]
  );

  // Load more posts
  const loadMorePosts = useCallback(() => {
    if (!loading && hasMore) {
      fetchPosts(page + 1);
    }
  }, [loading, hasMore, page, fetchPosts]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return {
    posts,
    loading,
    error,
    hasMore,
    fetchPosts,
    createPost,
    toggleLike,
    sharePost,
    deletePost,
    getPostsByUser,
    getPostsByTag,
    searchPosts,
    loadMorePosts,
  };
};

export const usePostBySlug = (slug: string) => {
  return useQuery({
    queryKey: ['post', slug],
    queryFn: async () => {
      if (!slug) return null;

      // Mock post by slug since posts table doesn't exist
      console.log('Mock getting post by slug:', slug);

      const mockPost = {
        id: '1',
        title: 'Sample Post',
        content: 'This is a sample post content',
        slug: slug,
        status: 'published',
        created_at: new Date().toISOString(),
        author: {
          full_name: 'Author Name',
          current_rank: 'G+',
        },
      };

      return mockPost;
    },
    enabled: !!slug,
  });
};
