import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { Loader2 } from 'lucide-react';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({
  children,
}) => {
  const { user, loading: authLoading, session } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  const location = useLocation();

  // Extended loading state check
  if (authLoading || adminLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-background'>
        <div className='text-center'>
          <Loader2 className='h-8 w-8 animate-spin mx-auto mb-4 text-primary' />
          <p className='text-muted-foreground'>Đang xác thực quyền admin...</p>
        </div>
      </div>
    );
  }

  // Check for both user and session for stronger authentication
  if (!user || !session) {
    // Clear any corrupted auth data
    if (!session) {
      localStorage.removeItem('supabase.auth.token');
    }

    // Redirect to auth with return URL
    return (
      <Navigate
        to={`/auth?redirect=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  // Check admin privileges
  if (!isAdmin) {
    // Redirect to dashboard if user is not admin
    return <Navigate to='/dashboard' replace />;
  }

  return <>{children}</>;
};
