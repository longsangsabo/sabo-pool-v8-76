import React from 'react';
import { useOptimizedResponsive } from '@/hooks/useOptimizedResponsive';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Settings, Trophy, Users, Shield, Building } from 'lucide-react';

interface ArenaQuickActionsProps {
  profile: any;
  onNavigateToClubTab?: () => void;
  onNavigateToRankTab?: () => void;
  className?: string;
}

export const ArenaQuickActions: React.FC<ArenaQuickActionsProps> = ({
  profile,
  onNavigateToClubTab,
  onNavigateToRankTab,
  className = '',
}) => {
  const { isMobile } = useOptimizedResponsive();
  const navigate = useNavigate();

  const actions = [
    {
      title: 'Chỉnh sửa',
      description: 'Cập nhật thông tin cá nhân',
      icon: Edit,
      onClick: () => navigate('/profile?tab=basic'),
      variant: 'default' as const,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
    },
    {
      title: 'Cài đặt',
      description: 'Quản lý tài khoản và bảo mật',
      icon: Settings,
      onClick: () => navigate('/settings'),
      variant: 'outline' as const,
      color: 'text-gray-400',
      bgColor: 'bg-gray-400/10',
    },
    {
      title: 'Xếp hạng',
      description: 'Xác minh và nâng cấp hạng',
      icon: Shield,
      onClick: onNavigateToRankTab || (() => navigate('/profile?tab=rank')),
      variant: 'outline' as const,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-400/10',
    },
    {
      title: 'Giải đấu',
      description: 'Tham gia các giải đấu',
      icon: Trophy,
      onClick: () => navigate('/tournaments'),
      variant: 'outline' as const,
      color: 'text-orange-400',
      bgColor: 'bg-orange-400/10',
    },
    {
      title: 'Bạn bè',
      description: 'Quản lý danh sách bạn bè',
      icon: Users,
      onClick: () => navigate('/friends'),
      variant: 'outline' as const,
      color: 'text-green-400',
      bgColor: 'bg-green-400/10',
    },
    {
      title: 'Club',
      description: 'Quản lý câu lạc bộ',
      icon: Building,
      onClick: onNavigateToClubTab || (() => navigate('/profile?tab=club')),
      variant: 'outline' as const,
      color: 'text-purple-400',
      bgColor: 'bg-purple-400/10',
    },
  ];

  if (isMobile) {
    return (
      <div className={`flex gap-3 ${className}`}>
        <Button
          onClick={actions[0].onClick}
          className='flex-1 bg-primary/20 border-primary/30 text-primary hover:bg-primary/30'
          variant='outline'
        >
          <Edit className='w-4 h-4 mr-2' />
          Chỉnh sửa
        </Button>
        <Button
          onClick={actions[1].onClick}
          className='flex-1 bg-card/30 border-primary/20 text-muted-foreground hover:bg-card/50'
          variant='outline'
        >
          <Settings className='w-4 h-4 mr-2' />
          Cài đặt
        </Button>
      </div>
    );
  }

  return (
    <Card
      className={`bg-card/30 border-primary/20 backdrop-blur-sm ${className}`}
    >
      <CardContent className='p-6'>
        <h3 className='text-lg font-semibold text-primary mb-4'>
          Hành động nhanh
        </h3>
        <div className='space-y-3'>
          {actions.map((action, index) => {
            const IconComponent = action.icon;
            return (
              <Button
                key={index}
                onClick={action.onClick}
                variant={action.variant}
                className='w-full justify-start bg-card/20 border-primary/20 text-left hover:bg-card/40 hover:border-primary/30 transition-all duration-300'
              >
                <div
                  className={`w-10 h-10 rounded-full ${action.bgColor} flex items-center justify-center mr-3`}
                >
                  <IconComponent className={`w-5 h-5 ${action.color}`} />
                </div>
                <div className='text-left'>
                  <div className='font-medium text-primary'>{action.title}</div>
                  <div className='text-sm text-muted-foreground'>
                    {action.description}
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
