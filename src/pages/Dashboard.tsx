
import React, { useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import MobileLayout from '../components/MobileLayout';
import MobileStoryReel from '../components/mobile/cards/MobileStoryReel';
import MobileFeedCard from '../components/mobile/cards/MobileFeedCard';
import MobileFloatingActionButton from '../components/mobile/common/MobileFloatingActionButton';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { useProgressiveLoading } from '../hooks/useProgressiveLoading';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

// Mock data - optimized for mobile performance
const MOCK_USERS = [
  { id: '1', name: 'Duc Nguyen', avatar: '/api/placeholder/40/40', rank: 'Expert' },
  { id: '2', name: 'Minh Tran', avatar: '/api/placeholder/40/40', rank: 'Pro' },
  { id: '3', name: 'Lan Pham', avatar: '/api/placeholder/40/40', rank: 'Master' },
  { id: '4', name: 'Tuan Le', avatar: '/api/placeholder/40/40', rank: 'Advanced' },
  { id: '5', name: 'Nam Vo', avatar: '/api/placeholder/40/40', rank: 'Expert' }
];

const POST_TYPES = ['match_result', 'achievement', 'challenge', 'tournament_update'] as const;

const CONTENT_TEMPLATES = {
  match_result: (user: any) => `Vừa thắng ${user.name === 'Duc Nguyen' ? 'Player2' : 'Player1'} với tỷ số thuyết phục! 🎱`,
  achievement: (user: any) => `Chính thức lên rank ${user.rank}! Cảm ơn mọi người đã ủng hộ 🏆`,
  challenge: () => `Ai dám nhận thách đấu với tôi không? Đặt cược 100K! 🔥`,
  tournament_update: (user: any, index: number) => `SABO Arena Open #${index + 1} sắp bắt đầu! Đăng ký ngay để nhận vị trí tốt nhất 🎯`
};

// Optimized mock data generation - reduce initial load
const generateMockFeedData = (count: number = 10) => {
  const posts = [];
  
  for (let i = 0; i < count; i++) {
    const user = MOCK_USERS[i % MOCK_USERS.length];
    const type = POST_TYPES[i % POST_TYPES.length];
    const baseStats: any = { 
      likes: 15 + (i * 3), 
      comments: 5 + (i * 2), 
      shares: 2 + i 
    };
    
    let content = CONTENT_TEMPLATES[type](user, i);
    let stats: any = { ...baseStats };

    switch (type) {
      case 'match_result':
        stats = { ...stats, score: '8-6', opponent: user.name === 'Duc Nguyen' ? 'Player2' : 'Player1' };
        break;
      case 'achievement':
        stats = { ...stats, achievement: `Rank ${user.rank}` };
        break;
      case 'challenge':
        stats = { ...stats, challenge_type: 'Thách đấu 8-ball' };
        break;
      case 'tournament_update':
        stats = { ...stats, tournament_name: `SABO Arena Open #${i + 1}` };
        break;
    }

    posts.push({
      id: `post-${i}`,
      type,
      user,
      content,
      timestamp: `${(i + 1) * 2}h trước`,
      stats,
      isLiked: i % 4 === 0
    });
  }

  return posts;
};

const Dashboard = () => {
  const [feedData, setFeedData] = useState(() => generateMockFeedData(8));
  const [refreshing, setRefreshing] = useState(false);

  // Progressive loading for smooth UX
  const { visibleItems, hasMore, loadMore } = useProgressiveLoading(feedData, {
    increment: 5,
    maxItems: feedData.length
  });

  // Pull to refresh functionality
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate new feed data
    const newFeedData = generateMockFeedData(8);
    setFeedData(newFeedData);
    setRefreshing(false);
    toast.success('Đã làm mới feed!');
  }, []);

  const {
    containerRef,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    getRefreshIndicatorStyle,
    getContainerStyle,
    isRefreshing: isPullRefreshing,
    pullDistance
  } = usePullToRefresh({
    onRefresh: handleRefresh,
    threshold: 80
  });

  // Infinite scroll for loading more content
  const loadMoreContent = useCallback(async () => {
    if (!hasMore) return;
    
    // Simulate loading delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Add more items to feed
    const moreData = generateMockFeedData(5);
    setFeedData(prev => [...prev, ...moreData]);
  }, [hasMore]);

  const { containerRef: infiniteScrollRef, isLoading: isLoadingMore } = useInfiniteScroll({
    loadMore: loadMoreContent,
    hasMore,
    threshold: 300
  });

  // Combine refs
  const combinedRef = useCallback((node: HTMLDivElement) => {
    containerRef.current = node;
    infiniteScrollRef.current = node;
  }, []);

  // Social interaction handlers
  const handleLike = useCallback((postId: string) => {
    setFeedData(prev => prev.map(post => 
      post.id === postId 
        ? { 
            ...post, 
            isLiked: !post.isLiked,
            stats: { 
              ...post.stats, 
              likes: post.isLiked ? post.stats.likes - 1 : post.stats.likes + 1 
            }
          }
        : post
    ));
  }, []);

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
        <meta name="description" content="Theo dõi hoạt động của cộng đồng billiards SABO Arena" />
      </Helmet>

      <MobileLayout>
        <div 
          ref={combinedRef}
          className="min-h-screen bg-background overflow-auto"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={getContainerStyle()}
        >
          {/* Pull to refresh indicator */}
          <div 
            className="flex justify-center items-center py-4"
            style={getRefreshIndicatorStyle()}
          >
            <RefreshCw 
              className={`w-6 h-6 text-primary ${
                isPullRefreshing || refreshing ? 'animate-spin' : ''
              }`} 
            />
          </div>

          {/* Story Reel */}
          <MobileStoryReel />

          {/* Social Feed */}
          <div className="px-4 space-y-4 pb-4">
            {visibleItems.map((post, index) => (
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
            {hasMore && (
              <div className="text-center py-4">
                <button
                  onClick={loadMore}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {isLoadingMore ? 'Đang tải...' : 'Xem thêm'}
                </button>
              </div>
            )}

            {/* End of feed indicator */}
            {!hasMore && feedData.length > 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <div className="text-sm">🎱</div>
                <div className="text-xs mt-2">Bạn đã xem hết feed rồi!</div>
              </div>
            )}
          </div>

          {/* Floating Action Button */}
          <MobileFloatingActionButton primaryAction={handleFABAction} />
        </div>
      </MobileLayout>
    </>
  );
};

export default Dashboard;
