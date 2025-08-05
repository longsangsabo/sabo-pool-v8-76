import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { NavigationItem } from './navigationConfig';
import { cn } from '@/lib/utils';

export interface BottomNavigationProps {
  items: NavigationItem[];
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  items,
}) => {
  const location = useLocation();

  // Get notification counts for badges
  const { data: notificationCount } = useQuery({
    queryKey: ['notification-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false)
        .is('deleted_at', null);

      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 30000,
  });

  const { data: challengeCount } = useQuery({
    queryKey: ['pending-challenges-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('challenges')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 30000,
  });

  // Get badge count for specific paths
  const getBadgeCount = (item: NavigationItem): number => {
    if (!item.badge) return 0;

    if (item.path.includes('notification')) return notificationCount || 0;
    if (item.path.includes('challenge')) return challengeCount || 0;

    return 0;
  };

  const isActive = (path: string) => {
    if (path === '/' || path === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className='fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border lg:hidden'>
      <div className='flex items-center justify-around py-2 px-2 safe-area-pb'>
        {items.map(item => {
          const Icon = item.icon;
          const active = isActive(item.path);
          const badgeCount = getBadgeCount(item);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'relative flex flex-col items-center justify-center min-w-0 flex-1 py-2 px-1 rounded-lg transition-all duration-200',
                'hover:bg-muted/50 active:scale-95',
                active
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className='relative'>
                <Icon
                  className={cn(
                    'w-5 h-5 transition-colors',
                    active && 'fill-current'
                  )}
                />

                {/* Badge */}
                {badgeCount > 0 && (
                  <Badge
                    variant='destructive'
                    className='absolute -top-2 -right-2 w-5 h-5 text-xs p-0 flex items-center justify-center min-w-[20px] h-5'
                  >
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </Badge>
                )}
              </div>

              <span
                className={cn(
                  'text-xs mt-1 font-medium truncate w-full text-center leading-tight',
                  active ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
