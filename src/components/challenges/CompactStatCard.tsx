import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface CompactStatCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  color?: string;
  trend?: 'up' | 'down' | 'neutral';
}

const CompactStatCard: React.FC<CompactStatCardProps> = ({
  icon: Icon,
  value,
  label,
  color = 'primary',
  trend = 'neutral',
}) => {
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100';
      case 'warning':
        return 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100';
      default:
        return 'bg-primary/5 border-primary/20 text-primary hover:bg-primary/10';
    }
  };

  const getTrendIndicator = () => {
    if (trend === 'up') return '↗️';
    if (trend === 'down') return '↘️';
    return '';
  };

  return (
    <Card
      className={`transition-all duration-200 hover:scale-105 ${getColorClasses(color)}`}
    >
      <CardContent className='p-4'>
        <div className='flex items-center gap-3'>
          <div className='flex-shrink-0'>
            <Icon className='w-6 h-6' />
          </div>
          <div className='flex-1 min-w-0'>
            <div className='flex items-center gap-1'>
              <div className='text-2xl font-bold truncate'>{value}</div>
              {getTrendIndicator() && (
                <span className='text-sm'>{getTrendIndicator()}</span>
              )}
            </div>
            <div className='text-sm font-medium opacity-80 truncate'>
              {label}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CompactStatCard;
