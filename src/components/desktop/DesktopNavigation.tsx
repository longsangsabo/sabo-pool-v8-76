import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  Trophy,
  Swords,
  Users,
  Calendar,
  BarChart3,
  Wallet,
  Settings,
  Heart,
  Store,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigationItems = [
  { name: 'Trang chủ', href: '/', icon: Home },
  { name: 'Giải đấu', href: '/tournaments', icon: Trophy },
  { name: 'Thách đấu', href: '/challenges', icon: Swords },
  { name: 'Cộng đồng', href: '/social-feed', icon: Heart },
  { name: 'Lịch', href: '/calendar', icon: Calendar },
  { name: 'Bảng xếp hạng', href: '/leaderboard', icon: BarChart3 },
  { name: 'Marketplace', href: '/enhanced-marketplace', icon: Store },
  { name: 'CLB', href: '/clubs', icon: Users },
  { name: 'Đăng ký CLB', href: '/club-registration', icon: Shield },
  { name: 'Ví', href: '/wallet', icon: Wallet },
  { name: 'Cài đặt', href: '/settings', icon: Settings },
];

export const DesktopNavigation: React.FC = () => {
  const location = useLocation();

  return (
    <nav className='w-64 min-h-screen bg-card border-r border-border'>
      <div className='p-4'>
        <div className='space-y-2'>
          {navigationItems.map(item => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.href ||
              (item.href !== '/' && location.pathname.startsWith(item.href));

            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <Icon className='h-5 w-5' />
                <span className='font-medium'>{item.name}</span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
