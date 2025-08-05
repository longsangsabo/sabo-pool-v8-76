import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Medal, Award, Star, Users, Gift, Edit } from 'lucide-react';
import { TournamentRewards as TournamentRewardsType } from '@/types/tournament-extended';
import type { RankCode } from '@/utils/eloConstants';

interface TournamentRewardsProps {
  rewards?: TournamentRewardsType;
  tournamentId?: string;
  rank?: RankCode;
  showElo?: boolean;
  showSpa?: boolean;
  className?: string;
  onEdit?: () => void;
  isEditable?: boolean;
}

const PositionIcon = ({ position }: { position: number }) => {
  const iconMap: Record<number, React.ReactNode> = {
    1: <Trophy className='w-5 h-5 text-yellow-500' />,
    2: <Medal className='w-5 h-5 text-gray-400' />,
    3: <Award className='w-5 h-5 text-amber-600' />,
    4: <Star className='w-5 h-5 text-blue-500' />,
    8: <Users className='w-5 h-5 text-green-500' />,
    16: <Users className='w-5 h-5 text-purple-500' />,
  };

  return iconMap[position] || <Gift className='w-5 h-5 text-gray-500' />;
};

const RewardRow = ({
  position,
  positionName,
  eloReward,
  spaReward,
  cashPrize,
  items,
  showElo,
  showSpa,
  showCash,
}: {
  position: number;
  positionName: string;
  eloReward: number;
  spaReward: number;
  cashPrize?: number;
  items?: string[];
  showElo: boolean;
  showSpa: boolean;
  showCash: boolean;
}) => {
  return (
    <div className='grid grid-cols-4 gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm'>
      {/* Position */}
      <div className='flex items-center gap-2'>
        <PositionIcon position={position} />
        <span className='font-medium'>{positionName}</span>
      </div>

      {/* Points */}
      <div className='flex flex-wrap gap-1'>
        {showElo && (
          <Badge
            variant='secondary'
            className='bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-xs'
          >
            +{eloReward} ELO
          </Badge>
        )}
        {showSpa && (
          <Badge
            variant='secondary'
            className='bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300 text-xs'
          >
            +{spaReward.toLocaleString()} SPA
          </Badge>
        )}
      </div>

      {/* Cash Prize */}
      <div className='font-medium'>
        {showCash && cashPrize ? (
          <span className='text-green-600'>
            {cashPrize.toLocaleString('vi-VN')}₫
          </span>
        ) : (
          <span className='text-muted-foreground'>-</span>
        )}
      </div>

      {/* Physical Items */}
      <div className='text-xs text-muted-foreground'>
        {items && items.length > 0 ? items.join(', ') : '-'}
      </div>
    </div>
  );
};

export const TournamentRewards: React.FC<TournamentRewardsProps> = ({
  rewards,
  tournamentId,
  rank,
  showElo = true,
  showSpa = true,
  className = '',
  onEdit,
  isEditable = false,
}) => {
  // Fallback to legacy format if no rewards provided
  if (!rewards) {
    return (
      <div className={`${className} text-center py-8`}>
        <Trophy className='w-12 h-12 text-muted-foreground mx-auto mb-4' />
        <p className='text-muted-foreground'>Chưa có thông tin phần thưởng</p>
      </div>
    );
  }

  const hasCashPrizes =
    rewards?.showPrizes && rewards.positions?.some(p => p.cashPrize > 0);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Rewards Table */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 justify-between'>
            <div className='flex items-center gap-2'>
              <Trophy className='w-5 h-5 text-yellow-500' />
              Phần thưởng giải đấu{rank && ` - Hạng ${rank}`}
            </div>
            {isEditable && onEdit && (
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={onEdit}
              >
                <Edit className='w-4 h-4 mr-1' />
                Chỉnh sửa
              </Button>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className='space-y-3'>
          {/* Table Header */}
          <div className='grid grid-cols-4 gap-3 p-2 bg-muted rounded-lg text-sm font-medium text-muted-foreground'>
            <div>Vị trí</div>
            <div>Điểm</div>
            <div>Tiền thưởng</div>
            <div>Hiện vật</div>
          </div>

          {/* Position Rewards */}
          {rewards.positions && rewards.positions.length > 0 ? (
            rewards.positions
              .filter(p => p.isVisible)
              .map(position => (
                <RewardRow
                  key={position.position}
                  position={position.position}
                  positionName={position.name}
                  eloReward={position.eloPoints}
                  spaReward={position.spaPoints}
                  cashPrize={position.cashPrize}
                  items={position.items}
                  showElo={showElo}
                  showSpa={showSpa}
                  showCash={rewards.showPrizes}
                />
              ))
          ) : (
            <div className='text-center py-4 text-muted-foreground'>
              Chưa có thông tin phần thưởng
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TournamentRewards;
