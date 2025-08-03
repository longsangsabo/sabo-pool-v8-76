import React from 'react';
import { Link } from 'react-router-dom';
import { Target, Bell, Settings, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';

export const DesktopHeader: React.FC = () => {
  const { user } = useAuth();

  return (
    <header className='sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
      <div className='container flex h-16 items-center justify-between px-6'>
        {/* Logo */}
        <Link to='/' className='flex items-center space-x-2'>
          <div className='w-8 h-8 bg-primary rounded-lg flex items-center justify-center'>
            <Target className='w-5 h-5 text-primary-foreground' />
          </div>
          <span className='text-xl font-bold'>SABO ARENA</span>
        </Link>

        {/* Search Bar */}
        <div className='flex-1 max-w-md mx-8'>
          <div className='relative'>
            <input
              type='text'
              placeholder='Tìm kiếm người chơi, giải đấu...'
              className='w-full h-10 px-4 pr-10 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20'
            />
          </div>
        </div>

        {/* Right Actions */}
        <div className='flex items-center space-x-4'>
          <Button variant='ghost' size='icon'>
            <Bell className='h-5 w-5' />
          </Button>
          <Button variant='ghost' size='icon'>
            <Settings className='h-5 w-5' />
          </Button>

          {user ? (
            <Avatar className='h-8 w-8'>
              <AvatarImage src={user.user_metadata?.avatar_url} />
              <AvatarFallback>
                {user.user_metadata?.full_name?.charAt(0) ||
                  user.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ) : (
            <Button variant='ghost' size='icon'>
              <User className='h-5 w-5' />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
