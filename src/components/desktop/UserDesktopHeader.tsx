import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Bell, Menu, Search, Settings, User, LogOut } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { ClubRoleSwitch } from '@/components/club/ClubRoleSwitch';
import NotificationBadge from '@/components/NotificationBadge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link, useNavigate } from 'react-router-dom';

interface UserDesktopHeaderProps {
  onToggleSidebar: () => void;
  sidebarCollapsed: boolean;
}

export const UserDesktopHeader: React.FC<UserDesktopHeaderProps> = ({
  onToggleSidebar,
  sidebarCollapsed,
}) => {
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

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
            <h1 className='text-xl font-bold'>Dashboard</h1>
            <Badge variant='secondary' className='bg-blue-100 text-blue-700'>
              Player Mode
            </Badge>
          </div>

          {/* Role Switch Button */}
          <div className='flex items-center gap-3'>
            <ClubRoleSwitch />
          </div>
        </div>

        <div className='flex items-center gap-4'>
          {/* Search */}
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
            <input
              type='text'
              placeholder='Tìm kiếm người chơi, giải đấu...'
              className='pl-10 pr-4 py-2 w-80 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20'
            />
          </div>

          {/* Notifications */}
          <NotificationBadge
            count={0}
            hasUrgent={false}
            onClick={() => {
              navigate('/notifications');
            }}
          />

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Menu */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='ghost' className='flex items-center gap-2 p-1'>
                  <Avatar className='h-8 w-8'>
                    <AvatarImage src={user.user_metadata?.avatar_url} />
                    <AvatarFallback>
                      {user.user_metadata?.full_name?.charAt(0) ||
                        user.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className='hidden md:block text-sm font-medium'>
                    {user.user_metadata?.full_name || user.email}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-56'>
                <DropdownMenuItem asChild>
                  <Link to='/profile' className='flex items-center'>
                    <User className='w-4 h-4 mr-2' />
                    Hồ sơ cá nhân
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to='/dashboard' className='flex items-center'>
                    <Settings className='w-4 h-4 mr-2' />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to='/notifications' className='flex items-center'>
                    <Bell className='w-4 h-4 mr-2' />
                    Thông báo
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className='w-4 h-4 mr-2' />
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className='flex items-center gap-2'>
              <Button variant='ghost' asChild>
                <Link to='/login'>Đăng nhập</Link>
              </Button>
              <Button asChild>
                <Link to='/register'>Đăng ký</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
