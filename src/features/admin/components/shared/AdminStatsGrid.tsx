import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: number | string;
  icon?: LucideIcon;
  iconColor?: string;
  bgColor?: string;
  borderColor?: string;
  textColor?: string;
  description?: string;
}

interface AdminStatsGridProps {
  stats: StatCardProps[];
  className?: string;
}

export function AdminStatsGrid({ stats, className = '' }: AdminStatsGridProps) {
  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}
    >
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  iconColor = 'text-blue-500',
  bgColor = 'bg-white',
  borderColor = 'border-gray-200',
  textColor = 'text-gray-900',
  description,
}: StatCardProps) {
  return (
    <div
      className={`${bgColor} p-4 rounded-lg border ${borderColor} shadow-sm`}
    >
      <div className='flex items-center justify-between'>
        <div className='flex-1'>
          <p className='text-sm font-medium text-gray-600'>{title}</p>
          <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
          {description && (
            <p className='text-xs text-gray-500 mt-1'>{description}</p>
          )}
        </div>
        {Icon && (
          <div className='ml-4'>
            <Icon className={`h-8 w-8 ${iconColor}`} />
          </div>
        )}
      </div>
    </div>
  );
}

// Predefined stat configurations for common use cases
export const statConfigs = {
  club: {
    total: { title: 'Tổng CLB', iconColor: 'text-blue-500' },
    pending: {
      title: 'Chờ duyệt',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-700',
      iconColor: 'text-yellow-500',
    },
    active: {
      title: 'Đã duyệt',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-700',
      iconColor: 'text-green-500',
    },
    rejected: {
      title: 'Bị từ chối',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-700',
      iconColor: 'text-red-500',
    },
  },
  user: {
    total: { title: 'Tổng users', iconColor: 'text-purple-500' },
    active: {
      title: 'Hoạt động',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-700',
      iconColor: 'text-green-500',
    },
    inactive: {
      title: 'Không hoạt động',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      textColor: 'text-gray-700',
      iconColor: 'text-gray-500',
    },
    banned: {
      title: 'Bị cấm',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-700',
      iconColor: 'text-red-500',
    },
  },
  tournament: {
    total: { title: 'Tổng giải đấu', iconColor: 'text-orange-500' },
    ongoing: {
      title: 'Đang diễn ra',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-700',
      iconColor: 'text-blue-500',
    },
    completed: {
      title: 'Hoàn thành',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-700',
      iconColor: 'text-green-500',
    },
    upcoming: {
      title: 'Sắp diễn ra',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-700',
      iconColor: 'text-yellow-500',
    },
  },
};
