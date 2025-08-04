import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminPageLayout } from '@/features/admin/components/shared/AdminPageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import {
  Search,
  Users,
  UserCheck,
  UserX,
  Shield,
  Eye,
  Ban,
  CheckCircle,
  Plus,
  Download
} from 'lucide-react';
import { useAdminUsers, type AdminUser } from '@/hooks/useAdminUsers';
import { toast } from 'sonner';

const UserStatusBadge = ({ status }: { status: string | null }) => {
  const { t } = useTranslation();
  const statusMap: Record<string, { label: string; variant: string }> = {
    'banned': { label: t('users.status.banned'), variant: 'destructive' },
    'active': { label: t('users.status.active'), variant: 'default' },
    'inactive': { label: t('users.status.inactive'), variant: 'secondary' },
  };

  const statusInfo = statusMap[status || 'active'] || statusMap['active'];
  
  return (
    <Badge variant={statusInfo.variant as any}>
      {statusInfo.label}
    </Badge>
  );
};

const RoleBadge = ({ role, isAdmin }: { role: string; isAdmin?: boolean }) => {
  const { t } = useTranslation();
  if (isAdmin) {
    return <Badge variant="destructive">{t('users.roles.admin')}</Badge>;
  }
  
  const roleMap: Record<string, { label: string; variant: string }> = {
    'admin': { label: t('users.roles.admin'), variant: 'destructive' },
    'moderator': { label: t('users.roles.moderator'), variant: 'default' },
    'user': { label: t('users.roles.user'), variant: 'secondary' },
  };

  const roleInfo = roleMap[role] || roleMap['user'];
  
  return (
    <Badge variant={roleInfo.variant as any}>
      {roleInfo.label}
    </Badge>
  );
};

const AdminUsersNew = () => {
  const { t } = useTranslation();
  const { users, isLoading, updateUserBan, updateUserRole } = useAdminUsers();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === '' || 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.includes(searchTerm) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTab = activeTab === 'all' || 
      (activeTab === 'active' && user.ban_status !== 'banned') ||
      (activeTab === 'banned' && user.ban_status === 'banned') ||
      (activeTab === 'admin' && user.is_admin);

    return matchesSearch && matchesTab;
  });

  const stats = {
    total: users.length,
    active: users.filter(u => u.ban_status !== 'banned').length,
    banned: users.filter(u => u.ban_status === 'banned').length,
    admin: users.filter(u => u.is_admin).length,
  };

  const handleBanUser = async (user: AdminUser) => {
    try {
      updateUserBan({
        userId: user.user_id,
        banStatus: 'banned',
        banReason: 'Bị cấm bởi admin'
      });
      toast.success(`Đã cấm người dùng ${user.full_name}`);
    } catch (error) {
      toast.error('Lỗi khi cấm người dùng');
    }
  };

  const handleUnbanUser = async (user: AdminUser) => {
    try {
      updateUserBan({
        userId: user.user_id,
        banStatus: null,
        banReason: null
      });
      toast.success(t('users.unban_success', { name: user.full_name }));
    } catch (error) {
      toast.error(t('users.unban_error'));
    }
  };

  const handleChangeRole = async (user: AdminUser, newRole: string) => {
    try {
      updateUserRole({
        userId: user.user_id,
        role: newRole
      });
      toast.success(t('users.role_update_success', { name: user.full_name }));
    } catch (error) {
      toast.error(t('users.role_update_error'));
    }
  };

  return (
    <AdminPageLayout
      title={t('users.title')}
      description={t('users.description')}
      actions={
        <div className="flex gap-2">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            {t('users.add_user')}
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            {t('users.export_data')}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng người dùng</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">{t('users.all')}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('users.active')}</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active}</div>
              <p className="text-xs text-muted-foreground">{t('users.active_users')}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('users.banned')}</CardTitle>
              <UserX className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.banned}</div>
              <p className="text-xs text-muted-foreground">{t('users.banned_users')}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('users.admin')}</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.admin}</div>
              <p className="text-xs text-muted-foreground">{t('users.admin_users')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder={t('users.search_placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">{t('users.all')} ({stats.total})</TabsTrigger>
            <TabsTrigger value="active">{t('users.active')} ({stats.active})</TabsTrigger>
            <TabsTrigger value="banned">{t('users.banned')} ({stats.banned})</TabsTrigger>
            <TabsTrigger value="admin">{t('users.admin')} ({stats.admin})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">{t('users.loading')}</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('users.user')}</TableHead>
                        <TableHead>{t('users.contact')}</TableHead>
                        <TableHead>{t('users.status')}</TableHead>
                        <TableHead>{t('users.role')}</TableHead>
                        <TableHead>ELO</TableHead>
                        <TableHead>{t('users.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.user_id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src="" />
                                <AvatarFallback className="bg-blue-100 text-blue-600">
                                  {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{user.full_name || 'Chưa có tên'}</div>
                                <div className="text-sm text-muted-foreground">ID: {user.user_id.slice(0, 8)}...</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div>{user.phone || 'Chưa có SĐT'}</div>
                              <div className="text-sm text-muted-foreground">{user.email || 'Chưa có email'}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <UserStatusBadge status={user.ban_status} />
                          </TableCell>
                          <TableCell>
                            <RoleBadge role={user.role} isAdmin={user.is_admin} />
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{user.elo || 0}</div>
                            <div className="text-sm text-muted-foreground">{user.verified_rank || 'Chưa xác thực'}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button size="sm" variant="outline">
                                <Eye className="h-4 w-4" />
                              </Button>
                              {user.ban_status === 'banned' ? (
                                <Button 
                                  size="sm" 
                                  variant="default"
                                  onClick={() => handleUnbanUser(user)}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              ) : (
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => handleBanUser(user)}
                                >
                                  <Ban className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                
                {!isLoading && filteredUsers.length === 0 && (
                  <div className="p-8 text-center">
                    <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-sm font-semibold">Không có người dùng</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Không tìm thấy người dùng nào phù hợp với bộ lọc.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminPageLayout>
  );
};

export default AdminUsersNew;
