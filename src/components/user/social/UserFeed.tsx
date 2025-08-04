import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserAvatar } from '../profile';
import {
  MessageSquare,
  Heart,
  Share2,
  Users,
  Trophy,
  Target,
  Camera,
  Send,
  MoreHorizontal,
  ThumbsUp,
  MessageCircle,
  Bookmark,
  Flag,
} from 'lucide-react';

interface UserFeedProps {
  className?: string;
}

interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url?: string;
  post_type: 'text' | 'match_result' | 'achievement' | 'tournament';
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  user_profile: {
    id: string;
    full_name: string;
    display_name?: string;
    avatar_url?: string;
    current_rank?: string;
    verified_rank?: string;
  };
  match_data?: {
    opponent_name: string;
    score: string;
    result: 'win' | 'lose';
    elo_change: number;
  };
  achievement_data?: {
    title: string;
    description: string;
    icon: string;
  };
  is_liked: boolean;
  is_bookmarked: boolean;
}

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user_profile: {
    full_name: string;
    display_name?: string;
    avatar_url?: string;
  };
}

const UserFeed = ({ className }: UserFeedProps) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [selectedTab, setSelectedTab] = useState('feed');
  const [showComments, setShowComments] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    fetchPosts();
    setupRealtimeSubscription();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('social_posts')
        .select(`
          *,
          user_profile:profiles!social_posts_user_id_fkey(
            id,
            full_name,
            display_name,
            avatar_url,
            current_rank,
            verified_rank
          ),
          likes:post_likes(count),
          comments:post_comments(count)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Process posts and add interaction data
      const processedPosts = await Promise.all(
        (data || []).map(async (post) => {
          // Check if user liked this post
          const { data: likeData } = await supabase
            .from('post_likes')
            .select('id')
            .eq('post_id', post.id)
            .eq('user_id', user?.id)
            .single();

          // Check if user bookmarked this post
          const { data: bookmarkData } = await supabase
            .from('post_bookmarks')
            .select('id')
            .eq('post_id', post.id)
            .eq('user_id', user?.id)
            .single();

          return {
            ...post,
            likes_count: post.likes?.[0]?.count || 0,
            comments_count: post.comments?.[0]?.count || 0,
            is_liked: !!likeData,
            is_bookmarked: !!bookmarkData,
          };
        })
      );

      setPosts(processedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Không thể tải bài viết');
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const subscription = supabase
      .channel('social_feed')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'social_posts',
        },
        () => {
          fetchPosts();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const handleCreatePost = async () => {
    if (!newPost.trim()) {
      toast.error('Vui lòng nhập nội dung bài viết');
      return;
    }

    try {
      const { error } = await supabase
        .from('social_posts')
        .insert({
          user_id: user?.id,
          content: newPost.trim(),
          post_type: 'text',
        });

      if (error) throw error;

      setNewPost('');
      toast.success('Đăng bài thành công!');
      fetchPosts();
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Đăng bài thất bại');
    }
  };

  const handleLikePost = async (postId: string) => {
    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      if (post.is_liked) {
        // Unlike
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user?.id);
      } else {
        // Like
        await supabase
          .from('post_likes')
          .insert({
            post_id: postId,
            user_id: user?.id,
          });
      }

      // Update local state
      setPosts(posts.map(p => 
        p.id === postId 
          ? {
              ...p,
              is_liked: !p.is_liked,
              likes_count: p.is_liked ? p.likes_count - 1 : p.likes_count + 1
            }
          : p
      ));
    } catch (error) {
      console.error('Error liking post:', error);
      toast.error('Thao tác thất bại');
    }
  };

  const handleBookmarkPost = async (postId: string) => {
    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      if (post.is_bookmarked) {
        // Remove bookmark
        await supabase
          .from('post_bookmarks')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user?.id);
      } else {
        // Add bookmark
        await supabase
          .from('post_bookmarks')
          .insert({
            post_id: postId,
            user_id: user?.id,
          });
      }

      // Update local state
      setPosts(posts.map(p => 
        p.id === postId 
          ? { ...p, is_bookmarked: !p.is_bookmarked }
          : p
      ));
    } catch (error) {
      console.error('Error bookmarking post:', error);
      toast.error('Thao tác thất bại');
    }
  };

  const fetchComments = async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from('post_comments')
        .select(`
          *,
          user_profile:profiles!post_comments_user_id_fkey(
            full_name,
            display_name,
            avatar_url
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!newComment.trim()) return;

    try {
      const { error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: user?.id,
          content: newComment.trim(),
        });

      if (error) throw error;

      setNewComment('');
      fetchComments(postId);
      
      // Update comments count
      setPosts(posts.map(p => 
        p.id === postId 
          ? { ...p, comments_count: p.comments_count + 1 }
          : p
      ));
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Thêm bình luận thất bại');
    }
  };

  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case 'match_result': return <Trophy className="h-4 w-4" />;
      case 'achievement': return <Target className="h-4 w-4" />;
      case 'tournament': return <Users className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getPostTypeColor = (type: string) => {
    switch (type) {
      case 'match_result': return 'bg-green-100 text-green-800';
      case 'achievement': return 'bg-yellow-100 text-yellow-800';
      case 'tournament': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderPost = (post: Post) => (
    <Card key={post.id} className="mb-4">
      <CardContent className="p-4">
        {/* Post Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <UserAvatar
              user={{
                id: post.user_profile.id,
                name: post.user_profile.display_name || post.user_profile.full_name,
                avatar: post.user_profile.avatar_url,
                rank: post.user_profile.verified_rank || post.user_profile.current_rank,
              }}
              size="md"
              showRank={true}
            />
            <div>
              <h4 className="font-semibold">
                {post.user_profile.display_name || post.user_profile.full_name}
              </h4>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">
                  {new Date(post.created_at).toLocaleDateString('vi-VN')}
                </span>
                <Badge className={`text-xs ${getPostTypeColor(post.post_type)}`}>
                  {getPostTypeIcon(post.post_type)}
                  <span className="ml-1 capitalize">{post.post_type}</span>
                </Badge>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {/* Post Content */}
        <div className="mb-4">
          <p className="text-gray-900 whitespace-pre-wrap">{post.content}</p>
          
          {/* Match Result Display */}
          {post.post_type === 'match_result' && post.match_data && (
            <div className={`mt-3 p-3 rounded-lg border-l-4 ${
              post.match_data.result === 'win' 
                ? 'border-l-green-500 bg-green-50' 
                : 'border-l-red-500 bg-red-50'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    vs {post.match_data.opponent_name}
                  </p>
                  <p className="text-sm text-gray-600">
                    Tỉ số: {post.match_data.score}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${
                    post.match_data.result === 'win' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {post.match_data.result === 'win' ? 'THẮNG' : 'THUA'}
                  </p>
                  <p className={`text-sm ${
                    post.match_data.elo_change > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {post.match_data.elo_change > 0 ? '+' : ''}{post.match_data.elo_change} ELO
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Achievement Display */}
          {post.post_type === 'achievement' && post.achievement_data && (
            <div className="mt-3 p-3 rounded-lg border-l-4 border-l-yellow-500 bg-yellow-50">
              <div className="flex items-center gap-3">
                <div className="text-2xl">{post.achievement_data.icon}</div>
                <div>
                  <h4 className="font-semibold text-yellow-800">
                    {post.achievement_data.title}
                  </h4>
                  <p className="text-sm text-yellow-600">
                    {post.achievement_data.description}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Post Actions */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleLikePost(post.id)}
              className={`gap-1 ${post.is_liked ? 'text-red-500' : ''}`}
            >
              <Heart className={`h-4 w-4 ${post.is_liked ? 'fill-current' : ''}`} />
              {post.likes_count}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (showComments === post.id) {
                  setShowComments(null);
                } else {
                  setShowComments(post.id);
                  fetchComments(post.id);
                }
              }}
              className="gap-1"
            >
              <MessageCircle className="h-4 w-4" />
              {post.comments_count}
            </Button>
            
            <Button variant="ghost" size="sm" className="gap-1">
              <Share2 className="h-4 w-4" />
              Chia sẻ
            </Button>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleBookmarkPost(post.id)}
            className={post.is_bookmarked ? 'text-blue-500' : ''}
          >
            <Bookmark className={`h-4 w-4 ${post.is_bookmarked ? 'fill-current' : ''}`} />
          </Button>
        </div>

        {/* Comments Section */}
        {showComments === post.id && (
          <div className="mt-4 pt-4 border-t">
            <div className="space-y-3 mb-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <UserAvatar
                    user={{
                      id: comment.user_id,
                      name: comment.user_profile.display_name || comment.user_profile.full_name,
                      avatar: comment.user_profile.avatar_url,
                    }}
                    size="sm"
                  />
                  <div className="flex-1 bg-gray-50 rounded-lg p-3">
                    <h5 className="font-medium text-sm">
                      {comment.user_profile.display_name || comment.user_profile.full_name}
                    </h5>
                    <p className="text-sm text-gray-700">{comment.content}</p>
                    <span className="text-xs text-gray-500">
                      {new Date(comment.created_at).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Add Comment */}
            <div className="flex gap-2">
              <UserAvatar
                user={{
                  id: user?.id || '',
                  name: user?.user_metadata?.display_name || user?.email || '',
                  avatar: user?.user_metadata?.avatar_url,
                }}
                size="sm"
              />
              <div className="flex-1 flex gap-2">
                <Input
                  placeholder="Viết bình luận..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                />
                <Button
                  size="sm"
                  onClick={() => handleAddComment(post.id)}
                  disabled={!newComment.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Create Post */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3">
            <UserAvatar
              user={{
                id: user?.id || '',
                name: user?.user_metadata?.display_name || user?.email || '',
                avatar: user?.user_metadata?.avatar_url,
              }}
              size="md"
            />
            <div className="flex-1">
              <Textarea
                placeholder="Bạn đang nghĩ gì?"
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                className="mb-3 resize-none"
                rows={3}
              />
              <div className="flex justify-between items-center">
                <Button variant="outline" size="sm" className="gap-2">
                  <Camera className="h-4 w-4" />
                  Ảnh
                </Button>
                <Button
                  onClick={handleCreatePost}
                  disabled={!newPost.trim()}
                  className="gap-2"
                >
                  <Send className="h-4 w-4" />
                  Đăng bài
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feed Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="feed">Bảng tin</TabsTrigger>
          <TabsTrigger value="following">Đang theo dõi</TabsTrigger>
          <TabsTrigger value="my-posts">Bài viết của tôi</TabsTrigger>
        </TabsList>

        <TabsContent value="feed" className="mt-6">
          <div className="space-y-4">
            {posts.map(renderPost)}
            
            {posts.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="font-semibold text-gray-600 mb-2">
                    Chưa có bài viết nào
                  </h3>
                  <p className="text-gray-500">
                    Hãy là người đầu tiên chia sẻ khoảnh khắc của bạn!
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="following" className="mt-6">
          <div className="space-y-4">
            {posts
              .filter(post => post.user_id !== user?.id) // Mock: filter following users
              .map(renderPost)}
          </div>
        </TabsContent>

        <TabsContent value="my-posts" className="mt-6">
          <div className="space-y-4">
            {posts
              .filter(post => post.user_id === user?.id)
              .map(renderPost)}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserFeed;
