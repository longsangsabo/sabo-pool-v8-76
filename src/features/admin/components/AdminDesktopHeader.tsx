import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/shared/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';
import { Bell, Menu, Search, Settings, Shield, Home } from 'lucide-react';
import LanguageToggle from './LanguageToggle';
import { AdminRoleSwitch } from './AdminRoleSwitch';

interface AdminDesktopHeaderProps {
  onToggleSidebar: () => void;
  sidebarCollapsed: boolean;
}

export const AdminDesktopHeader: React.FC<AdminDesktopHeaderProps> = ({
  onToggleSidebar,
  sidebarCollapsed,
}) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <header className='bg-card border-b border-border px-6 py-4'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <Button
            variant='ghost'
            size='sm'
            onClick={onToggleSidebar}
            className='hover:bg-muted'
          >
            <Menu className='h-5 w-5' />
          </Button>

          <div className='flex items-center gap-2'>
            <Shield className='h-5 w-5 text-primary' />
            <h1 className='text-xl font-bold'>{t('admin.panel')}</h1>
            <Badge variant='secondary' className='bg-primary/10 text-primary'>
              Admin
            </Badge>
          </div>

          {/* Home Button */}
          <Button
            variant='outline'
            size='sm'
            onClick={() => navigate('/dashboard')}
            className='flex items-center gap-2 hover:bg-primary/10'
          >
            <Home className='h-4 w-4' />
            <span>Quay về trang chủ</span>
          </Button>

          {/* Role Switch Button */}
          <AdminRoleSwitch />
        </div>

        <div className='flex items-center gap-4'>
          {/* Search */}
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
            <input
              type='text'
              placeholder='Tìm kiếm...'
              className='pl-10 pr-4 py-2 w-80 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20'
            />
          </div>

          {/* Notifications */}
          <Button variant='ghost' size='sm'>
            <Bell className='h-5 w-5' />
          </Button>

          {/* Settings */}
          <Button variant='ghost' size='sm'>
            <Settings className='h-5 w-5' />
          </Button>

          {/* Language Toggle */}
          <LanguageToggle />

          {/* User Avatar */}
          <Avatar className='h-8 w-8'>
            <AvatarImage src={user?.user_metadata?.avatar_url} />
            <AvatarFallback>
              {user?.user_metadata?.full_name?.charAt(0) ||
                user?.email?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
};
