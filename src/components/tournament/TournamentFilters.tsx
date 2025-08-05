/**
 * Enhanced Tournament Filters with search and status tabs
 */

import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  Filter,
  Calendar,
  Trophy,
  Clock,
  Users,
  MapPin,
  DollarSign,
} from 'lucide-react';
import { TournamentStatusBadge } from './TournamentStatusBadge';

interface TournamentFiltersProps {
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  tournamentCounts?: {
    all: number;
    registration_open: number;
    upcoming: number;
    ongoing: number;
    completed: number;
  };
}

export const TournamentFilters: React.FC<TournamentFiltersProps> = ({
  selectedFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  tournamentCounts,
}) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Filter configuration with icons and counts
  const filters = useMemo(
    () => [
      {
        key: 'all',
        label: 'Tất cả',
        icon: Trophy,
        count: tournamentCounts?.all || 0,
        color: 'text-gray-600',
      },
      {
        key: 'registration_open',
        label: 'Đang mở ĐK',
        icon: Users,
        count: tournamentCounts?.registration_open || 0,
        color: 'text-green-600',
      },
      {
        key: 'upcoming',
        label: 'Sắp diễn ra',
        icon: Calendar,
        count: tournamentCounts?.upcoming || 0,
        color: 'text-orange-600',
      },
      {
        key: 'ongoing',
        label: 'Đang diễn ra',
        icon: Clock,
        count: tournamentCounts?.ongoing || 0,
        color: 'text-purple-600',
      },
      {
        key: 'completed',
        label: 'Đã kết thúc',
        icon: Trophy,
        count: tournamentCounts?.completed || 0,
        color: 'text-gray-500',
      },
    ],
    [tournamentCounts]
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onSearchChange(e.target.value);
    },
    [onSearchChange]
  );

  return (
    <Card className='shadow-sm border-0 bg-white/50 backdrop-blur-sm'>
      <CardContent className='p-6'>
        <div className='space-y-6'>
          {/* Search Bar */}
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
            <Input
              placeholder='🔍 Tìm kiếm giải đấu theo tên, địa điểm...'
              value={searchQuery}
              onChange={handleSearchChange}
              className='pl-10 pr-4 h-11 border-gray-200 focus:border-blue-400 focus:ring-blue-400'
            />
            {searchQuery && (
              <Button
                variant='ghost'
                size='sm'
                className='absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0'
                onClick={() => onSearchChange('')}
              >
                ✕
              </Button>
            )}
          </div>

          {/* Status Filter Tabs */}
          <Tabs value={selectedFilter} onValueChange={onFilterChange}>
            <TabsList className='grid w-full grid-cols-5 bg-gray-100/50'>
              {filters.map(filter => {
                const Icon = filter.icon;
                return (
                  <TabsTrigger
                    key={filter.key}
                    value={filter.key}
                    className='relative data-[state=active]:bg-white data-[state=active]:shadow-sm'
                  >
                    <div className='flex flex-col items-center gap-1'>
                      <div className='flex items-center gap-1'>
                        <Icon className={`h-4 w-4 ${filter.color}`} />
                        <span className='font-medium'>{filter.label}</span>
                      </div>
                      {filter.count > 0 && (
                        <Badge
                          variant='secondary'
                          className='h-5 min-w-5 px-1 text-xs bg-gray-200 text-gray-700'
                        >
                          {filter.count}
                        </Badge>
                      )}
                    </div>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>

          {/* Quick Status Overview */}
          <div className='flex flex-wrap gap-2 justify-center'>
            <TournamentStatusBadge status='registration_open' size='sm' />
            <TournamentStatusBadge status='upcoming' size='sm' />
            <TournamentStatusBadge status='ongoing' size='sm' />
            <TournamentStatusBadge status='completed' size='sm' />
          </div>

          {/* Advanced Filters Toggle */}
          <div className='text-center'>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className='text-gray-600 hover:text-gray-900'
            >
              <Filter className='mr-2 h-4 w-4' />
              {showAdvancedFilters
                ? 'Ẩn bộ lọc nâng cao'
                : 'Hiển thị bộ lọc nâng cao'}
            </Button>
          </div>

          {/* Advanced Filters (expandable) */}
          {showAdvancedFilters && (
            <div className='space-y-4 p-4 bg-gray-50 rounded-lg'>
              <h4 className='font-medium text-gray-900'>Bộ lọc nâng cao</h4>

              <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                {/* Entry Fee Filter */}
                <div className='space-y-2'>
                  <label className='text-sm font-medium text-gray-700 flex items-center'>
                    <DollarSign className='mr-1 h-4 w-4' />
                    Phí tham gia
                  </label>
                  <select className='w-full p-2 border border-gray-200 rounded-md text-sm'>
                    <option value=''>Tất cả</option>
                    <option value='free'>Miễn phí</option>
                    <option value='0-100000'>0-100k VNĐ</option>
                    <option value='100000-500000'>100k-500k VNĐ</option>
                    <option value='500000+'>500k+ VNĐ</option>
                  </select>
                </div>

                {/* Location Filter */}
                <div className='space-y-2'>
                  <label className='text-sm font-medium text-gray-700 flex items-center'>
                    <MapPin className='mr-1 h-4 w-4' />
                    Khu vực
                  </label>
                  <select className='w-full p-2 border border-gray-200 rounded-md text-sm'>
                    <option value=''>Tất cả</option>
                    <option value='hcm'>TP. HCM</option>
                    <option value='hanoi'>Hà Nội</option>
                    <option value='danang'>Đà Nẵng</option>
                    <option value='other'>Khác</option>
                  </select>
                </div>

                {/* Tournament Type */}
                <div className='space-y-2'>
                  <label className='text-sm font-medium text-gray-700 flex items-center'>
                    <Trophy className='mr-1 h-4 w-4' />
                    Loại giải
                  </label>
                  <select className='w-full p-2 border border-gray-200 rounded-md text-sm'>
                    <option value=''>Tất cả</option>
                    <option value='single_elimination'>Loại trực tiếp</option>
                    <option value='double_elimination'>Loại kép</option>
                    <option value='round_robin'>Vòng tròn</option>
                  </select>
                </div>

                {/* Participants */}
                <div className='space-y-2'>
                  <label className='text-sm font-medium text-gray-700 flex items-center'>
                    <Users className='mr-1 h-4 w-4' />
                    Quy mô
                  </label>
                  <select className='w-full p-2 border border-gray-200 rounded-md text-sm'>
                    <option value=''>Tất cả</option>
                    <option value='small'>Nhỏ (≤16)</option>
                    <option value='medium'>Vừa (17-32)</option>
                    <option value='large'>Lớn (≥33)</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
