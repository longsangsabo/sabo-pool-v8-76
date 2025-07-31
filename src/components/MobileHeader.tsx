import { Bell, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useAvatar } from '@/contexts/AvatarContext';

const MobileHeader = () => {
  const { user } = useAuth();
  const { avatarUrl } = useAvatar();

  return (
    <header className='fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white z-40 safe-area-padding-top'>
      <div className='flex items-center justify-between px-4 h-16'>
        {/* Logo */}
        <Link to='/' className='flex items-center space-x-2'>
          <div className='w-8 h-8 bg-white rounded-lg flex items-center justify-center'>
            <span className='text-blue-600 font-bold text-sm'>SP</span>
          </div>
          <div className='hidden sm:block'>
            <span className='text-lg font-bold'>SABO ARENA</span>
          </div>
        </Link>

        {/* Right side actions */}
        <div className='flex items-center space-x-3'>
          {user ? (
            <>
              {/* Search Button */}
              <Button
                variant='ghost'
                size='icon'
                className='text-white hover:bg-white/20 h-10 w-10'
              >
                <Search className='h-5 w-5' />
              </Button>

              {/* Notifications */}
              <div className='relative'>
                <Button
                  variant='ghost'
                  size='icon'
                  className='text-white hover:bg-white/20 h-10 w-10'
                >
                  <Bell className='h-5 w-5' />
                </Button>
                {/* Notification badge */}
                <Badge className='absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs border-2 border-blue-600'>
                  3
                </Badge>
              </div>

              {/* User Avatar */}
              <Link to='/profile'>
                <Avatar className='h-10 w-10 border-2 border-white/20'>
                  <AvatarImage src={avatarUrl || user?.user_metadata?.avatar_url} />
                  <AvatarFallback className='bg-white/20 text-white'>
                    {user?.user_metadata?.full_name?.charAt(0) ||
                      user?.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </>
          ) : (
            /* Auth buttons for non-logged users */
            <div className='flex items-center space-x-2'>
              <Link to='/login'>
                <Button
                  variant='ghost'
                  size='sm'
                  className='text-white hover:bg-white/20'
                >
                  Đăng nhập
                </Button>
              </Link>
              <Link to='/register'>
                <Button
                  size='sm'
                  className='bg-white text-blue-600 hover:bg-white/90'
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

export default MobileHeader;
