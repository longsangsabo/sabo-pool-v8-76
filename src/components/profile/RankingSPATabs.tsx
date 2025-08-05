import React from 'react';
import { Trophy, Star, TrendingUp } from 'lucide-react';
import { RankEloCard } from '@/components/ranking/RankEloCard';
import { SPAPointsCard } from '@/components/ranking/SPAPointsCard';
import { RankProgressBar } from '@/components/ranking/RankProgressBar';
import { type RankCode } from '@/utils/rankUtils';
import { isEligibleForPromotion } from '@/utils/rankUtils';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface PlayerData {
  rank: RankCode;
  elo_points: number;
  spa_points: number;
  total_matches: number;
  last_promotion_date?: Date | null;
  weekly_spa_rank?: number;
  monthly_spa_rank?: number;
}

interface RankingSPAProps {
  playerData: PlayerData;
  eloHistory?: any[];
  spaMilestones?: any[];
}

export const RankingSPATabs: React.FC<RankingSPAProps> = ({
  playerData,
  eloHistory = [],
  spaMilestones = [],
}) => {
  const navigate = useNavigate();
  const isEligiblePromotion = isEligibleForPromotion(
    playerData.elo_points,
    playerData.rank
  );

  return (
    <div className='w-full space-y-6'>
      {/* Header with combined title */}
      <div className='flex items-center gap-3 pb-4 border-b'>
        <div className='flex items-center gap-2'>
          <Trophy className='w-5 h-5 text-yellow-600' />
          <span className='text-lg font-semibold'>Rank & ELO</span>
          {isEligiblePromotion && (
            <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse' />
          )}
        </div>
        <div className='text-muted-foreground'>•</div>
        <div className='flex items-center gap-2'>
          <Star className='w-5 h-5 text-yellow-500' />
          <span className='text-lg font-semibold'>SPA Points</span>
        </div>
      </div>

      {/* Combined layout: ELO + SPA */}
      <div className='grid lg:grid-cols-4 gap-6'>
        {/* Rank & ELO Section - 2 columns */}
        <div className='lg:col-span-2 space-y-6'>
          <RankEloCard
            rank={playerData.rank}
            elo={playerData.elo_points}
            matchCount={playerData.total_matches}
            isEligibleForPromotion={isEligiblePromotion}
          />

          <RankProgressBar
            current={{
              code: playerData.rank,
              name: playerData.rank,
              level: playerData.elo_points,
            }}
            progress={0}
            pointsToNext={0}
            pointsNeeded={0}
          />
        </div>

        {/* SPA Points Section - 1 column */}
        <div className='lg:col-span-1'>
          <SPAPointsCard
            points={playerData.spa_points}
            milestones={spaMilestones}
            weeklyRank={playerData.weekly_spa_rank}
            monthlyRank={playerData.monthly_spa_rank}
          />
        </div>

        {/* Side Panel - 1 column */}
        <div className='lg:col-span-1 space-y-6'>
          {/* Rank Registration */}
          <div className='bg-card p-4 rounded-lg border'>
            <div className='space-y-3'>
              <h4 className='font-medium text-foreground text-sm'>
                Xác minh hạng chính thức
              </h4>
              <p className='text-xs text-muted-foreground leading-relaxed'>
                Đăng ký xác minh hạng tại câu lạc bộ để có rank chính thức trong
                hệ thống
              </p>
              <Button
                onClick={() => navigate('/ranking?tab=register')}
                size='sm'
                className='w-full flex items-center gap-2'
              >
                <Trophy className='h-3 w-3' />
                Đăng ký Rank
              </Button>
            </div>
          </div>

          {/* ELO History Preview */}
          <div className='bg-card p-4 rounded-lg border'>
            <h4 className='font-medium text-foreground text-sm mb-3 flex items-center gap-2'>
              <TrendingUp className='w-4 h-4' />
              Lịch sử ELO
            </h4>
            <div className='h-32 flex items-center justify-center text-muted-foreground'>
              <p className='text-xs text-center'>
                Biểu đồ ELO sẽ được hiển thị ở đây
              </p>
            </div>
          </div>

          {/* SPA Ranking Info */}
          <div className='bg-card p-4 rounded-lg border'>
            <h4 className='font-medium text-foreground text-sm mb-3 flex items-center gap-2'>
              <Star className='w-4 h-4 text-yellow-500' />
              Bảng xếp hạng SPA
            </h4>
            <div className='space-y-2'>
              {playerData.weekly_spa_rank && (
                <div className='flex justify-between items-center p-2 bg-blue-50 rounded'>
                  <span className='text-xs font-medium'>Tuần này</span>
                  <span className='text-sm font-bold text-blue-600'>
                    #{playerData.weekly_spa_rank}
                  </span>
                </div>
              )}
              {playerData.monthly_spa_rank && (
                <div className='flex justify-between items-center p-2 bg-green-50 rounded'>
                  <span className='text-xs font-medium'>Tháng này</span>
                  <span className='text-sm font-bold text-green-600'>
                    #{playerData.monthly_spa_rank}
                  </span>
                </div>
              )}
              <div className='text-center py-3 text-muted-foreground'>
                <p className='text-xs'>
                  Xem bảng xếp hạng đầy đủ tại trang Leaderboard
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
