import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import {
  Search,
  Bell,
  LogOut,
  User,
  Settings,
  Shield,
  Trophy,
  Circle,
} from 'lucide-react';

interface TopBarProps {
  userRole?: 'user' | 'club' | 'admin';
  showSearch?: boolean;
  showNotifications?: boolean;
  showUserMenu?: boolean;
  showAuthButtons?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  userRole,
  showSearch = false,
  showNotifications = false,
  showUserMenu = false,
  showAuthButtons = false,
}) => {
  const { user, signOut } = useAuth();
  const { getUnreadCount } = useNotifications();
  const navigate = useNavigate();

  const unreadCount = getUnreadCount();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const getRoleInfo = () => {
    switch (userRole) {
      case 'admin':
        return { label: 'Admin', color: 'text-red-500', icon: Shield };
      case 'club':
        return { label: 'CLB', color: 'text-purple-500', icon: Trophy };
      default:
        return { label: 'User', color: 'text-primary', icon: User };
    }
  };

  const roleInfo = getRoleInfo();
  const RoleIcon = roleInfo.icon;

  return (
    <header className='fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border shadow-sm'>
      <div className='flex items-center justify-between h-14 px-3 max-w-full'>
        {/* Left: Logo */}
        <div className='flex items-center'>
          <Link to='/' className='flex items-center space-x-2'>
            <div className='w-8 h-8 bg-gradient-to-r from-primary to-primary-glow rounded-lg flex items-center justify-center shadow-md'>
              <Circle className='w-5 h-5 text-primary-foreground font-bold' />
            </div>
            <div className='hidden sm:flex flex-col'>
              <span className='text-lg font-black text-foreground'>SABO</span>
              <span className='text-xs text-primary font-bold -mt-1'>
                ARENA
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Search (Desktop only) */}
        {showSearch && (
          <div className='hidden md:flex flex-1 max-w-md mx-8'>
            <div className='relative w-full'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4' />
              <input
                type='text'
                placeholder='Tìm kiếm...'
                className='w-full pl-10 pr-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary'
              />
            </div>
          </div>
        )}

        {/* Right: Actions */}
        <div className='flex items-center space-x-3'>
          {/* Mobile Search Button */}
          {showSearch && (
            <Button variant='ghost' size='sm' className='md:hidden'>
              <Search className='h-4 w-4' />
            </Button>
          )}

          {/* Notifications */}
          {showNotifications && user && (
            <Button variant='ghost' size='sm' className='relative'>
              <Bell className='h-4 w-4' />
              {unreadCount > 0 && (
                <Badge
                  variant='destructive'
                  className='absolute -top-1 -right-1 h-5 w-5 text-xs p-0 flex items-center justify-center'
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </Button>
          )}

          {/* Theme Toggle */}
          <div className='hidden sm:block'>
            <ThemeToggle />
          </div>

          {/* User Menu */}
          {showUserMenu && user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='ghost'
                  className='relative h-9 w-9 rounded-full'
                >
                  <Avatar className='h-8 w-8'>
                    <AvatarImage src={user.user_metadata?.avatar_url} />
                    <AvatarFallback className='text-sm'>
                      {user.user_metadata?.full_name?.charAt(0) ||
                        user.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className='w-56' align='end' forceMount>
                <DropdownMenuLabel className='font-normal'>
                  <div className='flex flex-col space-y-1'>
                    <div className='flex items-center space-x-2'>
                      <p className='text-sm font-medium leading-none'>
                        {user.user_metadata?.full_name || 'User'}
                      </p>
                      <div
                        className={`flex items-center space-x-1 ${roleInfo.color}`}
                      >
                        <RoleIcon className='w-3 h-3' />
                        <span className='text-xs font-medium'>
                          {roleInfo.label}
                        </span>
                      </div>
                    </div>
                    <p className='text-xs leading-none text-muted-foreground'>
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                  <Link to='/profile' className='flex items-center'>
                    <User className='mr-2 h-4 w-4' />
                    <span>Hồ sơ</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link to='/settings' className='flex items-center'>
                    <Settings className='mr-2 h-4 w-4' />
                    <span>Cài đặt</span>
                  </Link>
                </DropdownMenuItem>

                {/* Role-specific quick access */}
                {userRole === 'admin' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link
                        to='/admin'
                        className='flex items-center text-red-600'
                      >
                        <Shield className='mr-2 h-4 w-4' />
                        <span>Admin Panel</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}

                {userRole === 'club' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link
                        to='/club-management'
                        className='flex items-center text-purple-600'
                      >
                        <Trophy className='mr-2 h-4 w-4' />
                        <span>Quản lý CLB</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className='text-red-600'
                >
                  <LogOut className='mr-2 h-4 w-4' />
                  <span>Đăng xuất</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Auth Buttons for non-authenticated users */}
          {showAuthButtons && !user && (
            <div className='flex items-center space-x-2'>
              <Link to='/login'>
                <Button variant='ghost' size='sm'>
                  Đăng nhập
                </Button>
              </Link>
              <Link to='/register'>
                <Button
                  size='sm'
                  className='bg-gradient-to-r from-primary to-primary-glow hover:from-primary/90 hover:to-primary-glow/90'
                >
                  Đăng ký
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
