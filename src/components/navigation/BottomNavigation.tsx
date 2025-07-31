import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import {
  Home,
  Search,
  Plus,
  MessageCircle,
  User,
  Target,
  Trophy,
  Wallet,
} from 'lucide-react';

interface BottomNavigationProps {
  unreadMessages?: number;
  unreadNotifications?: number;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  unreadMessages = 0,
  unreadNotifications = 0,
}) => {
  const location = useLocation();

  const navigationItems = [
    {
      path: '/',
      icon: <Home className='h-5 w-5' />,
      label: 'Trang chủ',
      active: location.pathname === '/',
    },
    {
      path: '/discovery',
      icon: <Search className='h-5 w-5' />,
      label: 'Khám phá',
      active: location.pathname.startsWith('/discovery'),
    },
    {
      path: '/challenges',
      icon: <Target className='h-5 w-5' />,
      label: 'Thách đấu',
      active: location.pathname.startsWith('/challenges'),
    },
    {
      path: '/tournaments',
      icon: <Trophy className='h-5 w-5' />,
      label: 'Giải đấu',
      active: location.pathname.startsWith('/tournaments'),
    },
    {
      path: '/chat',
      icon: <MessageCircle className='h-5 w-5' />,
      label: 'Chat',
      active: location.pathname.startsWith('/chat'),
      badge: unreadMessages,
    },
    {
      path: '/wallet',
      icon: <Wallet className='h-5 w-5' />,
      label: 'Ví',
      active: location.pathname.startsWith('/wallet'),
    },
    {
      path: '/profile',
      icon: <User className='h-5 w-5' />,
      label: 'Cá nhân',
      active: location.pathname.startsWith('/profile'),
    },
  ];

  return (
    <nav className='fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:hidden'>
      <div className='flex items-center justify-around px-2 py-2'>
        {navigationItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center w-full py-2 px-1 rounded-lg transition-colors ${
              item.active
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
            }`}
          >
            <div className='relative'>
              {item.icon}
              {item.badge && item.badge > 0 && (
                <Badge className='absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500 text-white'>
                  {item.badge > 99 ? '99+' : item.badge}
                </Badge>
              )}
            </div>
            <span className='text-xs mt-1 font-medium'>{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};
