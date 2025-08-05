import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, Trophy, User, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface UserStatus {
  isAdmin: boolean;
  isClubOwner: boolean;
  clubInfo?: {
    id: string;
    club_name: string;
    verification_status: string;
  };
  profile?: {
    full_name: string;
    phone: string;
    is_admin: boolean;
  };
}

const UserStatusDebug: React.FC = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<UserStatus>({
    isAdmin: false,
    isClubOwner: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkUserStatus = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Check profile info and admin status
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, phone, is_admin')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        console.error('Profile check error:', profileError);
      }

      // Check club owner status
      const { data: clubData, error: clubError } = await supabase
        .from('club_profiles')
        .select('id, club_name, verification_status')
        .eq('user_id', user.id)
        .single();

      if (clubError && clubError.code !== 'PGRST116') {
        console.error('Club check error:', clubError);
      }

      setStatus({
        isAdmin: profileData?.is_admin || false,
        isClubOwner: !!clubData && clubData.verification_status === 'approved',
        clubInfo: clubData || undefined,
        profile: profileData || undefined,
      });
    } catch (err) {
      console.error('Error checking user status:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      checkUserStatus();
    }
  }, [user]);

  if (!user) {
    return (
      <Card className='w-full max-w-md'>
        <CardHeader>
          <CardTitle className='flex items-center space-x-2'>
            <AlertCircle className='w-5 h-5 text-orange-500' />
            <span>Chưa đăng nhập</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-sm text-muted-foreground'>
            Vui lòng đăng nhập để kiểm tra quyền admin và club.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='w-full max-w-md'>
      <CardHeader>
        <CardTitle className='flex items-center justify-between'>
          <span>Trạng thái người dùng</span>
          <Button
            size='sm'
            variant='outline'
            onClick={checkUserStatus}
            disabled={loading}
          >
            {loading ? 'Đang kiểm tra...' : 'Refresh'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* User Info */}
        <div className='flex items-center space-x-2'>
          <User className='w-4 h-4' />
          <div>
            <p className='font-medium'>
              {status.profile?.full_name || 'Chưa có tên'}
            </p>
            <p className='text-xs text-muted-foreground'>{user.email}</p>
            <p className='text-xs text-muted-foreground'>
              {status.profile?.phone || 'Chưa có SĐT'}
            </p>
          </div>
        </div>

        {error && (
          <div className='p-3 bg-red-50 border border-red-200 rounded-md'>
            <p className='text-sm text-red-600'>Lỗi: {error}</p>
          </div>
        )}

        {/* Admin Status */}
        <div className='flex items-center justify-between p-3 bg-gray-50 rounded-md'>
          <div className='flex items-center space-x-2'>
            <Shield className='w-4 h-4' />
            <span className='font-medium'>Quyền Admin</span>
          </div>
          <Badge variant={status.isAdmin ? 'default' : 'secondary'}>
            {status.isAdmin ? (
              <div className='flex items-center space-x-1'>
                <CheckCircle className='w-3 h-3' />
                <span>Có quyền</span>
              </div>
            ) : (
              <span>Không có</span>
            )}
          </Badge>
        </div>

        {/* Club Owner Status */}
        <div className='flex items-center justify-between p-3 bg-gray-50 rounded-md'>
          <div className='flex items-center space-x-2'>
            <Trophy className='w-4 h-4' />
            <span className='font-medium'>Chủ CLB</span>
          </div>
          <Badge variant={status.isClubOwner ? 'default' : 'secondary'}>
            {status.isClubOwner ? (
              <div className='flex items-center space-x-1'>
                <CheckCircle className='w-3 h-3' />
                <span>Đã xác thực</span>
              </div>
            ) : (
              <span>Không có</span>
            )}
          </Badge>
        </div>

        {/* Club Info */}
        {status.clubInfo && (
          <div className='p-3 bg-blue-50 border border-blue-200 rounded-md'>
            <p className='font-medium text-sm'>Thông tin CLB:</p>
            <p className='text-sm'>{status.clubInfo.club_name}</p>
            <Badge
              variant={
                status.clubInfo.verification_status === 'approved'
                  ? 'default'
                  : 'secondary'
              }
              className='mt-1'
            >
              {status.clubInfo.verification_status}
            </Badge>
          </div>
        )}

        {/* Navigation Links */}
        <div className='space-y-2 pt-2 border-t'>
          <p className='text-sm font-medium'>Liên kết nhanh:</p>
          {status.isAdmin && (
            <Button
              size='sm'
              variant='outline'
              className='w-full justify-start'
              onClick={() => window.open('/admin', '_blank')}
            >
              <Shield className='w-4 h-4 mr-2' />
              Trang quản trị Admin
            </Button>
          )}
          {status.isClubOwner && (
            <Button
              size='sm'
              variant='outline'
              className='w-full justify-start'
              onClick={() => window.open('/club-management', '_blank')}
            >
              <Trophy className='w-4 h-4 mr-2' />
              Quản lý CLB
            </Button>
          )}
          {!status.isAdmin && !status.isClubOwner && (
            <p className='text-sm text-muted-foreground'>
              Chưa có quyền đặc biệt nào.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UserStatusDebug;
