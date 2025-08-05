import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building, Plus, Users, Trophy, Star } from 'lucide-react';

interface ProfileSidebarProps {
  onNavigateToClubTab: () => void;
  userRole: 'player' | 'club_owner' | 'both';
}

export const ProfileSidebar: React.FC<ProfileSidebarProps> = ({
  onNavigateToClubTab,
  userRole,
}) => {
  const quickActions = [
    {
      title: 'Đăng ký CLB',
      description:
        userRole === 'player' ? 'Tạo câu lạc bộ mới' : 'Quản lý CLB của bạn',
      icon: Building,
      onClick: onNavigateToClubTab,
      primary: true,
    },
    {
      title: 'Thách đấu',
      description: 'Tìm đối thủ và thách đấu',
      icon: Trophy,
      onClick: () => {},
      primary: false,
    },
    {
      title: 'Bạn bè',
      description: 'Kết nối với người chơi khác',
      icon: Users,
      onClick: () => {},
      primary: false,
    },
  ];

  return (
    <Card className='enhanced-card bg-card dark:bg-card border-border dark:border-border'>
      <CardHeader className='pb-4'>
        <CardTitle className='flex items-center gap-2 text-card-foreground dark:text-card-foreground'>
          <Star className='w-5 h-5 text-primary' />
          Thao tác nhanh
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-3'>
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Button
              key={index}
              variant={action.primary ? 'default' : 'ghost'}
              className={`w-full justify-start gap-3 h-auto p-4 rounded-xl transition-all duration-200 ${
                action.primary
                  ? 'bg-primary hover:bg-primary/90 text-primary-foreground dark:bg-primary dark:hover:bg-primary/90 dark:text-primary-foreground'
                  : 'hover:bg-secondary dark:hover:bg-secondary/80 border border-transparent hover:border-border/50 dark:hover:border-border/50'
              }`}
              onClick={action.onClick}
            >
              <div
                className={`p-3 rounded-xl transition-all duration-200 ${
                  action.primary
                    ? 'bg-primary-foreground/20 dark:bg-primary-foreground/20'
                    : 'bg-muted/50 dark:bg-muted/80'
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${
                    action.primary
                      ? 'text-primary-foreground'
                      : 'text-muted-foreground dark:text-muted-foreground'
                  }`}
                />
              </div>
              <div className='flex-1 text-left'>
                <div
                  className={`font-semibold ${
                    action.primary
                      ? 'text-primary-foreground'
                      : 'text-card-foreground dark:text-card-foreground'
                  }`}
                >
                  {action.title}
                </div>
                <div
                  className={`text-sm mt-1 ${
                    action.primary
                      ? 'text-primary-foreground/80'
                      : 'text-muted-foreground dark:text-muted-foreground'
                  }`}
                >
                  {action.description}
                </div>
              </div>
              {action.primary && (
                <Plus className='w-5 h-5 text-primary-foreground' />
              )}
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
};
