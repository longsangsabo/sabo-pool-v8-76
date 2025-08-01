import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Zap, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AutomationStatus {
  isActive: boolean;
  isProcessing: boolean;
  lastTriggered: Date | null;
  successCount: number;
  errorCount: number;
  pendingActions: number;
}

interface EnhancedAutomationStatusDisplayProps {
  status: AutomationStatus;
  className?: string;
}

export const EnhancedAutomationStatusDisplay: React.FC<
  EnhancedAutomationStatusDisplayProps
> = ({ status, className }) => {
  const getStatusInfo = () => {
    if (status.isProcessing) {
      return {
        icon: Loader2,
        text: 'Đang xử lý...',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50 border-blue-200',
      };
    }

    if (status.pendingActions > 0) {
      return {
        icon: Clock,
        text: `${status.pendingActions} thao tác đang chờ`,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50 border-yellow-200',
      };
    }

    if (status.isActive) {
      return {
        icon: CheckCircle,
        text: 'Hoạt động bình thường',
        color: 'text-green-600',
        bgColor: 'bg-green-50 border-green-200',
      };
    }

    return {
      icon: AlertCircle,
      text: 'Không hoạt động',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50 border-gray-200',
    };
  };

  const statusInfo = getStatusInfo();
  const totalActions = status.successCount + status.errorCount;
  const successRate =
    totalActions > 0 ? (status.successCount / totalActions) * 100 : 100;

  return (
    <Card className={cn('border-2', statusInfo.bgColor, className)}>
      <CardHeader className='pb-3'>
        <CardTitle className='flex items-center gap-2 text-sm'>
          <Zap className='w-4 h-4 text-accent-blue' />
          Tournament Automation
          <Badge className={cn('gap-1', statusInfo.bgColor, statusInfo.color)}>
            <statusInfo.icon
              className={cn('w-3 h-3', status.isProcessing && 'animate-spin')}
            />
            {statusInfo.text}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-3'>
        {/* Success Rate Progress */}
        <div className='space-y-2'>
          <div className='flex justify-between text-xs'>
            <span className='text-muted-foreground'>Tỷ lệ thành công</span>
            <span className='font-medium'>{successRate.toFixed(1)}%</span>
          </div>
          <Progress value={successRate} className='h-2' />
        </div>

        {/* Stats Grid */}
        <div className='grid grid-cols-3 gap-2 text-center'>
          <div className='p-2 bg-green-50 rounded border border-green-200'>
            <div className='text-lg font-bold text-green-600'>
              {status.successCount}
            </div>
            <div className='text-xs text-muted-foreground'>Thành công</div>
          </div>

          <div className='p-2 bg-red-50 rounded border border-red-200'>
            <div className='text-lg font-bold text-red-600'>
              {status.errorCount}
            </div>
            <div className='text-xs text-muted-foreground'>Lỗi</div>
          </div>

          <div className='p-2 bg-blue-50 rounded border border-blue-200'>
            <div className='text-lg font-bold text-blue-600'>
              {status.pendingActions}
            </div>
            <div className='text-xs text-muted-foreground'>Đang chờ</div>
          </div>
        </div>

        {/* Last Activity */}
        {status.lastTriggered && (
          <div className='text-xs text-muted-foreground text-center'>
            Hoạt động cuối: {status.lastTriggered.toLocaleString('vi-VN')}
          </div>
        )}

        {/* Processing Indicator */}
        {status.isProcessing && (
          <div className='flex items-center justify-center gap-2 p-2 bg-blue-50 rounded border border-blue-200'>
            <Loader2 className='w-4 h-4 animate-spin text-blue-600' />
            <span className='text-sm text-blue-600'>
              Automation đang chạy...
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
