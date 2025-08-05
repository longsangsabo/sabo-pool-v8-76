import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Users,
  Trophy,
  MessageSquare,
  User,
  Menu,
  X,
  Home,
  Store,
  Shield,
  Bell,
  Calendar,
  BarChart3,
  Gamepad2,
  Heart,
} from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '@/hooks/useAuth';
// Admin check removed - admin links moved to AdminRouter
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Badge } from './ui/badge';
import NotificationBadge from './NotificationBadge';
import SPAPointsBadge from './SPAPointsBadge';
import { supabase } from '@/integrations/supabase/client';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  console.log('Header: user:', user?.id, user?.phone);

  // Admin check removed for performance - admin functionality separated

  const location = useLocation();

  // Admin functionality moved to AdminRouter - no admin checks in user components

  const navigationItems = [
    { name: 'Trang chủ', href: '/', icon: Home },
    { name: 'Xếp hạng', href: '/leaderboard', icon: Trophy },
    { name: 'Thách đấu', href: '/challenges', icon: Gamepad2 },
    { name: 'Giải đấu', href: '/tournaments', icon: Calendar },
    { name: 'Cộng đồng', href: '/social-feed', icon: Heart },
    { name: 'Marketplace', href: '/enhanced-marketplace', icon: Store },
    { name: 'CLB', href: '/clubs', icon: Users },
    { name: 'Đăng ký CLB', href: '/club-registration', icon: Shield },
    { name: 'Phân tích', href: '/analytics', icon: BarChart3 },
  ];

  const isActiveRoute = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <header className='bg-white shadow-sm border-b sticky top-0 z-50'>
      <div className='container mx-auto px-4'>
        <div className='flex items-center justify-between h-16'>
          {/* Logo */}
          <Link to='/' className='flex items-center space-x-2'>
            <div className='w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center'>
              <span className='text-white font-bold text-sm'>🎱</span>
            </div>
            <span className='font-bold text-xl text-gray-900'>SABO ARENA</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className='hidden lg:flex items-center space-x-1'>
            {navigationItems.map(item => {
              const Icon = item.icon;
              const isActive = isActiveRoute(item.href);

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className='w-4 h-4' />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Side */}
          <div className='flex items-center space-x-4'>
            {/* SPA Points Badge */}
            {user && <SPAPointsBadge />}

            {/* Notifications */}
            {user && (
              <NotificationBadge
                count={notifications?.length || 0}
                hasUrgent={
                  notifications?.some(n => n.priority === 'high') || false
                }
                onClick={() => {
                  navigate('/notifications');
                }}
              />
            )}

            {/* User Menu */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='ghost'
                    className='flex items-center space-x-2 p-1'
                  >
                    <Avatar className='h-8 w-8'>
                      <AvatarImage src='/placeholder.svg' />
                      <AvatarFallback>
                        {user.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className='hidden md:block text-sm font-medium'>
                      {user.email}
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
                      <BarChart3 className='w-4 h-4 mr-2' />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to='/notifications' className='flex items-center'>
                      <Bell className='w-4 h-4 mr-2' />
                      Thông báo
                    </Link>
                  </DropdownMenuItem>
                  {/* Admin link removed - handled in AdminRouter */}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className='flex items-center space-x-2'>
                <Button variant='ghost' asChild>
                  <Link to='/login'>Đăng nhập</Link>
                </Button>
                <Button asChild>
                  <Link to='/register'>Đăng ký</Link>
                </Button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant='ghost'
              size='sm'
              className='lg:hidden'
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className='w-5 h-5' />
              ) : (
                <Menu className='w-5 h-5' />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className='lg:hidden py-4 border-t'>
            <nav className='space-y-2'>
              {navigationItems.map(item => {
                const Icon = item.icon;
                const isActive = isActiveRoute(item.href);

                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Icon className='w-5 h-5' />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
