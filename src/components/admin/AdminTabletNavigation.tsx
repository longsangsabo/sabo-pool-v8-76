import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Trophy,
  Building2,
  CreditCard,
  BarChart3,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const tabletNavItems = [
  { icon: LayoutDashboard, path: '/admin', label: 'Dashboard' },
  { icon: Users, path: '/admin/users', label: 'Users' },
  { icon: Trophy, path: '/admin/tournaments', label: 'Tournaments' },
  { icon: Building2, path: '/admin/clubs', label: 'Clubs' },
  { icon: CreditCard, path: '/admin/transactions', label: 'Transactions' },
  { icon: BarChart3, path: '/admin/analytics', label: 'Analytics' },
  { icon: Settings, path: '/admin/settings', label: 'Settings' },
];

export const AdminTabletNavigation: React.FC = () => {
  const location = useLocation();

  return (
    <nav className='fixed bottom-0 left-0 right-0 bg-card border-t border-border pb-safe-bottom'>
      <div className='flex justify-around items-center py-3 max-w-6xl mx-auto'>
        {tabletNavItems.map(item => {
          const Icon = item.icon;
          const isActive =
            location.pathname === item.path ||
            (item.path !== '/admin' && location.pathname.startsWith(item.path));

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors',
                isActive
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className='h-5 w-5' />
              <span className='text-sm font-medium'>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
