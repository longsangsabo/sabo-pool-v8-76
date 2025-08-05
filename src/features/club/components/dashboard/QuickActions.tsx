import React from 'react';
import { Button } from '@/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { UserPlus, Users, Trophy, Calendar } from 'lucide-react';

export const QuickActions: React.FC = () => {
  const actions = [
    {
      icon: UserPlus,
      label: 'Thêm thành viên',
      color: 'bg-blue-500 hover:bg-blue-600',
      action: () => {
        // TODO: Implement add member logic
        console.log('Add member');
      },
    },
    {
      icon: Users,
      label: 'Check-in',
      color: 'bg-green-500 hover:bg-green-600',
      action: () => {
        // TODO: Implement check-in logic
        console.log('Check-in');
      },
    },
    {
      icon: Trophy,
      label: 'Tạo giải đấu',
      color: 'bg-purple-500 hover:bg-purple-600',
      action: () => {
        // TODO: Implement tournament creation
        console.log('Create tournament');
      },
    },
    {
      icon: Calendar,
      label: 'Đặt bàn',
      color: 'bg-orange-500 hover:bg-orange-600',
      action: () => {
        // TODO: Implement table booking
        console.log('Book table');
      },
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thao tác nhanh</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          {actions.map((action, index) => (
            <Button
              key={index}
              variant='outline'
              className={`h-20 flex-col space-y-2 ${action.color} text-white border-0`}
              onClick={action.action}
            >
              <action.icon className='h-6 w-6' />
              <span className='text-xs font-medium'>{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
