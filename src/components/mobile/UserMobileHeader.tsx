import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bell, Search, Menu, User, Settings, LogOut } from 'lucide-react';

interface UserMobileHeaderProps {
  title?: string;
  showSearch?: boolean;
  showProfile?: boolean;
  showNotifications?: boolean;
  onMenuClick?: () => void;
}

const UserMobileHeader: React.FC<UserMobileHeaderProps> = ({
  title,
  showSearch = true,
  showProfile = true,
  showNotifications = true,
  onMenuClick,
}) => {
  const { user, signOut } = useAuth();

  return (
    <header className='fixed top-0 left-0 right-0 bg-card border-b border-border px-4 py-3 z-[1000] mobile-safe-area-top px-safe'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          {onMenuClick && (
            <Button
              variant='ghost'
              size='sm'
              onClick={onMenuClick}
              className='hover:bg-muted'
            >
              <Menu className='h-5 w-5' />
            </Button>
          )}

          <h1 className='text-lg font-bold'>{title || 'SABO ARENA'}</h1>
        </div>

        <div className='flex items-center gap-2'>
          {showSearch && (
            <Button variant='ghost' size='sm'>
              <Search className='h-4 w-4' />
            </Button>
          )}

          {showNotifications && (
            <Button variant='ghost' size='sm'>
              <Bell className='h-4 w-4' />
            </Button>
          )}

          {showProfile && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='ghost'
                  className='relative h-8 w-8 rounded-full p-0'
                >
                  <Avatar className='h-7 w-7'>
                    <AvatarImage src={user?.user_metadata?.avatar_url} />
                    <AvatarFallback className='text-xs'>
                      {user?.user_metadata?.full_name?.charAt(0) ||
                        user?.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className='w-56 bg-card border border-border shadow-lg z-[1001]'
                align='end'
                forceMount
              >
                <div className='flex items-center justify-start gap-2 p-2'>
                  <div className='flex flex-col space-y-1 leading-none'>
                    <p className='font-medium text-sm text-foreground'>
                      {user?.user_metadata?.full_name || user?.email}
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      {user?.email}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem className='cursor-pointer'>
                  <User className='mr-2 h-4 w-4' />
                  <span>Hồ sơ</span>
                </DropdownMenuItem>
                <DropdownMenuItem className='cursor-pointer'>
                  <Settings className='mr-2 h-4 w-4' />
                  <span>Cài đặt</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className='cursor-pointer text-destructive focus:text-destructive'
                  onClick={() => signOut()}
                >
                  <LogOut className='mr-2 h-4 w-4' />
                  <span>Đăng xuất</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
};

export default UserMobileHeader;
