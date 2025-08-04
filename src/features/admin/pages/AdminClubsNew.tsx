import React, { useState, useEffect } from 'react';
import { AdminPageLayout } from '@/features/admin/components/shared/AdminPageLayout';
import { AdminDataTable, ColumnDef } from '@/features/admin/components/shared/AdminDataTable';
import { AdminStatusBadge } from '@/features/admin/components/shared/AdminStatusBadge';
import { AdminStatsGrid, StatCardProps, statConfigs } from '@/features/admin/components/shared/AdminStatsGrid';
import { useAdminClubs, useAdminClubStats } from '@/hooks/admin/useAdminData';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { 
  Building, 
  CheckCircle, 
  Clock, 
  Eye, 
  Check, 
  X, 
  MapPin, 
  Phone, 
  Users,
  Plus,
  Download
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ClubRegistration {
  id: string;
  owner_id: string;
  name: string;
  address?: string;
  contact_info?: string;
  description?: string;
  status: 'pending' | 'active' | 'rejected';
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    display_name: string;
    full_name: string;
  };
}

const StatusBadge = ({ status }: { status: string }) => {
  return <AdminStatusBadge status={status} type="club" />;
};

const ClubRegistrationsList = ({ 
  status, 
  onApprove, 
  onReject, 
  onView 
}: { 
  status: 'pending' | 'active' | 'rejected';
  onApprove: (club: any) => void;
  onReject: (club: any) => void;
  onView: (club: any) => void;
}) => {
  const { data: clubs, loading, refresh } = useAdminClubs(status);

  // Refresh data when actions are performed
  useEffect(() => {
    refresh();
  }, [status, refresh]);

  const columns: ColumnDef<any>[] = [
    {
      key: 'name',
      header: 'Tên Câu lạc bộ',
      sortable: true,
      render: (value, row) => (
        <div className="space-y-1">
          <div className="font-medium">{value}</div>
          <div className="text-sm text-gray-500 flex items-center">
            <Building className="h-3 w-3 mr-1" />
            ID: {row.id.slice(0, 8)}...
          </div>
        </div>
      ),
    },
    {
      key: 'profiles',
      header: 'Chủ sở hữu',
      render: (value, row) => (
        <div className="space-y-1">
          <div className="font-medium">
            {value?.display_name || value?.full_name || 'Chưa cập nhật'}
          </div>
          {row.contact_info && (
            <div className="text-sm text-gray-500 flex items-center">
              <Phone className="h-3 w-3 mr-1" />
              {row.contact_info}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'address',
      header: 'Địa chỉ',
      render: (value) => (
        <div className="text-sm">
          {value ? (
            <div className="flex items-start">
              <MapPin className="h-3 w-3 mr-1 mt-0.5 text-gray-400" />
              <span className="line-clamp-2">{value}</span>
            </div>
          ) : (
            <span className="text-gray-400">Chưa cập nhật</span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (value) => <StatusBadge status={value} />,
    },
    {
      key: 'created_at',
      header: 'Ngày tạo',
      sortable: true,
      render: (value) => {
        const date = new Date(value);
        return (
          <div className="text-sm">
            <div>{date.toLocaleDateString('vi-VN')}</div>
            <div className="text-gray-500">{date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        );
      },
    },
  ];

  const actions = [
    {
      label: 'Xem chi tiết',
      onClick: onView,
      icon: <Eye className="h-4 w-4" />,
    },
    {
      label: 'Duyệt',
      onClick: onApprove,
      icon: <Check className="h-4 w-4" />,
      condition: (row: any) => row.status === 'pending',
    },
    {
      label: 'Từ chối',
      onClick: onReject,
      icon: <X className="h-4 w-4" />,
      variant: 'destructive' as const,
      condition: (row: any) => row.status === 'pending',
    },
  ];

  return (
    <AdminDataTable
      data={clubs}
      columns={columns}
      loading={loading}
      actions={actions}
      searchPlaceholder="Tìm kiếm tên CLB, chủ sở hữu..."
      emptyMessage={`Không có câu lạc bộ nào ${status === 'pending' ? 'chờ duyệt' : status === 'active' ? 'đã duyệt' : 'bị từ chối'}`}
    />
  );
};

function AdminClubsNewContent() {
  const [activeTab, setActiveTab] = useState('pending');
  const { stats, refreshStats } = useAdminClubStats();

  const handleApprove = async (club: any) => {
    try {
      const { error } = await supabase
        .from('clubs')
        .update({ 
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', club.id);

      if (error) throw error;

      toast.success(`Đã duyệt câu lạc bộ "${club.name}"`);
      refreshStats();
      // Refresh current tab data
      window.location.reload();
    } catch (error) {
      console.error('Error approving club:', error);
      toast.error('Lỗi khi duyệt câu lạc bộ');
    }
  };

  const handleReject = async (club: any) => {
    const reason = prompt('Lý do từ chối:');
    if (!reason) return;

    try {
      const { error } = await supabase
        .from('clubs')
        .update({ 
          status: 'rejected',
          rejection_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', club.id);

      if (error) throw error;

      toast.success(`Đã từ chối câu lạc bộ "${club.name}"`);
      refreshStats();
      // Refresh current tab data
      window.location.reload();
    } catch (error) {
      console.error('Error rejecting club:', error);
      toast.error('Lỗi khi từ chối câu lạc bộ');
    }
  };

  const handleView = (club: any) => {
    // TODO: Open detail modal
    alert(`Xem chi tiết: ${club.name}\nMô tả: ${club.description || 'Không có'}`);
  };

  const filters = (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">Thời gian:</label>
        <select className="border rounded px-2 py-1 text-sm">
          <option value="">Tất cả</option>
          <option value="today">Hôm nay</option>
          <option value="week">Tuần này</option>
          <option value="month">Tháng này</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">Khu vực:</label>
        <select className="border rounded px-2 py-1 text-sm">
          <option value="">Tất cả</option>
          <option value="hanoi">Hà Nội</option>
          <option value="hcm">TP.HCM</option>
          <option value="danang">Đà Nẵng</option>
        </select>
      </div>
    </div>
  );

  return (
    <AdminPageLayout
      title="🏢 Quản lý Câu lạc bộ"
      description="Quản lý đăng ký và duyệt các câu lạc bộ trong hệ thống"
      actions={
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Xuất báo cáo
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Thêm CLB
          </Button>
        </div>
      }
      filters={filters}
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <AdminStatsGrid 
          stats={[
            {
              ...statConfigs.club.total,
              value: stats.total,
              icon: Building
            },
            {
              ...statConfigs.club.pending,
              value: stats.pending,
              icon: Clock
            },
            {
              ...statConfigs.club.active,
              value: stats.active,
              icon: CheckCircle
            },
            {
              ...statConfigs.club.rejected,
              value: stats.rejected,
              icon: X
            }
          ]}
        />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Chờ duyệt ({stats.pending})
            </TabsTrigger>
            <TabsTrigger value="active" className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Đã duyệt ({stats.active})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="flex items-center gap-2">
              <X className="w-4 h-4" />
              Bị từ chối ({stats.rejected})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <ClubRegistrationsList 
              status="pending" 
              onApprove={handleApprove}
              onReject={handleReject}
              onView={handleView}
            />
          </TabsContent>

          <TabsContent value="active">
            <ClubRegistrationsList 
              status="active" 
              onApprove={handleApprove}
              onReject={handleReject}
              onView={handleView}
            />
          </TabsContent>

          <TabsContent value="rejected">
            <ClubRegistrationsList 
              status="rejected" 
              onApprove={handleApprove}
              onReject={handleReject}
              onView={handleView}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AdminPageLayout>
  );
}

export default function AdminClubsNew() {
  return <AdminClubsNewContent />;
}
