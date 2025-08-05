import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Trophy, Users, BarChart3, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: Home, path: '/dashboard', label: 'Trang chủ' },
  { icon: User, path: '/profile', label: 'Hồ sơ' },
  { icon: Trophy, path: '/tournaments', label: 'Giải đấu' },
  { icon: Users, path: '/challenges', label: 'Thách đấu' },
  { icon: BarChart3, path: '/leaderboard', label: 'BXH' },
];

const UserMobileNavigation: React.FC = () => {
  const location = useLocation();

  return (
    <nav className='mobile-nav-enhanced'>
      <div className='flex justify-around items-center py-2'>
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive =
            location.pathname === item.path ||
            (item.path !== '/dashboard' &&
              location.pathname.startsWith(item.path));

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'mobile-nav-item flex flex-col items-center gap-1 px-3 py-2',
                isActive
                  ? 'active'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <Icon className='h-6 w-6' />
              <span className='text-xs font-medium'>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default UserMobileNavigation;
