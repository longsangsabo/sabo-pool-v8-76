import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard,
  Users,
  Building,
  Shield,
  CreditCard,
  Trophy,
  Settings,
  BarChart3,
  Database,
  Bell,
  Wrench,
  Activity,
  Bot
} from 'lucide-react';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  permission?: string;
}

/**
 * Admin Navigation Items
 * Available to admin users only
 */
const adminNavigationItems: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    permission: 'admin_access',
  },
  {
    name: 'Users',
    href: '/admin/users',
    icon: Users,
    permission: 'user_management',
  },
  {
    name: 'Clubs',
    href: '/admin/clubs',
    icon: Building,
    permission: 'club_management',
  },
  {
    name: 'Rank Verification',
    href: '/admin/rank-verification',
    icon: Shield,
    permission: 'user_management',
  },
  {
    name: 'Transactions',
    href: '/admin/transactions',
    icon: CreditCard,
    permission: 'financial_management',
  },
  {
    name: 'Challenges',
    href: '/admin/challenges',
    icon: Trophy,
    permission: 'tournament_management',
  },
  {
    name: 'Tournaments',
    href: '/admin/tournaments',
    icon: Trophy,
    permission: 'tournament_management',
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
    permission: 'analytics_access',
  },
  {
    name: 'Notifications',
    href: '/admin/notifications',
    icon: Bell,
    permission: 'system_management',
  },
  {
    name: 'Database',
    href: '/admin/database',
    icon: Database,
    permission: 'system_management',
  },
  {
    name: 'Automation',
    href: '/admin/automation',
    icon: Bot,
    permission: 'system_management',
  },
  {
    name: 'System Monitor',
    href: '/admin/system',
    icon: Activity,
    permission: 'system_management',
  },
  {
    name: 'Tools',
    href: '/admin/tools',
    icon: Wrench,
    permission: 'system_management',
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    permission: 'system_management',
  },
];

interface AdminNavigationProps {
  className?: string;
}

/**
 * AdminNavigation - Navigation component for admin dashboard
 * Displays admin-specific navigation items with permission checks
 */
export const AdminNavigation: React.FC<AdminNavigationProps> = ({
  className
}) => {
  const location = useLocation();

  return (
    <nav className={cn('space-y-1', className)}>
      {adminNavigationItems.map((item) => {
        const isActive = location.pathname === item.href || 
          (item.href !== '/admin' && location.pathname.startsWith(item.href));
        
        return (
          <Link
            key={item.name}
            to={item.href}
            className={cn(
              'group flex items-center px-2 py-2 text-sm font-medium rounded-md',
              'transition-colors duration-200',
              isActive
                ? 'bg-orange-600 text-white'
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

export default AdminNavigation;
