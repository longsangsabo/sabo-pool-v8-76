import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TechCard,
  TechButton,
  TechListItem,
} from '@/components/ui/sabo-tech-global';
import {
  Building,
  Trophy,
  Users,
  Settings,
  Plus,
  Edit,
  Shield,
} from 'lucide-react';
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
  className = '',
}) => {
  const { isMobile } = useOptimizedResponsive();
  const navigate = useNavigate();

  const actions = [
    {
      title: 'Đăng ký hạng',
      description: profile?.verified_rank
        ? `Hạng hiện tại: ${profile.verified_rank}`
        : 'Xác thực hạng thi đấu',
      icon: Shield,
      onClick: onNavigateToRankTab,
      primary: true,
      variant: 'primary' as const,
      highlighted: !profile?.verified_rank,
    },
    {
      title: profile?.club_profile ? 'Quản lý CLB' : 'Đăng ký CLB',
      description: profile?.club_profile
        ? 'Quản lý câu lạc bộ của bạn'
        : 'Tạo câu lạc bộ mới',
      icon: Building,
      onClick: onNavigateToClubTab,
      primary: false,
      variant: 'secondary' as const,
    },
    {
      title: 'Thách đấu',
      description: 'Tìm đối thủ và thách đấu',
      icon: Trophy,
      onClick: () => navigate('/challenges'),
      primary: false,
      variant: 'success' as const,
    },
    {
      title: 'Bạn bè',
      description: 'Kết nối với người chơi khác',
      icon: Users,
      onClick: () => {},
      primary: false,
      variant: 'secondary' as const,
    },
  ];

  if (isMobile) {
    return (
      <div className={`space-y-3 px-4 ${className}`}>
        <div className='grid grid-cols-2 gap-3'>
          <TechButton variant='primary' size='md' fullWidth>
            <Edit className='w-4 h-4 mr-2' />
            Chỉnh sửa
          </TechButton>
          <TechButton variant='secondary' size='md' fullWidth>
            <Settings className='w-4 h-4 mr-2' />
            Cài đặt
          </TechButton>
        </div>
      </div>
    );
  }

  return (
    <TechCard className={className} variant='default'>
      <div className='space-y-4'>
        <div className='flex items-center gap-2 text-lg font-semibold text-foreground'>
          <Plus className='w-5 h-5 text-primary' />
          Thao tác nhanh
        </div>

        <div className='space-y-2'>
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <TechListItem
                key={index}
                onClick={action.onClick}
                leftIcon={<Icon className='w-5 h-5' />}
                className='cursor-pointer'
              >
                <div className='flex-1'>
                  <div className='font-medium text-foreground'>
                    {action.title}
                  </div>
                  <div className='text-sm text-muted-foreground mt-1'>
                    {action.description}
                  </div>
                </div>
              </TechListItem>
            );
          })}
        </div>
      </div>
    </TechCard>
  );
};
