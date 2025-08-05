import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { Loader2, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  const location = useLocation();

  const loading = authLoading || adminLoading;

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-background'>
        <div className='text-center'>
          <Loader2 className='h-8 w-8 animate-spin mx-auto mb-4 text-primary' />
          <p className='text-muted-foreground'>Đang kiểm tra quyền admin...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to={`/auth?redirect=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  // Temporary bypass for admin check debugging
  const bypassAdmin =
    user?.email === 'longsangsabo@gmail.com' ||
    user?.email === 'longsang063@gmail.com';

  if (!isAdmin && !bypassAdmin) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-background p-4'>
        <Card className='w-full max-w-md'>
          <CardHeader className='text-center'>
            <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10'>
              <Shield className='h-6 w-6 text-destructive' />
            </div>
            <CardTitle className='text-xl'>Không Có Quyền Truy Cập</CardTitle>
          </CardHeader>
          <CardContent className='text-center'>
            <p className='text-muted-foreground mb-4'>
              Bạn cần quyền admin để truy cập trang này.
            </p>
            <p className='text-xs text-muted-foreground mb-4'>
              Email: {user?.email} | Admin: {isAdmin ? 'Yes' : 'No'}
            </p>
            <Navigate to='/dashboard' replace />
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};
