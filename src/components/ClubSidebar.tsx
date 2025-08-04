import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/shared/components/ui/button';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import {
  Building,
  BarChart3,
  Trophy,
  Users,
  Settings,
  UserCheck,
  Swords,
  Bell,
  Calendar,
  CreditCard,
} from 'lucide-react';

interface ClubSidebarProps {
  collapsed?: boolean;
  clubProfile?: any;
}

const ClubSidebar: React.FC<ClubSidebarProps> = ({
  collapsed = false,
  clubProfile,
}) => {
  const location = useLocation();

  const managementItems = [
    {
      title: 'Tổng quan',
      icon: BarChart3,
      href: '/club-management',
      description: 'Dashboard và thống kê',
    },
    {
      title: 'Thành viên',
      icon: Users,
      href: '/club-management/members',
      description: 'Quản lý thành viên',
      badge: clubProfile?.pending_members || 0,
    },
    {
      title: 'Xác thực hạng',
      icon: UserCheck,
      href: '/club-management/verification',
      description: 'Duyệt yêu cầu hạng',
      badge: clubProfile?.pending_verifications || 0,
    },
  ];

  const operationsItems = [
    {
      title: 'Giải đấu',
      icon: Trophy,
      href: '/club-management/tournaments',
      description: 'Quản lý giải đấu',
    },
    {
      title: 'Thách đấu',
      icon: Swords,
      href: '/challenges',
      description: 'Tham gia thách đấu',
    },
    {
      title: 'Lịch trình',
      icon: Calendar,
      href: '/club-management/schedule',
      description: 'Quản lý lịch',
    },
  ];

  const systemItems = [
    {
      title: 'Thông báo',
      icon: Bell,
      href: '/club-management/notifications',
      description: 'Gửi thông báo',
    },
    {
      title: 'Thanh toán',
      icon: CreditCard,
      href: '/club-management/payments',
      description: 'Quản lý thanh toán',
    },
    {
      title: 'Cài đặt',
      icon: Settings,
      href: '/club-management/settings',
      description: 'Cài đặt CLB',
    },
  ];

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-card border-r border-border transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className='p-4 border-b border-border'>
        <div className='flex items-center gap-3'>
          <div className='w-8 h-8 bg-primary rounded-lg flex items-center justify-center'>
            <Building className='w-4 h-4 text-primary-foreground' />
          </div>
          {!collapsed && (
            <div className='flex-1 min-w-0'>
              <h2 className='font-semibold text-sm truncate'>
                {clubProfile?.club_name || 'CLB Management'}
              </h2>
              <p className='text-xs text-muted-foreground truncate'>
                Quản lý câu lạc bộ
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className='flex-1'>
        <nav className='p-2 space-y-4'>
          {/* Management Section */}
          <div>
            {!collapsed && (
              <h3 className='px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2'>
                Quản lý
              </h3>
            )}
            <div className='space-y-1'>
              {managementItems.map(item => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors group',
                      'hover:bg-accent hover:text-accent-foreground',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground'
                    )
                  }
                >
                  <item.icon
                    className={cn('shrink-0', collapsed ? 'w-5 h-5' : 'w-4 h-4')}
                  />
                  {!collapsed && (
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center justify-between'>
                        <span className='truncate'>{item.title}</span>
                        {item.badge && item.badge > 0 && (
                          <span className='ml-2 px-1.5 py-0.5 text-xs bg-destructive text-destructive-foreground rounded-full'>
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <div className='text-xs opacity-70 truncate'>
                        {item.description}
                      </div>
                    </div>
                  )}
                  {collapsed && item.badge && item.badge > 0 && (
                    <span className='absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full'></span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>

          {/* Operations Section */}
          <div>
            {!collapsed && (
              <h3 className='px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2'>
                Hoạt động
              </h3>
            )}
            <div className='space-y-1'>
              {operationsItems.map(item => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      'hover:bg-accent hover:text-accent-foreground',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground'
                    )
                  }
                >
                  <item.icon
                    className={cn('shrink-0', collapsed ? 'w-5 h-5' : 'w-4 h-4')}
                  />
                  {!collapsed && (
                    <div className='flex-1 min-w-0'>
                      <div className='truncate'>{item.title}</div>
                      <div className='text-xs opacity-70 truncate'>
                        {item.description}
                      </div>
                    </div>
                  )}
                </NavLink>
              ))}
            </div>
          </div>

          {/* System Section */}
          <div>
            {!collapsed && (
              <h3 className='px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2'>
                Hệ thống
              </h3>
            )}
            <div className='space-y-1'>
              {systemItems.map(item => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      'hover:bg-accent hover:text-accent-foreground',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground'
                    )
                  }
                >
                  <item.icon
                    className={cn('shrink-0', collapsed ? 'w-5 h-5' : 'w-4 h-4')}
                  />
                  {!collapsed && (
                    <div className='flex-1 min-w-0'>
                      <div className='truncate'>{item.title}</div>
                      <div className='text-xs opacity-70 truncate'>
                        {item.description}
                      </div>
                    </div>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className='p-4 border-t border-border'>
        {!collapsed && (
          <div className='text-xs text-muted-foreground'>
            <p>CLB ID: {clubProfile?.id?.slice(0, 8) || 'N/A'}</p>
            <p>Thành viên: {clubProfile?.member_count || 0}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClubSidebar;
