import { useState, ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Target,
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  User,
  Crown,
  Calendar,
  History,
  Trophy,
  Swords,
  ShoppingBag,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const menuItems = [
    { name: 'Tổng quan', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Hồ sơ cá nhân', href: '/profile', icon: User },
    { name: 'Gói hội viên', href: '/membership', icon: Crown },
    { name: 'Giải đấu', href: '/tournaments', icon: Calendar },
    { name: 'Lịch sử trận đấu', href: '/matches', icon: History },
    { name: 'Ranking', href: '/ranking', icon: Trophy },
    { name: 'Thách đấu', href: '/challenges', icon: Swords },
    { name: 'Marketplace', href: '/marketplace', icon: ShoppingBag },
  ];

  return (
    <div className='min-h-screen bg-gray-50 flex'>
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className='fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden'
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out flex flex-col',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className='flex items-center justify-between h-16 px-4 border-b'>
          <Link to='/' className='flex items-center space-x-2'>
            <div className='w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center'>
              <Target className='w-5 h-5 text-white' />
            </div>
            <span className='text-lg font-bold text-blue-700'>SABO ARENA</span>
          </Link>
          <Button
            variant='ghost'
            size='sm'
            className='lg:hidden'
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className='h-5 w-5' />
          </Button>
        </div>

        {/* Navigation */}
        <nav className='flex-1 px-4 py-6 space-y-2'>
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;

            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors',
                  isActive
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
                onClick={() => setIsSidebarOpen(false)}
              >
                <Icon className='w-5 h-5' />
                <span className='font-medium'>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className='p-4 border-t'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' className='w-full justify-start p-2'>
                <Avatar className='h-8 w-8 mr-3'>
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback>
                    {user?.user_metadata?.full_name?.charAt(0) ||
                      user?.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className='flex-1 text-left'>
                  <div className='font-medium text-sm'>
                    {user?.user_metadata?.full_name || 'User'}
                  </div>
                  <div className='text-xs text-gray-500 truncate'>
                    {user?.email}
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className='w-56' align='start' forceMount>
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className='mr-2 h-4 w-4' />
                Đăng xuất
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content */}
      <div className='flex-1 flex flex-col'>
        {/* Top Bar */}
        <header className='bg-white shadow-sm border-b h-16 flex items-center justify-between px-4 lg:px-6'>
          <Button
            variant='ghost'
            size='sm'
            className='lg:hidden'
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className='h-6 w-6' />
          </Button>
          <div className='hidden lg:block'>
            <h1 className='text-xl font-semibold text-gray-900'>Dashboard</h1>
          </div>
        </header>

        {/* Page Content */}
        <main className='flex-1 p-4 lg:p-6'>{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
