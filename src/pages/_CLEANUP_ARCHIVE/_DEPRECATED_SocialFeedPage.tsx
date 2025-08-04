import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRealtimeFeed } from '@/hooks/useRealtimeFeed';
import SocialFeedCard from '@/components/SocialFeedCard';
import CreatePostModal from '@/components/CreatePostModal';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

const SocialFeedPage = () => {
  const {
    feedPosts,
    isConnected,
    handleLike,
    handleComment,
    handleShare,
    handleChallenge,
    refreshFeed,
    createPost,
  } = useRealtimeFeed();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshFeed();
    setIsRefreshing(false);
    toast.success('Đã làm mới feed!');
  };

  const handleCreatePost = async (content: string) => {
    await createPost(content);
    toast.success('Đã đăng bài thành công!');
  };

  return (
    <>
      <Helmet>
        <title>Feed Cộng Đồng - SABO Billiards</title>
        <meta
          name='description'
          content='Chia sẻ và theo dõi thành tích của cộng đồng bi-a'
        />
      </Helmet>

      <div className='min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8'>
        <div className='container mx-auto px-4 max-w-2xl'>
          {/* Header */}
          <div className='mb-6'>
            <div className='flex items-center justify-between mb-4'>
              <div>
                <h1 className='text-2xl font-bold text-gray-900'>
                  Feed Cộng Đồng
                </h1>
                <p className='text-gray-600'>
                  Chia sẻ và theo dõi hoạt động của cộng đồng
                </p>
              </div>
              <div className='flex items-center gap-2'>
                <div
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
                <span className='text-sm text-gray-500'>
                  {isConnected ? 'Trực tuyến' : 'Ngoại tuyến'}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className='flex items-center gap-3'>
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className='flex items-center gap-2'
              >
                <Plus className='w-4 h-4' />
                Tạo bài viết
              </Button>
              <Button
                variant='outline'
                onClick={handleRefresh}
                disabled={isRefreshing}
                className='flex items-center gap-2'
              >
                <RefreshCw
                  className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
                />
                Làm mới
              </Button>
            </div>
          </div>

          {/* Feed content */}
          <div className='space-y-4'>
            {feedPosts.length === 0 ? (
              <Card>
                <CardContent className='p-8 text-center'>
                  <div className='text-gray-500 mb-4'>
                    <Plus className='w-12 h-12 mx-auto mb-4 opacity-50' />
                    <h3 className='text-lg font-medium mb-2'>
                      Chưa có bài viết nào
                    </h3>
                    <p className='text-sm'>
                      Hãy là người đầu tiên chia sẻ thành tích của mình!
                    </p>
                  </div>
                  <Button onClick={() => setIsCreateModalOpen(true)}>
                    Tạo bài viết đầu tiên
                  </Button>
                </CardContent>
              </Card>
            ) : (
              feedPosts.map(post => (
                <SocialFeedCard
                  key={post.id}
                  post={post}
                  onLike={handleLike}
                  onComment={handleComment}
                  onShare={handleShare}
                  onChallenge={handleChallenge}
                />
              ))
            )}
          </div>

          {/* Load more indicator */}
          {feedPosts.length > 0 && (
            <div className='text-center py-8'>
              <Button variant='outline' onClick={handleRefresh}>
                Tải thêm bài viết
              </Button>
            </div>
          )}
        </div>
      </div>

      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreatePost={handleCreatePost}
      />
    </>
  );
};

export default SocialFeedPage;
