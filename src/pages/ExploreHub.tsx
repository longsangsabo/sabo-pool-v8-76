import React, { useState, useEffect, Suspense } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  Compass, 
  Store, 
  Calendar, 
  TrendingUp,
  Users,
  MapPin,
  Star,
  Filter,
  Grid3X3,
  List,
  Plus,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

// Hooks
import { useDiscovery, DiscoveryItem } from '@/hooks/useDiscovery';
import { useMarketplace } from '@/hooks/marketplace/useMarketplace';
import { useProfile } from '@/hooks/useProfile';

// Components
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import LoadingSpinner from '@/components/LoadingSpinner';

// Lazy loaded components
const EnhancedPlayerCard = React.lazy(() => import('@/components/EnhancedPlayerCard'));
const MarketplaceItemCard = React.lazy(() => import('@/components/marketplace/MarketplaceItemCard'));
const DiscoveryFilters = React.lazy(() => import('@/components/DiscoveryFilters'));
const MarketplaceFilters = React.lazy(() => import('@/components/marketplace/MarketplaceFilters'));
const ChallengeModal = React.lazy(() => import('@/components/ChallengeModal'));

import { UserProfile } from '@/types/common';

interface ExploreStats {
  nearbyPlayers: number;
  marketplaceItems: number;
  upcomingEvents: number;
  activeDeals: number;
}

