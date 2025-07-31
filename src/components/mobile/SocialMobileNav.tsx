
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Trophy, Users, Calendar, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: Home, path: '/dashboard', label: 'Trang chủ' },
  { icon: User, path: '/profile', label: 'Hồ sơ' },
  { icon: Trophy, path: '/tournaments', label: 'Giải đấu' },
  { icon: Users, path: '/challenges', label: 'Thách đấu' },
  { icon: Calendar, path: '/calendar', label: 'Lịch' },
];

const SocialMobileNav: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="mobile-nav-enhanced">
      <div className="flex justify-around items-center py-2 px-safe">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || 
                         (item.path !== '/dashboard' && location.pathname.startsWith(item.path));

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "mobile-nav-item flex flex-col items-center gap-1 px-3 py-2 transition-colors",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default SocialMobileNav;
