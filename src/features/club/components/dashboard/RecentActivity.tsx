import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/shared/components/ui/avatar';

interface RecentActivityProps {
  clubId: string;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ clubId }) => {
  // TODO: Fetch real activity data
  const activities = [
    {
      id: 1,
      type: 'member_join',
      user: 'Nguyễn Văn A',
      action: 'đã tham gia CLB',
      time: '2 phút trước',
      avatar: null,
    },
    {
      id: 2,
      type: 'table_booking',
      user: 'Trần Thị B',
      action: 'đã đặt bàn số 3',
      time: '5 phút trước',
      avatar: null,
    },
    {
      id: 3,
      type: 'tournament_create',
      user: 'Lê Văn C',
      action: 'đã tạo giải đấu mới',
      time: '10 phút trước',
      avatar: null,
    },
    {
      id: 4,
      type: 'payment',
      user: 'Phạm Thị D',
      action: 'đã thanh toán phí thành viên',
      time: '15 phút trước',
      avatar: null,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hoạt động gần đây</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {activities.map(activity => (
            <div key={activity.id} className='flex items-center space-x-3'>
              <Avatar className='h-8 w-8'>
                <AvatarImage src={activity.avatar || undefined} />
                <AvatarFallback>{activity.user.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className='flex-1 space-y-1'>
                <div className='text-sm'>
                  <span className='font-medium'>{activity.user}</span>{' '}
                  <span className='text-muted-foreground'>
                    {activity.action}
                  </span>
                </div>
                <div className='text-xs text-muted-foreground'>
                  {activity.time}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
