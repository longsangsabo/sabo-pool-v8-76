import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, Grid3X3, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMarketplace } from '@/hooks/marketplace/useMarketplace';
import MarketplaceItemCard from '@/components/marketplace/MarketplaceItemCard';
import MarketplaceFilters from '@/components/marketplace/MarketplaceFilters';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

const EnhancedMarketplacePage = () => {
  const { items, loading, error, fetchItems } = useMarketplace();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [condition, setCondition] = useState('all');
  const [location, setLocation] = useState('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([
    0, 100000000,
  ]);

  // Load items on component mount
  useEffect(() => {
    fetchItems();
  }, []);

  const handleApplyFilters = async () => {
    const filters = {
      search: searchQuery || undefined,
      category: category !== 'all' ? category : undefined,
      condition: condition !== 'all' ? condition : undefined,
      priceRange:
        priceRange[0] > 0 || priceRange[1] < 100000000 ? priceRange : undefined,
    };

    await fetchItems(filters);
    toast.success('Đã áp dụng bộ lọc');
  };

  const handleClearFilters = async () => {
    setSearchQuery('');
    setCategory('all');
    setCondition('all');
    setLocation('all');
    setPriceRange([0, 100000000]);
    await fetchItems();
    toast.success('Đã xóa bộ lọc');
  };

  const handleItemClick = (item: any) => {
    console.log('Navigate to item detail:', item.id);
    // Navigate to item detail page
    toast.info(`Xem chi tiết: ${item.title}`);
  };

  const handleFavorite = (itemId: string) => {
    console.log('Toggle favorite for item:', itemId);
    toast.success('Đã thêm vào danh sách yêu thích');
  };

  if (error) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8'>
        <div className='container mx-auto px-4'>
          <Card>
            <CardContent className='p-8 text-center'>
              <div className='text-red-500 mb-4'>⚠️</div>
              <h3 className='text-lg font-medium mb-2'>Có lỗi xảy ra</h3>
              <p className='text-gray-600 mb-4'>{error}</p>
              <Button onClick={() => fetchItems()}>Thử lại</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Marketplace - SABO Billiards</title>
        <meta
          name='description'
          content='Mua bán thiết bị bi-a chính hãng, chất lượng cao'
        />
      </Helmet>

      <div className='min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8'>
        <div className='container mx-auto px-4 max-w-7xl'>
          {/* Header */}
          <div className='mb-8'>
            <div className='flex items-center justify-between mb-6'>
              <div>
                <h1 className='text-3xl font-bold text-gray-900'>
                  Marketplace
                </h1>
                <p className='text-gray-600 mt-2'>
                  Mua bán thiết bị bi-a chính hãng, chất lượng cao
                </p>
              </div>

              <div className='flex items-center gap-3'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() =>
                    setViewMode(viewMode === 'grid' ? 'list' : 'grid')
                  }
                >
                  {viewMode === 'grid' ? (
                    <List className='w-4 h-4' />
                  ) : (
                    <Grid3X3 className='w-4 h-4' />
                  )}
                </Button>

                <Button className='flex items-center gap-2'>
                  <Plus className='w-4 h-4' />
                  Đăng bán
                </Button>
              </div>
            </div>

            {/* Filters */}
            <MarketplaceFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              category={category}
              onCategoryChange={setCategory}
              condition={condition}
              onConditionChange={setCondition}
              priceRange={priceRange}
              onPriceRangeChange={setPriceRange}
              location={location}
              onLocationChange={setLocation}
              onApplyFilters={handleApplyFilters}
              onClearFilters={handleClearFilters}
            />
          </div>

          {/* Results */}
          <div className='mb-4'>
            <p className='text-gray-600'>
              Tìm thấy <span className='font-semibold'>{items.length}</span> sản
              phẩm
            </p>
          </div>

          {/* Items Grid/List */}
          {loading ? (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
              {[...Array(8)].map((_, i) => (
                <Card key={i} className='animate-pulse'>
                  <CardContent className='p-0'>
                    <div className='aspect-square bg-gray-200 rounded-t-lg'></div>
                    <div className='p-4 space-y-3'>
                      <div className='h-4 bg-gray-200 rounded'></div>
                      <div className='h-4 bg-gray-200 rounded w-2/3'></div>
                      <div className='h-4 bg-gray-200 rounded w-1/2'></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : items.length === 0 ? (
            <Card>
              <CardContent className='p-8 text-center'>
                <div className='text-gray-400 mb-4'>
                  <div className='text-6xl mb-4'>🎱</div>
                  <h3 className='text-lg font-medium mb-2'>
                    Không tìm thấy sản phẩm
                  </h3>
                  <p className='text-sm'>
                    Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
                  </p>
                </div>
                <Button variant='outline' onClick={handleClearFilters}>
                  Xóa bộ lọc
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                  : 'space-y-4'
              }
            >
              {items.map(item => (
                <MarketplaceItemCard
                  key={item.id}
                  item={item}
                  onItemClick={handleItemClick}
                  onFavorite={handleFavorite}
                  isFavorited={false}
                />
              ))}
            </div>
          )}

          {/* Load More */}
          {items.length > 0 && (
            <div className='text-center mt-8'>
              <Button variant='outline' onClick={() => fetchItems()}>
                Tải thêm sản phẩm
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default EnhancedMarketplacePage;
