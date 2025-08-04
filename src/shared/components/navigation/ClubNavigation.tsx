import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard,
  Building,
  Trophy,
  Users,
  Calendar,
  Settings,
  CreditCard,
  Bell,
  BarChart3,
  Shield
} from 'lucide-react';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  permission?: string;
}

/**
 * Club Navigation Items
 * Available to club owners and managers
 */
const clubNavigationItems: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/club/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Club Profile',
    href: '/club/management',
    icon: Building,
    permission: 'club_management',
  },
  {
    name: 'Tournaments',
    href: '/club/management/tournaments',
    icon: Trophy,
    permission: 'tournament_creation',
  },
  {
    name: 'Members',
    href: '/club/management/members',
    icon: Users,
    permission: 'member_management',
  },
  {
    name: 'Challenges',
    href: '/club/management/challenges',
    icon: Shield,
    permission: 'club_management',
  },
  {
    name: 'Verification',
    href: '/club/management/verification',
    icon: Shield,
    permission: 'member_management',
  },
  {
    name: 'Schedule',
    href: '/club/management/schedule',
    icon: Calendar,
    permission: 'club_management',
  },
  {
    name: 'Notifications',
    href: '/club/management/notifications',
    icon: Bell,
    permission: 'club_management',
  },
  {
    name: 'Analytics',
    href: '/club/management/analytics',
    icon: BarChart3,
    permission: 'club_analytics',
  },
  {
    name: 'Payments',
    href: '/club/management/payments',
    icon: CreditCard,
    permission: 'club_financial',
  },
  {
    name: 'Settings',
    href: '/club/management/settings',
    icon: Settings,
    permission: 'club_management',
  },
];

interface ClubNavigationProps {
  className?: string;
}

/**
 * ClubNavigation - Navigation component for club management
 * Displays club-specific navigation items with permission checks
 */
export const ClubNavigation: React.FC<ClubNavigationProps> = ({
  className
}) => {
  const location = useLocation();

  return (
    <nav className={cn('space-y-1', className)}>
      {clubNavigationItems.map((item) => {
        const isActive = location.pathname === item.href || 
          (item.href !== '/club/dashboard' && location.pathname.startsWith(item.href));
        
        return (
          <Link
            key={item.name}
            to={item.href}
            className={cn(
              'group flex items-center px-2 py-2 text-sm font-medium rounded-md',
              'transition-colors duration-200',
              isActive
                ? 'bg-blue-600 text-white'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted',
            )}
          >
            <item.icon
              className={cn(
                'mr-3 flex-shrink-0 h-5 w-5',
                isActive
                  ? 'text-white'
                  : 'text-muted-foreground group-hover:text-foreground'
              )}
            />
            <span className="truncate">{item.name}</span>
            {item.badge && (
              <span className={cn(
                'ml-auto inline-block py-0.5 px-2 text-xs rounded-full',
                isActive
                  ? 'bg-white/20 text-white'
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

export default ClubNavigation;