const ExploreHub = () => {
  // Discovery hooks
  const { items: nearbyPlayers, loading: discoveryLoading, sendChallenge } = useDiscovery();
  const { getProfile } = useProfile();
  
  // Marketplace hooks
  const { items: marketplaceItems, loading: marketplaceLoading, fetchItems } = useMarketplace();
  
  // State management
  const [activeTab, setActiveTab] = useState('overview');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<ExploreStats>({
    nearbyPlayers: 0,
    marketplaceItems: 0,
    upcomingEvents: 0,
    activeDeals: 0
  });

  // Discovery states
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [showDiscoveryFilters, setShowDiscoveryFilters] = useState(false);
  const [selectedOpponent, setSelectedOpponent] = useState<UserProfile | null>(null);
  const [discoveryFilters, setDiscoveryFilters] = useState({
    rankRange: ['K1', 'G+'],
    maxDistance: 50,
    minBetPoints: 10,
    maxBetPoints: 100,
  });

  // Marketplace states
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [condition, setCondition] = useState('all');
  const [location, setLocation] = useState('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000000]);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const userProfile = await getProfile();
        setProfile(userProfile);
        await fetchItems();
      } catch (error) {
        console.error('Error loading explore data:', error);
        toast.error('Lỗi tải dữ liệu khám phá');
      }
    };

    loadData();
  }, []);

  // Update stats when data changes
  useEffect(() => {
    setStats({
      nearbyPlayers: nearbyPlayers.length,
      marketplaceItems: marketplaceItems.length,
      upcomingEvents: Math.floor(Math.random() * 10) + 5, // Mock data
      activeDeals: Math.floor(Math.random() * 20) + 10 // Mock data
    });
  }, [nearbyPlayers, marketplaceItems]);

  // Discovery handlers
  const handleSendChallenge = async (item: DiscoveryItem) => {
    try {
      // Convert DiscoveryItem to UserProfile format for challenge
      const mockProfile: UserProfile = {
        user_id: item.id,
        full_name: item.title,
        avatar_url: item.image_url,
        current_rank: item.rank || 'K1',
        ranking_points: item.points || 1000,
        matches_played: 0,
        matches_won: 0,
        address: item.location?.address,
        min_bet_points: 10,
        max_bet_points: 100
      };
      setSelectedOpponent(mockProfile);
      setShowChallengeModal(true);
    } catch (error) {
      console.error('Error preparing challenge:', error);
      toast.error('Lỗi chuẩn bị thách đấu');
    }
  };

  const handleSwipeLeft = () => {
    if (currentIndex < nearbyPlayers.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleSwipeRight = () => {
    const currentPlayer = nearbyPlayers[currentIndex];
    if (currentPlayer) {
      handleSendChallenge(currentPlayer);
    }
  };

  // Marketplace handlers
  const handleApplyMarketplaceFilters = async () => {
    const filters = {
      search: searchQuery || undefined,
      category: category !== 'all' ? category : undefined,
      condition: condition !== 'all' ? condition : undefined,
      priceRange: priceRange[0] > 0 || priceRange[1] < 100000000 ? priceRange : undefined,
    };

    await fetchItems(filters);
    toast.success('Đã áp dụng bộ lọc marketplace');
  };

  const handleClearMarketplaceFilters = async () => {
    setSearchQuery('');
    setCategory('all');
    setCondition('all');
    setLocation('all');
    setPriceRange([0, 100000000]);
    await fetchItems();
    toast.success('Đã xóa bộ lọc marketplace');
  };

  // Overview Component
  const ExploreOverview = () => (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Người chơi gần đây</p>
                <p className="text-xl font-bold">{stats.nearbyPlayers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Store className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Sản phẩm</p>
                <p className="text-xl font-bold">{stats.marketplaceItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Sự kiện</p>
                <p className="text-xl font-bold">{stats.upcomingEvents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Ưu đãi</p>
                <p className="text-xl font-bold">{stats.activeDeals}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Khám phá nhanh</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              className="h-auto py-3 flex flex-col items-center gap-2"
              onClick={() => setActiveTab('discovery')}
            >
              <Compass className="h-5 w-5" />
              <span className="text-sm">Tìm đối thủ</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto py-3 flex flex-col items-center gap-2"
              onClick={() => setActiveTab('marketplace')}
            >
              <Store className="h-5 w-5" />
              <span className="text-sm">Chợ phụ kiện</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Preview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Hoạt động gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {nearbyPlayers.slice(0, 3).map((player, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {player.title?.[0] || 'U'}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{player.title || 'Người chơi'}</p>
                    <p className="text-xs text-gray-600">
                      <MapPin className="inline h-3 w-3 mr-1" />
                      {Math.floor(Math.random() * 5) + 1}km
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {player.rank || 'K1'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Discovery Component
  const DiscoverySection = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Tìm đối thủ</h2>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDiscoveryFilters(!showDiscoveryFilters)}
          >
            <Filter className="h-4 w-4 mr-1" />
            Lọc
          </Button>
          <Badge variant="secondary">
            {nearbyPlayers.length - currentIndex} người
          </Badge>
        </div>
      </div>

      {showDiscoveryFilters && (
        <Suspense fallback={<LoadingSpinner />}>
          <DiscoveryFilters
            isOpen={showDiscoveryFilters}
            filters={discoveryFilters}
            onFiltersChange={setDiscoveryFilters}
            onClose={() => setShowDiscoveryFilters(false)}
          />
        </Suspense>
      )}

      {discoveryLoading ? (
        <LoadingSpinner />
      ) : nearbyPlayers.length > 0 && currentIndex < nearbyPlayers.length ? (
        <div className="space-y-4">
          <Suspense fallback={<LoadingSpinner />}>
            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">{nearbyPlayers[currentIndex]?.title || 'Người chơi'}</h3>
                <Badge variant="secondary">{nearbyPlayers[currentIndex]?.rank || 'K1'}</Badge>
              </div>
              <div className="space-y-2">
                <p className="text-gray-600">{nearbyPlayers[currentIndex]?.description || 'Mô tả không có sẵn'}</p>
                {nearbyPlayers[currentIndex]?.location && (
                  <p className="text-sm text-gray-500">
                    <MapPin className="inline h-4 w-4 mr-1" />
                    {nearbyPlayers[currentIndex].location.address}
                  </p>
                )}
              </div>
            </div>
          </Suspense>
          
          <div className="flex justify-center space-x-4">
            <Button
              variant="outline"
              size="lg"
              onClick={handleSwipeLeft}
              className="w-24"
            >
              Bỏ qua
            </Button>
            <Button
              size="lg"
              onClick={handleSwipeRight}
              className="w-24 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              <Zap className="h-4 w-4 mr-1" />
              Thách đấu
            </Button>
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Không có đối thủ phù hợp trong khu vực</p>
            <Button variant="outline" className="mt-4">
              Mở rộng phạm vi tìm kiếm
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // Marketplace Component
  const MarketplaceSection = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Chợ phụ kiện</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Đăng bán
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <Suspense fallback={<LoadingSpinner />}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3 py-2 border rounded-lg w-64"
              />
              <Button onClick={handleApplyMarketplaceFilters} size="sm">
                Tìm kiếm
              </Button>
            </div>
          </div>
        </div>
      </Suspense>

      {marketplaceLoading ? (
        <LoadingSpinner />
      ) : marketplaceItems.length > 0 ? (
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" 
          : "space-y-4"
        }>
          {marketplaceItems.map((item, index) => (
            <Suspense key={index} fallback={<div className="h-48 bg-gray-100 rounded-lg animate-pulse" />}>
              <div className="border rounded-lg p-4 bg-white">
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.description}</p>
                <p className="text-lg font-bold text-green-600">{item.price?.toLocaleString()} VND</p>
              </div>
            </Suspense>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Chưa có sản phẩm nào</p>
            <Button variant="outline" className="mt-4">
              <Plus className="h-4 w-4 mr-1" />
              Đăng sản phẩm đầu tiên
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Khám phá - Sabo Pool</title>
        <meta name="description" content="Khám phá đối thủ mới và chợ phụ kiện billiards" />
      </Helmet>

      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Khám phá</h1>
          <p className="text-gray-600">Tìm đối thủ mới và mua sắm phụ kiện</p>
        </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" className="flex items-center space-x-1">
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Tổng quan</span>
              </TabsTrigger>
              <TabsTrigger value="discovery" className="flex items-center space-x-1">
                <Compass className="h-4 w-4" />
                <span className="hidden sm:inline">Tìm kiếm</span>
              </TabsTrigger>
              <TabsTrigger value="marketplace" className="flex items-center space-x-1">
                <Store className="h-4 w-4" />
                <span className="hidden sm:inline">Chợ</span>
              </TabsTrigger>
              <TabsTrigger value="events" className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Sự kiện</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <ExploreOverview />
            </TabsContent>

            <TabsContent value="discovery" className="mt-6">
              <DiscoverySection />
            </TabsContent>

            <TabsContent value="marketplace" className="mt-6">
              <MarketplaceSection />
            </TabsContent>

            <TabsContent value="events" className="mt-6">
              <Card>
                <CardContent className="py-8 text-center">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Tính năng sự kiện đang phát triển</p>
                  <Badge variant="secondary" className="mt-2">Sắp ra mắt</Badge>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Challenge Modal */}
        {showChallengeModal && selectedOpponent && (
          <Suspense fallback={<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <LoadingSpinner />
          </div>}>
            <ChallengeModal
              isOpen={showChallengeModal}
              onClose={() => {
                setShowChallengeModal(false);
                setSelectedOpponent(null);
              }}
              opponent={selectedOpponent}
              onSendChallenge={(data) => {
                sendChallenge.mutate({
                  challengedId: selectedOpponent.user_id || selectedOpponent.id,
                  betPoints: data.betPoints,
                  message: data.message
                });
              }}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
};

export default ExploreHub;
