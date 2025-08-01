import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TournamentSPAPreviewProps {
  playerRank: string;
  tournamentType?: string;
  className?: string;
}

export function TournamentSPAPreview({
  playerRank,
  tournamentType = 'normal',
  className,
}: TournamentSPAPreviewProps) {
  const { data: spaPoints, isLoading } = useQuery({
    queryKey: ['tournament-spa-preview', playerRank, tournamentType],
    queryFn: async () => {
      const positions = [1, 2, 3, 4, 8, 16]; // Top positions to show
      const results = [];

      for (const position of positions) {
        // Simple SPA calculation without RPC
        let baseSPA = 0;
        switch (position) {
          case 1:
            baseSPA = 100;
            break;
          case 2:
            baseSPA = 80;
            break;
          case 3:
            baseSPA = 60;
            break;
          case 4:
            baseSPA = 40;
            break;
          case 8:
            baseSPA = 20;
            break;
          case 16:
            baseSPA = 10;
            break;
          default:
            baseSPA = 5;
        }

        // Tournament type multiplier
        let multiplier = 1.0;
        if (tournamentType === 'season') multiplier = 1.5;
        else if (tournamentType === 'open') multiplier = 2.0;

        results.push({
          position,
          spa: Math.round(baseSPA * multiplier),
        });
      }

      return results;
    },
  });

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className='h-4 w-4 text-yellow-500' />;
      case 2:
        return <Medal className='h-4 w-4 text-gray-400' />;
      case 3:
        return <Award className='h-4 w-4 text-amber-600' />;
      default:
        return <Star className='h-4 w-4 text-muted-foreground' />;
    }
  };

  const getPositionText = (position: number) => {
    if (position === 1) return 'Vô địch';
    if (position === 2) return 'Á quân';
    if (position === 3) return 'Hạng 3';
    if (position === 4) return 'Hạng 4';
    if (position === 8) return 'Top 8';
    return `Top ${position}`;
  };

  const multiplierText =
    tournamentType === 'season'
      ? ' (x1.5)'
      : tournamentType === 'open'
        ? ' (x2.0)'
        : '';

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className='text-sm'>Điểm SPA dự kiến</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='animate-pulse space-y-2'>
            <div className='h-4 bg-muted rounded w-full'></div>
            <div className='h-4 bg-muted rounded w-3/4'></div>
            <div className='h-4 bg-muted rounded w-1/2'></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className='text-sm flex items-center gap-2'>
          <Trophy className='h-4 w-4' />
          Điểm SPA dự kiến (Rank {playerRank}){multiplierText}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-2'>
          {spaPoints?.map(({ position, spa }) => (
            <div key={position} className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                {getPositionIcon(position)}
                <span className='text-sm'>{getPositionText(position)}</span>
              </div>
              <Badge
                variant={position <= 3 ? 'default' : 'secondary'}
                className={
                  position === 1
                    ? 'bg-gradient-to-r from-yellow-400 to-yellow-600'
                    : ''
                }
              >
                +{spa} SPA
              </Badge>
            </div>
          ))}

          {spaPoints && spaPoints.length > 0 && (
            <div className='pt-2 border-t text-xs text-muted-foreground'>
              <p>
                * Tham gia: +{spaPoints[spaPoints.length - 1]?.spa || 100} SPA
              </p>
              {tournamentType !== 'normal' && (
                <p>
                  * Đã áp dụng hệ số x
                  {tournamentType === 'season' ? '1.5' : '2.0'}
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default TournamentSPAPreview;
