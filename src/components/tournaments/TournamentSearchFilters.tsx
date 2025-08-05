import React from 'react';
import { Search, Filter, Sliders } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface TournamentSearchFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
  activeFiltersCount?: number;
}

export const TournamentSearchFilters: React.FC<
  TournamentSearchFiltersProps
> = ({
  searchQuery,
  onSearchChange,
  selectedFilter,
  onFilterChange,
  activeFiltersCount = 0,
}) => {
  const filterChips = [
    { id: 'all', label: 'Tất cả', color: 'default' },
    { id: 'registration_open', label: 'Đang mở ĐK', color: 'success' },
    { id: 'upcoming', label: 'Sắp diễn ra', color: 'info' },
    { id: 'ongoing', label: 'Đang diễn ra', color: 'warning' },
    { id: 'completed', label: 'Đã kết thúc', color: 'secondary' },
  ];

  return (
    <div className='px-4 mb-6 space-y-4'>
      {/* Search Bar */}
      <div className='relative'>
        <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
        <Input
          placeholder='Tìm kiếm giải đấu...'
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          className='pl-10 h-12 rounded-2xl border-border/50 bg-card/50 backdrop-blur-sm focus:bg-card transition-all duration-200'
        />
      </div>

      {/* Filter Chips */}
      <div className='flex items-center space-x-3'>
        <div className='flex space-x-2 overflow-x-auto pb-2 scrollbar-hide'>
          {filterChips.map(chip => (
            <button
              key={chip.id}
              onClick={() => onFilterChange(chip.id)}
              className={`
                px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200
                ${
                  selectedFilter === chip.id
                    ? 'bg-primary text-primary-foreground shadow-glow'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted active:scale-95'
                }
              `}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Advanced Filters Button */}
        <Button
          variant='outline'
          size='icon'
          className='relative h-10 w-10 rounded-full shrink-0'
        >
          <Sliders className='h-4 w-4' />
          {activeFiltersCount > 0 && (
            <Badge
              variant='destructive'
              className='absolute -top-1 -right-1 w-5 h-5 text-xs p-0 flex items-center justify-center'
            >
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </div>
    </div>
  );
};
