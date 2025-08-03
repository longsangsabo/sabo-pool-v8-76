import React, { useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import MobileStoryReel from '../components/mobile/cards/MobileStoryReel';
import MobileFeedCard from '../components/mobile/cards/MobileFeedCard';
import MobileFloatingActionButton from '../components/mobile/common/MobileFloatingActionButton';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { useProgressiveLoading } from '../hooks/useProgressiveLoading';
import { useSocialFeed } from '../hooks/useSocialFeed';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

// Dashboard now uses real data from useSocialFeed hook

const Dashboard = () => {
  // Use real social feed data
  const {
    feedPosts,
    stories,
    loading,
    error,
    refreshFeed,
    handleLike,
    isConnected,
  } = useSocialFeed();

  // Progressive loading for smooth UX
  const { visibleItems, hasMore, loadMore } = useProgressiveLoading(feedPosts, {
    increment: 5,
    maxItems: feedPosts.length,
  });

  // Pull to refresh functionality
  const handleRefresh = useCallback(async () => {
    refreshFeed();
    toast.success('Đã làm mới feed!');
  }, [refreshFeed]);

  const {
    containerRef,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    getRefreshIndicatorStyle,
    getContainerStyle,
    isRefreshing: isPullRefreshing,
    pullDistance,
  } = usePullToRefresh({
    onRefresh: handleRefresh,
    threshold: 80,
  });

  // Infinite scroll for loading more content
  const loadMoreContent = useCallback(async () => {
    if (!hasMore) return;

    // For now, just refresh the feed to get more content
    // In a real app, this would implement pagination
    refreshFeed();
  }, [hasMore, refreshFeed]);

  const { containerRef: infiniteScrollRef, isLoading: isLoadingMore } =
    useInfiniteScroll({
      loadMore: loadMoreContent,
      hasMore,
      threshold: 300,
    });

  // Combine refs
  const combinedRef = useCallback((node: HTMLDivElement) => {
    containerRef.current = node;
    infiniteScrollRef.current = node;
  }, []);

  // Social interaction handlers are now provided by useSocialFeed hook

  const handleComment = useCallback((postId: string) => {
    toast.info('Tính năng bình luận đang phát triển');
  }, []);

  const handleShare = useCallback((postId: string) => {
    toast.success('Đã sao chép link bài viết!');
  }, []);

  const handleAction = useCallback((postId: string, action: string) => {
    switch (action) {
      case 'accept_challenge':
        toast.success('Đã nhận thách đấu! Chờ xác nhận từ đối thủ');
        break;
      case 'join_tournament':
        toast.success('Đã đăng ký tham gia giải đấu!');
        break;
      default:
        break;
    }
  }, []);

  const handleFABAction = useCallback(() => {
    toast.info('Tính năng tạo nội dung đang phát triển');
  }, []);

  return (
    <>
      <Helmet>
        <title>SABO Arena - Social Feed</title>
        <meta
          name='description'
          content='Theo dõi hoạt động của cộng đồng billiards SABO Arena'
        />
      </Helmet>

      <div
        ref={combinedRef}
        className='min-h-screen bg-background overflow-auto'
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={getContainerStyle()}
      >
        {/* Pull to refresh indicator */}
        <div
          className='flex justify-center items-center py-4'
          style={getRefreshIndicatorStyle()}
        >
          <RefreshCw
            className={`w-6 h-6 text-primary ${
              isPullRefreshing || loading ? 'animate-spin' : ''
            }`}
          />
        </div>

        {/* Story Reel with real data */}
        <MobileStoryReel stories={stories} />

        {/* Social Feed */}
        <div className='px-4 space-y-4 pb-4'>
          {/* Loading state */}
          {loading && feedPosts.length === 0 && (
            <div className='text-center py-8'>
              <RefreshCw className='w-8 h-8 animate-spin mx-auto text-muted-foreground' />
              <p className='text-sm text-muted-foreground mt-2'>
                Đang tải feed...
              </p>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className='text-center py-8'>
              <p className='text-sm text-destructive'>{error}</p>
              <button
                onClick={refreshFeed}
                className='text-sm text-primary hover:underline mt-2'
              >
                Thử lại
              </button>
            </div>
          )}

          {/* Feed content */}
          {!loading &&
            !error &&
            visibleItems.map(post => (
              <MobileFeedCard
                key={post.id}
                post={post}
                onLike={handleLike}
                onComment={handleComment}
                onShare={handleShare}
                onAction={handleAction}
              />
            ))}

          {/* Load more indicator */}
          {hasMore && !loading && (
            <div className='text-center py-4'>
              <button
                onClick={loadMore}
                className='text-sm text-muted-foreground hover:text-foreground transition-colors'
              >
                {isLoadingMore ? 'Đang tải...' : 'Xem thêm'}
              </button>
            </div>
          )}

          {/* End of feed indicator */}
          {!hasMore && feedPosts.length > 0 && !loading && (
            <div className='text-center py-8 text-muted-foreground'>
              <div className='text-sm'>🎱</div>
              <div className='text-xs mt-2'>Bạn đã xem hết feed rồi!</div>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && feedPosts.length === 0 && (
            <div className='text-center py-12'>
              <div className='text-4xl mb-2'>🎱</div>
              <p className='text-sm text-muted-foreground'>
                Chưa có hoạt động nào
              </p>
              <p className='text-xs text-muted-foreground mt-1'>
                Hãy tham gia một trận đấu hoặc tạo thách đấu!
              </p>
            </div>
          )}
        </div>

        {/* Floating Action Button */}
        <MobileFloatingActionButton primaryAction={handleFABAction} />
      </div>
    </>
  );
};

export default Dashboard;
