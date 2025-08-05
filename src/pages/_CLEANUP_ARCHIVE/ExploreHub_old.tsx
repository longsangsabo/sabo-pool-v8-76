import React, { Suspense } from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/shared/components/ui/tabs';
import { Card } from '@/shared/components/ui/card';
import {
  Loader2,
  Compass,
  ShoppingBag,
  FileText,
  HelpCircle,
  Search,
  TrendingUp,
  Users,
  Star,
} from 'lucide-react';

// Lazy load explore components
const DiscoveryPage = React.lazy(() => import('@/pages/DiscoveryPage'));
const EnhancedMarketplacePage = React.lazy(
  () => import('@/pages/EnhancedMarketplacePage')
);
const BlogPage = React.lazy(() => import('@/pages/BlogPage'));
const HelpPage = React.lazy(() => import('@/pages/HelpPage'));

// Loading component
const TabLoadingSpinner = () => (
  <div className='flex items-center justify-center p-8'>
    <Loader2 className='h-8 w-8 animate-spin text-primary' />
    <span className='ml-2 text-muted-foreground'>Đang tải...</span>
  </div>
);

// Explore Overview component
const ExploreOverview = () => (
  <Card className='p-6'>
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center space-x-4'>
        <div className='w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center'>
          <Compass className='h-8 w-8 text-white' />
        </div>
        <div>
          <h3 className='text-xl font-bold'>Khám phá & Cộng đồng</h3>
          <p className='text-muted-foreground'>
            Tìm hiểu mọi thứ trong thế giới billiards
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
        <Card className='p-4'>
          <div className='text-center'>
            <div className='text-2xl font-bold text-blue-500'>2,156</div>
            <div className='text-sm text-muted-foreground'>
              Người chơi hoạt động
            </div>
          </div>
        </Card>
        <Card className='p-4'>
          <div className='text-center'>
            <div className='text-2xl font-bold text-green-500'>89</div>
            <div className='text-sm text-muted-foreground'>Sản phẩm mới</div>
          </div>
        </Card>
        <Card className='p-4'>
          <div className='text-center'>
            <div className='text-2xl font-bold text-purple-500'>45</div>
            <div className='text-sm text-muted-foreground'>
              Bài viết tuần này
            </div>
          </div>
        </Card>
        <Card className='p-4'>
          <div className='text-center'>
            <div className='text-2xl font-bold text-orange-500'>1,234</div>
            <div className='text-sm text-muted-foreground'>
              Lượt xem hôm nay
            </div>
          </div>
        </Card>
      </div>

      {/* Featured Content */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {/* Trending Players */}
        <Card className='p-4'>
          <div className='flex items-center space-x-2 mb-4'>
            <TrendingUp className='h-5 w-5 text-orange-500' />
            <h4 className='font-semibold'>Người chơi nổi bật</h4>
          </div>
          <div className='space-y-3'>
            {['PoolMaster', 'Champion99', 'ProPlayer123'].map((name, index) => (
              <div key={index} className='flex items-center space-x-3'>
                <div className='w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center'>
                  <span className='text-white text-sm font-semibold'>
                    {name.charAt(0)}
                  </span>
                </div>
                <div className='flex-1'>
                  <div className='font-medium text-sm'>{name}</div>
                  <div className='text-xs text-muted-foreground'>
                    {index === 0 && 'ELO: 1,485 • 15 thắng liên tiếp'}
                    {index === 1 && 'ELO: 1,421 • Tournament winner'}
                    {index === 2 && 'ELO: 1,398 • Rising star'}
                  </div>
                </div>
                <Star className='h-4 w-4 text-yellow-500' />
              </div>
            ))}
          </div>
        </Card>

        {/* Latest News */}
        <Card className='p-4'>
          <div className='flex items-center space-x-2 mb-4'>
            <FileText className='h-5 w-5 text-blue-500' />
            <h4 className='font-semibold'>Tin tức mới nhất</h4>
          </div>
          <div className='space-y-3'>
            <div className='p-3 border rounded-lg cursor-pointer hover:bg-muted/50'>
              <div className='font-medium text-sm'>
                Tournament Spring Championship 2024
              </div>
              <div className='text-xs text-muted-foreground'>
                Giải đấu lớn nhất năm sắp bắt đầu với giải thưởng 10M
              </div>
              <div className='text-xs text-blue-500 mt-1'>2 giờ trước</div>
            </div>
            <div className='p-3 border rounded-lg cursor-pointer hover:bg-muted/50'>
              <div className='font-medium text-sm'>
                Cập nhật hệ thống ranking mới
              </div>
              <div className='text-xs text-muted-foreground'>
                Hệ thống ELO được cải tiến để công bằng hơn
              </div>
              <div className='text-xs text-blue-500 mt-1'>1 ngày trước</div>
            </div>
            <div className='p-3 border rounded-lg cursor-pointer hover:bg-muted/50'>
              <div className='font-medium text-sm'>
                Khai trương club mới tại TP.HCM
              </div>
              <div className='text-xs text-muted-foreground'>
                Billiards Arena chính thức có mặt tại Sài Gòn
              </div>
              <div className='text-xs text-blue-500 mt-1'>3 ngày trước</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  </Card>
);

// Hot Deals component for marketplace
const HotDeals = () => (
  <Card className='p-6'>
    <div className='space-y-4'>
      <div className='flex items-center space-x-2'>
        <ShoppingBag className='h-5 w-5 text-green-500' />
        <h3 className='text-lg font-semibold'>Ưu đãi nổi bật</h3>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        {[
          {
            name: 'Cơ Pool Professional',
            price: '2,500,000',
            oldPrice: '3,000,000',
            discount: '17%',
          },
          {
            name: 'Bàn Pool Premium',
            price: '45,000,000',
            oldPrice: '50,000,000',
            discount: '10%',
          },
          {
            name: 'Phấn Pool Cao Cấp',
            price: '150,000',
            oldPrice: '200,000',
            discount: '25%',
          },
        ].map((item, index) => (
          <Card
            key={index}
            className='p-4 cursor-pointer hover:shadow-md transition-shadow'
          >
            <div className='aspect-square bg-muted rounded-lg mb-3 flex items-center justify-center'>
              <ShoppingBag className='h-12 w-12 text-muted-foreground' />
            </div>
            <div className='space-y-2'>
              <div className='font-medium text-sm'>{item.name}</div>
              <div className='flex items-center space-x-2'>
                <span className='text-lg font-bold text-green-600'>
                  {item.price}đ
                </span>
                <span className='text-sm text-muted-foreground line-through'>
                  {item.oldPrice}đ
                </span>
              </div>
              <div className='text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full inline-block'>
                Giảm {item.discount}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  </Card>
);

// Quick Search component
const QuickSearch = () => (
  <Card className='p-6'>
    <div className='space-y-4'>
      <div className='flex items-center space-x-2'>
        <Search className='h-5 w-5 text-purple-500' />
        <h3 className='text-lg font-semibold'>Tìm kiếm nhanh</h3>
      </div>

      {/* Search categories */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
        {[
          { label: 'Người chơi', icon: Users, count: '2,156' },
          { label: 'Sản phẩm', icon: ShoppingBag, count: '342' },
          { label: 'Bài viết', icon: FileText, count: '128' },
          { label: 'Trợ giúp', icon: HelpCircle, count: '89' },
        ].map((category, index) => (
          <Card
            key={index}
            className='p-3 cursor-pointer hover:bg-muted/50 transition-colors'
          >
            <div className='text-center'>
              <category.icon className='h-8 w-8 mx-auto mb-2 text-muted-foreground' />
              <div className='font-medium text-sm'>{category.label}</div>
              <div className='text-xs text-muted-foreground'>
                {category.count}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Search bar */}
      <div className='flex space-x-2'>
        <input
          placeholder='Tìm kiếm người chơi, sản phẩm, bài viết...'
          className='flex-1 px-4 py-2 border rounded-lg'
        />
        <button className='px-6 py-2 bg-primary text-primary-foreground rounded-lg'>
          Tìm
        </button>
      </div>

      {/* Popular searches */}
      <div>
        <div className='text-sm font-medium mb-2'>Tìm kiếm phổ biến:</div>
        <div className='flex flex-wrap gap-2'>
          {[
            'Cơ pool',
            'Tournament',
            'Thách đấu',
            'Bàn billiards',
            'Phấn pool',
          ].map((term, index) => (
            <span
              key={index}
              className='px-3 py-1 bg-muted text-muted-foreground rounded-full text-xs cursor-pointer hover:bg-muted/80'
            >
              {term}
            </span>
          ))}
        </div>
      </div>
    </div>
  </Card>
);

const ExploreHub: React.FC = () => {
  return (
    <div className='container mx-auto p-6 space-y-6'>
      {/* Header */}
      <div className='flex items-center space-x-3'>
        <Compass className='h-8 w-8 text-orange-500' />
        <div>
          <h1 className='text-3xl font-bold'>Explore Hub</h1>
          <p className='text-muted-foreground'>
            Khám phá cộng đồng, sản phẩm và kiến thức billiards
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs defaultValue='overview' className='w-full'>
        <TabsList className='grid w-full grid-cols-6'>
          <TabsTrigger value='overview' className='flex items-center space-x-2'>
            <Compass className='h-4 w-4' />
            <span className='hidden sm:inline'>Tổng quan</span>
          </TabsTrigger>
          <TabsTrigger
            value='discovery'
            className='flex items-center space-x-2'
          >
            <Users className='h-4 w-4' />
            <span className='hidden sm:inline'>Khám phá</span>
          </TabsTrigger>
          <TabsTrigger
            value='marketplace'
            className='flex items-center space-x-2'
          >
            <ShoppingBag className='h-4 w-4' />
            <span className='hidden sm:inline'>Shop</span>
          </TabsTrigger>
          <TabsTrigger value='blog' className='flex items-center space-x-2'>
            <FileText className='h-4 w-4' />
            <span className='hidden sm:inline'>Blog</span>
          </TabsTrigger>
          <TabsTrigger value='search' className='flex items-center space-x-2'>
            <Search className='h-4 w-4' />
            <span className='hidden sm:inline'>Tìm kiếm</span>
          </TabsTrigger>
          <TabsTrigger value='help' className='flex items-center space-x-2'>
            <HelpCircle className='h-4 w-4' />
            <span className='hidden sm:inline'>Trợ giúp</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab Contents */}
        <TabsContent value='overview' className='mt-6'>
          <ExploreOverview />
        </TabsContent>

        <TabsContent value='discovery' className='mt-6'>
          <Suspense fallback={<TabLoadingSpinner />}>
            <DiscoveryPage />
          </Suspense>
        </TabsContent>

        <TabsContent value='marketplace' className='mt-6'>
          <div className='space-y-6'>
            <HotDeals />
            <Suspense fallback={<TabLoadingSpinner />}>
              <EnhancedMarketplacePage />
            </Suspense>
          </div>
        </TabsContent>

        <TabsContent value='blog' className='mt-6'>
          <Suspense fallback={<TabLoadingSpinner />}>
            <BlogPage />
          </Suspense>
        </TabsContent>

        <TabsContent value='search' className='mt-6'>
          <QuickSearch />
        </TabsContent>

        <TabsContent value='help' className='mt-6'>
          <Suspense fallback={<TabLoadingSpinner />}>
            <HelpPage />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExploreHub;
