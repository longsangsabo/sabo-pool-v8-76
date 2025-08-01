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

const UserNavigation = () => {
  const { user, signOut } = useAuth();
  const { getUnreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isClubOwner, setIsClubOwner] = useState(false);

  // ✅ NO ADMIN CODE HERE - Club owner check only for user features
  useEffect(() => {
    if (!user) {
      setIsClubOwner(false);
      return;
    }

    let isSubscriptionActive = true;

    const checkClubOwnership = async () => {
      try {
        // Only check club ownership for user features
        const [clubResult] = await Promise.allSettled([
          supabase
            .from('clubs')
            .select('id')
            .eq('owner_id', user.id)
            .eq('status', 'approved')
            .limit(1),
        ]);

        if (!isSubscriptionActive) return;

        // Handle club result
        if (
          clubResult.status === 'fulfilled' &&
          clubResult.value.data &&
          !clubResult.value.error
        ) {
          setIsClubOwner(clubResult.value.data.length > 0);
        } else {
          setIsClubOwner(false);
        }
      } catch (error) {
        console.error('Error checking club ownership:', error);
        setIsClubOwner(false);
      }
    };

    checkClubOwnership();

    return () => {
      isSubscriptionActive = false;
      setIsClubOwner(false);
    };
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const unreadCount = getUnreadCount();

  const navigationItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/tournaments', icon: Trophy, label: 'Tournaments' },
    { to: '/challenges', icon: Target, label: 'Challenges' },
    { to: '/leaderboard', icon: Crown, label: 'Leaderboard' },
    { to: '/community', icon: Users, label: 'Community' },
    { to: '/clubs', icon: Shield, label: 'Clubs' },
    { to: '/feed', icon: Mail, label: 'Feed' },
  ];

  // ✅ Club management items (user feature, not admin)
  const clubManagementItems = isClubOwner ? [
    { to: '/club-management', icon: Shield, label: 'Club Management' },
  ] : [];

  const mobileMenuItems = [
    ...navigationItems,
    ...clubManagementItems,
    { to: '/profile', icon: User, label: 'Profile' },
    { to: '/wallet', icon: Wallet, label: 'Wallet' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  const toggleMobileMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMenuOpen(false);
  };

  // Get initials for avatar fallback
  const getInitials = (email: string) => {
    return email.split('@')[0].slice(0, 2).toUpperCase();
  };

  if (!user) {
    return (
      <nav className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="text-xl font-bold text-primary">
              SABO Pool Arena
            </Link>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Button variant="ghost" asChild>
                <Link to="/auth/login">Sign In</Link>
              </Button>
              <Button asChild>
                <Link to="/auth/register">Sign Up</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/dashboard" className="text-xl font-bold text-primary">
              SABO Pool Arena
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navigationItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === item.to
                    ? 'bg-primary text-primary-foreground'
                    : 'text-gray-600 dark:text-gray-300 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <item.icon size={16} />
                <span>{item.label}</span>
              </Link>
            ))}

            {/* Club Management for club owners */}
            {isClubOwner && (
              <Link
                to="/club-management"
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname.startsWith('/club-management')
                    ? 'bg-primary text-primary-foreground'
                    : 'text-gray-600 dark:text-gray-300 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Shield size={16} />
                <span>Club Management</span>
              </Link>
            )}
          </div>

          {/* Desktop User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <ThemeToggle />
            
            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/notifications')}
              className="relative"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={user.user_metadata?.avatar_url}
                      alt={user.email || 'User'}
                    />
                    <AvatarFallback>
                      {getInitials(user.email || 'User')}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.user_metadata?.full_name || 'User'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/wallet')}>
                  <Wallet className="mr-2 h-4 w-4" />
                  <span>Wallet</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            <ThemeToggle />
            
            {/* Mobile Notifications */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/notifications')}
              className="relative"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMobileMenu}
              className="text-gray-600 dark:text-gray-300"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200 dark:border-gray-700">
              {mobileMenuItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={closeMobileMenu}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    location.pathname === item.to ||
                    (item.to === '/club-management' &&
                      location.pathname.startsWith('/club-management'))
                      ? 'bg-primary text-primary-foreground'
                      : 'text-gray-600 dark:text-gray-300 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </Link>
              ))}
              
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex items-center px-3 py-2">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={user.user_metadata?.avatar_url}
                      alt={user.email || 'User'}
                    />
                    <AvatarFallback>
                      {getInitials(user.email || 'User')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="ml-3">
                    <div className="text-base font-medium text-gray-800 dark:text-white">
                      {user.user_metadata?.full_name || 'User'}
                    </div>
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {user.email}
                    </div>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  onClick={handleSignOut}
                  className="w-full justify-start mt-2 text-gray-600 dark:text-gray-300"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default UserNavigation;
