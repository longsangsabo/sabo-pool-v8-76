import React from 'react';
import { Check, X, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Membership {
  id: string;
  club_id: string;
  user_id: string;
  joined_at: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface IndividualMembershipTabProps {
  currentMembership: Membership | null;
  onUpgrade: (planType: string, planPrice: number) => void;
}

export const IndividualMembershipTab: React.FC<
  IndividualMembershipTabProps
> = ({ currentMembership, onUpgrade }) => {
  return (
    <div className='space-y-8'>
      {/* Current Plan */}
      {currentMembership && (
        <div className='bg-white rounded-lg shadow-sm border p-6'>
          <h2 className='text-xl font-semibold text-gray-900 mb-4'>
            Gói hiện tại
          </h2>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-4'>
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  currentMembership.status === 'active'
                    ? 'bg-yellow-100'
                    : 'bg-gray-100'
                }`}
              >
                <Crown
                  className={`w-6 h-6 ${
                    currentMembership.status === 'active'
                      ? 'text-yellow-600'
                      : 'text-gray-600'
                  }`}
                />
              </div>
              <div>
                <h3 className='text-lg font-medium text-gray-900'>
                  {currentMembership.status === 'active'
                    ? 'Active Member'
                    : 'Free Member'}
                </h3>
                <p className='text-sm text-gray-600'>
                  {currentMembership.status === 'active'
                    ? `Gia nhập: ${new Date(currentMembership.joined_at).toLocaleDateString('vi-VN')}`
                    : 'Gói miễn phí không giới hạn thời gian'}
                </p>
              </div>
            </div>
            {currentMembership.status === 'active' && (
              <Button onClick={() => onUpgrade('premium', 99000)}>
                Gia hạn
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Pricing Plans */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {/* Free Plan */}
        <div className='bg-white rounded-lg shadow-sm border p-6'>
          <div className='text-center mb-6'>
            <h3 className='text-xl font-semibold text-gray-900'>Free Member</h3>
            <div className='mt-4'>
              <span className='text-3xl font-bold text-gray-900'>0</span>
              <span className='text-gray-600'> VNĐ/tháng</span>
            </div>
          </div>

          <ul className='space-y-3 mb-6'>
            <li className='flex items-center'>
              <Check className='w-4 h-4 text-green-500 mr-3' />
              <span className='text-sm text-gray-600'>Tạo hồ sơ cá nhân</span>
            </li>
            <li className='flex items-center'>
              <Check className='w-4 h-4 text-green-500 mr-3' />
              <span className='text-sm text-gray-600'>Xem bảng xếp hạng</span>
            </li>
            <li className='flex items-center'>
              <Check className='w-4 h-4 text-green-500 mr-3' />
              <span className='text-sm text-gray-600'>Tham gia thách đấu</span>
            </li>
            <li className='flex items-center'>
              <X className='w-4 h-4 text-red-500 mr-3' />
              <span className='text-sm text-gray-400'>Tham gia giải đấu</span>
            </li>
            <li className='flex items-center'>
              <X className='w-4 h-4 text-red-500 mr-3' />
              <span className='text-sm text-gray-400'>Giảm giá giờ chơi</span>
            </li>
          </ul>

          <Button
            variant='outline'
            disabled={currentMembership?.status === 'active'}
            className='w-full'
          >
            {currentMembership?.status === 'active'
              ? 'Đang sử dụng'
              : 'Chọn gói này'}
          </Button>
        </div>

        {/* Premium Plan */}
        <div className='bg-white rounded-lg shadow-sm border-2 border-blue-500 p-6 relative'>
          <div className='absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2'>
            <span className='bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium'>
              Phổ biến nhất
            </span>
          </div>

          <div className='text-center mb-6'>
            <h3 className='text-xl font-semibold text-gray-900'>
              Premium Member
            </h3>
            <div className='mt-4'>
              <span className='text-3xl font-bold text-gray-900'>99,000</span>
              <span className='text-gray-600'> VNĐ/tháng</span>
            </div>
          </div>

          <ul className='space-y-3 mb-6'>
            <li className='flex items-center'>
              <Check className='w-4 h-4 text-green-500 mr-3' />
              <span className='text-sm text-gray-600'>
                Tất cả tính năng Free
              </span>
            </li>
            <li className='flex items-center'>
              <Check className='w-4 h-4 text-green-500 mr-3' />
              <span className='text-sm text-gray-600'>Tham gia giải đấu</span>
            </li>
            <li className='flex items-center'>
              <Check className='w-4 h-4 text-green-500 mr-3' />
              <span className='text-sm text-gray-600'>Giảm 20% giờ chơi</span>
            </li>
            <li className='flex items-center'>
              <Check className='w-4 h-4 text-green-500 mr-3' />
              <span className='text-sm text-gray-600'>Ưu tiên đặt bàn</span>
            </li>
            <li className='flex items-center'>
              <Check className='w-4 h-4 text-green-500 mr-3' />
              <span className='text-sm text-gray-600'>
                Thông báo khuyến mãi
              </span>
            </li>
          </ul>

          <Button
            onClick={() => onUpgrade('premium', 99000)}
            disabled={currentMembership?.status === 'active'}
            className='w-full'
          >
            {currentMembership?.status === 'active'
              ? 'Đang sử dụng'
              : 'Nâng cấp ngay'}
          </Button>
        </div>

        {/* VIP Plan */}
        <div className='bg-white rounded-lg shadow-sm border p-6'>
          <div className='text-center mb-6'>
            <h3 className='text-xl font-semibold text-gray-900'>VIP Member</h3>
            <div className='mt-4'>
              <span className='text-3xl font-bold text-gray-900'>299,000</span>
              <span className='text-gray-600'> VNĐ/tháng</span>
            </div>
          </div>

          <ul className='space-y-3 mb-6'>
            <li className='flex items-center'>
              <Check className='w-4 h-4 text-green-500 mr-3' />
              <span className='text-sm text-gray-600'>
                Tất cả tính năng Premium
              </span>
            </li>
            <li className='flex items-center'>
              <Check className='w-4 h-4 text-green-500 mr-3' />
              <span className='text-sm text-gray-600'>Giảm 30% giờ chơi</span>
            </li>
            <li className='flex items-center'>
              <Check className='w-4 h-4 text-green-500 mr-3' />
              <span className='text-sm text-gray-600'>Huấn luyện cá nhân</span>
            </li>
            <li className='flex items-center'>
              <Check className='w-4 h-4 text-green-500 mr-3' />
              <span className='text-sm text-gray-600'>Tham gia giải VIP</span>
            </li>
            <li className='flex items-center'>
              <Check className='w-4 h-4 text-green-500 mr-3' />
              <span className='text-sm text-gray-600'>Hỗ trợ ưu tiên</span>
            </li>
          </ul>

          <Button
            onClick={() => onUpgrade('vip', 299000)}
            className='w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800'
          >
            Nâng cấp VIP
          </Button>
        </div>
      </div>
    </div>
  );
};
