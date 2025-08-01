import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import {
  X,
  BarChart3,
  Trophy,
  Users,
  Settings,
  UserCheck,
  Swords,
  Bell,
  Calendar,
  CreditCard,
  LogOut,
  Home,
} from 'lucide-react';

interface ClubMobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  clubProfile?: any;
}

const drawerItems = [
  { icon: BarChart3, path: '/club-management', label: 'Tổng quan' },
  { icon: Trophy, path: '/club-management/tournaments', label: 'Giải đấu' },
  { icon: Swords, path: '/challenges', label: 'Thách đấu' },
  {
    icon: UserCheck,
    path: '/club-management/verification',
    label: 'Xác thực hạng',
  },
  { icon: Users, path: '/club-management/members', label: 'Thành viên' },
  { icon: Bell, path: '/club-management/notifications', label: 'Thông báo' },
  { icon: Calendar, path: '/club-management/schedule', label: 'Lịch trình' },
  { icon: CreditCard, path: '/club-management/payments', label: 'Thanh toán' },
  { icon: Settings, path: '/club-management/settings', label: 'Cài đặt' },
];

export const ClubMobileDrawer: React.FC<ClubMobileDrawerProps> = ({
  isOpen,
  onClose,
  clubProfile,
}) => {
  const { signOut } = useAuth();
  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50'>
      <div className='absolute inset-0 bg-black/50' onClick={onClose} />

      <div className='absolute left-0 top-0 h-full w-80 bg-card shadow-lg'>
        <div className='p-4 border-b border-border'>
          <div className='flex items-center justify-between'>
            <h2 className='text-lg font-bold'>{t('club.management')}</h2>
            <Button variant='ghost' size='sm' onClick={onClose}>
              <X className='h-4 w-4' />
            </Button>
          </div>
          {clubProfile && (
            <p className='text-sm text-muted-foreground mt-1'>
              {clubProfile.club_name}
            </p>
          )}
        </div>

        <nav className='flex-1 p-4 space-y-2'>
          {drawerItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className='flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors'
                onClick={onClose}
              >
                <Icon className='h-4 w-4' />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className='p-4 border-t border-border space-y-2'>
          <NavLink to='/' onClick={onClose}>
            <Button variant='ghost' className='w-full justify-start gap-3'>
              <Home className='h-4 w-4' />
              Trang chủ
            </Button>
          </NavLink>

          <Button
            variant='ghost'
            className='w-full justify-start gap-3'
            onClick={() => {
              signOut();
              onClose();
            }}
          >
            <LogOut className='h-4 w-4' />
            Đăng xuất
          </Button>
        </div>
      </div>
    </div>
  );
};
