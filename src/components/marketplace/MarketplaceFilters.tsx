import React from 'react';
import { Search, Filter, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

interface MarketplaceFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  category: string;
  onCategoryChange: (category: string) => void;
  condition: string;
  onConditionChange: (condition: string) => void;
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
  location: string;
  onLocationChange: (location: string) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
}

const MarketplaceFilters = ({
  searchQuery,
  onSearchChange,
  category,
  onCategoryChange,
  condition,
  onConditionChange,
  priceRange,
  onPriceRangeChange,
  location,
  onLocationChange,
  onApplyFilters,
  onClearFilters,
}: MarketplaceFiltersProps) => {
  const categories = [
    { value: 'all', label: 'Tất cả' },
    { value: 'cue', label: 'Cơ bi-a' },
    { value: 'table', label: 'Bàn bi-a' },
    { value: 'accessories', label: 'Phụ kiện' },
    { value: 'chalk', label: 'Phấn' },
    { value: 'case', label: 'Bao cơ' },
  ];

  const conditions = [
    { value: 'all', label: 'Tất cả tình trạng' },
    { value: 'new', label: 'Mới' },
    { value: 'used', label: 'Đã sử dụng' },
    { value: 'refurbished', label: 'Tân trang' },
  ];

  const locations = [
    { value: 'all', label: 'Tất cả địa điểm' },
    { value: 'ho-chi-minh', label: 'TP. Hồ Chí Minh' },
    { value: 'ha-noi', label: 'Hà Nội' },
    { value: 'da-nang', label: 'Đà Nẵng' },
    { value: 'can-tho', label: 'Cần Thơ' },
    { value: 'hai-phong', label: 'Hải Phòng' },
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  return (
    <div className='space-y-4'>
      {/* Search Bar */}
      <div className='relative'>
        <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
        <Input
          placeholder='Tìm kiếm sản phẩm...'
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          className='pl-10'
        />
      </div>

      {/* Quick Filters */}
      <div className='flex items-center gap-3 flex-wrap'>
        <Select value={category} onValueChange={onCategoryChange}>
          <SelectTrigger className='w-48'>
            <SelectValue placeholder='Chọn danh mục' />
          </SelectTrigger>
          <SelectContent>
            {categories.map(cat => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={location} onValueChange={onLocationChange}>
          <SelectTrigger className='w-48'>
            <SelectValue placeholder='Chọn địa điểm' />
          </SelectTrigger>
          <SelectContent>
            {locations.map(loc => (
              <SelectItem key={loc.value} value={loc.value}>
                {loc.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Advanced Filters */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant='outline' className='flex items-center gap-2'>
              <SlidersHorizontal className='w-4 h-4' />
              Bộ lọc nâng cao
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Bộ lọc nâng cao</SheetTitle>
              <SheetDescription>
                Tùy chỉnh bộ lọc để tìm sản phẩm phù hợp
              </SheetDescription>
            </SheetHeader>

            <div className='space-y-6 mt-6'>
              {/* Condition Filter */}
              <div className='space-y-2'>
                <Label>Tình trạng sản phẩm</Label>
                <Select value={condition} onValueChange={onConditionChange}>
                  <SelectTrigger>
                    <SelectValue placeholder='Chọn tình trạng' />
                  </SelectTrigger>
                  <SelectContent>
                    {conditions.map(cond => (
                      <SelectItem key={cond.value} value={cond.value}>
                        {cond.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Price Range Filter */}
              <div className='space-y-3'>
                <Label>Khoảng giá (VNĐ)</Label>
                <div className='px-3'>
                  <Slider
                    value={priceRange}
                    onValueChange={value =>
                      onPriceRangeChange(value as [number, number])
                    }
                    max={100000000}
                    min={0}
                    step={100000}
                    className='w-full'
                  />
                </div>
                <div className='flex justify-between text-sm text-gray-600'>
                  <span>{formatPrice(priceRange[0])} đ</span>
                  <span>{formatPrice(priceRange[1])} đ</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className='flex gap-3 pt-4'>
                <Button onClick={onApplyFilters} className='flex-1'>
                  Áp dụng
                </Button>
                <Button
                  variant='outline'
                  onClick={onClearFilters}
                  className='flex-1'
                >
                  Xóa bộ lọc
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};

export default MarketplaceFilters;
