import React from 'react';
import { X, Sliders, MapPin, Trophy, Zap } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Slider } from '@/shared/components/ui/slider';
import { Label } from '@/shared/components/ui/label';

interface DiscoveryFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  filters: {
    rankRange: string[];
    maxDistance: number;
    minBetPoints: number;
    maxBetPoints: number;
  };
  onFiltersChange: (filters: any) => void;
}

const ranks = [
  'K',
  'K+',
  'I',
  'I+',
  'H',
  'H+',
  'G',
  'G+',
  'F',
  'F+',
  'E',
  'E+',
];

const DiscoveryFilters = ({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
}: DiscoveryFiltersProps) => {
  if (!isOpen) return null;

  const handleRankSelect = (rank: string) => {
    const currentRanks = filters.rankRange;
    if (currentRanks.includes(rank)) {
      const newRanks = currentRanks.filter(r => r !== rank);
      onFiltersChange({ ...filters, rankRange: newRanks });
    } else {
      onFiltersChange({ ...filters, rankRange: [...currentRanks, rank] });
    }
  };

  return (
    <div className='fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end'>
      <div className='w-full bg-white rounded-t-2xl p-4 max-h-[80vh] overflow-y-auto'>
        <Card className='border-0 shadow-none'>
          <CardHeader className='pb-4'>
            <div className='flex items-center justify-between'>
              <CardTitle className='flex items-center space-x-2'>
                <Sliders className='w-5 h-5' />
                <span>Bộ lọc tìm kiếm</span>
              </CardTitle>
              <Button variant='ghost' size='icon' onClick={onClose}>
                <X className='w-5 h-5' />
              </Button>
            </div>
          </CardHeader>

          <CardContent className='space-y-6'>
            {/* Rank Filter */}
            <div>
              <Label className='text-base font-semibold flex items-center space-x-2 mb-3'>
                <Trophy className='w-4 h-4' />
                <span>Hạng đấu</span>
              </Label>
              <div className='grid grid-cols-4 gap-2'>
                {ranks.map(rank => (
                  <Button
                    key={rank}
                    variant={
                      filters.rankRange.includes(rank) ? 'default' : 'outline'
                    }
                    size='sm'
                    onClick={() => handleRankSelect(rank)}
                    className='h-10'
                  >
                    {rank}
                  </Button>
                ))}
              </div>
              <p className='text-sm text-gray-500 mt-2'>
                Đã chọn: {filters.rankRange.length} hạng
              </p>
            </div>

            {/* Distance Filter */}
            <div>
              <Label className='text-base font-semibold flex items-center space-x-2 mb-3'>
                <MapPin className='w-4 h-4' />
                <span>Khoảng cách tối đa: {filters.maxDistance}km</span>
              </Label>
              <Slider
                value={[filters.maxDistance]}
                onValueChange={value =>
                  onFiltersChange({ ...filters, maxDistance: value[0] })
                }
                max={100}
                min={5}
                step={5}
                className='w-full'
              />
              <div className='flex justify-between text-sm text-gray-500 mt-1'>
                <span>5km</span>
                <span>100km</span>
              </div>
            </div>

            {/* Bet Points Filter */}
            <div>
              <Label className='text-base font-semibold flex items-center space-x-2 mb-3'>
                <Zap className='w-4 h-4' />
                <span>
                  Mức cược: {filters.minBetPoints} - {filters.maxBetPoints} điểm
                </span>
              </Label>
              <div className='space-y-3'>
                <div>
                  <Label className='text-sm text-gray-600'>Tối thiểu</Label>
                  <Slider
                    value={[filters.minBetPoints]}
                    onValueChange={value =>
                      onFiltersChange({ ...filters, minBetPoints: value[0] })
                    }
                    max={500}
                    min={10}
                    step={10}
                    className='w-full mt-1'
                  />
                </div>
                <div>
                  <Label className='text-sm text-gray-600'>Tối đa</Label>
                  <Slider
                    value={[filters.maxBetPoints]}
                    onValueChange={value =>
                      onFiltersChange({ ...filters, maxBetPoints: value[0] })
                    }
                    max={1000}
                    min={50}
                    step={25}
                    className='w-full mt-1'
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className='flex space-x-3 pt-4'>
              <Button
                variant='outline'
                className='flex-1'
                onClick={() => {
                  onFiltersChange({
                    rankRange: ['K', 'K+'],
                    maxDistance: 50,
                    minBetPoints: 10,
                    maxBetPoints: 100,
                  });
                }}
              >
                Đặt lại
              </Button>
              <Button className='flex-1' onClick={onClose}>
                Áp dụng
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DiscoveryFilters;
