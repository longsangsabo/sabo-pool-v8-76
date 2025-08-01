import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, Trophy, Medal, Award } from 'lucide-react';
import { RankingService } from '@/services/rankingService';
import {
  SPA_TOURNAMENT_REWARDS,
  TOURNAMENT_ELO_REWARDS,
} from '@/utils/eloConstants';
import type { RankCode, TournamentPosition } from '@/utils/eloConstants';

interface QuickAllocationPreview {
  position: number;
  name: string;
  eloPoints: number;
  spaPoints: number;
  cashAmount: number;
  items: string[];
}

interface QuickRewardAllocationProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (allocations: QuickAllocationPreview[]) => void;
  totalPrizePool: number;
  currentAllocations: any[];
}

const PRIZE_TEMPLATES = {
  '50-30-20': { 1: 0.5, 2: 0.3, 3: 0.2 },
  '40-30-20-10': { 1: 0.4, 2: 0.3, 3: 0.2, 4: 0.1 },
  '40-25-15-10-5-5': { 1: 0.4, 2: 0.25, 3: 0.15, 4: 0.1, 5: 0.05, 8: 0.05 },
  'even-distribution': { 1: 0.25, 2: 0.2, 3: 0.15, 4: 0.15, 8: 0.15, 16: 0.1 },
};

const POSITION_TEMPLATES = {
  3: [
    { position: 1, name: 'Vô địch', items: ['Cúp vô địch', 'Huy chương vàng'] },
    { position: 2, name: 'Á quân', items: ['Huy chương bạc'] },
    { position: 3, name: 'Hạng ba', items: ['Huy chương đồng'] },
  ],
  4: [
    { position: 1, name: 'Vô địch', items: ['Cúp vô địch', 'Huy chương vàng'] },
    { position: 2, name: 'Á quân', items: ['Huy chương bạc'] },
    { position: 3, name: 'Hạng ba', items: ['Huy chương đồng'] },
    { position: 4, name: 'Hạng tư', items: ['Giấy chứng nhận'] },
  ],
  8: [
    { position: 1, name: 'Vô địch', items: ['Cúp vô địch', 'Huy chương vàng'] },
    { position: 2, name: 'Á quân', items: ['Huy chương bạc'] },
    { position: 3, name: 'Hạng ba', items: ['Huy chương đồng'] },
    { position: 4, name: 'Hạng tư', items: ['Giấy chứng nhận'] },
    { position: 8, name: 'Top 8', items: ['Giấy chứng nhận'] },
  ],
  16: [
    { position: 1, name: 'Vô địch', items: ['Cúp vô địch', 'Huy chương vàng'] },
    { position: 2, name: 'Á quân', items: ['Huy chương bạc'] },
    { position: 3, name: 'Hạng ba', items: ['Huy chương đồng'] },
    { position: 4, name: 'Hạng tư', items: ['Giấy chứng nhận'] },
    { position: 8, name: 'Top 8', items: ['Giấy chứng nhận'] },
    { position: 16, name: 'Top 16', items: ['Giấy chứng nhận'] },
  ],
};

const TOURNAMENT_TYPE_MULTIPLIERS = {
  normal: 1.0,
  season: 1.5,
  open: 2.0,
};

