import React from 'react';
import { Home, Trophy, Grid, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ArenaNavigation: React.FC = () => {
  const navigate = useNavigate();

  const navItems = [
    { icon: Home, path: '/dashboard', label: 'Home' },
    { icon: Trophy, path: '/tournaments', label: 'Tournaments' },
    { icon: Grid, path: '/matches', label: 'Matches' },
    { icon: User, path: '/profile', label: 'Profile', active: true },
  ];

  return (
    <div className='arena-navigation'>
      {navItems.map((item, index) => {
        const Icon = item.icon;
        return (
          <div
            key={index}
            className={`nav-item ${item.active ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <Icon className='nav-icon' />
            <span className='nav-label'>{item.label}</span>
          </div>
        );
      })}
    </div>
  );
};
