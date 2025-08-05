import React, { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOptimizedAdminUsers } from '@/hooks/useOptimizedAdminData';
import VirtualizedDataTable from '@/components/admin/VirtualizedDataTable';
import { Edit, Shield, ShieldOff, Crown, User } from 'lucide-react';

const OptimizedAdminUsers = () => {
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  const { t } = useLanguage();
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  const {
    users,
    totalCount,
    loading,
    error,
    updateUser,
    refreshUsers,
    hasNextPage,
    hasPreviousPage,
  } = useOptimizedAdminUsers(currentPage, pageSize);

  const columns = useMemo(
    () => [
      {
        key: 'full_name',
        title: 'Họ tên',
        width: 200,
        render: (value: string, item: any) => (
          <div className='flex items-center gap-2'>
            <div className='flex flex-col'>
              <span className='font-medium'>{value || 'N/A'}</span>
              <span className='text-xs text-muted-foreground'>
                {item.display_name}
              </span>
            </div>
          </div>
        ),
      },
      {
        key: 'email',
        title: 'Email',
        width: 250,
        render: (value: string) => (
          <span className='text-sm font-mono'>{value || 'Chưa có email'}</span>
        ),
      },
      {
        key: 'phone',
        title: 'Số điện thoại',
        width: 150,
        render: (value: string) => (
          <span className='text-sm font-mono'>{value || 'N/A'}</span>
        ),
      },
      {
        key: 'role',
        title: 'Vai trò',
        width: 120,
        render: (value: string) => {
          const roleConfig = {
            admin: {
              label: 'Admin',
              color: 'bg-red-100 text-red-800',
              icon: Crown,
            },
            moderator: {
              label: 'Mod',
              color: 'bg-blue-100 text-blue-800',
              icon: Shield,
            },
            player: {
              label: 'Player',
              color: 'bg-gray-100 text-gray-800',
              icon: User,
            },
          };

          const config =
            roleConfig[value as keyof typeof roleConfig] || roleConfig.player;
          const Icon = config.icon;

          return (
            <Badge className={`${config.color} gap-1`}>
              <Icon className='h-3 w-3' />
              {config.label}
            </Badge>
          );
        },
      },
      {
        key: 'membership_type',
        title: 'Thành viên',
        width: 120,
        render: (value: string) => {
          const membershipConfig = {
            premium: {
              label: 'Premium',
              color: 'bg-yellow-100 text-yellow-800',
            },
            vip: { label: 'VIP', color: 'bg-purple-100 text-purple-800' },
            basic: { label: 'Basic', color: 'bg-gray-100 text-gray-800' },
          };

          const config =
            membershipConfig[value as keyof typeof membershipConfig] ||
            membershipConfig.basic;

          return <Badge className={config.color}>{config.label}</Badge>;
        },
      },
      {
        key: 'skill_level',
        title: 'Trình độ',
        width: 100,
        render: (value: string) => {
          const skillColors = {
            beginner: 'bg-green-100 text-green-800',
            intermediate: 'bg-blue-100 text-blue-800',
            advanced: 'bg-orange-100 text-orange-800',
            expert: 'bg-red-100 text-red-800',
          };

          return (
            <Badge
              className={
                skillColors[value as keyof typeof skillColors] ||
                skillColors.beginner
              }
            >
              {value || 'N/A'}
            </Badge>
          );
        },
      },
      {
        key: 'is_banned',
        title: 'Trạng thái',
        width: 120,
        render: (value: boolean, item: any) => (
          <div className='flex items-center gap-2'>
            <Badge
              className={
                value
                  ? 'bg-red-100 text-red-800'
                  : 'bg-green-100 text-green-800'
              }
            >
              {value ? 'Bị cấm' : 'Hoạt động'}
            </Badge>
          </div>
        ),
      },
      {
        key: 'created_at',
        title: 'Ngày tham gia',
        width: 120,
        render: (value: string) => (
          <span className='text-sm'>
            {value ? new Date(value).toLocaleDateString('vi-VN') : 'N/A'}
          </span>
        ),
      },
      {
        key: 'actions',
        title: 'Thao tác',
        width: 120,
        render: (_, item: any) => (
          <div className='flex items-center gap-1'>
            <Button
              variant='ghost'
              size='sm'
              onClick={e => {
                e.stopPropagation();
                handleToggleBan(item.user_id, !item.is_banned);
              }}
            >
              {item.is_banned ? (
                <Shield className='h-4 w-4 text-green-600' />
              ) : (
                <ShieldOff className='h-4 w-4 text-red-600' />
              )}
            </Button>
            <Button
              variant='ghost'
              size='sm'
              onClick={e => {
                e.stopPropagation();
                // Handle edit user
              }}
            >
              <Edit className='h-4 w-4' />
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  const handleToggleBan = async (userId: string, shouldBan: boolean) => {
    const result = await updateUser(userId, { is_banned: shouldBan });
    if (result.success) {
      // Success feedback handled by optimistic update
    }
  };

  if (adminLoading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary'></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-center'>
          <h2 className='text-2xl font-bold text-foreground mb-4'>
            {t('common.access_denied')}
          </h2>
          <p className='text-muted-foreground'>{t('common.no_permission')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-center'>
          <h2 className='text-xl font-bold text-destructive mb-2'>
            Lỗi tải dữ liệu
          </h2>
          <p className='text-muted-foreground mb-4'>{error}</p>
          <Button onClick={refreshUsers}>Thử lại</Button>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
        <div>
          <h1 className='text-3xl font-bold text-foreground'>
            Quản lý người dùng
          </h1>
          <p className='text-muted-foreground'>
            Quản lý thông tin và quyền hạn của {totalCount.toLocaleString()}{' '}
            người dùng
          </p>
        </div>
      </div>

      <VirtualizedDataTable
        data={users}
        columns={columns}
        loading={loading}
        title='Danh sách người dùng'
        searchable={true}
        onRefresh={refreshUsers}
        itemHeight={70}
        containerHeight={600}
        pagination={{
          current: currentPage,
          total: totalCount,
          pageSize,
          onPageChange: setCurrentPage,
        }}
        onItemClick={user => {
          console.log('Selected user:', user);
          // Handle user selection
        }}
      />
    </div>
  );
};

export default OptimizedAdminUsers;