export const QuickRewardAllocation: React.FC<QuickRewardAllocationProps> = ({
  isOpen,
  onClose,
  onApply,
  totalPrizePool,
  currentAllocations,
}) => {
  const [selectedRank, setSelectedRank] = useState<RankCode>('K');
  const [tournamentType, setTournamentType] = useState<
    'normal' | 'season' | 'open'
  >('normal');
  const [positionCount, setPositionCount] = useState<3 | 4 | 8 | 16>(3);
  const [prizeTemplate, setPrizeTemplate] =
    useState<keyof typeof PRIZE_TEMPLATES>('50-30-20');
  const [preview, setPreview] = useState<QuickAllocationPreview[]>([]);

  const calculatePreview = () => {
    const positions = POSITION_TEMPLATES[positionCount];
    const template = PRIZE_TEMPLATES[prizeTemplate];
    const spaMultiplier = TOURNAMENT_TYPE_MULTIPLIERS[tournamentType];

    const newPreview: QuickAllocationPreview[] = positions.map(pos => {
      // Get base SPA points for this rank and position
      let tournamentPosition: TournamentPosition;
      if (pos.position === 1) tournamentPosition = 'CHAMPION';
      else if (pos.position === 2) tournamentPosition = 'RUNNER_UP';
      else if (pos.position === 3) tournamentPosition = 'THIRD_PLACE';
      else if (pos.position === 4) tournamentPosition = 'FOURTH_PLACE';
      else if (pos.position <= 8) tournamentPosition = 'TOP_8';
      else if (pos.position <= 16) tournamentPosition = 'TOP_16';
      else tournamentPosition = 'PARTICIPATION';

      const baseSpaPoints =
        SPA_TOURNAMENT_REWARDS[selectedRank]?.[tournamentPosition] || 0;
      const spaPoints = Math.floor(baseSpaPoints * spaMultiplier);
      const eloPoints = TOURNAMENT_ELO_REWARDS[tournamentPosition] || 0;

      // Calculate cash amount based on template
      const cashPercentage =
        template[pos.position as keyof typeof template] || 0;
      const cashAmount = Math.floor(totalPrizePool * cashPercentage);

      return {
        position: pos.position,
        name: pos.name,
        eloPoints,
        spaPoints,
        cashAmount,
        items: pos.items,
      };
    });

    setPreview(newPreview);
  };

  React.useEffect(() => {
    calculatePreview();
  }, [
    selectedRank,
    tournamentType,
    positionCount,
    prizeTemplate,
    totalPrizePool,
  ]);

  const handleApply = () => {
    onApply(preview);
    onClose();
  };

  const getTotalCashDistributed = () => {
    return preview.reduce((sum, item) => sum + item.cashAmount, 0);
  };

  const getPositionIcon = (position: number) => {
    if (position === 1) return <Trophy className='w-4 h-4 text-yellow-500' />;
    if (position === 2) return <Medal className='w-4 h-4 text-gray-400' />;
    if (position === 3) return <Award className='w-4 h-4 text-amber-600' />;
    return <Award className='w-4 h-4 text-blue-500' />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Zap className='w-5 h-5 text-yellow-500' />
            Phân bổ phần thưởng nhanh
          </DialogTitle>
        </DialogHeader>

        <div className='grid md:grid-cols-2 gap-6'>
          {/* Configuration Panel */}
          <div className='space-y-4'>
            <Card>
              <CardHeader>
                <CardTitle className='text-lg'>Cài đặt phân bổ</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div>
                  <Label htmlFor='rank-select'>Hạng mục tiêu</Label>
                  <Select
                    value={selectedRank}
                    onValueChange={(value: RankCode) => setSelectedRank(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='K'>Hạng K (Mới bắt đầu)</SelectItem>
                      <SelectItem value='K+'>Hạng K+ (Cơ bản cao)</SelectItem>
                      <SelectItem value='I'>Hạng I (Trung cấp)</SelectItem>
                      <SelectItem value='I+'>
                        Hạng I+ (Trung cấp cao)
                      </SelectItem>
                      <SelectItem value='H'>Hạng H (Khá)</SelectItem>
                      <SelectItem value='H+'>Hạng H+ (Khá cao)</SelectItem>
                      <SelectItem value='G'>Hạng G (Giỏi)</SelectItem>
                      <SelectItem value='G+'>Hạng G+ (Giỏi cao)</SelectItem>
                      <SelectItem value='F'>Hạng F (Xuất sắc)</SelectItem>
                      <SelectItem value='F+'>Hạng F+ (Xuất sắc cao)</SelectItem>
                      <SelectItem value='E'>Hạng E (Chuyên nghiệp)</SelectItem>
                      <SelectItem value='E+'>
                        Hạng E+ (Chuyên nghiệp cao)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor='type-select'>Loại giải đấu</Label>
                  <Select
                    value={tournamentType}
                    onValueChange={(value: 'normal' | 'season' | 'open') =>
                      setTournamentType(value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='normal'>Thường (1x điểm)</SelectItem>
                      <SelectItem value='season'>
                        Mùa giải (1.5x điểm)
                      </SelectItem>
                      <SelectItem value='open'>Mở rộng (2x điểm)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor='positions-select'>Số vị trí</Label>
                  <Select
                    value={positionCount.toString()}
                    onValueChange={value =>
                      setPositionCount(parseInt(value) as 3 | 4 | 8 | 16)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='3'>3 vị trí (Giải nhỏ)</SelectItem>
                      <SelectItem value='4'>4 vị trí (Giải vừa)</SelectItem>
                      <SelectItem value='8'>8 vị trí (Giải lớn)</SelectItem>
                      <SelectItem value='16'>
                        16 vị trí (Giải chuyên nghiệp)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor='template-select'>Mẫu phân bổ tiền</Label>
                  <Select
                    value={prizeTemplate}
                    onValueChange={(value: keyof typeof PRIZE_TEMPLATES) =>
                      setPrizeTemplate(value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='50-30-20'>
                        50-30-20% (3 vị trí)
                      </SelectItem>
                      <SelectItem value='40-30-20-10'>
                        40-30-20-10% (4 vị trí)
                      </SelectItem>
                      <SelectItem value='40-25-15-10-5-5'>
                        40-25-15-10-5-5% (6 vị trí)
                      </SelectItem>
                      <SelectItem value='even-distribution'>
                        Phân bổ đều (Nhiều vị trí)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
              <div className='flex items-center gap-2 text-yellow-800 mb-2'>
                <Zap className='w-4 h-4' />
                <span className='font-medium'>Tổng quan phân bổ</span>
              </div>
              <div className='space-y-1 text-sm text-yellow-700'>
                <div>
                  Tổng tiền thưởng: {totalPrizePool.toLocaleString()} VND
                </div>
                <div>
                  Đã phân bổ: {getTotalCashDistributed().toLocaleString()} VND
                </div>
                <div>
                  Còn lại:{' '}
                  {(
                    totalPrizePool - getTotalCashDistributed()
                  ).toLocaleString()}{' '}
                  VND
                </div>
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className='text-lg'>Xem trước kết quả</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-3 max-h-96 overflow-y-auto'>
                  {preview.map(item => (
                    <div
                      key={item.position}
                      className='border rounded-lg p-3 bg-gray-50'
                    >
                      <div className='flex items-center justify-between mb-2'>
                        <div className='flex items-center gap-2'>
                          {getPositionIcon(item.position)}
                          <span className='font-medium'>{item.name}</span>
                        </div>
                        <span className='text-sm text-gray-500'>
                          #{item.position}
                        </span>
                      </div>

                      <div className='grid grid-cols-2 gap-2 text-sm'>
                        <div>
                          <span className='text-gray-600'>ELO:</span>
                          <span className='ml-1 font-medium text-blue-600'>
                            +{item.eloPoints}
                          </span>
                        </div>
                        <div>
                          <span className='text-gray-600'>SPA:</span>
                          <span className='ml-1 font-medium text-green-600'>
                            +{item.spaPoints}
                          </span>
                        </div>
                        <div className='col-span-2'>
                          <span className='text-gray-600'>Tiền thưởng:</span>
                          <span className='ml-1 font-medium text-orange-600'>
                            {item.cashAmount.toLocaleString()} VND
                          </span>
                        </div>
                        {item.items.length > 0 && (
                          <div className='col-span-2'>
                            <span className='text-gray-600'>Vật phẩm:</span>
                            <span className='ml-1 text-purple-600'>
                              {item.items.join(', ')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className='flex justify-between items-center pt-4 border-t'>
          <div className='text-sm text-gray-600'>
            {currentAllocations.length > 0 && (
              <span className='text-amber-600'>
                ⚠️ Thao tác này sẽ thay thế {currentAllocations.length} vị trí
                hiện tại
              </span>
            )}
          </div>
          <div className='flex gap-2'>
            <Button variant='outline' onClick={onClose}>
              Hủy
            </Button>
            <Button
              onClick={handleApply}
              className='bg-blue-600 hover:bg-blue-700'
            >
              <Zap className='w-4 h-4 mr-2' />
              Áp dụng phân bổ
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
