import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useSmartNavigation } from '@/hooks/useSmartNavigation';
import { useUnifiedPermissions } from '@/hooks/useUnifiedPermissions';
import { 
  Shield, 
  Building2, 
  Trophy, 
  User,
  ArrowRight,
  CheckCircle
} from 'lucide-react';

const SmartNavigationTestPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    navigateAfterLogin, 
    getDefaultRoute, 
    getWelcomeMessage, 
    hasMultipleRoles 
  } = useSmartNavigation();
  const { permissions, isLoading } = useUnifiedPermissions();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleTestNavigation = () => {
    navigateAfterLogin();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">🎯 Smart Navigation Test</h1>
        <p className="text-muted-foreground">Test thực tế hệ thống điều hướng thông minh</p>
      </div>

      {/* Current User Permissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Quyền hạn hiện tại
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
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
                <User className="h-3 w-3" />
                Quản lý CLB
              </Badge>
            )}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className={`h-4 w-4 ${permissions.canAccessAdminPanel ? 'text-green-500' : 'text-gray-400'}`} />
              <span>Admin Panel</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className={`h-4 w-4 ${permissions.canManageClub ? 'text-green-500' : 'text-gray-400'}`} />
              <span>Quản lý CLB</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className={`h-4 w-4 ${permissions.canManageTournaments ? 'text-green-500' : 'text-gray-400'}`} />
              <span>Quản lý giải đấu</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className={`h-4 w-4 ${permissions.canManageMembers ? 'text-green-500' : 'text-gray-400'}`} />
              <span>Quản lý thành viên</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Smart Navigation Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Kết quả Smart Navigation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="font-medium">Default Route</p>
                <p className="text-sm text-muted-foreground">Route mặc định khi login</p>
              </div>
              <Badge variant="outline">{getDefaultRoute()}</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="font-medium">Welcome Message</p>
                <p className="text-sm text-muted-foreground">Thông điệp chào mừng</p>
              </div>
              <span className="text-sm">{getWelcomeMessage()}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="font-medium">Multiple Roles</p>
                <p className="text-sm text-muted-foreground">Có nhiều vai trò hay không</p>
              </div>
              <Badge variant={hasMultipleRoles ? "default" : "secondary"}>
                {hasMultipleRoles ? 'Có' : 'Không'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Test Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            <Button 
              onClick={handleTestNavigation}
              className="w-full justify-between"
            >
              <span>🚀 Test Smart Navigation</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button 
                variant="outline" 
                onClick={() => navigate('/dashboard')}
                className="justify-between"
              >
                <span>Dashboard Tổng hợp</span>
                <Trophy className="h-4 w-4" />
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => navigate('/admin')}
                className="justify-between"
                disabled={!permissions.canAccessAdminPanel}
              >
                <span>Admin Panel</span>
                <Shield className="h-4 w-4" />
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => navigate('/clb')}
                className="justify-between"
                disabled={!permissions.canManageClub}
              >
                <span>Quản lý CLB</span>
                <Building2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Strategy Explanation */}
      <Card>
        <CardHeader>
          <CardTitle>🎯 Navigation Strategy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
              <p className="font-medium text-blue-800">Single Role Strategy</p>
              <p className="text-blue-600">Chỉ có 1 role → Direct redirect đến route chính</p>
            </div>
            
            <div className="p-3 bg-purple-50 rounded-lg border-l-4 border-purple-500">
              <p className="font-medium text-purple-800">Multi-Role Strategy</p>
              <p className="text-purple-600">Có nhiều roles → Unified Dashboard với lựa chọn</p>
            </div>
            
            <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
              <p className="font-medium text-green-800">User Experience</p>
              <p className="text-green-600">Smart suggestions + Role switcher ở TopBar</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SmartNavigationTestPage;
