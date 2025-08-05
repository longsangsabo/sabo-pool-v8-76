import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Users,
  UserPlus,
  Database,
  RefreshCw,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { faker } from '@faker-js/faker';

interface DemoUser {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  phone: string;
  verified_rank?: string;
  elo: number;
  skill_level: string;
  is_demo_user: boolean;
  created_at: string;
}

const AdminDevelopment: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [demoUsers, setDemoUsers] = useState<DemoUser[]>([]);
  const [userCount, setUserCount] = useState(5);
  const { toast } = useToast();

  useEffect(() => {
    loadDemoUsers();
  }, []);

  const loadDemoUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(
          'id, user_id, email, full_name, phone, verified_rank, elo, skill_level, is_demo_user, created_at'
        )
        .eq('is_demo_user', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDemoUsers(data || []);
    } catch (error) {
      console.error('Error loading demo users:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách demo users',
        variant: 'destructive',
      });
    }
  };

  const generateRandomUser = () => {
    const ranks = ['K', 'I', 'H', 'G', 'F', 'E'];
    const skillLevels = ['beginner', 'intermediate', 'advanced'];

    return {
      email: faker.internet.email().toLowerCase(),
      password: 'demo123456',
      full_name: faker.person.fullName(),
      phone: `09${Math.floor(Math.random() * 100000000)
        .toString()
        .padStart(8, '0')}`,
      current_rank: faker.helpers.arrayElement(ranks),
      elo: faker.number.int({ min: 1000, max: 2000 }),
      skill_level: faker.helpers.arrayElement(skillLevels),
      bio: faker.lorem.sentence(),
      is_demo_user: true,
    };
  };

  const createDemoUsers = async () => {
    setLoading(true);

    try {
      const users = Array.from({ length: userCount }, () =>
        generateRandomUser()
      );

      // Call edge function to create users
      const { data, error } = await supabase.functions.invoke(
        'create-admin-user',
        {
          body: {
            users: users,
            batch_create: true,
          },
        }
      );

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Không thể tạo demo users');
      }

      console.log('Demo users created:', data);

      toast({
        title: 'Thành công!',
        description: `Đã tạo ${userCount} demo users`,
      });

      // Reload demo users list
      await loadDemoUsers();
    } catch (error: any) {
      console.error('Error creating demo users:', error);
      toast({
        title: 'Lỗi tạo demo users',
        description: error.message || 'Vui lòng kiểm tra edge function',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const cleanupDemoUsers = async () => {
    if (!confirm('Bạn có chắc muốn xóa tất cả demo users?')) return;

    setLoading(true);

    try {
      // First delete from profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('is_demo_user', true);

      if (profileError) throw profileError;

      // Then delete auth users through edge function
      const { error: functionError } = await supabase.functions.invoke(
        'create-admin-user',
        {
          body: {
            action: 'cleanup_demo_users',
          },
        }
      );

      if (functionError) {
        console.warn('Edge function cleanup warning:', functionError);
      }

      toast({
        title: 'Đã xóa',
        description: 'Tất cả demo users đã được xóa',
      });

      await loadDemoUsers();
    } catch (error: any) {
      console.error('Error cleaning up demo users:', error);
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể xóa demo users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetDatabase = async () => {
    if (
      !confirm(
        'CẢNH BÁO: Thao tác này sẽ xóa TẤT CẢ dữ liệu trong database. Bạn có chắc chắn?'
      )
    )
      return;
    if (!confirm('Xác nhận lần cuối: Bạn THỰC SỰ muốn reset toàn bộ database?'))
      return;

    setLoading(true);

    try {
      const { error } = await supabase.functions.invoke('create-admin-user', {
        body: {
          action: 'reset_database',
        },
      });

      if (error) throw error;

      toast({
        title: 'Database đã được reset',
        description: 'Tất cả dữ liệu đã được xóa',
      });

      await loadDemoUsers();
    } catch (error: any) {
      console.error('Error resetting database:', error);
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể reset database',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='p-6 max-w-6xl mx-auto'>
      <div className='mb-6'>
        <h1 className='text-3xl font-bold text-foreground mb-2'>
          🛠️ Admin Development Tools
        </h1>
        <p className='text-muted-foreground'>
          Công cụ phát triển và test cho admin
        </p>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Demo User Creation */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <UserPlus className='h-5 w-5' />
              Tạo Demo Users
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <Label htmlFor='userCount'>Số lượng users</Label>
              <Input
                id='userCount'
                type='number'
                value={userCount}
                onChange={e =>
                  setUserCount(Math.max(1, parseInt(e.target.value) || 1))
                }
                min='1'
                max='50'
                className='mt-1'
              />
            </div>

            <Button
              onClick={createDemoUsers}
              disabled={loading}
              className='w-full'
            >
              {loading ? (
                <>
                  <RefreshCw className='mr-2 h-4 w-4 animate-spin' />
                  Đang tạo...
                </>
              ) : (
                <>
                  <UserPlus className='mr-2 h-4 w-4' />
                  Tạo {userCount} Demo Users
                </>
              )}
            </Button>

            <div className='pt-2 border-t'>
              <p className='text-sm text-muted-foreground mb-2'>
                Demo users sẽ có:
              </p>
              <ul className='text-xs text-muted-foreground space-y-1'>
                <li>• Email và tên ngẫu nhiên</li>
                <li>• Password: demo123456</li>
                <li>• ELO từ 1000-2000</li>
                <li>• Rank ngẫu nhiên (K-E)</li>
                <li>• Đánh dấu is_demo_user = true</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Demo Users List */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center justify-between'>
              <span className='flex items-center gap-2'>
                <Users className='h-5 w-5' />
                Demo Users ({demoUsers.length})
              </span>
              <Button
                variant='destructive'
                size='sm'
                onClick={cleanupDemoUsers}
                disabled={loading || demoUsers.length === 0}
              >
                <Trash2 className='mr-2 h-4 w-4' />
                Xóa tất cả
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='max-h-96 overflow-y-auto space-y-2'>
              {demoUsers.length === 0 ? (
                <p className='text-sm text-muted-foreground text-center py-4'>
                  Chưa có demo users nào
                </p>
              ) : (
                demoUsers.map(user => (
                  <div
                    key={user.id}
                    className='flex items-center justify-between p-2 border rounded'
                  >
                    <div>
                      <p className='font-medium text-sm'>{user.full_name}</p>
                      <p className='text-xs text-muted-foreground'>
                        {user.email}
                      </p>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Badge variant='outline' className='text-xs'>
                        {user.verified_rank || 'K'}
                      </Badge>
                      <span className='text-xs text-muted-foreground'>
                        {user.elo}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dangerous Operations */}
        <Card className='border-red-200'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-red-600'>
              <AlertTriangle className='h-5 w-5' />
              Nguy hiểm - Chỉ dùng khi phát triển
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <Button
              variant='destructive'
              onClick={resetDatabase}
              disabled={loading}
              className='w-full'
            >
              <Database className='mr-2 h-4 w-4' />
              Reset Toàn Bộ Database
            </Button>

            <div className='text-xs text-red-600 bg-red-50 p-2 rounded'>
              ⚠️ Thao tác này sẽ xóa TẤT CẢ dữ liệu trong database và không thể
              khôi phục!
            </div>
          </CardContent>
        </Card>

        {/* System Info */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Database className='h-5 w-5' />
              Thông tin hệ thống
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-2'>
            <div className='flex justify-between text-sm'>
              <span>Demo Users:</span>
              <span className='font-medium'>{demoUsers.length}</span>
            </div>
            <div className='flex justify-between text-sm'>
              <span>Edge Functions:</span>
              <Badge variant='outline' className='text-xs'>
                create-admin-user
              </Badge>
            </div>
            <div className='flex justify-between text-sm'>
              <span>Environment:</span>
              <Badge variant='secondary' className='text-xs'>
                Development
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDevelopment;
