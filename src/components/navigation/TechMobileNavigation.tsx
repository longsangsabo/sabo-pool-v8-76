import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { TechNavigation } from '@/components/ui/sabo-tech-global';
import {
  Home,
  User,
  Trophy,
  Calendar,
  BarChart3,
  Settings,
} from 'lucide-react';

export const TechMobileNavigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navigationItems = [
    {
      icon: <Home />,
      label: 'Trang chủ',
      path: '/',
      active: location.pathname === '/',
    },
    {
      icon: <Trophy />,
      label: 'Thách đấu',
      path: '/challenges',
      active: location.pathname === '/challenges',
    },
    {
      icon: <Calendar />,
      label: 'Lịch',
      path: '/calendar',
      active: location.pathname === '/calendar',
    },
    {
      icon: <BarChart3 />,
      label: 'Bảng xếp hạng',
      path: '/leaderboard',
      active: location.pathname === '/leaderboard',
    },
    {
      icon: <User />,
      label: 'Hồ sơ',
      path: '/profile',
      active: location.pathname === '/profile',
    },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <TechNavigation items={navigationItems} onNavigate={handleNavigation} />
  );
};
