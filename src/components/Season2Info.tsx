import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { useSeason2 } from '../hooks/useSeason2';
import { useAuth } from '../hooks/useAuth';
import { Trophy, CheckCircle, XCircle, Award } from 'lucide-react';
import { toast } from '../hooks/use-toast';

export const Season2Info: React.FC = () => {
  const {
    season2,
    seasonInfo,
    prizes,
    loading,
    checkSeason2Eligibility,
    registerForSeason2,
  } = useSeason2();
  const { user } = useAuth();
  const [eligibility, setEligibility] = useState<{
    eligible: boolean;
    reason?: string;
    currentRank?: string;
  } | null>(null);
  const [checkingEligibility, setCheckingEligibility] = useState(false);

  useEffect(() => {
    if (user) {
      checkUserEligibility();
    }
  }, [user]);

  const checkUserEligibility = async () => {
    setCheckingEligibility(true);
    const result = await checkSeason2Eligibility();
    setEligibility(result);
    setCheckingEligibility(false);
  };

  const handleRegister = async () => {
    const success = await registerForSeason2();
    if (success) {
      toast({
        title: 'Đăng ký thành công',
        description: 'Bạn đã được đăng ký tham gia Season 2 - 2025!',
      });
      checkUserEligibility();
    }
  };

  // Use season2 data if seasonInfo is not available
  const currentSeasonInfo = seasonInfo || season2;

  if (!currentSeasonInfo) {
    return (
      <Card>
        <CardContent className='p-6'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto'></div>
            <p className='mt-2 text-gray-600'>Đang tải thông tin Season 2...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Season Header */}
      <Card className='bg-gradient-to-r from-blue-600 to-purple-600 text-white'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-2xl'>
            <Trophy className='w-8 h-8' />
            {currentSeasonInfo.season_name}
          </CardTitle>
          <CardDescription className='text-blue-100'>
            Thời gian:{' '}
            {new Date(currentSeasonInfo.start_date).toLocaleDateString('vi-VN')}{' '}
            - {new Date(currentSeasonInfo.end_date).toLocaleDateString('vi-VN')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <div className='text-center'>
              <div className='text-2xl font-bold'>
                {currentSeasonInfo.total_participants || 0}
              </div>
              <div className='text-sm text-blue-100'>Người tham gia</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold'>
                {currentSeasonInfo.total_matches || 0}
              </div>
              <div className='text-sm text-blue-100'>Trận đấu</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold'>
                {(currentSeasonInfo.registration_fee || 0).toLocaleString()}đ
              </div>
              <div className='text-sm text-blue-100'>Phí đăng ký</div>
            </div>
            <div className='text-center'>
              <Badge variant='secondary' className='text-blue-600'>
                {currentSeasonInfo.status === 'active'
                  ? 'Đang diễn ra'
                  : 'Đã kết thúc'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Eligibility Check */}
      {user && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <CheckCircle className='w-5 h-5' />
              Kiểm tra điều kiện tham gia
            </CardTitle>
          </CardHeader>
          <CardContent>
            {checkingEligibility ? (
              <div className='flex items-center gap-2'>
                <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600'></div>
                <span>Đang kiểm tra...</span>
              </div>
            ) : eligibility ? (
              <div className='space-y-3'>
                <div className='flex items-center gap-2'>
                  {eligibility.eligible ? (
                    <CheckCircle className='w-5 h-5 text-green-600' />
                  ) : (
                    <XCircle className='w-5 h-5 text-red-600' />
                  )}
                  <span
                    className={
                      eligibility.eligible ? 'text-green-600' : 'text-red-600'
                    }
                  >
                    {eligibility.eligible
                      ? 'Đủ điều kiện tham gia'
                      : 'Chưa đủ điều kiện'}
                  </span>
                </div>

                {eligibility.currentRank && (
                  <div className='text-sm text-gray-600'>
                    Hạng hiện tại:{' '}
                    <Badge variant='outline'>{eligibility.currentRank}</Badge>
                  </div>
                )}

                {eligibility.reason && (
                  <div className='text-sm text-red-600 bg-red-50 p-3 rounded-lg'>
                    {eligibility.reason}
                  </div>
                )}

                {eligibility.eligible && (
                  <Button onClick={handleRegister} disabled={loading}>
                    {loading ? 'Đang đăng ký...' : 'Đăng ký tham gia'}
                  </Button>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Tournament Rules */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Award className='w-5 h-5' />
            Thể lệ thi đấu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <h4 className='font-medium mb-2'>Đối tượng tham gia:</h4>
                <ul className='text-sm text-gray-600 space-y-1'>
                  <li>• Các VĐV Hạng G, H, I, K</li>
                  <li>• Đã đăng ký Member SABO (99K/tháng)</li>
                </ul>
              </div>
              <div>
                <h4 className='font-medium mb-2'>Thể loại:</h4>
                <div className='flex gap-2'>
                  <Badge>8 Ball</Badge>
                  <Badge>9 Ball</Badge>
                  <Badge>Song Tô</Badge>
                </div>
              </div>
            </div>

            <div>
              <h4 className='font-medium mb-2'>Số lượng người tham gia:</h4>
              <p className='text-sm text-gray-600'>Không giới hạn</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prize Structure */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Trophy className='w-5 h-5' />
            Cơ cấu giải thưởng
          </CardTitle>
          <CardDescription>
            Tổng giá trị giải thưởng:{' '}
            {prizes
              .reduce((sum, prize) => sum + prize.prize_value, 0)
              .toLocaleString()}
            đ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-3'>
            {prizes.map(prize => (
              <div
                key={prize.id}
                className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'
              >
                <div className='flex items-center gap-3'>
                  <div className='w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm'>
                    {prize.rank_min}
                  </div>
                  <div>
                    <div className='font-medium'>
                      Top {prize.rank_min}
                      {prize.rank_max !== prize.rank_min
                        ? ` - ${prize.rank_max}`
                        : ''}
                    </div>
                    <div className='text-sm text-gray-600'>
                      {prize.prize_description}
                    </div>
                  </div>
                </div>
                <div className='text-right'>
                  <div className='font-bold text-green-600'>
                    {prize.prize_value.toLocaleString()}đ
                  </div>
                  {prize.voucher_amount > 0 && (
                    <div className='text-sm text-blue-600'>
                      + {prize.voucher_amount.toLocaleString()}đ voucher
                    </div>
                  )}
                  {prize.member_months > 0 && (
                    <div className='text-sm text-purple-600'>
                      + {prize.member_months} tháng Member
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Important Notes */}
      <Card className='border-orange-200 bg-orange-50'>
        <CardHeader>
          <CardTitle className='text-orange-800'>Lưu ý quan trọng</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className='text-sm text-orange-700 space-y-2'>
            <li>• Chỉ các VĐV đã đăng ký Member SABO mới được tham gia</li>
            <li>• Phí đăng ký Member: 99.000đ/tháng</li>
            <li>• Giải thưởng sẽ được trao sau khi kết thúc mùa giải</li>
            <li>• Mọi tranh chấp sẽ được giải quyết bởi ban tổ chức</li>
            <li>• Ban tổ chức có quyền thay đổi thể lệ nếu cần thiết</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
