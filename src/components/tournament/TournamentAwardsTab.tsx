import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Star, Award, Gift } from 'lucide-react';
import { formatCurrency } from '@/utils/prizeUtils';

interface AwardDetail {
  position: number;
  positionName: string;
  cashPrize: number;
  spaPoints: number;
  eloPoints: number;
  physicalPrizes: string[];
}

interface TournamentAwardsTabProps {
  tournament: any;
}

export const TournamentAwardsTab: React.FC<TournamentAwardsTabProps> = ({
  tournament,
}) => {
  const getPositionName = (position: number): string => {
    switch (position) {
      case 1:
        return 'Vô địch';
      case 2:
        return 'Á quân';
      case 3:
        return 'Hạng 3';
      case 4:
        return 'Hạng 4';
      default:
        return `Hạng ${position}`;
    }
  };

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className='h-5 w-5 text-yellow-500' />;
      case 2:
        return <Star className='h-5 w-5 text-gray-400' />;
      case 3:
        return <Award className='h-5 w-5 text-amber-600' />;
      default:
        return <Gift className='h-5 w-5 text-blue-500' />;
    }
  };

  const getAwardDetails = (): AwardDetail[] => {
    const awards: AwardDetail[] = [];

    // Parse prize distribution
    const prizeDistribution = tournament.prize_distribution || {};
    const spaConfig = tournament.spa_points_config || {};
    const eloConfig = tournament.elo_points_config || {};
    const physicalPrizes = tournament.physical_prizes || [];

    // Check if tournament has any prize configuration
    const hasPrizeData =
      Object.keys(prizeDistribution).length > 0 ||
      Object.keys(spaConfig).length > 0 ||
      Object.keys(eloConfig).length > 0 ||
      (Array.isArray(physicalPrizes) && physicalPrizes.length > 0);

    // Show at least top 4 positions with default values if no specific config
    const positionsToShow = hasPrizeData ? 16 : 4;

    for (let position = 1; position <= positionsToShow; position++) {
      // Get cash prize
      let cashPrize = 0;
      if (prizeDistribution[position.toString()]) {
        cashPrize = Number(prizeDistribution[position.toString()]) || 0;
      } else if (position > 8 && prizeDistribution['participation']) {
        cashPrize = Number(prizeDistribution['participation']) || 0;
      }

      // Get SPA points - provide defaults if no config
      let spaPoints = 0;
      if (Object.keys(spaConfig).length > 0) {
        if (position === 1) spaPoints = spaConfig.winner || 100;
        else if (position === 2) spaPoints = spaConfig.runner_up || 80;
        else if (position === 3) spaPoints = spaConfig.third_place || 60;
        else if (position <= 8) spaPoints = spaConfig.top_8 || 40;
        else spaPoints = spaConfig.participation || 20;
      } else {
        // Default SPA points
        if (position === 1) spaPoints = 100;
        else if (position === 2) spaPoints = 80;
        else if (position === 3) spaPoints = 60;
        else if (position === 4) spaPoints = 40;
      }

      // Get ELO points - provide defaults if no config
      let eloPoints = 0;
      const kFactor = eloConfig.k_factor || 32;
      const multiplier = eloConfig.tournament_multiplier || 1.5;

      if (Object.keys(eloConfig).length > 0 || !hasPrizeData) {
        if (position === 1) eloPoints = Math.round(kFactor * multiplier);
        else if (position === 2)
          eloPoints = Math.round(kFactor * multiplier * 0.8);
        else if (position === 3)
          eloPoints = Math.round(kFactor * multiplier * 0.6);
        else if (position <= 8)
          eloPoints = Math.round(kFactor * multiplier * 0.4);
        else eloPoints = Math.round(kFactor * multiplier * 0.2);
      }

      // Get physical prizes
      const physicalPrize = physicalPrizes.find(
        (p: any) => p.position === position
      );
      const physicalItems = physicalPrize?.items || [];

      awards.push({
        position,
        positionName: getPositionName(position),
        cashPrize,
        spaPoints,
        eloPoints,
        physicalPrizes: physicalItems,
      });
    }

    // Only filter if we have actual prize data, otherwise show defaults
    if (hasPrizeData) {
      return awards.filter(
        award =>
          award.cashPrize > 0 ||
          award.spaPoints > 0 ||
          award.eloPoints > 0 ||
          award.physicalPrizes.length > 0
      );
    }

    // Return top 4 with default SPA/ELO points if no prize data
    return awards.slice(0, 4);
  };

  const awards = getAwardDetails();

  return (
    <div className='space-y-6'>
      <div className='text-center'>
        <h3 className='text-lg font-semibold text-gray-900 mb-2'>
          Cơ cấu giải thưởng
        </h3>
        <p className='text-sm text-gray-600'>
          Chi tiết phần thưởng cho các vị trí trong giải đấu
        </p>
      </div>

      <div className='grid gap-4'>
        {awards.map(award => (
          <Card key={award.position} className='border-l-4 border-l-blue-500'>
            <CardHeader className='pb-3'>
              <CardTitle className='flex items-center gap-2 text-base'>
                {getPositionIcon(award.position)}
                <span>{award.positionName}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className='pt-0'>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                {/* Cash Prize */}
                {award.cashPrize > 0 && (
                  <div className='flex items-center gap-2'>
                    <div className='w-8 h-8 bg-green-100 rounded-full flex items-center justify-center'>
                      <span className='text-green-600 text-sm font-semibold'>
                        ₫
                      </span>
                    </div>
                    <div>
                      <div className='text-sm text-gray-500'>Tiền thưởng</div>
                      <div className='font-semibold text-green-600'>
                        {formatCurrency(award.cashPrize)}
                      </div>
                    </div>
                  </div>
                )}

                {/* SPA Points */}
                {award.spaPoints > 0 && (
                  <div className='flex items-center gap-2'>
                    <div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center'>
                      <span className='text-blue-600 text-xs font-semibold'>
                        SPA
                      </span>
                    </div>
                    <div>
                      <div className='text-sm text-gray-500'>Điểm SPA</div>
                      <div className='font-semibold text-blue-600'>
                        +{award.spaPoints}
                      </div>
                    </div>
                  </div>
                )}

                {/* ELO Points */}
                {award.eloPoints > 0 && (
                  <div className='flex items-center gap-2'>
                    <div className='w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center'>
                      <span className='text-purple-600 text-xs font-semibold'>
                        ELO
                      </span>
                    </div>
                    <div>
                      <div className='text-sm text-gray-500'>Điểm ELO</div>
                      <div className='font-semibold text-purple-600'>
                        +{award.eloPoints}
                      </div>
                    </div>
                  </div>
                )}

                {/* Physical Prizes */}
                {award.physicalPrizes.length > 0 && (
                  <div className='flex items-center gap-2'>
                    <div className='w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center'>
                      <Gift className='h-4 w-4 text-orange-600' />
                    </div>
                    <div>
                      <div className='text-sm text-gray-500'>Hiện vật</div>
                      <div className='text-sm font-medium text-orange-600'>
                        {award.physicalPrizes.join(', ')}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {awards.length === 0 && (
        <div className='text-center py-8'>
          <Gift className='h-12 w-12 text-gray-400 mx-auto mb-4' />
          <p className='text-gray-500'>Chưa có thông tin giải thưởng</p>
        </div>
      )}
    </div>
  );
};
