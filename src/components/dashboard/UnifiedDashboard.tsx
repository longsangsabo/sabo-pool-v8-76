import React from 'react';
import { useUnifiedPermissions } from '@/hooks/useUnifiedPermissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Building2, Users, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const UnifiedDashboard: React.FC = () => {
  const { permissions, isLoading } = useUnifiedPermissions();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Determine primary role for smart suggestions
  const primaryRole = permissions.isAdmin ? 'admin' : 'club';
  const hasMultipleRoles = permissions.isAdmin && (permissions.isClubOwner || permissions.isClubManager);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Tổng hợp</h1>
          <p className="text-muted-foreground">
            {hasMultipleRoles 
              ? 'Bạn có nhiều vai trò - chọn khu vực làm việc phù hợp'
              : 'Quản lý tất cả quyền hạn từ một nơi'
            }
          </p>
        </div>
        
        {/* Quick Role Switcher */}
        {hasMultipleRoles && (
          <div className="flex gap-2">
            <Button 
              variant={primaryRole === 'admin' ? 'default' : 'outline'}
              size="sm"
              onClick={() => navigate('/admin')}
            >
              <Shield className="h-4 w-4 mr-2" />
              Admin Mode
            </Button>
            <Button 
              variant={primaryRole === 'club' ? 'default' : 'outline'}
              size="sm"
              onClick={() => navigate('/clb')}
            >
              <Building2 className="h-4 w-4 mr-2" />
              CLB Mode
            </Button>
          </div>
        )}
      </div>

      {/* Smart Suggestions */}
      {hasMultipleRoles && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800">🎯 Gợi ý cho hôm nay</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {permissions.isClubOwner && (
                <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div>
                    <p className="font-medium">Kiểm tra tình hình CLB</p>
                    <p className="text-sm text-muted-foreground">Xem thống kê bàn chơi, thành viên mới</p>
                  </div>
                  <Button size="sm" onClick={() => navigate('/clb')}>
                    Đi đến CLB
                  </Button>
                </div>
              )}
              {permissions.isAdmin && (
                <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div>
                    <p className="font-medium">Quản trị hệ thống</p>
                    <p className="text-sm text-muted-foreground">Kiểm tra hoạt động chung, user management</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => navigate('/admin')}>
                    Admin Panel
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Permission Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Quyền hạn của bạn</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {permissions.isAdmin && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Super Admin
              </Badge>
            )}
            {permissions.isClubOwner && (
              <Badge variant="default" className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                Chủ CLB
              </Badge>
            )}
            {permissions.isClubManager && !permissions.isClubOwner && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                Quản lý CLB
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Access Panels */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Admin Panel */}
        {permissions.canAccessAdminPanel && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Admin Panel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Quản lý toàn hệ thống, người dùng, và cài đặt global
              </p>
              <div className="space-y-2">
                <Button 
                  onClick={() => navigate('/admin/users')} 
                  variant="outline" 
                  className="w-full"
                >
                  Quản lý người dùng
                </Button>
                <Button 
                  onClick={() => navigate('/admin/clubs')} 
                  variant="outline" 
                  className="w-full"
                >
                  Quản lý CLB
                </Button>
                <Button 
                  onClick={() => navigate('/admin/settings')} 
                  variant="outline" 
                  className="w-full"
                >
                  Cài đặt hệ thống
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* CLB Panel */}
        {permissions.canAccessCLBPanel && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                CLB Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Quản lý câu lạc bộ, thành viên, và hoạt động
              </p>
              <div className="space-y-2">
                <Button 
                  onClick={() => navigate('/clb')} 
                  variant="outline" 
                  className="w-full"
                >
                  Dashboard CLB
                </Button>
                <Button 
                  onClick={() => navigate('/clb/members')} 
                  variant="outline" 
                  className="w-full"
                >
                  Quản lý thành viên
                </Button>
                <Button 
                  onClick={() => navigate('/clb/tournaments')} 
                  variant="outline" 
                  className="w-full"
                >
                  Quản lý giải đấu
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* No Permissions */}
      {!permissions.canAccessAdminPanel && !permissions.canAccessCLBPanel && (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Chưa có quyền quản lý</h3>
            <p className="text-muted-foreground">
              Bạn chưa được cấp quyền admin hoặc quản lý CLB nào
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
