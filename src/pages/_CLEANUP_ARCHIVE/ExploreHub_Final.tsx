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
import { toast } from 'sonner';

// Components
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import LoadingSpinner from '@/components/LoadingSpinner';

const ExploreHub = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats] = useState({
    nearbyPlayers: 15,
    marketplaceItems: 42,
    upcomingEvents: 8,
    activeDeals: 23
  });

  // Overview Component
  const ExploreOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Người chơi gần đây</p>
                <p className="text-2xl font-bold">{stats.nearbyPlayers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Store className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Sản phẩm</p>
                <p className="text-2xl font-bold">{stats.marketplaceItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Calendar className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Sự kiện</p>
                <p className="text-2xl font-bold">{stats.upcomingEvents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Ưu đãi</p>
                <p className="text-2xl font-bold">{stats.activeDeals}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Khám phá nhanh</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center gap-2"
              onClick={() => setActiveTab('discovery')}
            >
              <Compass className="h-6 w-6" />
              <span>Tìm đối thủ</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center gap-2"
              onClick={() => setActiveTab('marketplace')}
            >
              <Store className="h-6 w-6" />
              <span>Chợ phụ kiện</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Featured Content */}
      <Card>
        <CardHeader>
          <CardTitle>Nội dung nổi bật</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                  A
                </div>
                <div>
                  <p className="font-medium">Anh Tuấn</p>
                  <p className="text-sm text-gray-600">
                    <MapPin className="inline h-4 w-4 mr-1" />
                    2.5km
                  </p>
                </div>
              </div>
              <Badge variant="secondary">Master</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white">
                  <Store className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">Cơ Predator Revo</p>
                  <p className="text-sm text-gray-600">2.5 triệu VND</p>
                </div>
              </div>
              <Badge variant="secondary">Mới</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Discovery Section
  const DiscoverySection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Tìm đối thủ</h2>
        <Badge variant="secondary">15 người gần đây</Badge>
      </div>

      <Card>
        <CardContent className="py-8 text-center">
          <Compass className="h-16 w-16 text-blue-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Khám phá đối thủ mới</h3>
          <p className="text-gray-600 mb-4">Tìm và thách đấu với những người chơi phù hợp trong khu vực</p>
          <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
            <Zap className="h-4 w-4 mr-2" />
            Bắt đầu tìm kiếm
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {[1, 2, 3].map((_, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    {['A', 'B', 'C'][index]}
                  </div>
                  <div>
                    <p className="font-medium">{['Anh Tuấn', 'Minh Hoàng', 'Đức Anh'][index]}</p>
                    <p className="text-sm text-gray-600">
                      <MapPin className="inline h-4 w-4 mr-1" />
                      {[2.5, 3.2, 1.8][index]}km
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="secondary">{['Master', 'Expert', 'Pro'][index]}</Badge>
                  <p className="text-sm text-gray-600 mt-1">
                    <Star className="inline h-4 w-4 mr-1 text-yellow-500" />
                    {[4.8, 4.6, 4.9][index]}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  // Marketplace Section
  const MarketplaceSection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Chợ phụ kiện</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Đăng bán
          </Button>
          <Button variant="outline" size="sm">
            <Grid3X3 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Tìm kiếm sản phẩm..."
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { name: 'Cơ Predator Revo', price: '2.5 triệu', image: '🎱' },
          { name: 'Phấn Triangle', price: '150k', image: '🎯' },
          { name: 'Túi đựng cơ', price: '800k', image: '👜' },
          { name: 'Găng tay Buffalo', price: '200k', image: '🧤' },
          { name: 'Tip Kamui', price: '300k', image: '🎪' },
          { name: 'Bàn bi-a mini', price: '15 triệu', image: '🏓' }
        ].map((item, index) => (
          <Card key={index} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-4xl">
                {item.image}
              </div>
              <div className="p-4">
                <h3 className="font-medium mb-1">{item.name}</h3>
                <p className="text-lg font-bold text-green-600">{item.price}</p>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">4.5</span>
                  </div>
                  <Badge variant="outline" className="text-xs">Mới</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
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
          <h1 className="text-3xl font-bold">Khám phá</h1>
          <p className="text-gray-600 mt-1">Tìm đối thủ mới và mua sắm phụ kiện billiards</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Tổng quan</span>
            </TabsTrigger>
            <TabsTrigger value="discovery" className="flex items-center space-x-2">
              <Compass className="h-4 w-4" />
              <span className="hidden sm:inline">Tìm kiếm</span>
            </TabsTrigger>
            <TabsTrigger value="marketplace" className="flex items-center space-x-2">
              <Store className="h-4 w-4" />
              <span className="hidden sm:inline">Chợ</span>
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Sự kiện</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <ExploreOverview />
          </TabsContent>

          <TabsContent value="discovery">
            <DiscoverySection />
          </TabsContent>

          <TabsContent value="marketplace">
            <MarketplaceSection />
          </TabsContent>

          <TabsContent value="events">
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Sự kiện sắp tới</h3>
                <p className="text-gray-600 mb-4">Tính năng sự kiện đang được phát triển</p>
                <Badge variant="secondary">Sắp ra mắt</Badge>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ExploreHub;
