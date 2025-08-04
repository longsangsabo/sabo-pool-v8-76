import React from 'react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Trophy, TrendingUp, Target } from 'lucide-react';
import { eloToSaboRank, saboRankToElo } from '@/utils/eloToSaboRank';
import { RANK_ELO } from '@/utils/eloConstants';

interface EloInfoDisplayProps {
  currentElo: number;
  currentRank?: string;
  compact?: boolean;
  arenaMode?: boolean;
}

export const EloInfoDisplay: React.FC<EloInfoDisplayProps> = ({
  currentElo,
  currentRank,
  compact = false,
  arenaMode = false,
}) => {
  const actualRank = currentRank || eloToSaboRank(currentElo);
  const actualElo = currentRank ? saboRankToElo(currentRank) : currentElo;

  // Calculate next rank and progress
  const rankOrder = [
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
  const currentIndex = rankOrder.indexOf(actualRank);
  const nextRank =
    currentIndex < rankOrder.length - 1 ? rankOrder[currentIndex + 1] : null;
  const nextRankElo = nextRank
    ? RANK_ELO[nextRank as keyof typeof RANK_ELO]
    : null;

  const progress = nextRankElo
    ? Math.min(
        100,
        ((actualElo - RANK_ELO[actualRank as keyof typeof RANK_ELO]) /
          (nextRankElo - RANK_ELO[actualRank as keyof typeof RANK_ELO])) *
          100
      )
    : 100;
  const pointsToNext = nextRankElo ? nextRankElo - actualElo : 0;

  if (compact) {
    return (
      <div className='flex items-center gap-2'>
        <Badge variant='outline' className='flex items-center gap-1'>
          <Trophy className='w-3 h-3' />
          {actualRank}
        </Badge>
        <span className='text-sm font-medium'>{actualElo} ELO</span>
        {nextRank && (
          <span className='text-xs text-muted-foreground'>
            +{pointsToNext} → {nextRank}
          </span>
        )}
      </div>
    );
  }

  return (
    <Card
      className={`${arenaMode ? 'bg-slate-800/50 border-cyan-500/30' : ''}`}
    >
      <CardContent className='p-4'>
        <div className='space-y-3'>
          {/* Current Rank & ELO */}
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Trophy
                className={`w-5 h-5 ${arenaMode ? 'text-cyan-400' : 'text-primary'}`}
              />
              <span className='font-semibold'>Hạng hiện tại</span>
            </div>
            <div className='text-right'>
              <div
                className={`text-2xl font-racing-sans-one ${arenaMode ? 'text-cyan-300' : 'text-primary'}`}
              >
                {actualRank}
              </div>
              <div
                className={`text-sm ${arenaMode ? 'text-cyan-400' : 'text-primary'}`}
              >
                {actualElo} ELO
              </div>
            </div>
          </div>

          {/* Progress to Next Rank */}
          {nextRank && (
            <div className='space-y-2'>
              <div className='flex items-center justify-between text-sm'>
                <span
                  className={
                    arenaMode ? 'text-slate-300' : 'text-muted-foreground'
                  }
                >
                  Tiến độ lên {nextRank}
                </span>
                <span
                  className={
                    arenaMode ? 'text-slate-300' : 'text-muted-foreground'
                  }
                >
                  {Math.round(progress)}%
                </span>
              </div>

              <div className='w-full bg-muted rounded-full h-2 overflow-hidden'>
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    arenaMode ? 'bg-cyan-500' : 'bg-primary'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className='flex items-center justify-between text-xs'>
                <span
                  className={
                    arenaMode ? 'text-slate-400' : 'text-muted-foreground'
                  }
                >
                  Cần thêm {pointsToNext} ELO
                </span>
                <div className='flex items-center gap-1'>
                  <Target className='w-3 h-3' />
                  <span>{nextRankElo} ELO</span>
                </div>
              </div>
            </div>
          )}

          {/* System Info */}
          <div
            className={`text-xs ${arenaMode ? 'text-slate-400' : 'text-muted-foreground'} pt-2 border-t border-border/50`}
          >
            <div className='flex items-center gap-1'>
              <TrendingUp className='w-3 h-3' />
              <span>Hệ thống ELO SABO Pool Arena</span>
            </div>
            {currentRank && currentRank !== actualRank && (
              <div className='text-yellow-600 text-xs mt-1'>
                ⚠️ Đã điều chỉnh rank theo ELO: {currentRank} → {actualRank}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
