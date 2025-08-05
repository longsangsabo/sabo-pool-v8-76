import React, { useState } from 'react';
import { AdminPageLayout } from '@/features/admin/components/shared/AdminPageLayout';
import {
  AdminDataTable,
  ColumnDef,
} from '@/features/admin/components/shared/AdminDataTable';
import { BulkAction } from '@/features/admin/components/shared/AdminBulkActions';
import { AdminStatusBadge } from '@/features/admin/components/shared/AdminStatusBadge';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/shared/components/ui/avatar';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/shared/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Textarea } from '@/shared/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import {
  Search,
  Users,
  UserCheck,
  UserX,
  Crown,
  AlertTriangle,
  Shield,
  Eye,
  Ban,
  CheckCircle,
  Settings,
  Download,
  Plus,
  Trash2,
} from 'lucide-react';
import { useAdminUsers, type AdminUser } from '@/hooks/useAdminUsers';
import { DatabaseTest } from '@/components/DatabaseTest';
import { toast } from 'sonner';

const UserStatusBadge = ({ status }: { status: string | null }) => {
  const statusMap: Record<string, string> = {
    banned: 'banned',
    inactive: 'inactive',
    active: 'active',
  };

  const mappedStatus = statusMap[status || 'active'] || 'active';
  return <AdminStatusBadge status={mappedStatus} type='user' />;
};

const UserRoleBadge = ({ role }: { role: string }) => {
  const roleConfig: Record<string, { label: string; className: string }> = {
    admin: { label: 'Admin', className: 'bg-purple-100 text-purple-800' },
    moderator: { label: 'Moderator', className: 'bg-blue-100 text-blue-800' },
    user: { label: 'User', className: 'bg-gray-100 text-gray-800' },
    premium: { label: 'Premium', className: 'bg-yellow-100 text-yellow-800' },
  };

  const config = roleConfig[role] || roleConfig.user;
  return (
    <Badge className={config.className}>
      <Crown className='h-3 w-3 mr-1' />
      {config.label}
    </Badge>
  );
};

interface UserManagementProps {
  users: AdminUser[];
  onBanUser: (user: AdminUser) => void;
  onUnbanUser: (user: AdminUser) => void;
  onChangeRole: (user: AdminUser, role: string) => void;
  onViewUser: (user: AdminUser) => void;
  loading?: boolean;
}

