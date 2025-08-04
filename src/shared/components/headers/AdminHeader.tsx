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
  Activity,
  Database,
  AlertTriangle
} from 'lucide-react';

interface AdminHeaderProps {
  className?: string;
}

/**
 * AdminHeader - Header component for admin dashboard
 * Features system monitoring, admin tools, and quick actions
 */
export const AdminHeader: React.FC<AdminHeaderProps> = ({
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
      'border-orange-200 dark:border-orange-800',
      className
    )}>
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left section - Admin branding and system status */}
        <div className="flex items-center space-x-4">
          <h1 className="text-lg font-semibold text-orange-600">
            Admin Dashboard
          </h1>
          
          {/* System Status Indicators */}
          <div className="hidden md:flex items-center space-x-2">
            <Badge variant="outline" className="text-green-600 border-green-600">
              <Activity className="w-3 h-3 mr-1" />
              System OK
            </Badge>
            <Badge variant="outline" className="text-blue-600 border-blue-600">
              <Database className="w-3 h-3 mr-1" />
              DB Connected
            </Badge>
          </div>
        </div>

        {/* Right section - Admin actions */}
        <div className="flex items-center space-x-4">
          {/* Quick Actions */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/admin/system')}
            className="hidden md:flex"
          >
            <Activity className="h-4 w-4 mr-2" />
            System Monitor
          </Button>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Emergency Alerts */}
          <Button variant="ghost" size="sm" className="relative">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
            >
              !
            </Badge>
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
            >
              5
            </Badge>
          </Button>

          {/* Admin User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8 ring-2 ring-orange-500">
                  <AvatarImage src={user?.user_metadata?.avatar_url} alt="Avatar" />
                  <AvatarFallback className="bg-orange-100 text-orange-800">
                    {user?.email?.charAt(0).toUpperCase() || 'A'}
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
                    Admin • {user?.email}
                  </p>
                </div>
              </div>
              <DropdownMenuSeparator />
              
              {/* Quick Dashboard Switches */}
              <DropdownMenuItem onClick={() => navigate('/user')}>
                <User className="mr-2 h-4 w-4" />
                <span>User Dashboard</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => navigate('/club')}>
                <Building className="mr-2 h-4 w-4" />
                <span>Club Dashboard</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={() => navigate('/admin/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Admin Settings</span>
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

export default AdminHeader;
