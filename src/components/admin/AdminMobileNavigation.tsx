import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Trophy,
  BarChart3,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const quickAccessItems = [
  { icon: LayoutDashboard, path: '/admin', label: 'Dashboard' },
  { icon: Users, path: '/admin/users', label: 'Users' },
  { icon: Trophy, path: '/admin/tournaments', label: 'Tournaments' },
  { icon: BarChart3, path: '/admin/analytics', label: 'Analytics' },
  { icon: Settings, path: '/admin/settings', label: 'Settings' },
];

export const AdminMobileNavigation: React.FC = () => {
  const location = useLocation();

  return (
    <nav className='fixed bottom-0 left-0 right-0 bg-card border-t border-border pb-safe-bottom'>
      <div className='flex justify-around items-center py-2'>
        {quickAccessItems.map(item => {
          const Icon = item.icon;
          const isActive =
            location.pathname === item.path ||
            (item.path !== '/admin' && location.pathname.startsWith(item.path));

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
