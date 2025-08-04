import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { Loader2 } from 'lucide-react';

interface RouteGuardProps {
  children: React.ReactNode;
  requiredRole?: 'user' | 'club_owner' | 'admin';
  fallbackPath?: string;
}

/**
 * RouteGuard - Protects routes based on user roles
 * Used within route definitions to control access
 */
export const RouteGuard: React.FC<RouteGuardProps> = ({
  children,
  requiredRole = 'user',
  fallbackPath = '/auth'
}) => {
  const { user, loading } = useAuth();
  const { hasRole, loading: permissionsLoading } = useUserPermissions();
  const location = useLocation();

  // Show loading while checking auth and permissions
  if (loading || permissionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if not authenticated
  if (!user) {
    return (
      <Navigate 
        to={`${fallbackPath}?redirect=${encodeURIComponent(location.pathname)}`} 
        replace 
      />
    );
  }

  // Check role-based access
  if (!hasRole(requiredRole)) {
    // Redirect based on what roles user actually has
    if (hasRole('admin')) {
      return <Navigate to="/admin" replace />;
    } else if (hasRole('club_owner')) {
      return <Navigate to="/club" replace />;
    } else {
      return <Navigate to="/user" replace />;
    }
  }

  return <>{children}</>;
};

interface PermissionGuardProps {
  children: React.ReactNode;
  requiredPermission: string;
  fallbackPath?: string;
}

/**
 * PermissionGuard - Protects routes based on specific permissions
 * More granular than role-based protection
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  requiredPermission,
  fallbackPath = '/user/dashboard'
}) => {
  const { user, loading } = useAuth();
  const { hasPermission, loading: permissionsLoading } = useUserPermissions();
  const location = useLocation();

  // Show loading while checking permissions
  if (loading || permissionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Đang kiểm tra quyền hạn...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if not authenticated
  if (!user) {
    return (
      <Navigate 
        to={`/auth?redirect=${encodeURIComponent(location.pathname)}`} 
        replace 
      />
    );
  }

  // Check specific permission
  if (!hasPermission(requiredPermission)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};

interface SmartRedirectProps {
  children: React.ReactNode;
}

/**
 * SmartRedirect - Automatically redirects users to appropriate dashboard
 * based on their highest role/permission level
 */
export const SmartRedirect: React.FC<SmartRedirectProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const { hasRole, loading: permissionsLoading } = useUserPermissions();

  // Show loading while checking auth and permissions
  if (loading || permissionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Đang xác định trang chủ...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if not authenticated
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect to appropriate dashboard based on highest role
  if (hasRole('admin')) {
    return <Navigate to="/admin" replace />;
  } else if (hasRole('club_owner')) {
    return <Navigate to="/club" replace />;
  } else {
    return <Navigate to="/user" replace />;
  }
};

export default RouteGuard;
