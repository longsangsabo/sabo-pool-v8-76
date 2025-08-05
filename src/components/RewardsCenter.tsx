import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRewards } from '@/hooks/useRewards';
import { useCheckIn } from '@/hooks/useCheckIn';
import { Gift, Clock } from 'lucide-react';

const RewardsCenter = () => {
  const { availableRewards, redemptions, redeemReward, isRedeeming } =
    useRewards();
  const { userStreak } = useCheckIn();

  const userPoints = userStreak?.total_points || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Gift className='w-5 h-5' />
          Đổi phần thưởng
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Available Rewards */}
        <div className='space-y-3'>
          {availableRewards.map((reward, index) => {
            const canAfford = userPoints >= reward.points_cost;
            const alreadyRedeemed = redemptions.some(
              r => r.reward_type === reward.type && r.status === 'active'
            );

            return (
              <div
                key={index}
                className={`p-3 border rounded-lg transition-colors ${
                  canAfford
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <span className='text-2xl'>{reward.icon}</span>
                    <div>
                      <h4 className='font-medium text-sm'>{reward.name}</h4>
                      <p className='text-xs text-gray-500'>
                        {reward.description}
                      </p>
                      <div className='flex items-center gap-2 mt-1'>
                        <Badge variant='outline' className='text-xs'>
                          {reward.points_cost} điểm
                        </Badge>
                        {alreadyRedeemed && (
                          <Badge variant='secondary' className='text-xs'>
                            Đã sở hữu
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    size='sm'
                    disabled={!canAfford || alreadyRedeemed || isRedeeming}
                    onClick={() =>
                      redeemReward(
                        reward.type,
                        reward.title,
                        reward.points_cost
                      )
                    }
                    className='shrink-0'
                  >
                    {alreadyRedeemed ? 'Đã có' : 'Đổi'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent Redemptions */}
        {redemptions.length > 0 && (
          <div className='mt-6'>
            <h4 className='font-medium text-sm mb-3 flex items-center gap-2'>
              <Clock className='w-4 h-4' />
              Phần thưởng đã đổi
            </h4>
            <div className='space-y-2 max-h-32 overflow-y-auto'>
              {redemptions.slice(0, 3).map(redemption => {
                const reward = availableRewards.find(
                  r => r.type === redemption.reward_type
                );
                return (
                  <div
                    key={redemption.id}
                    className='flex items-center gap-2 text-xs'
                  >
                    <span>{reward?.icon || '🎁'}</span>
                    <span className='flex-1'>
                      {reward?.name || redemption.reward_type}
                    </span>
                    <span className='text-gray-500'>
                      -{redemption.points_cost} điểm
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className='text-xs text-gray-500 bg-gray-50 p-3 rounded-lg'>
          <p>
            Kiếm điểm bằng cách check-in hàng ngày. Streak dài hơn = nhiều điểm
            hơn!
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default RewardsCenter;
