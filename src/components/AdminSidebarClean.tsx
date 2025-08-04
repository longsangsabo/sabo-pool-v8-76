import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  BarChart3,
  Users,
  Settings,
  Trophy,
  Building,
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
  TrendingUp,
  Calendar,
  Bell,
} from 'lucide-react';

export interface AdminSidebarProps {
  collapsed?: boolean;
}

const AdminSidebarClean: React.FC<AdminSidebarProps> = ({ collapsed = false }) => {
  const location = useLocation();

  const menuItems = [
    // === DASHBOARD & OVERVIEW ===
    {
      title: '📈 Dashboard',
      icon: BarChart3,
      href: '/admin/dashboard-new',
      description: 'Enhanced analytics dashboard',
      group: 'overview'
    },
    
    // === USER MANAGEMENT ===
    {
      title: '👥 Users',
      icon: Users,
      href: '/admin/users-new',
      description: 'Advanced user management',
      group: 'users'
    },
    {
      title: '🎯 Rank Verification',
      icon: UserCheck,
      href: '/admin/rank-verification-new',
      description: 'Advanced rank verification system',
      group: 'users'
    },

    // === GAME MANAGEMENT ===
    {
      title: '🏆 Tournaments',
      icon: Trophy,
      href: '/admin/tournaments-new',
      description: 'Advanced tournament management',
      group: 'game'
    },
    {
      title: '⚔️ Challenges',
      icon: Target,
      href: '/admin/challenges-new',
      description: 'Advanced challenge management',
      group: 'game'
    },
    {
      title: '🎮 Game Config',
      icon: Gamepad2,
      href: '/admin/game-config-new',
      description: 'Advanced game configuration',
      group: 'game'
    },

    // === BUSINESS MANAGEMENT ===
    {
      title: '🏢 Clubs',
      icon: Building,
      href: '/admin/clubs-new',
      description: 'Advanced club management',
      group: 'business'
    },
    {
      title: '💳 Transactions',
      icon: Receipt,
      href: '/admin/transactions-new',
      description: 'Advanced transaction management',
      group: 'business'
    },
    {
      title: '💰 Payments',
      icon: DollarSign,
      href: '/admin/payments-new',
      description: 'Advanced payment management',
      group: 'business'
    },

    // === ANALYTICS & REPORTS ===
    {
      title: '📊 Analytics',
      icon: TrendingUp,
      href: '/admin/analytics-new',
      description: 'Advanced analytics & insights',
      group: 'analytics'
    },
    {
      title: '📋 Reports',
      icon: FileText,
      href: '/admin/reports-new',
      description: 'Advanced reporting system',
      group: 'analytics'
    },

    // === COMMUNICATION ===
    {
      title: '🔔 Notifications',
      icon: Bell,
      href: '/admin/notifications-new',
      description: 'Advanced notification system',
      group: 'communication'
    },
    {
      title: '📅 Schedule',
      icon: Calendar,
      href: '/admin/schedule-new',
      description: 'Advanced scheduling system',
      group: 'communication'
    },

    // === SYSTEM & AUTOMATION ===
    {
      title: '🗄️ Database',
      icon: Database,
      href: '/admin/database-new',
      description: 'Advanced database management',
      group: 'system'
    },
    {
      title: '⚡ Automation',
      icon: Zap,
      href: '/admin/automation-new',
      description: 'Workflow automation center',
      group: 'system'
    },
    {
      title: '🤖 AI Assistant',
      icon: Bot,
      href: '/admin/ai-assistant-new',
      description: 'AI automation & insights',
      group: 'system'
    },

    // === SETTINGS & SUPPORT ===
    {
      title: '⚙️ Settings',
      icon: Settings,
      href: '/admin/settings-new',
      description: 'Advanced system settings',
      group: 'settings'
    },
    {
      title: '📚 Guide',
      icon: BookOpen,
      href: '/admin/guide-new',
      description: 'Documentation & help system',
      group: 'settings'
    },

    // === EMERGENCY & DEVELOPMENT ===
    {
      title: '🚨 Emergency',
      icon: AlertTriangle,
      href: '/admin/emergency-new',
      description: 'Emergency incident management',
      group: 'emergency'
    },
    {
      title: '🔧 Development',
      icon: Code,
      href: '/admin/development-new',
      description: 'Development tools & utilities',
      group: 'emergency'
    },
  ];

  const groupedMenuItems = [
    { key: 'overview', title: 'Tổng quan', items: menuItems.filter(item => item.group === 'overview') },
    { key: 'users', title: 'Quản lý người dùng', items: menuItems.filter(item => item.group === 'users') },
    { key: 'game', title: 'Quản lý Game', items: menuItems.filter(item => item.group === 'game') },
    { key: 'business', title: 'Kinh doanh', items: menuItems.filter(item => item.group === 'business') },
    { key: 'analytics', title: 'Phân tích & Báo cáo', items: menuItems.filter(item => item.group === 'analytics') },
    { key: 'communication', title: 'Giao tiếp', items: menuItems.filter(item => item.group === 'communication') },
    { key: 'system', title: 'Hệ thống', items: menuItems.filter(item => item.group === 'system') },
    { key: 'settings', title: 'Cài đặt & Hỗ trợ', items: menuItems.filter(item => item.group === 'settings') },
    { key: 'emergency', title: 'Khẩn cấp & Dev', items: menuItems.filter(item => item.group === 'emergency') },
  ];

  return (
    <div className={cn(
      'bg-gradient-to-b from-slate-900 to-slate-800 border-r border-slate-700/50 h-full flex flex-col transition-all duration-300',
      collapsed ? 'w-16' : 'w-64'
    )}>
      {/* Header */}
      <div className='p-4 border-b border-slate-700/50'>
        <div className='flex items-center gap-3'>
          <div className='w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center'>
            <span className='text-white font-bold text-sm'>A</span>
          </div>
          {!collapsed && (
            <div>
              <h2 className='font-semibold text-sm truncate text-white'>Admin Panel</h2>
              <p className='text-xs text-slate-400 truncate'>SABO Pool Arena</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className='flex-1'>
        <div className='p-2'>
          {groupedMenuItems.map((group) => (
            <div key={group.key} className='mb-4'>
              {!collapsed && (
                <h3 className='px-3 py-2 text-xs font-medium text-slate-400 uppercase tracking-wider'>
                  {group.title}
                </h3>
              )}
              <div className='space-y-1'>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  
                  return (
                    <NavLink
                      key={item.href}
                      to={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group',
                        isActive
                          ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                          : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                      )}
                      title={collapsed ? item.title : undefined}
                    >
                      <Icon className={cn(
                        'h-4 w-4 flex-shrink-0 transition-colors',
                        isActive 
                          ? 'text-blue-400' 
                          : 'text-slate-400 group-hover:text-slate-300'
                      )} />
                      {!collapsed && (
                        <div className='flex-1 min-w-0'>
                          <span className='truncate'>{item.title}</span>
                          <p className={cn(
                            'text-xs truncate mt-0.5',
                            isActive 
                              ? 'text-blue-300/70' 
                              : 'text-slate-500 group-hover:text-slate-400'
                          )}>
                            {item.description}
                          </p>
                        </div>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className='p-4 border-t border-slate-700/50'>
        {!collapsed && (
          <div className='text-xs text-slate-500 text-center'>
            Version 2.0 • Enhanced
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSidebarClean;
