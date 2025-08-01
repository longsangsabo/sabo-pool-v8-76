import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { BarChart3, Trophy, Users, Settings, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const quickAccessItems = [
  { icon: BarChart3, path: '/club-management', label: 'Tổng quan' },
  { icon: Trophy, path: '/club-management/tournaments', label: 'Giải đấu' },
  { icon: UserCheck, path: '/club-management/verification', label: 'Xác thực' },
  { icon: Users, path: '/club-management/members', label: 'Thành viên' },
  { icon: Settings, path: '/club-management/settings', label: 'Cài đặt' },
];

export const ClubMobileNavigation: React.FC = () => {
  const location = useLocation();

  return (
    <nav className='fixed bottom-0 left-0 right-0 bg-card border-t border-border pb-safe-bottom'>
      <div className='flex justify-around items-center py-2'>
        {quickAccessItems.map(item => {
          const Icon = item.icon;
          const isActive =
            location.pathname === item.path ||
            (item.path !== '/club-management' &&
              location.pathname.startsWith(item.path));

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors',
                isActive
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className='h-4 w-4' />
              <span className='text-xs font-medium'>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
