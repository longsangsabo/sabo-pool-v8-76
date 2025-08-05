import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Trophy, Medal, Award, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { RankingService } from '@/services/rankingService';
// Inline simple rewards display for button popup
import type { RankCode } from '@/utils/eloConstants';

interface TournamentRewardsButtonProps {
  playerRank?: RankCode;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'secondary';
  className?: string;
}

export const TournamentRewardsButton: React.FC<
  TournamentRewardsButtonProps
> = ({
  playerRank = 'K',
  size = 'sm',
  variant = 'outline',
  className = '',
}) => {
  const [open, setOpen] = useState(false);

  // Get quick preview rewards for champion and top 8
  const championRewards = RankingService.calculateTournamentRewards(
    'CHAMPION',
    playerRank
  );
  const top8Rewards = RankingService.calculateTournamentRewards(
    'TOP_8',
    playerRank
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={`gap-2 ${className}`}>
          <Trophy className='w-4 h-4' />
          Phần thưởng
        </Button>
      </DialogTrigger>

      <DialogContent className='max-w-3xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Trophy className='w-5 h-5 text-yellow-500' />
            Phần thưởng giải đấu - Rank {playerRank}
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-6'>
          {/* Simple Rewards Table */}
          <div className='space-y-4'>
            <div className='grid gap-4'>
              {[
                {
                  position: 1,
                  name: 'Vô địch',
                  eloPoints: championRewards.eloPoints,
                  spaPoints: championRewards.spaPoints,
                  icon: <Trophy className='w-5 h-5 text-yellow-500' />,
                },
                {
                  position: 2,
                  name: 'Á quân',
                  eloPoints: Math.round(championRewards.eloPoints * 0.6),
                  spaPoints: Math.round(championRewards.spaPoints * 0.8),
                  icon: <Medal className='w-5 h-5 text-gray-400' />,
                },
                {
                  position: 3,
                  name: 'Hạng ba',
                  eloPoints: Math.round(championRewards.eloPoints * 0.4),
                  spaPoints: Math.round(championRewards.spaPoints * 0.6),
                  icon: <Award className='w-5 h-5 text-amber-600' />,
                },
                {
                  position: 8,
                  name: 'Top 8',
                  eloPoints: top8Rewards.eloPoints,
                  spaPoints: top8Rewards.spaPoints,
                  icon: <Star className='w-5 h-5 text-blue-500' />,
                },
              ].map(reward => (
                <div key={reward.position} className='border rounded-lg p-4'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-3'>
                      {reward.icon}
                      <span className='font-semibold'>{reward.name}</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Badge
                        variant='secondary'
                        className='bg-blue-50 text-blue-700'
                      >
                        +{reward.eloPoints} ELO
                      </Badge>
                      <Badge
                        variant='secondary'
                        className='bg-yellow-50 text-yellow-700'
                      >
                        +{reward.spaPoints} SPA
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Information Box */}
          <div className='p-4 rounded-lg bg-primary/5 border border-primary/20'>
            <h4 className='font-medium text-primary mb-3 flex items-center gap-2'>
              <Award className='w-4 h-4' />
              Thông tin quan trọng
            </h4>
            <ul className='text-sm text-muted-foreground space-y-2'>
              <li className='flex items-start gap-2'>
                <span className='text-blue-600 font-semibold'>ELO:</span>
                <span>
                  Điểm chính thức, ảnh hưởng trực tiếp đến hạng của bạn
                </span>
              </li>
              <li className='flex items-start gap-2'>
                <span className='text-yellow-600 font-semibold'>SPA:</span>
                <span>
                  Điểm "vui", không ảnh hưởng hạng chính thức nhưng có thể đổi
                  quà
                </span>
              </li>
              <li className='flex items-start gap-2'>
                <span className='text-purple-600 font-semibold'>Rank:</span>
                <span>
                  Điểm SPA phụ thuộc vào hạng hiện tại - hạng cao hơn = SPA
                  nhiều hơn
                </span>
              </li>
              <li className='flex items-start gap-2'>
                <span className='text-green-600 font-semibold'>Vị trí:</span>
                <span>
                  Điểm ELO cố định theo vị trí cuối cùng trong giải đấu
                </span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className='flex justify-end gap-2'>
            <Button variant='outline' onClick={() => setOpen(false)}>
              Đóng
            </Button>
            <Button onClick={() => setOpen(false)}>Hiểu rồi</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TournamentRewardsButton;
