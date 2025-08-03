import React from 'react';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Settings,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSystemHealthCheck } from '@/hooks/useSystemHealthCheck';

const SystemHealthDashboard = () => {
  const {
    healthChecks,
    criticalIssues,
    overallHealth,
    performHealthCheck,
    manualFix,
  } = useSystemHealthCheck();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className='w-4 h-4 text-green-500' />;
      case 'warning':
        return <AlertTriangle className='w-4 h-4 text-yellow-500' />;
      case 'error':
        return <AlertTriangle className='w-4 h-4 text-red-500' />;
      case 'checking':
        return <RefreshCw className='w-4 h-4 text-blue-500 animate-spin' />;
      default:
        return <Shield className='w-4 h-4 text-gray-500' />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'default';
      case 'warning':
        return 'secondary';
      case 'error':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getOverallHealthColor = () => {
    switch (overallHealth) {
      case 'healthy':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Card className='w-full'>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <div>
          <CardTitle className='text-lg'>Trạng thái hệ thống</CardTitle>
          <CardDescription>
            Giám sát sức khỏe và hiệu suất hệ thống real-time
          </CardDescription>
        </div>
        <div className='flex items-center gap-2'>
          <Badge variant={getStatusVariant(overallHealth)} className='gap-1'>
            {getStatusIcon(overallHealth)}
            {overallHealth === 'healthy'
              ? 'Khỏe mạnh'
              : overallHealth === 'warning'
                ? 'Cảnh báo'
                : 'Lỗi'}
          </Badge>
          <Button
            variant='outline'
            size='sm'
            onClick={performHealthCheck}
            className='gap-1'
          >
            <RefreshCw className='w-3 h-3' />
            Kiểm tra
          </Button>
        </div>
      </CardHeader>

      <CardContent className='space-y-4'>
        {/* Overall Status Summary */}
        <div
          className={`p-3 rounded-lg border ${
            overallHealth === 'healthy'
              ? 'bg-green-50 border-green-200'
              : overallHealth === 'warning'
                ? 'bg-yellow-50 border-yellow-200'
                : 'bg-red-50 border-red-200'
          }`}
        >
          <div className='flex items-center justify-between'>
            <div>
              <h3 className={`font-medium ${getOverallHealthColor()}`}>
                {overallHealth === 'healthy'
                  ? 'Hệ thống hoạt động bình thường'
                  : overallHealth === 'warning'
                    ? 'Có một số cảnh báo cần chú ý'
                    : 'Phát hiện vấn đề nghiêm trọng'}
              </h3>
              <p className='text-sm text-muted-foreground'>
                {criticalIssues.length > 0 &&
                  `${criticalIssues.length} vấn đề cần xử lý ngay`}
              </p>
            </div>
            {criticalIssues.length > 0 && (
              <Button variant='outline' size='sm'>
                <Settings className='w-3 h-3 mr-1' />
                Khắc phục tự động
              </Button>
            )}
          </div>
        </div>

        {/* Detailed Health Checks */}
        <div className='space-y-2'>
          <h4 className='font-medium text-sm'>Chi tiết kiểm tra</h4>
          {healthChecks.map(check => (
            <div
              key={check.id}
              className='flex items-center justify-between p-3 rounded-lg border bg-card'
            >
              <div className='flex items-center gap-3'>
                {getStatusIcon(check.status)}
                <div>
                  <div className='font-medium text-sm'>{check.name}</div>
                  <div className='text-xs text-muted-foreground'>
                    {check.details} • Kiểm tra lúc{' '}
                    {check.lastChecked.toLocaleTimeString('vi-VN')}
                  </div>
                </div>
              </div>
              <div className='flex items-center gap-2'>
                <Badge
                  variant={getStatusVariant(check.status)}
                  className='text-xs'
                >
                  {check.status === 'healthy'
                    ? 'OK'
                    : check.status === 'warning'
                      ? 'Cảnh báo'
                      : check.status === 'error'
                        ? 'Lỗi'
                        : 'Đang kiểm tra'}
                </Badge>
                {check.status === 'error' && (
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => manualFix(check.id)}
                    className='h-6 px-2 text-xs'
                  >
                    Sửa
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className='pt-2 border-t'>
          <div className='flex items-center justify-between text-xs text-muted-foreground'>
            <span>Tự động kiểm tra mỗi 30 giây</span>
            <span>
              Cập nhật lần cuối: {new Date().toLocaleTimeString('vi-VN')}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemHealthDashboard;
