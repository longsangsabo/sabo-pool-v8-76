import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Calendar, Users, Settings, Trophy, Target } from 'lucide-react';
import { Link } from 'react-router-dom';

interface QuickActionsProps {
  dashboardType: 'admin' | 'club' | 'player' | 'guest';
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  dashboardType,
}) => {
  const getActions = () => {
    switch (dashboardType) {
      case 'admin':
        return [
          {
            label: 'Tạo giải đấu',
            icon: Trophy,
            href: '/admin/tournaments/create',
            variant: 'default' as const,
          },
          {
            label: 'Quản lý người dùng',
            icon: Users,
            href: '/admin/users',
            variant: 'outline' as const,
          },
          {
            label: 'Cài đặt hệ thống',
            icon: Settings,
            href: '/admin/settings',
            variant: 'outline' as const,
          },
        ];
      case 'club':
        return [
          {
            label: 'Tạo sự kiện',
            icon: Plus,
            href: '/club/events/create',
            variant: 'default' as const,
          },
          {
            label: 'Lịch thi đấu',
            icon: Calendar,
            href: '/club/schedule',
            variant: 'outline' as const,
          },
          {
            label: 'Quản lý thành viên',
            icon: Users,
            href: '/club/members',
            variant: 'outline' as const,
          },
        ];
      case 'player':
        return [
          {
            label: 'Tạo thách đấu',
            icon: Target,
            href: '/challenges/create',
            variant: 'default' as const,
          },
          {
            label: 'Tham gia giải đấu',
            icon: Trophy,
            href: '/tournaments',
            variant: 'outline' as const,
          },
          {
            label: 'Đặt bàn',
            icon: Calendar,
            href: '/booking',
            variant: 'outline' as const,
          },
        ];
      case 'guest':
        return [
          {
            label: 'Đăng ký tài khoản',
            icon: Plus,
            href: '/register',
            variant: 'default' as const,
          },
          {
            label: 'Xem giải đấu',
            icon: Trophy,
            href: '/tournaments',
            variant: 'outline' as const,
          },
          {
            label: 'Tìm hiểu CLB',
            icon: Users,
            href: '/simple-club',
            variant: 'outline' as const,
          },
        ];
    }
  };

  const actions = getActions();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hành động nhanh</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
          {actions.map(action => {
            const Icon = action.icon;
            return (
              <Link key={action.href} to={action.href}>
                <Button
                  variant={action.variant}
                  className='w-full justify-start gap-2'
                >
                  <Icon className='h-4 w-4' />
                  {action.label}
                </Button>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
