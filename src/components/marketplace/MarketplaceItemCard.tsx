import React from 'react';
import { Heart, Eye, MapPin, Clock, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MarketplaceItem } from '@/hooks/marketplace/types';

interface MarketplaceItemCardProps {
  item: MarketplaceItem;
  onItemClick: (item: MarketplaceItem) => void;
  onFavorite?: (itemId: string) => void;
  isFavorited?: boolean;
}

const MarketplaceItemCard = ({
  item,
  onItemClick,
  onFavorite,
  isFavorited = false,
}: MarketplaceItemCardProps) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const getConditionLabel = (condition: string | null) => {
    switch (condition) {
      case 'new':
        return 'Mới';
      case 'used':
        return 'Đã sử dụng';
      case 'refurbished':
        return 'Tân trang';
      default:
        return 'Không rõ';
    }
  };

  const getConditionVariant = (condition: string | null) => {
    switch (condition) {
      case 'new':
        return 'default';
      case 'used':
        return 'secondary';
      case 'refurbished':
        return 'outline' as const;
      default:
        return 'secondary';
    }
  };

  return (
    <Card className='group hover:shadow-lg transition-shadow cursor-pointer'>
      <CardContent className='p-0'>
        {/* Product Image */}
        <div className='relative aspect-square bg-gray-100 rounded-t-lg overflow-hidden'>
          {item.images && item.images.length > 0 ? (
            <img
              src={item.images[0]}
              alt={item.title}
              className='w-full h-full object-cover group-hover:scale-105 transition-transform'
            />
          ) : (
            <div className='w-full h-full flex items-center justify-center text-gray-400'>
              <div className='text-center'>
                <div className='text-4xl mb-2'>🎱</div>
                <div className='text-sm'>Chưa có ảnh</div>
              </div>
            </div>
          )}

          {/* Favorite Button */}
          {onFavorite && (
            <button
              onClick={e => {
                e.stopPropagation();
                onFavorite(item.id);
              }}
              className='absolute top-2 right-2 p-2 bg-white/80 hover:bg-white rounded-full shadow-sm transition-colors'
            >
              <Heart
                className={`w-4 h-4 ${
                  isFavorited
                    ? 'fill-red-500 text-red-500'
                    : 'text-gray-500 hover:text-red-500'
                }`}
              />
            </button>
          )}

          {/* Condition Badge */}
          <div className='absolute top-2 left-2'>
            <Badge variant={getConditionVariant(item.condition)}>
              {getConditionLabel(item.condition)}
            </Badge>
          </div>
        </div>

        {/* Product Info */}
        <div className='p-4 space-y-3' onClick={() => onItemClick(item)}>
          {/* Title and Price */}
          <div>
            <h3 className='font-semibold text-lg line-clamp-2 group-hover:text-blue-600 transition-colors'>
              {item.title}
            </h3>
            <div className='flex items-center justify-between mt-1'>
              <span className='text-xl font-bold text-green-600'>
                {formatPrice(item.price)}
              </span>
              {item.original_price && item.original_price > item.price && (
                <span className='text-sm text-gray-500 line-through'>
                  {formatPrice(item.original_price)}
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          {item.description && (
            <p className='text-gray-600 text-sm line-clamp-2'>
              {item.description}
            </p>
          )}

          {/* Brand and Category */}
          {item.brand && (
            <div className='flex items-center gap-2'>
              <Badge variant='outline' className='text-xs'>
                {item.brand}
              </Badge>
            </div>
          )}

          {/* Location and Stats */}
          <div className='flex items-center justify-between text-sm text-gray-500'>
            <div className='flex items-center gap-1'>
              <MapPin className='w-4 h-4' />
              <span>{item.location || 'Chưa rõ'}</span>
            </div>
            <div className='flex items-center gap-3'>
              <div className='flex items-center gap-1'>
                <Eye className='w-4 h-4' />
                <span>{item.views_count || 0}</span>
              </div>
              <div className='flex items-center gap-1'>
                <Heart className='w-4 h-4' />
                <span>{item.favorites_count || 0}</span>
              </div>
            </div>
          </div>

          {/* Seller Info */}
          {item.seller && (
            <div className='flex items-center justify-between pt-2 border-t'>
              <div className='flex items-center gap-2'>
                <Avatar className='h-6 w-6'>
                  <AvatarImage src={item.seller.avatar_url || ''} />
                  <AvatarFallback className='text-xs'>
                    {item.seller.full_name?.charAt(0) || 'S'}
                  </AvatarFallback>
                </Avatar>
                <span className='text-sm text-gray-600'>
                  {item.seller.full_name || item.seller.nickname || 'Người bán'}
                </span>
              </div>

              {item.seller.avg_response_time && (
                <div className='flex items-center gap-1 text-xs text-gray-500'>
                  <Clock className='w-3 h-3' />
                  <span>~{item.seller.avg_response_time}h</span>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className='flex gap-2 pt-2'>
            <Button
              variant='outline'
              size='sm'
              className='flex-1'
              onClick={e => {
                e.stopPropagation();
                // Handle contact seller
                console.log('Contact seller for item:', item.id);
              }}
            >
              Liên hệ
            </Button>
            <Button
              size='sm'
              className='flex-1'
              onClick={e => {
                e.stopPropagation();
                // Handle buy now
                console.log('Buy now item:', item.id);
              }}
            >
              Mua ngay
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MarketplaceItemCard;
