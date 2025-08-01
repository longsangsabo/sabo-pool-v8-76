import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Menu,
  X,
  Trophy,
  Target,
  Users,
  Circle,
  User,
  Settings,
  Wallet,
  HelpCircle,
  LogOut,
  LayoutDashboard,
  Crown,
  History,
  Shield,
  Mail,
  Bell,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { checkUserAdminStatus } from '@/utils/adminHelpers';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/ui/theme-toggle';

const Navigation = () => {
  const { user, signOut } = useAuth();
  const { getUnreadCount } = useNotifications();
  // Admin check removed for performance - admin functionality separated
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isClubOwner, setIsClubOwner] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is a verified club owner and admin - optimized with error handling
  useEffect(() => {
    if (!user) {
      setIsClubOwner(false);
      setIsAdmin(false);
      return;
    }

    const checkUserStatus = async () => {
      try {
        // Run both checks in parallel to improve performance
        const [clubResult, adminResult] = await Promise.allSettled([
          // Check club owner status
          // Check club owner status using clubs table
          supabase.from('clubs').select('id').eq('owner_id', user.id).single(),
          // Check admin status using profile table directly
          supabase
            .from('profiles')
            .select('is_admin')
            .eq('user_id', user.id)
            .single(),
        ]);

        // Handle club owner result
        if (
          clubResult.status === 'fulfilled' &&
          clubResult.value.data &&
          !clubResult.value.error
        ) {
          setIsClubOwner(true);
        } else {
          setIsClubOwner(false);
        }

        // Handle admin result
        if (
          adminResult.status === 'fulfilled' &&
          adminResult.value.data &&
          !adminResult.value.error
        ) {
          setIsAdmin(adminResult.value.data.is_admin || false);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error checking user status:', error);
        setIsClubOwner(false);
        setIsAdmin(false);
      }
    };

    // Add timeout to prevent hanging
    const timeoutId = setTimeout(() => {
      console.warn('User status check timed out');
      setIsClubOwner(false);
      setIsAdmin(false);
    }, 5000); // 5 second timeout

    checkUserStatus().finally(() => {
      clearTimeout(timeoutId);
    });
  }, [user]);

  const unreadCount = getUnreadCount();

  const handleLogout = async () => {
    await signOut();
    setIsMenuOpen(false);
  };

  const navigationItems = [
    { name: 'Trang chủ', href: '/', current: location.pathname === '/' },
    {
      name: 'Giải đấu',
      href: '/tournaments',
      current: location.pathname === '/tournaments',
    },
    {
      name: 'Thách đấu',
      href: '/challenges',
      current: location.pathname === '/challenges',
    },
    {
      name: 'Ranking',
      href: '/leaderboard',
      current: location.pathname === '/leaderboard',
    },
    { name: 'CLB', href: '/clubs', current: location.pathname === '/clubs' },
    {
      name: 'Về chúng tôi',
      href: '/about',
      current: location.pathname === '/about',
    },
    { name: 'Trợ giúp', href: '/help', current: location.pathname === '/help' },
  ];

  const userMenuItems = user
    ? [
        { name: 'Feed', href: '/feed', icon: LayoutDashboard },
        { name: 'Hồ sơ cá nhân', href: '/profile', icon: User },
        {
          name: 'Quản lý CLB',
          href: '/club-management',
          icon: Trophy,
          requiresClub: true,
        },
        { name: 'Gói hội viên', href: '/membership', icon: Crown },
        { name: 'Ví của tôi', href: '/wallet', icon: Wallet },
        { name: 'Lịch sử trận đấu', href: '/matches', icon: History },
        { name: 'Cài đặt', href: '/settings', icon: Settings },
      ]
    : [];

  return (
    <nav className='bg-background/95 backdrop-blur-sm border-b border-border shadow-lg fixed w-full top-0 z-50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between h-16'>
          {/* Logo */}
          <div className='flex items-center'>
            <Link to='/' className='flex items-center space-x-3'>
              <div className='w-10 h-10 bg-gradient-to-r from-primary to-primary-glow rounded-lg flex items-center justify-center shadow-lg'>
                <Circle className='w-6 h-6 text-primary-foreground font-bold' />
              </div>
              <div className='hidden sm:flex flex-col'>
                <span className='text-xl font-black text-foreground'>SABO</span>
                <span className='text-sm text-primary font-bold -mt-1'>
                  ARENA
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className='hidden lg:flex lg:items-center lg:space-x-8'>
            {navigationItems.map(item => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => {
                  console.log(
                    `🔗 [Navigation] Clicking on: ${item.name} -> ${item.href}`
                  );
                }}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  item.current
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-primary hover:border-b-2 hover:border-primary/50'
                }`}
              >
                {item.name}
              </Link>
            ))}

            {/* Admin & Club Management - Desktop */}
            {isAdmin && (
              <Link
                to='/admin'
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  location.pathname === '/admin'
                    ? 'text-accent-red border-b-2 border-accent-red'
                    : 'text-muted-foreground hover:text-accent-red hover:border-b-2 hover:border-accent-red/50'
                }`}
              >
                <div className='flex items-center space-x-1'>
                  <Shield className='w-4 h-4' />
                  <span>Admin</span>
                </div>
              </Link>
            )}

            {isClubOwner && (
              <Link
                to='/club-management'
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  location.pathname === '/club-management'
                    ? 'text-accent-purple border-b-2 border-accent-purple'
                    : 'text-muted-foreground hover:text-accent-purple hover:border-b-2 hover:border-accent-purple/50'
                }`}
              >
                <div className='flex items-center space-x-1'>
                  <Trophy className='w-4 h-4' />
                  <span>CLB</span>
                </div>
              </Link>
            )}

            {/* Inbox Icon - Only show when logged in */}
            {user && (
              <Link
                to='/inbox'
                className={`relative px-3 py-2 text-sm font-medium transition-colors ${
                  location.pathname === '/inbox'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-primary hover:border-b-2 hover:border-primary/50'
                }`}
              >
                <div className='relative'>
                  <Mail className='w-5 h-5' />
                  {unreadCount > 0 && (
                    <Badge
                      className='absolute -top-2 -right-2 h-4 w-4 p-0 text-xs bg-accent-red hover:bg-accent-red flex items-center justify-center'
                      variant='destructive'
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Badge>
                  )}
                </div>
              </Link>
            )}
          </div>

          {/* User Menu & Auth Buttons */}
          <div className='flex items-center space-x-4'>
            {/* Theme Toggle Button - Desktop only */}
            <div className='hidden lg:block'>
              <ThemeToggle />
            </div>
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='ghost'
                    className='relative h-8 w-8 rounded-full'
                  >
                    <Avatar className='h-8 w-8'>
                      <AvatarImage src={user.user_metadata?.avatar_url} />
                      <AvatarFallback>
                        {user.user_metadata?.full_name?.charAt(0) ||
                          user.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className='w-56' align='end' forceMount>
                  <DropdownMenuLabel className='font-normal'>
                    <div className='flex flex-col space-y-1'>
                      <p className='text-sm font-medium leading-none'>
                        {user.user_metadata?.full_name || 'User'}
                      </p>
                      <p className='text-xs leading-none text-muted-foreground'>
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {userMenuItems.map(item => {
                    const Icon = item.icon;
                    // Skip club management if user is not a club owner
                    if (item.requiresClub && !isClubOwner) return null;

                    return (
                      <DropdownMenuItem key={item.name} asChild>
                        <Link to={item.href} className='flex items-center'>
                          <Icon className='mr-2 h-4 w-4' />
                          <span>{item.name}</span>
                        </Link>
                      </DropdownMenuItem>
                    );
                  })}
                  {/* Admin menu item - only show for admin users */}
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to='/admin' className='flex items-center'>
                          <Shield className='mr-2 h-4 w-4' />
                          <span>Quản trị</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className='mr-2 h-4 w-4' />
                    <span>Đăng xuất</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className='flex items-center space-x-4'>
                <Link to='/login'>
                  <Button
                    variant='ghost'
                    className='text-muted-foreground hover:text-foreground'
                  >
                    Đăng nhập
                  </Button>
                </Link>
                <Link to='/register'>
                  <Button className='bg-gradient-to-r from-primary to-primary-glow hover:from-primary/90 hover:to-primary-glow/90 text-primary-foreground font-bold'>
                    Đăng ký
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <div className='lg:hidden'>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <Menu className='h-5 w-5' />
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className='lg:hidden border-t border-border bg-background/95 backdrop-blur-sm'>
            <div className='px-2 pt-2 pb-3 space-y-1'>
              {/* Theme Toggle for Mobile */}
              <div className='px-3 py-2'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium text-muted-foreground'>
                    Giao diện
                  </span>
                  <ThemeToggle />
                </div>
              </div>

              {navigationItems.map(item => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`block px-3 py-2 text-base font-medium rounded-md transition-colors ${
                    item.current
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-primary hover:bg-muted/50'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}

              {/* Mobile Inbox Link */}
              {user && (
                <Link
                  to='/inbox'
                  className={`flex items-center justify-between px-3 py-2 text-base font-medium rounded-md transition-colors ${
                    location.pathname === '/inbox'
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-primary hover:bg-muted/50'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className='flex items-center'>
                    <Mail className='w-5 h-5 mr-2' />
                    Hộp thư
                  </div>
                  {unreadCount > 0 && (
                    <Badge
                      className='h-5 w-5 p-0 text-xs bg-accent-red hover:bg-accent-red flex items-center justify-center'
                      variant='destructive'
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Badge>
                  )}
                </Link>
              )}

              {/* Mobile Admin & Club Links */}
              {isAdmin && (
                <Link
                  to='/admin'
                  className={`flex items-center px-3 py-2 text-base font-medium rounded-md transition-colors ${
                    location.pathname === '/admin'
                      ? 'text-accent-red bg-accent-red/10'
                      : 'text-muted-foreground hover:text-accent-red hover:bg-muted/50'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Shield className='w-5 h-5 mr-2' />
                  Quản trị Admin
                </Link>
              )}

              {isClubOwner && (
                <Link
                  to='/club-management'
                  className={`flex items-center px-3 py-2 text-base font-medium rounded-md transition-colors ${
                    location.pathname === '/club-management'
                      ? 'text-accent-purple bg-accent-purple/10'
                      : 'text-muted-foreground hover:text-accent-purple hover:bg-muted/50'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Trophy className='w-5 h-5 mr-2' />
                  Quản lý CLB
                </Link>
              )}

              {!user && (
                <div className='pt-4 border-t border-border'>
                  <Link
                    to='/login'
                    className='block px-3 py-2 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors'
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to='/register'
                    className='block px-3 py-2 text-base font-medium bg-gradient-to-r from-primary to-primary-glow text-primary-foreground rounded-md mt-2 transition-colors'
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Đăng ký
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