const UserManagementTable = ({
  users,
  onBanUser,
  onUnbanUser,
  onChangeRole,
  onViewUser,
  loading = false,
}: UserManagementProps) => {
  const columns: ColumnDef<AdminUser>[] = [
    {
      key: 'user_info',
      header: 'Thông tin người dùng',
      render: (_, user) => (
        <div className='flex items-center space-x-3'>
          <Avatar className='h-10 w-10'>
            <AvatarImage src='' />
            <AvatarFallback className='bg-blue-100 text-blue-600'>
              {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className='font-medium'>
              {user.full_name || 'Chưa cập nhật'}
            </div>
            <div className='text-sm text-gray-500'>
              {user.phone || 'Chưa có SĐT'}
            </div>
            <div className='text-xs text-gray-400'>
              ID: {user.user_id.slice(0, 8)}...
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'display_name',
      header: 'Tên hiển thị',
      sortable: true,
      render: (_, user) => (
        <div className='font-medium'>{user.full_name || 'Chưa đặt tên'}</div>
      ),
    },
    {
      key: 'role',
      header: 'Vai trò',
      render: value => <UserRoleBadge role={value || 'user'} />,
    },
    {
      key: 'ban_status',
      header: 'Trạng thái',
      render: value => <UserStatusBadge status={value} />,
    },
    {
      key: 'elo_rating',
      header: 'ELO Rating',
      sortable: true,
      render: (_, user) => (
        <div className='text-center'>
          <span className='font-bold text-blue-600'>
            {user.elo_points || 1000}
          </span>
          <div className='text-xs text-gray-500'>points</div>
        </div>
      ),
    },
    {
      key: 'created_at',
      header: 'Ngày tham gia',
      sortable: true,
      render: value => {
        const date = new Date(value);
        return (
          <div className='text-sm'>
            <div>{date.toLocaleDateString('vi-VN')}</div>
            <div className='text-gray-500'>
              {date.toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
        );
      },
    },
  ];

  const actions = [
    {
      label: 'Xem chi tiết',
      onClick: onViewUser,
      icon: <Eye className='h-4 w-4' />,
    },
    {
      label: 'Cấm người dùng',
      onClick: onBanUser,
      icon: <Ban className='h-4 w-4' />,
      variant: 'destructive' as const,
      condition: (user: AdminUser) => user.ban_status !== 'banned',
    },
    {
      label: 'Bỏ cấm',
      onClick: onUnbanUser,
      icon: <CheckCircle className='h-4 w-4' />,
      condition: (user: AdminUser) => user.ban_status === 'banned',
    },
    {
      label: 'Đổi vai trò',
      onClick: (user: AdminUser) => {
        // This will be handled by a separate dialog
      },
      icon: <Settings className='h-4 w-4' />,
    },
  ];

  return (
    <AdminDataTable
      data={users}
      columns={columns}
      loading={loading}
      actions={actions}
      searchPlaceholder='Tìm kiếm tên, SĐT, ID người dùng...'
      emptyMessage='Không có người dùng nào'
    />
  );
};

const UserManagementTableWithBulkActions = ({
  users,
  onBanUser,
  onUnbanUser,
  onChangeRole,
  onViewUser,
  loading = false,
}: UserManagementProps) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const bulkActions: BulkAction[] = [
    {
      id: 'bulk-ban',
      label: 'Cấm người dùng',
      icon: <Ban className='h-4 w-4' />,
      variant: 'destructive',
      confirmMessage: `Bạn có chắc chắn muốn cấm ${selectedIds.length} người dùng đã chọn?`,
      onExecute: async (ids: string[]) => {
        for (const id of ids) {
          const user = users.find(u => u.user_id === id);
          if (user && user.ban_status !== 'banned') {
            onBanUser(user);
          }
        }
        toast.success(`Đã cấm ${ids.length} người dùng`);
      },
    },
    {
      id: 'bulk-unban',
      label: 'Bỏ cấm',
      icon: <CheckCircle className='h-4 w-4' />,
      confirmMessage: `Bạn có chắc chắn muốn bỏ cấm ${selectedIds.length} người dùng đã chọn?`,
      onExecute: async (ids: string[]) => {
        for (const id of ids) {
          const user = users.find(u => u.user_id === id);
          if (user && user.ban_status === 'banned') {
            onUnbanUser(user);
          }
        }
        toast.success(`Đã bỏ cấm ${ids.length} người dùng`);
      },
    },
    {
      id: 'bulk-export',
      label: 'Xuất danh sách',
      icon: <Download className='h-4 w-4' />,
      onExecute: async (ids: string[]) => {
        const selectedUsers = users.filter(u => ids.includes(u.user_id));
        const csv = selectedUsers
          .map(u => `${u.full_name},${u.phone},${u.role || 'user'}`)
          .join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'selected_users.csv';
        a.click();
        toast.success(`Đã xuất ${ids.length} người dùng`);
      },
    },
  ];

  const columns: ColumnDef<AdminUser>[] = [
    {
      key: 'user_info',
      header: 'Thông tin người dùng',
      render: (_, user) => (
        <div className='flex items-center space-x-3'>
          <Avatar className='h-10 w-10'>
            <AvatarImage src='' />
            <AvatarFallback className='bg-blue-100 text-blue-600'>
              {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className='font-medium'>
              {user.full_name || 'Chưa cập nhật'}
            </div>
            <div className='text-sm text-gray-500'>
              {user.phone || 'Chưa có SĐT'}
            </div>
            <div className='text-xs text-gray-400'>
              ID: {user.user_id.slice(0, 8)}...
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'display_name',
      header: 'Tên hiển thị',
      sortable: true,
      render: (_, user) => (
        <div className='font-medium'>{user.full_name || 'Chưa đặt tên'}</div>
      ),
    },
    {
      key: 'role',
      header: 'Vai trò',
      render: value => <UserRoleBadge role={value || 'user'} />,
    },
    {
      key: 'ban_status',
      header: 'Trạng thái',
      render: value => <UserStatusBadge status={value} />,
    },
    {
      key: 'elo_rating',
      header: 'ELO Rating',
      sortable: true,
      render: (_, user) => (
        <div className='text-center'>
          <span className='font-bold text-blue-600'>
            {user.elo_points || 1000}
          </span>
          <div className='text-xs text-gray-500'>points</div>
        </div>
      ),
    },
    {
      key: 'created_at',
      header: 'Ngày tham gia',
      sortable: true,
      render: value => {
        const date = new Date(value);
        return (
          <div className='text-sm'>
            <div>{date.toLocaleDateString('vi-VN')}</div>
            <div className='text-gray-500'>
              {date.toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
        );
      },
    },
  ];

  const actions = [
    {
      label: 'Xem chi tiết',
      onClick: onViewUser,
      icon: <Eye className='h-4 w-4' />,
    },
    {
      label: 'Cấm người dùng',
      onClick: onBanUser,
      icon: <Ban className='h-4 w-4' />,
      variant: 'destructive' as const,
      condition: (user: AdminUser) => user.ban_status !== 'banned',
    },
    {
      label: 'Bỏ cấm',
      onClick: onUnbanUser,
      icon: <CheckCircle className='h-4 w-4' />,
      condition: (user: AdminUser) => user.ban_status === 'banned',
    },
    {
      label: 'Đổi vai trò',
      onClick: (user: AdminUser) => {
        // This will be handled by a separate dialog
      },
      icon: <Settings className='h-4 w-4' />,
    },
  ];

  return (
    <AdminDataTable
      data={users}
      columns={columns}
      loading={loading}
      searchPlaceholder='Tìm kiếm tên, SĐT, ID người dùng...'
      emptyMessage='Không có người dùng nào'
    />
  );
};

function AdminUsersNewContent() {
  const {
    users,
    loading,
    error,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    toggleUserBan,
    grantSpaPoints,
    getUserStats,
    getUserActivities,
  } = useAdminUsers();

  const [activeTab, setActiveTab] = useState('all');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [newRole, setNewRole] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [userStats, setUserStats] = useState<any>(null);

  // Load initial data
  React.useEffect(() => {
    console.log('AdminUsersNew: Starting to fetch users...');
    fetchUsers()
      .then(() => {
        console.log('AdminUsersNew: Users fetched, count:', users.length);
      })
      .catch(error => {
        console.error('AdminUsersNew: Error fetching users:', error);
      });
    loadStats();
  }, []);

  // Debug: Log users whenever they change
  React.useEffect(() => {
    console.log('AdminUsersNew: Users updated:', users.length, users);
  }, [users]);

  // Debug: Log loading state
  React.useEffect(() => {
    console.log('AdminUsersNew: Loading state:', loading);
  }, [loading]);

  const loadStats = async () => {
    try {
      console.log('AdminUsersNew: Loading stats...');
      const stats = await getUserStats();
      console.log('AdminUsersNew: Stats loaded:', stats);
      setUserStats(stats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // Calculate stats from current data
  const stats = userStats || {
    total: users.length,
    active: users.filter(u => u.ban_status === 'active').length,
    banned: users.filter(u => u.ban_status === 'banned').length,
    admins: users.filter(u => u.is_admin === true).length,
  };

  // Filter users by tab
  const filteredUsers = users.filter(user => {
    switch (activeTab) {
      case 'active':
        return user.ban_status === 'active';
      case 'banned':
        return user.ban_status === 'banned';
      case 'admins':
        return user.is_admin === true;
      default:
        return true;
    }
  });

  const handleSearchUsers = async (query: string) => {
    setSearchQuery(query);
    try {
      await fetchUsers(query);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const handleBanUser = (user: AdminUser) => {
    setSelectedUser(user);
    setBanDialogOpen(true);
  };

  const handleUnbanUser = async (user: AdminUser) => {
    try {
      await toggleUserBan(user.user_id);
      toast.success(`Đã bỏ cấm người dùng ${user.full_name}`);
    } catch (error) {
      console.error('Error unbanning user:', error);
    }
  };

  const handleChangeRole = (user: AdminUser) => {
    setSelectedUser(user);
    setNewRole(user.role || 'player');
    setRoleDialogOpen(true);
  };

  const handleViewUser = (user: AdminUser) => {
    // TODO: Open user detail modal
    alert(
      `Xem chi tiết người dùng: ${user.full_name}\nSPA Points: ${user.spa_points || 0}\nELO: ${user.elo_points || 1000}\nVai trò: ${user.role || 'player'}`
    );
  };

  const confirmBanUser = async () => {
    if (selectedUser) {
      try {
        await toggleUserBan(selectedUser.user_id, banReason);
        setBanDialogOpen(false);
        setBanReason('');
        setSelectedUser(null);
        toast.success(`Đã cấm người dùng ${selectedUser.full_name}`);
      } catch (error) {
        console.error('Error banning user:', error);
      }
    }
  };

  const confirmChangeRole = async () => {
    if (selectedUser && newRole) {
      try {
        await updateUser(selectedUser.user_id, { role: newRole as any });
        setRoleDialogOpen(false);
        setNewRole('');
        setSelectedUser(null);
        toast.success(
          `Đã thay đổi vai trò của ${selectedUser.full_name} thành ${newRole}`
        );
      } catch (error) {
        console.error('Error changing role:', error);
      }
    }
  };

  const filters = (
    <div className='flex items-center gap-4'>
      <div className='flex items-center gap-2'>
        <label className='text-sm font-medium'>Vai trò:</label>
        <Select defaultValue='all'>
          <SelectTrigger className='w-[180px]'>
            <SelectValue placeholder='Tất cả vai trò' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>Tất cả vai trò</SelectItem>
            <SelectItem value='admin'>Admin</SelectItem>
            <SelectItem value='moderator'>Moderator</SelectItem>
            <SelectItem value='user'>User</SelectItem>
            <SelectItem value='premium'>Premium</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className='flex items-center gap-2'>
        <label className='text-sm font-medium'>ELO Rating:</label>
        <Select defaultValue='all'>
          <SelectTrigger className='w-[180px]'>
            <SelectValue placeholder='Tất cả rating' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>Tất cả rating</SelectItem>
            <SelectItem value='beginner'>Người mới ({'< 1400'})</SelectItem>
            <SelectItem value='intermediate'>Trung bình (1400-1600)</SelectItem>
            <SelectItem value='advanced'>Khá (1600-1800)</SelectItem>
            <SelectItem value='expert'>Giỏi ({'>= 1800'})</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <AdminPageLayout
      title='👥 Quản lý Người dùng'
      description='Quản lý tài khoản và quyền hạn của người dùng trong hệ thống'
      actions={
        <div className='flex gap-2'>
          <Button variant='outline'>
            <Download className='h-4 w-4 mr-2' />
            Xuất danh sách
          </Button>
          <Button>
            <Plus className='h-4 w-4 mr-2' />
            Thêm người dùng
          </Button>
        </div>
      }
      filters={filters}
    >
      <div className='space-y-6'>
        {/* DEBUG: Database Test Component */}
        <DatabaseTest />

        {/* Stats Cards - Simplified */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          <div className='bg-card text-card-foreground rounded-lg border p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium'>Tổng người dùng</p>
                <p className='text-2xl font-bold'>{stats.total}</p>
              </div>
              <Users className='h-8 w-8 text-muted-foreground' />
            </div>
          </div>
          <div className='bg-card text-card-foreground rounded-lg border p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium'>Hoạt động</p>
                <p className='text-2xl font-bold'>{stats.active}</p>
              </div>
              <UserCheck className='h-8 w-8 text-muted-foreground' />
            </div>
          </div>
          <div className='bg-card text-card-foreground rounded-lg border p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium'>Quản trị viên</p>
                <p className='text-2xl font-bold'>{stats.admins}</p>
              </div>
              <Crown className='h-8 w-8 text-muted-foreground' />
            </div>
          </div>
          <div className='bg-card text-card-foreground rounded-lg border p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium'>Bị cấm</p>
                <p className='text-2xl font-bold'>{stats.banned}</p>
              </div>
              <Shield className='h-8 w-8 text-muted-foreground' />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className='space-y-4'
        >
          <TabsList className='grid w-full grid-cols-4'>
            <TabsTrigger value='all' className='flex items-center gap-2'>
              <Users className='w-4 h-4' />
              Tất cả ({stats.total})
            </TabsTrigger>
            <TabsTrigger value='active' className='flex items-center gap-2'>
              <UserCheck className='w-4 h-4' />
              Hoạt động ({stats.active})
            </TabsTrigger>
            <TabsTrigger value='admins' className='flex items-center gap-2'>
              <Crown className='w-4 h-4' />
              Quản trị viên ({stats.admins})
            </TabsTrigger>
            <TabsTrigger value='banned' className='flex items-center gap-2'>
              <Shield className='w-4 h-4' />
              Bị cấm ({stats.banned})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {/* Search Bar */}
            <div className='mb-4'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                <Input
                  placeholder='Tìm kiếm người dùng theo tên, email, SĐT...'
                  value={searchQuery}
                  onChange={e => handleSearchUsers(e.target.value)}
                  className='pl-10'
                />
              </div>
            </div>

            <UserManagementTableWithBulkActions
              users={filteredUsers}
              loading={loading}
              onBanUser={handleBanUser}
              onUnbanUser={handleUnbanUser}
              onChangeRole={handleChangeRole}
              onViewUser={handleViewUser}
            />
          </TabsContent>
        </Tabs>

        {/* Ban User Dialog */}
        <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cấm người dùng</DialogTitle>
              <DialogDescription>
                Bạn có chắc chắn muốn cấm người dùng {selectedUser?.full_name}?
              </DialogDescription>
            </DialogHeader>
            <div className='space-y-4'>
              <div>
                <label className='text-sm font-medium'>Lý do cấm:</label>
                <Textarea
                  value={banReason}
                  onChange={e => setBanReason(e.target.value)}
                  placeholder='Nhập lý do cấm người dùng...'
                  className='mt-1'
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant='outline' onClick={() => setBanDialogOpen(false)}>
                Hủy
              </Button>
              <Button
                variant='destructive'
                onClick={confirmBanUser}
                disabled={loading || !banReason.trim()}
              >
                {loading ? 'Đang xử lý...' : 'Cấm người dùng'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Change Role Dialog */}
        <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Thay đổi vai trò</DialogTitle>
              <DialogDescription>
                Thay đổi vai trò của {selectedUser?.full_name}
              </DialogDescription>
            </DialogHeader>
            <div className='space-y-4'>
              <div>
                <label className='text-sm font-medium'>Vai trò mới:</label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger className='mt-1'>
                    <SelectValue placeholder='Chọn vai trò mới' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='user'>User</SelectItem>
                    <SelectItem value='premium'>Premium</SelectItem>
                    <SelectItem value='moderator'>Moderator</SelectItem>
                    <SelectItem value='admin'>Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant='outline'
                onClick={() => setRoleDialogOpen(false)}
              >
                Hủy
              </Button>
              <Button
                onClick={confirmChangeRole}
                disabled={loading || !newRole}
              >
                {loading ? 'Đang xử lý...' : 'Thay đổi vai trò'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminPageLayout>
  );
}

export default function AdminUsersNew() {
  return <AdminUsersNewContent />;
}
