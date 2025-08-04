import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import { Slider } from '@/shared/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Checkbox } from '@/shared/components/ui/checkbox';
import {
  Search,
  Filter,
  MapPin,
  Users,
  Target,
  Star,
  X,
  RotateCcw,
} from 'lucide-react';

interface SearchFilters {
  query: string;
  location: string;
  skillLevel: string[];
  distance: number;
  onlineOnly: boolean;
  verifiedOnly: boolean;
  minRating: number;
  maxRating: number;
  categories: string[];
}

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void;
  onReset: () => void;
  isLoading?: boolean;
}

export const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  onSearch,
  onReset,
  isLoading = false,
}) => {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    location: '',
    skillLevel: [],
    distance: 50,
    onlineOnly: false,
    verifiedOnly: false,
    minRating: 0,
    maxRating: 5,
    categories: [],
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const skillLevels = [
    { value: 'E+', label: 'Chuyên nghiệp tiến bộ (E+)' },
    { value: 'E', label: 'Chuyên nghiệp (E)' },
    { value: 'F+', label: 'Xuất sắc tiến bộ (F+)' },
    { value: 'F', label: 'Xuất sắc (F)' },
    { value: 'G+', label: 'Giỏi tiến bộ (G+)' },
    { value: 'G', label: 'Giỏi (G)' },
    { value: 'H+', label: 'Khá tiến bộ (H+)' },
    { value: 'H', label: 'Khá (H)' },
    { value: 'I+', label: 'Trung bình tiến bộ (I+)' },
    { value: 'I', label: 'Trung bình (I)' },
    { value: 'K+', label: 'Người mới tiến bộ (K+)' },
    { value: 'K', label: 'Người mới (K)' },
  ];

  const categories = [
    { value: 'tournament', label: 'Giải đấu' },
    { value: 'challenge', label: 'Thách đấu' },
    { value: 'club', label: 'Câu lạc bộ' },
    { value: 'player', label: 'Người chơi' },
    { value: 'coach', label: 'Huấn luyện viên' },
  ];

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSkillLevelToggle = (level: string) => {
    setFilters(prev => ({
      ...prev,
      skillLevel: prev.skillLevel.includes(level)
        ? prev.skillLevel.filter(l => l !== level)
        : [...prev.skillLevel, level],
    }));
  };

  const handleCategoryToggle = (category: string) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category],
    }));
  };

  const handleSearch = () => {
    onSearch(filters);
  };

  const handleReset = () => {
    setFilters({
      query: '',
      location: '',
      skillLevel: [],
      distance: 50,
      onlineOnly: false,
      verifiedOnly: false,
      minRating: 0,
      maxRating: 5,
      categories: [],
    });
    onReset();
  };

  const activeFiltersCount = [
    filters.query,
    filters.location,
    filters.skillLevel.length,
    filters.categories.length,
    filters.onlineOnly,
    filters.verifiedOnly,
    filters.distance !== 50,
    filters.minRating !== 0,
    filters.maxRating !== 5,
  ].filter(Boolean).length;

  return (
    <Card className='w-full'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2'>
            <Search className='h-5 w-5' />
            Tìm kiếm nâng cao
          </CardTitle>
          <div className='flex items-center gap-2'>
            {activeFiltersCount > 0 && (
              <Badge variant='secondary'>{activeFiltersCount} bộ lọc</Badge>
            )}
            <Button
              variant='outline'
              size='sm'
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <Filter className='h-4 w-4 mr-2' />
              {showAdvanced ? 'Ẩn' : 'Hiện'} bộ lọc
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className='space-y-4'>
        {/* Basic Search */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
            <Input
              placeholder='Tìm kiếm...'
              value={filters.query}
              onChange={e => handleFilterChange('query', e.target.value)}
              className='pl-10'
            />
          </div>
          <div className='relative'>
            <MapPin className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
            <Input
              placeholder='Địa điểm...'
              value={filters.location}
              onChange={e => handleFilterChange('location', e.target.value)}
              className='pl-10'
            />
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className='space-y-6 pt-4 border-t'>
            {/* Categories */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Danh mục
              </label>
              <div className='flex flex-wrap gap-2'>
                {categories.map(category => (
                  <Badge
                    key={category.value}
                    variant={
                      filters.categories.includes(category.value)
                        ? 'default'
                        : 'outline'
                    }
                    className='cursor-pointer'
                    onClick={() => handleCategoryToggle(category.value)}
                  >
                    {category.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Skill Levels */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Trình độ
              </label>
              <div className='grid grid-cols-2 md:grid-cols-3 gap-2'>
                {skillLevels.map(level => (
                  <div
                    key={level.value}
                    className='flex items-center space-x-2'
                  >
                    <Checkbox
                      id={level.value}
                      checked={filters.skillLevel.includes(level.value)}
                      onCheckedChange={() =>
                        handleSkillLevelToggle(level.value)
                      }
                    />
                    <label
                      htmlFor={level.value}
                      className='text-sm cursor-pointer'
                    >
                      {level.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Distance */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Khoảng cách tối đa: {filters.distance} km
              </label>
              <Slider
                value={[filters.distance]}
                onValueChange={value =>
                  handleFilterChange('distance', value[0])
                }
                max={100}
                min={1}
                step={1}
                className='w-full'
              />
            </div>

            {/* Rating Range */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Đánh giá: {filters.minRating} - {filters.maxRating} sao
              </label>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='block text-xs text-gray-600 mb-1'>Từ</label>
                  <Select
                    value={filters.minRating.toString()}
                    onValueChange={value =>
                      handleFilterChange('minRating', parseFloat(value))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[0, 1, 2, 3, 4, 5].map(rating => (
                        <SelectItem key={rating} value={rating.toString()}>
                          {rating} sao
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className='block text-xs text-gray-600 mb-1'>
                    Đến
                  </label>
                  <Select
                    value={filters.maxRating.toString()}
                    onValueChange={value =>
                      handleFilterChange('maxRating', parseFloat(value))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[0, 1, 2, 3, 4, 5].map(rating => (
                        <SelectItem key={rating} value={rating.toString()}>
                          {rating} sao
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Additional Filters */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='flex items-center space-x-2'>
                <Checkbox
                  id='onlineOnly'
                  checked={filters.onlineOnly}
                  onCheckedChange={checked =>
                    handleFilterChange('onlineOnly', checked)
                  }
                />
                <label htmlFor='onlineOnly' className='text-sm cursor-pointer'>
                  Chỉ người đang online
                </label>
              </div>
              <div className='flex items-center space-x-2'>
                <Checkbox
                  id='verifiedOnly'
                  checked={filters.verifiedOnly}
                  onCheckedChange={checked =>
                    handleFilterChange('verifiedOnly', checked)
                  }
                />
                <label
                  htmlFor='verifiedOnly'
                  className='text-sm cursor-pointer'
                >
                  Chỉ tài khoản đã xác thực
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className='flex gap-2 pt-4'>
          <Button
            onClick={handleSearch}
            disabled={isLoading}
            className='flex-1'
          >
            {isLoading ? (
              <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
            ) : (
              <Search className='h-4 w-4 mr-2' />
            )}
            Tìm kiếm
          </Button>
          <Button variant='outline' onClick={handleReset} disabled={isLoading}>
            <RotateCcw className='h-4 w-4 mr-2' />
            Đặt lại
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
