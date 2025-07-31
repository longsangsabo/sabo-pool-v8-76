
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bell, Search, Menu } from 'lucide-react';

interface UserMobileHeaderProps {
  title?: string;
  showSearch?: boolean;
  showProfile?: boolean;
  showNotifications?: boolean;
  onMenuClick?: () => void;
}

const UserMobileHeader: React.FC<UserMobileHeaderProps> = ({
  title,
  showSearch = true,
  showProfile = true,
  showNotifications = true,
  onMenuClick
}) => {
  const { user } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 bg-card border-b border-border px-4 py-3 z-[1000] mobile-safe-area-top px-safe">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onMenuClick && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMenuClick}
              className="hover:bg-muted"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          
          <h1 className="text-lg font-bold">{title || 'Social App'}</h1>
        </div>

        <div className="flex items-center gap-2">
          {showSearch && (
            <Button variant="ghost" size="sm">
              <Search className="h-4 w-4" />
            </Button>
          )}

          {showNotifications && (
            <Button variant="ghost" size="sm">
              <Bell className="h-4 w-4" />
            </Button>
          )}

          {showProfile && (
            <Avatar className="h-7 w-7">
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback className="text-xs">
                {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>
    </header>
  );
};

export default UserMobileHeader;
