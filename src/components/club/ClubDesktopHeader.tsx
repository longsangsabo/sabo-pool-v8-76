import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Bell, Menu, Search, Settings, Building, Home } from 'lucide-react';
import { ClubRoleSwitch } from './ClubRoleSwitch';
import { UserModeSwitch } from './UserModeSwitch';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface ClubDesktopHeaderProps {
  onToggleSidebar: () => void;
  sidebarCollapsed: boolean;
  clubProfile?: any;
}

export const ClubDesktopHeader: React.FC<ClubDesktopHeaderProps> = ({
  onToggleSidebar,
  sidebarCollapsed,
  clubProfile,
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
            <Building className='h-5 w-5 text-primary' />
            <h1 className='text-xl font-bold'>{t('club.management')}</h1>
            <Badge variant='secondary' className='bg-primary/10 text-primary'>
              {clubProfile?.club_name || 'Club'}
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

          {/* Role Switch Buttons */}
          <div className='flex items-center gap-3'>
            <UserModeSwitch />
            <ClubRoleSwitch />
          </div>
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

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Settings */}
          <Button variant='ghost' size='sm'>
            <Settings className='h-5 w-5' />
          </Button>

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
