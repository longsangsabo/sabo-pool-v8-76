import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Button } from '@/shared/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { ThemeToggle } from '@/shared/components/ui/theme-toggle';
import { 
  Bell, 
  Settings, 
  LogOut, 
  User, 
  Building,
  Users,
  Calendar,
  BarChart3
} from 'lucide-react';

interface ClubHeaderProps {
  className?: string;
}

/**
 * ClubHeader - Header component for club management dashboard
 * Features club selection, member management, and quick actions
 */
export const ClubHeader: React.FC<ClubHeaderProps> = ({
  className
}) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className={cn(
      'sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
      'border-blue-200 dark:border-blue-800',
      className
    )}>
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left section - Club branding and info */}
        <div className="flex items-center space-x-4">
          <h1 className="text-lg font-semibold text-blue-600">
            Club Management
          </h1>
          
          {/* Club Status Indicators */}
          <div className="hidden md:flex items-center space-x-2">
            <Badge variant="outline" className="text-green-600 border-green-600">
              <Users className="w-3 h-3 mr-1" />
              24 Members
            </Badge>
            <Badge variant="outline" className="text-blue-600 border-blue-600">
              <Calendar className="w-3 h-3 mr-1" />
              3 Events
            </Badge>
          </div>
        </div>

        {/* Right section - Club actions */}
        <div className="flex items-center space-x-4">
          {/* Quick Actions */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/club/management/members')}
            className="hidden md:flex"
          >
            <Users className="h-4 w-4 mr-2" />
            Members
          </Button>

          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/club/management/analytics')}
            className="hidden md:flex"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
            >
              2
            </Badge>
          </Button>

          {/* Club Manager User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8 ring-2 ring-blue-500">
                  <AvatarImage src={user?.user_metadata?.avatar_url} alt="Avatar" />
                  <AvatarFallback className="bg-blue-100 text-blue-800">
                    {user?.email?.charAt(0).toUpperCase() || 'C'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium text-sm">
                    {user?.user_metadata?.full_name || user?.email}
                  </p>
                  <p className="w-[200px] truncate text-xs text-muted-foreground">
                    Club Manager • {user?.email}
                  </p>
                </div>
              </div>
              <DropdownMenuSeparator />
              
              {/* Quick Dashboard Switches */}
              <DropdownMenuItem onClick={() => navigate('/user')}>
                <User className="mr-2 h-4 w-4" />
                <span>User Dashboard</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={() => navigate('/club/management/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Club Settings</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                onClick={handleSignOut}
                className="text-red-600 focus:text-red-600"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default ClubHeader;
