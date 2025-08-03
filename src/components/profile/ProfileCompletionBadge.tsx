import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Target } from 'lucide-react';

interface ProfileCompletionBadgeProps {
  completionPercentage: number;
  showDetails?: boolean;
  className?: string;
}

const ProfileCompletionBadge: React.FC<ProfileCompletionBadgeProps> = ({
  completionPercentage,
  showDetails = false,
  className = '',
}) => {
  const getCompletionLevel = (percentage: number) => {
    if (percentage >= 90)
      return {
        level: 'Complete',
        color: 'bg-green-100 text-green-800',
        icon: CheckCircle,
        message: 'Hồ sơ hoàn thiện!',
      };
    if (percentage >= 70)
      return {
        level: 'Nearly Complete',
        color: 'bg-blue-100 text-blue-800',
        icon: Target,
        message: 'Gần hoàn thiện',
      };
    if (percentage >= 50)
      return {
        level: 'Partial',
        color: 'bg-yellow-100 text-yellow-800',
        icon: Target,
        message: 'Cần bổ sung thêm',
      };
    if (percentage >= 25)
      return {
        level: 'Basic',
        color: 'bg-orange-100 text-orange-800',
        icon: AlertCircle,
        message: 'Thiếu nhiều thông tin',
      };
    return {
      level: 'Incomplete',
      color: 'bg-red-100 text-red-800',
      icon: AlertCircle,
      message: 'Hồ sơ chưa đầy đủ',
    };
  };

  const completion = getCompletionLevel(completionPercentage);
  const IconComponent = completion.icon;

  if (!showDetails) {
    return (
      <Badge className={`${completion.color} ${className}`}>
        <IconComponent className='w-3 h-3 mr-1' />
        {completionPercentage}%
      </Badge>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className='flex items-center justify-between'>
        <span className='text-sm font-medium text-gray-700'>
          Hoàn thiện hồ sơ
        </span>
        <Badge className={completion.color}>
          <IconComponent className='w-3 h-3 mr-1' />
          {completionPercentage}%
        </Badge>
      </div>

      <Progress value={completionPercentage} className='h-2' />

      <p className='text-xs text-gray-500'>{completion.message}</p>

      {completionPercentage < 90 && (
        <div className='text-xs text-gray-600 space-y-1'>
          <p className='font-medium'>Để nâng cao điểm hoàn thiện:</p>
          <ul className='list-disc list-inside space-y-1 text-gray-500'>
            {completionPercentage < 50 && (
              <>
                <li>Thêm ảnh đại diện</li>
                <li>Điền đầy đủ họ tên và số điện thoại</li>
              </>
            )}
            {completionPercentage < 70 && (
              <>
                <li>Viết giới thiệu bản thân</li>
                <li>Cập nhật địa chỉ (thành phố, quận/huyện)</li>
              </>
            )}
            {completionPercentage < 90 && (
              <>
                <li>Đánh giá trình độ kỹ năng</li>
                <li>Xác thực email</li>
              </>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ProfileCompletionBadge;
