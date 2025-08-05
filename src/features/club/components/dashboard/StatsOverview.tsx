import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Users, DollarSign, Table2, TrendingUp } from 'lucide-react';

interface StatsOverviewProps {
  clubId: string;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ clubId }) => {
  // TODO: Fetch real stats data based on clubId
  const stats = [
    {
      title: 'Tổng thành viên',
      value: '124',
      icon: Users,
      description: '+12% so với tháng trước',
    },
    {
      title: 'Doanh thu tháng',
      value: '45.2M',
      icon: DollarSign,
      description: '+8% so với tháng trước',
    },
    {
      title: 'Bàn đang sử dụng',
      value: '8/12',
      icon: Table2,
      description: 'Tỷ lệ sử dụng 67%',
    },
    {
      title: 'Tăng trưởng',
      value: '+15%',
      icon: TrendingUp,
      description: 'So với quý trước',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thống kê tổng quan</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-2 gap-4'>
          {stats.map((stat, index) => (
            <div key={index} className='space-y-2'>
              <div className='flex items-center space-x-2'>
                <stat.icon className='h-4 w-4 text-muted-foreground' />
                <span className='text-sm font-medium text-muted-foreground'>
                  {stat.title}
                </span>
              </div>
              <div className='text-2xl font-bold'>{stat.value}</div>
              <div className='text-xs text-muted-foreground'>
                {stat.description}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
