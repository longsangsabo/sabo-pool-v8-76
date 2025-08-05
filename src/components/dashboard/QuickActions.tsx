import React from 'react';
import { Button } from '@/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { UserPlus, Trophy, Table, Shield, Star, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const QuickActions: React.FC = () => {
  const navigate = useNavigate();

  const actions = [
    {
      icon: Trophy,
      label: 'Tournaments',
      color: 'bg-amber-500 hover:bg-amber-600',
      action: () => navigate('/tournaments'),
    },
    {
      icon: Table,
      label: 'Book a Table',
      color: 'bg-blue-500 hover:bg-blue-600',
      action: () => navigate('/booking'),
    },
    {
      icon: Shield,
      label: 'Challenges',
      color: 'bg-green-500 hover:bg-green-600',
      action: () => navigate('/challenges'),
    },
    {
      icon: Star,
      label: 'Rankings',
      color: 'bg-purple-500 hover:bg-purple-600',
      action: () => navigate('/ranking'),
    },
    {
      icon: Calendar,
      label: 'Schedule',
      color: 'bg-red-500 hover:bg-red-600',
      action: () => navigate('/schedule'),
    },
  ];

  return (
    <Card className='col-span-full md:col-span-1'>
      <CardHeader className='pb-2'>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className='grid grid-cols-2 md:grid-cols-1 gap-2'>
        {actions.map((action, i) => (
          <Button
            key={i}
            variant='ghost'
            className={`w-full justify-start ${action.color} text-white`}
            onClick={action.action}
          >
            <action.icon className='mr-2 h-4 w-4' />
            {action.label}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
};
