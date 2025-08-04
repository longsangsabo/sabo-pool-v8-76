import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import {
  Search,
  Filter,
  Heart,
  ShoppingCart,
  Star,
  MapPin,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';

const MarketplacePage = () => {
  // Mock data for marketplace items
  const marketplaceItems = [
    {
      id: '1',
      title: 'Gậy Predator 314-3 Shaft',
      price: 15000000,
      originalPrice: 18000000,
      condition: 'Like New',
      brand: 'Predator',
      category: 'cue_stick',
      images: ['/placeholder.svg'],
      location: 'TP.HCM, Quận 1',
      seller: {
        name: 'Nguyễn Văn A',
        rating: 4.8,
        totalSales: 23,
      },
      favorites: 12,
      views: 156,
    },
    {
      id: '2',
      title: 'Bàn Bida 9ft Diamond',
      price: 120000000,
      originalPrice: 150000000,
      condition: 'Good',
      brand: 'Diamond',
      category: 'table',
      images: ['/placeholder.svg'],
      location: 'Hà Nội, Cầu Giấy',
      seller: {
        name: 'Trần Thị B',
        rating: 4.9,
        totalSales: 8,
      },
      favorites: 25,
      views: 234,
    },
    {
      id: '3',
      title: 'Hộp Đựng Gậy Leather Case',
      price: 2500000,
      originalPrice: 3000000,
      condition: 'New',
      brand: 'Custom',
      category: 'accessories',
      images: ['/placeholder.svg'],
      location: 'TP.HCM, Quận 7',
      seller: {
        name: 'Lê Văn C',
        rating: 4.7,
        totalSales: 45,
      },
      favorites: 8,
      views: 89,
    },
  ];

  const categories = [
    { value: 'all', label: 'Tất cả' },
    { value: 'cue_stick', label: 'Gậy Cơ' },
    { value: 'accessories', label: 'Phụ Kiện' },
    { value: 'table', label: 'Bàn Bida' },
    { value: 'case', label: 'Hộp Đựng' },
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const getConditionColor = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'new':
        return 'bg-green-100 text-green-800';
      case 'like new':
        return 'bg-blue-100 text-blue-800';
      case 'good':
        return 'bg-yellow-100 text-yellow-800';
      case 'fair':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className='container mx-auto px-4 py-6'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-gray-900 mb-2'>
          Chợ Bida Online
        </h1>
        <p className='text-gray-600'>
          Mua bán thiết bị bida chất lượng cao với hệ thống uy tín
        </p>
      </div>

      {/* Search and Filters */}
      <div className='mb-6 space-y-4'>
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
          <Input placeholder='Tìm kiếm thiết bị bida...' className='pl-10' />
        </div>

        <div className='flex flex-wrap gap-4'>
          <Select>
            <SelectTrigger className='w-[180px]'>
              <SelectValue placeholder='Danh mục' />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant='outline' className='flex items-center gap-2'>
            <Filter className='w-4 h-4' />
            Bộ lọc
          </Button>
        </div>
      </div>

      {/* Items Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
        {marketplaceItems.map(item => (
          <Card
            key={item.id}
            className='hover:shadow-lg transition-shadow cursor-pointer'
          >
            <div className='relative'>
              <img
                src={item.images[0]}
                alt={item.title}
                className='w-full h-48 object-cover rounded-t-lg'
              />
              <button className='absolute top-2 right-2 p-2 bg-white rounded-full shadow-sm hover:bg-gray-50'>
                <Heart className='w-4 h-4 text-gray-600' />
              </button>
              <Badge
                className={`absolute top-2 left-2 ${getConditionColor(item.condition)}`}
              >
                {item.condition}
              </Badge>
            </div>

            <CardContent className='p-4'>
              <h3 className='text-lg font-semibold text-gray-900 mb-2 line-clamp-2'>
                {item.title}
              </h3>

              <div className='flex items-center justify-between mb-2'>
                <p className='text-xl font-bold text-blue-600'>
                  {formatPrice(item.price)}
                </p>
                {item.originalPrice && item.originalPrice > item.price && (
                  <p className='text-sm text-gray-500 line-through'>
                    {formatPrice(item.originalPrice)}
                  </p>
                )}
              </div>

              <div className='flex items-center justify-between text-sm text-gray-500 mb-3'>
                <div className='flex items-center'>
                  <MapPin className='w-3 h-3 mr-1' />
                  {item.location}
                </div>
                <div className='flex items-center space-x-2'>
                  <span className='flex items-center'>
                    <Heart className='w-3 h-3 mr-1' />
                    {item.favorites}
                  </span>
                  <span>{item.views} lượt xem</span>
                </div>
              </div>

              <div className='flex items-center justify-between mb-3'>
                <div className='flex items-center space-x-2'>
                  <div className='w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center'>
                    <span className='text-white text-xs font-medium'>
                      {item.seller.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className='text-sm font-medium text-gray-900'>
                      {item.seller.name}
                    </p>
                    <div className='flex items-center'>
                      <Star className='w-3 h-3 text-yellow-400 mr-1' />
                      <span className='text-xs text-gray-500'>
                        {item.seller.rating} ({item.seller.totalSales} đã bán)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className='flex space-x-2'>
                <Button className='flex-1' size='sm'>
                  Xem chi tiết
                </Button>
                <Button variant='outline' size='sm'>
                  <ShoppingCart className='w-4 h-4' />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Load More */}
      <div className='text-center mt-8'>
        <Button variant='outline' size='lg'>
          Xem thêm sản phẩm
        </Button>
      </div>
    </div>
  );
};

export default MarketplacePage;
