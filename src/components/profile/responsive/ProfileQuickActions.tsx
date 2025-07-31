
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building, Trophy, Users, Settings, Plus, Edit, Shield } from 'lucide-react';
import { useOptimizedResponsive } from '@/hooks/useOptimizedResponsive';

interface ProfileQuickActionsProps {
  profile: any;
  onNavigateToClubTab?: () => void;
  onNavigateToRankTab?: () => void;
  className?: string;
}

export const ProfileQuickActions: React.FC<ProfileQuickActionsProps> = ({ 
  profile, 
  onNavigateToClubTab,
  onNavigateToRankTab,
  className = '' 
}) => {
  const { isMobile } = useOptimizedResponsive();

  const actions = [
    {
      title: 'Đăng ký hạng',
      description: profile?.verified_rank ? `Hạng hiện tại: ${profile.verified_rank}` : 'Xác thực hạng thi đấu',
      icon: Shield,
      onClick: onNavigateToRankTab,
      primary: true,
      variant: 'default' as const,
      highlighted: !profile?.verified_rank,
    },
    {
      title: profile?.club_profile ? 'Quản lý CLB' : 'Đăng ký CLB',
      description: profile?.club_profile ? 'Quản lý câu lạc bộ của bạn' : 'Tạo câu lạc bộ mới',
      icon: Building,
      onClick: onNavigateToClubTab,
      primary: false,
      variant: 'outline' as const,
    },
    {
      title: 'Thách đấu',
      description: 'Tìm đối thủ và thách đấu',
      icon: Trophy,
      onClick: () => {},
      primary: false,
      variant: 'outline' as const,
    },
    {
      title: 'Bạn bè',
      description: 'Kết nối với người chơi khác',
      icon: Users,
      onClick: () => {},
      primary: false,
      variant: 'outline' as const,
    },
  ];

  if (isMobile) {
    return (
      <div className={`grid grid-cols-2 gap-3 ${className}`}>
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Button
              key={index}
              variant={action.variant}
              onClick={action.onClick}
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs text-center">{action.title}</span>
            </Button>
          );
        })}
      </div>
    );
  }

  return (
    <Card className={`bg-card border-border ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Plus className="w-5 h-5 text-primary" />
          Thao tác nhanh
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Button
              key={index}
              variant={action.variant}
              className="w-full justify-start gap-3 h-auto p-4"
              onClick={action.onClick}
            >
              <div className="p-2 rounded-lg bg-muted">
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-medium">{action.title}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {action.description}
                </div>
              </div>
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
};
