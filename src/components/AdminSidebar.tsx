import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Shield,
  BarChart3,
  Users,
  Settings,
  Trophy,
  Building,
  CreditCard,
  Database,
  Zap,
  Code,
  Bot,
  UserCheck,
  Receipt,
  Gamepad2,
  Target,
  DollarSign,
  AlertTriangle,
  BookOpen,
  FileText,
  Globe,
  Layers,
  TrendingUp,
  MessageSquare,
  Calendar,
  Bell,
} from 'lucide-react';

export interface AdminSidebarProps {
  collapsed?: boolean;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ collapsed = false }) => {
  const location = useLocation();

  const menuItems = [
    {
      title: 'Dashboard',
      icon: BarChart3,
      href: '/admin',
      description: 'Tổng quan hệ thống',
    },
    {
      title: 'Người dùng',
      icon: Users,
      href: '/admin/users',
      description: 'Quản lý người dùng',
    },
    {
      title: 'Giải đấu',
      icon: Trophy,
      href: '/admin/tournaments',
      description: 'Quản lý giải đấu',
    },
    {
      title: 'Câu lạc bộ',
      icon: Building,
      href: '/admin/clubs',
      description: 'Quản lý câu lạc bộ',
    },
    {
      title: 'Xác thực hạng',
      icon: UserCheck,
      href: '/admin/rank-verification',
      description: 'Xác thực hạng người chơi',
    },
    {
      title: 'Giao dịch',
      icon: Receipt,
      href: '/admin/transactions',
      description: 'Quản lý giao dịch',
    },
    {
      title: 'Cấu hình Game',
      icon: Gamepad2,
      href: '/admin/game-config',
      description: 'Cấu hình trò chơi',
    },
    {
      title: 'Thách đấu',
      icon: Target,
      href: '/admin/challenges',
      description: 'Quản lý thách đấu',
    },
    {
      title: 'Thanh toán',
      icon: DollarSign,
      href: '/admin/payments',
      description: 'Quản lý thanh toán',
    },
    {
      title: 'Khẩn cấp',
      icon: AlertTriangle,
      href: '/admin/emergency',
      description: 'Xử lý khẩn cấp',
    },
    {
      title: 'Hướng dẫn',
      icon: BookOpen,
      href: '/admin/guide',
      description: 'Hướng dẫn sử dụng',
    },
    {
      title: 'Báo cáo',
      icon: FileText,
      href: '/admin/reports',
      description: 'Báo cáo tổng hợp',
    },
    {
      title: 'Phân tích',
      icon: TrendingUp,
      href: '/admin/analytics',
      description: 'Phân tích dữ liệu',
    },
    {
      title: 'Lịch trình',
      icon: Calendar,
      href: '/admin/schedule',
      description: 'Quản lý lịch trình',
    },
    {
      title: 'Thông báo',
      icon: Bell,
      href: '/admin/notifications',
      description: 'Hệ thống thông báo',
    },
    {
      title: 'Database',
      icon: Database,
      href: '/admin/database',
      description: 'Quản lý cơ sở dữ liệu',
    },
    {
      title: 'Automation',
      icon: Zap,
      href: '/admin/automation',
      description: 'Tự động hóa',
    },
    {
      title: 'Development',
      icon: Code,
      href: '/admin/development',
      description: 'Công cụ phát triển',
    },
    {
      title: 'AI Assistant',
      icon: Bot,
      href: '/admin/ai-assistant',
      description: 'Trợ lý AI',
    },
    {
      title: 'Cài đặt',
      icon: Settings,
      href: '/admin/settings',
      description: 'Cài đặt hệ thống',
    },
  ];

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-card border-r border-border transition-all duration-300 relative z-10',
        collapsed ? 'w-16' : 'w-64'
      )}
      data-testid='admin-sidebar'
      role='navigation'
      aria-label='Admin navigation'
    >
      {/* Header */}
      <div className='p-4 border-b border-border'>
        <div className='flex items-center gap-3'>
          <div className='w-8 h-8 bg-primary rounded-lg flex items-center justify-center'>
            <Shield className='w-4 h-4 text-primary-foreground' />
          </div>
          {!collapsed && (
            <div className='flex-1 min-w-0'>
              <h2 className='font-semibold text-sm truncate'>Admin Panel</h2>
              <p className='text-xs text-muted-foreground truncate'>
                Quản trị hệ thống
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className='flex-1'>
        <nav className='p-2 space-y-1' data-testid='admin-nav-menu'>
          {menuItems.map(item => {
            const isActive = location.pathname === item.href;
            return (
              <NavLink
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground'
                )}
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
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className='p-4 border-t border-border'>
        {!collapsed && (
          <div className='text-xs text-muted-foreground'>
            <p>System Admin</p>
            <p>Version: 1.0.0</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSidebar;
