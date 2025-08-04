import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface PublicRouteProps {
  children: React.ReactNode;
}

export const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { user, loading, session } = useAuth();

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-background'>
        <div className='text-center'>
          <Loader2 className='h-8 w-8 animate-spin mx-auto mb-4 text-primary' />
          <p className='text-muted-foreground'>Đang kiểm tra xác thực...</p>
        </div>
      </div>
    );
  }

  if (user && session) {
    // If user is already authenticated, redirect to dashboard
    return <Navigate to='/dashboard' replace />;
  }

  return <>{children}</>;
};
