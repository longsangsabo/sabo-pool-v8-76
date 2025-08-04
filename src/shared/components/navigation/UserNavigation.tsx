import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard,
  User,
  Trophy,
  Users,
  Calendar,
  Settings,
  Wallet,
  Store,
  MessageSquare,
  Target
} from 'lucide-react';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  permission?: string;
}

/**
 * User Navigation Items
 * Available to all authenticated users
 */
const userNavigationItems: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/user/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Profile',
    href: '/user/profile',
    icon: User,
  },
  {
    name: 'Challenges',
    href: '/user/challenges',
    icon: Target,
    permission: 'challenge_access',
  },
  {
    name: 'Community',
    href: '/user/community',
    icon: Users,
    permission: 'community_access',
  },
  {
    name: 'Calendar',
    href: '/user/calendar',
    icon: Calendar,
  },
  {
    name: 'Tournaments',
    href: '/tournaments',
    icon: Trophy,
    permission: 'tournament_participation',
  },
  {
    name: 'Marketplace',
    href: '/user/marketplace',
    icon: Store,
    permission: 'marketplace_access',
  },
  {
    name: 'Feed',
    href: '/user/feed',
    icon: MessageSquare,
  },
  {
    name: 'Wallet',
    href: '/user/wallet',
    icon: Wallet,
  },
  {
    name: 'Settings',
    href: '/user/settings',
    icon: Settings,
  },
];

interface UserNavigationProps {
  className?: string;
}

/**
 * UserNavigation - Navigation component for user dashboard
 * Displays user-specific navigation items with permission checks
 */
export const UserNavigation: React.FC<UserNavigationProps> = ({
  className
}) => {
  const location = useLocation();

  return (
    <nav className={cn('space-y-1', className)}>
      {userNavigationItems.map((item) => {
        const isActive = location.pathname === item.href || 
          (item.href !== '/user/dashboard' && location.pathname.startsWith(item.href));
        
        return (
          <Link
            key={item.name}
            to={item.href}
            className={cn(
              'group flex items-center px-2 py-2 text-sm font-medium rounded-md',
              'transition-colors duration-200',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted',
            )}
          >
            <item.icon
              className={cn(
                'mr-3 flex-shrink-0 h-5 w-5',
                isActive
                  ? 'text-primary-foreground'
                  : 'text-muted-foreground group-hover:text-foreground'
              )}
            />
            <span className="truncate">{item.name}</span>
            {item.badge && (
              <span className={cn(
                'ml-auto inline-block py-0.5 px-2 text-xs rounded-full',
                isActive
                  ? 'bg-primary-foreground/20 text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              )}>
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
};

export default UserNavigation;
