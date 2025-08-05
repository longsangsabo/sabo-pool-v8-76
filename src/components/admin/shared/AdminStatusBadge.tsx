import React from 'react';
import { Badge } from '../../ui/badge';
import { CheckCircle, Clock, XCircle, Ban, Activity } from 'lucide-react';

export interface StatusConfig {
  [key: string]: {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    color?: string;
  };
}

interface AdminStatusBadgeProps {
  status: string;
  type: 'club' | 'user' | 'tournament' | 'transaction';
}

export function AdminStatusBadge({ status, type }: AdminStatusBadgeProps) {
  const configs: Record<string, StatusConfig> = {
    club: {
      pending: { label: 'Chờ duyệt', variant: 'secondary' },
      active: { label: 'Đã duyệt', variant: 'default' },
      rejected: { label: 'Bị từ chối', variant: 'destructive' },
      suspended: { label: 'Tạm dừng', variant: 'outline' },
    },
    user: {
      active: { label: 'Hoạt động', variant: 'default' },
      inactive: { label: 'Không hoạt động', variant: 'secondary' },
      banned: { label: 'Bị cấm', variant: 'destructive' },
      pending: { label: 'Chờ xác thực', variant: 'secondary' },
    },
    tournament: {
      draft: { label: 'Nháp', variant: 'outline' },
      published: { label: 'Đã xuất bản', variant: 'secondary' },
      registration_open: { label: 'Đang mở ĐK', variant: 'default' },
      registration_closed: { label: 'Đã đóng ĐK', variant: 'secondary' },
      ongoing: { label: 'Đang diễn ra', variant: 'default' },
      completed: { label: 'Hoàn thành', variant: 'secondary' },
      cancelled: { label: 'Đã hủy', variant: 'destructive' },
    },
    transaction: {
      pending: { label: 'Chờ xử lý', variant: 'secondary' },
      completed: { label: 'Hoàn thành', variant: 'default' },
      failed: { label: 'Thất bại', variant: 'destructive' },
      cancelled: { label: 'Đã hủy', variant: 'outline' },
    },
  };

  const config = configs[type]?.[status] || {
    label: status,
    variant: 'outline' as const,
  };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}

// Helper function to get all statuses for a type
export function getStatusOptions(type: 'club' | 'user' | 'tournament' | 'transaction') {
  const configs: Record<string, StatusConfig> = {
    club: {
      pending: { label: 'Chờ duyệt', variant: 'secondary' },
      active: { label: 'Đã duyệt', variant: 'default' },
      rejected: { label: 'Bị từ chối', variant: 'destructive' },
      suspended: { label: 'Tạm dừng', variant: 'outline' },
    },
    user: {
      active: { label: 'Hoạt động', variant: 'default' },
      inactive: { label: 'Không hoạt động', variant: 'secondary' },
      banned: { label: 'Bị cấm', variant: 'destructive' },
      pending: { label: 'Chờ xác thực', variant: 'secondary' },
    },
    tournament: {
      draft: { label: 'Nháp', variant: 'outline' },
      published: { label: 'Đã xuất bản', variant: 'secondary' },
      registration_open: { label: 'Đang mở ĐK', variant: 'default' },
      registration_closed: { label: 'Đã đóng ĐK', variant: 'secondary' },
      ongoing: { label: 'Đang diễn ra', variant: 'default' },
      completed: { label: 'Hoàn thành', variant: 'secondary' },
      cancelled: { label: 'Đã hủy', variant: 'destructive' },
    },
    transaction: {
      pending: { label: 'Chờ xử lý', variant: 'secondary' },
      completed: { label: 'Hoàn thành', variant: 'default' },
      failed: { label: 'Thất bại', variant: 'destructive' },
      cancelled: { label: 'Đã hủy', variant: 'outline' },
    },
  };

  return Object.entries(configs[type] || {}).map(([value, config]) => ({
    value,
    label: config.label,
  }));
}
