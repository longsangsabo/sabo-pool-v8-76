import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
  Coins,
  Gift,
} from 'lucide-react';

interface WalletOverviewProps {
  balance: number;
  totalEarned: number;
  totalSpent: number;
  pendingAmount: number;
  onDeposit: () => void;
  onWithdraw: () => void;
  onTransfer: () => void;
}

export const WalletOverview: React.FC<WalletOverviewProps> = ({
  balance,
  totalEarned,
  totalSpent,
  pendingAmount,
  onDeposit,
  onWithdraw,
  onTransfer,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  return (
    <div className='space-y-6'>
      {/* Main Balance Card */}
      <Card className='bg-gradient-to-r from-blue-500 to-purple-600 text-white'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Wallet className='h-6 w-6' />
            Số dư hiện tại
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-3xl font-bold mb-2'>
            {formatCurrency(balance)}
          </div>
          {pendingAmount > 0 && (
            <div className='flex items-center gap-2 text-sm opacity-90'>
              <Coins className='h-4 w-4' />
              <span>Đang xử lý: {formatCurrency(pendingAmount)}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Thao tác nhanh</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <Button
              onClick={onDeposit}
              className='h-16 flex flex-col items-center justify-center gap-2 bg-green-500 hover:bg-green-600'
            >
              <Plus className='h-6 w-6' />
              <span>Nạp điểm</span>
            </Button>

            <Button
              onClick={onWithdraw}
              variant='outline'
              className='h-16 flex flex-col items-center justify-center gap-2'
            >
              <Minus className='h-6 w-6' />
              <span>Rút điểm</span>
            </Button>

            <Button
              onClick={onTransfer}
              variant='outline'
              className='h-16 flex flex-col items-center justify-center gap-2'
            >
              <ArrowUpRight className='h-6 w-6' />
              <span>Chuyển điểm</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Thống kê</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='space-y-4'>
              <div className='flex items-center justify-between p-4 bg-green-50 rounded-lg'>
                <div className='flex items-center gap-3'>
                  <div className='p-2 bg-green-100 rounded-full'>
                    <TrendingUp className='h-5 w-5 text-green-600' />
                  </div>
                  <div>
                    <div className='font-medium text-green-800'>
                      Tổng thu nhập
                    </div>
                    <div className='text-sm text-green-600'>
                      Từ trận đấu và thưởng
                    </div>
                  </div>
                </div>
                <div className='text-right'>
                  <div className='text-lg font-bold text-green-800'>
                    {formatCurrency(totalEarned)}
                  </div>
                </div>
              </div>

              <div className='flex items-center justify-between p-4 bg-red-50 rounded-lg'>
                <div className='flex items-center gap-3'>
                  <div className='p-2 bg-red-100 rounded-full'>
                    <TrendingDown className='h-5 w-5 text-red-600' />
                  </div>
                  <div>
                    <div className='font-medium text-red-800'>
                      Tổng chi tiêu
                    </div>
                    <div className='text-sm text-red-600'>
                      Thách đấu và phí dịch vụ
                    </div>
                  </div>
                </div>
                <div className='text-right'>
                  <div className='text-lg font-bold text-red-800'>
                    {formatCurrency(totalSpent)}
                  </div>
                </div>
              </div>
            </div>

            <div className='space-y-4'>
              <div className='flex items-center justify-between p-4 bg-blue-50 rounded-lg'>
                <div className='flex items-center gap-3'>
                  <div className='p-2 bg-blue-100 rounded-full'>
                    <Gift className='h-5 w-5 text-blue-600' />
                  </div>
                  <div>
                    <div className='font-medium text-blue-800'>
                      Thưởng tháng
                    </div>
                    <div className='text-sm text-blue-600'>
                      Thưởng từ hoạt động
                    </div>
                  </div>
                </div>
                <div className='text-right'>
                  <div className='text-lg font-bold text-blue-800'>
                    {formatCurrency(50000)}
                  </div>
                </div>
              </div>

              <div className='flex items-center justify-between p-4 bg-purple-50 rounded-lg'>
                <div className='flex items-center gap-3'>
                  <div className='p-2 bg-purple-100 rounded-full'>
                    <ArrowDownRight className='h-5 w-5 text-purple-600' />
                  </div>
                  <div>
                    <div className='font-medium text-purple-800'>
                      Đang xử lý
                    </div>
                    <div className='text-sm text-purple-600'>
                      Giao dịch chờ xác nhận
                    </div>
                  </div>
                </div>
                <div className='text-right'>
                  <div className='text-lg font-bold text-purple-800'>
                    {formatCurrency(pendingAmount)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Hoạt động gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-3'>
            <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
              <div className='flex items-center gap-3'>
                <div className='p-2 bg-green-100 rounded-full'>
                  <Plus className='h-4 w-4 text-green-600' />
                </div>
                <div>
                  <div className='font-medium'>Thắng trận đấu</div>
                  <div className='text-sm text-gray-600'>
                    vs player2 • 2 giờ trước
                  </div>
                </div>
              </div>
              <div className='text-right'>
                <div className='font-medium text-green-600'>+50,000 VNĐ</div>
              </div>
            </div>

            <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
              <div className='flex items-center gap-3'>
                <div className='p-2 bg-red-100 rounded-full'>
                  <Minus className='h-4 w-4 text-red-600' />
                </div>
                <div>
                  <div className='font-medium'>Thách đấu</div>
                  <div className='text-sm text-gray-600'>
                    vs pool_master • 1 ngày trước
                  </div>
                </div>
              </div>
              <div className='text-right'>
                <div className='font-medium text-red-600'>-100,000 VNĐ</div>
              </div>
            </div>

            <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
              <div className='flex items-center gap-3'>
                <div className='p-2 bg-blue-100 rounded-full'>
                  <ArrowUpRight className='h-4 w-4 text-blue-600' />
                </div>
                <div>
                  <div className='font-medium'>Nạp điểm</div>
                  <div className='text-sm text-gray-600'>
                    Chuyển khoản ngân hàng • 2 ngày trước
                  </div>
                </div>
              </div>
              <div className='text-right'>
                <div className='font-medium text-blue-600'>+500,000 VNĐ</div>
              </div>
            </div>
          </div>

          <Button variant='outline' className='w-full mt-4'>
            Xem tất cả giao dịch
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
