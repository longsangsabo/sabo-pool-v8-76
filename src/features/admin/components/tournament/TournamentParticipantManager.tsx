import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  UserX, 
  Search, 
  Download, 
  Trophy,
  Star,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Mail,
  Phone
} from 'lucide-react';
import { AdminDataTable, ColumnDef } from '@/features/admin/components/shared/AdminDataTable';
import { EnhancedAdminDataTable, BulkAction } from '@/features/admin/components/shared/AdminBulkActions';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { toast } from 'sonner';
import { AdminTournament } from '@/hooks/admin/useAdminData';

interface TournamentParticipant {
  participant_id: string;
  user_id: string;
  user_name: string;
  email: string | null;
  phone: string | null;
  elo_rating: number;
  registration_status: 'pending' | 'confirmed' | 'cancelled' | 'waitlisted';
  registration_date: string;
  payment_status: 'pending' | 'paid' | 'refunded';
  seed_number?: number;
  avatar_url?: string;
  club_affiliation?: string;
  notes?: string;
}

interface TournamentParticipantManagerProps {
  tournament: AdminTournament;
  isOpen: boolean;
  onClose: () => void;
}

const TournamentParticipantManager = ({ tournament, isOpen, onClose }: TournamentParticipantManagerProps) => {
  const [participants, setParticipants] = useState<TournamentParticipant[]>([
    {
      participant_id: 'P001',
      user_id: 'U001',
      user_name: 'Nguyễn Văn A',
      email: 'nguyenvana@email.com',
      phone: '0901234567',
      elo_rating: 1850,
      registration_status: 'confirmed',
      registration_date: '2024-02-01T10:30:00Z',
      payment_status: 'paid',
      seed_number: 1,
      club_affiliation: 'CLB Billiards Sài Gòn',
      notes: 'Ứng viên vô địch',
    },
    {
      participant_id: 'P002',
      user_id: 'U002',
      user_name: 'Trần Thị B',
      email: 'tranthib@email.com',
      phone: '0912345678',
      elo_rating: 1720,
      registration_status: 'confirmed',
      registration_date: '2024-02-02T14:20:00Z',
      payment_status: 'paid',
      seed_number: 2,
      club_affiliation: 'CLB Hà Nội',
    },
    {
      participant_id: 'P003',
      user_id: 'U003',
      user_name: 'Lê Văn C',
      email: 'levanc@email.com',
      phone: '0923456789',
      elo_rating: 1680,
      registration_status: 'pending',
      registration_date: '2024-02-03T09:15:00Z',
      payment_status: 'pending',
      notes: 'Chờ xác nhận thanh toán',
    },
    {
      participant_id: 'P004',
      user_id: 'U004',
      user_name: 'Phạm Văn D',
      email: 'phamvand@email.com',
      phone: '0934567890',
      elo_rating: 1590,
      registration_status: 'waitlisted',
      registration_date: '2024-02-04T16:45:00Z',
      payment_status: 'pending',
      notes: 'Trong danh sách chờ',
    },
  ]);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const handleConfirmParticipant = (participant: TournamentParticipant) => {
    setParticipants(prev => prev.map(p => 
      p.participant_id === participant.participant_id 
        ? { ...p, registration_status: 'confirmed' }
        : p
    ));
    toast.success(`Đã xác nhận thí sinh ${participant.user_name}`);
  };

  const handleRejectParticipant = (participant: TournamentParticipant) => {
    setParticipants(prev => prev.map(p => 
      p.participant_id === participant.participant_id 
        ? { ...p, registration_status: 'cancelled' }
        : p
    ));
    toast.error(`Đã từ chối thí sinh ${participant.user_name}`);
  };

  const handleMoveToWaitlist = (participant: TournamentParticipant) => {
    setParticipants(prev => prev.map(p => 
      p.participant_id === participant.participant_id 
        ? { ...p, registration_status: 'waitlisted' }
        : p
    ));
    toast.info(`Đã chuyển ${participant.user_name} vào danh sách chờ`);
  };

  const bulkActions: BulkAction[] = [
    {
      id: 'bulk-confirm',
      label: 'Xác nhận hàng loạt',
      icon: <CheckCircle className="h-4 w-4" />,
      variant: 'default',
      confirmMessage: `Xác nhận ${selectedIds.length} thí sinh đã chọn?`,
      onExecute: async (ids: string[]) => {
        setParticipants(prev => prev.map(p => 
          ids.includes(p.participant_id) 
            ? { ...p, registration_status: 'confirmed' }
            : p
        ));
        toast.success(`Đã xác nhận ${ids.length} thí sinh`);
      }
    },
    {
      id: 'bulk-reject',
      label: 'Từ chối hàng loạt',
      icon: <XCircle className="h-4 w-4" />,
      variant: 'destructive',
      confirmMessage: `Từ chối ${selectedIds.length} thí sinh đã chọn?`,
      onExecute: async (ids: string[]) => {
        setParticipants(prev => prev.map(p => 
          ids.includes(p.participant_id) 
            ? { ...p, registration_status: 'cancelled' }
            : p
        ));
        toast.success(`Đã từ chối ${ids.length} thí sinh`);
      }
    },
    {
      id: 'bulk-waitlist',
      label: 'Chuyển vào danh sách chờ',
      icon: <Clock className="h-4 w-4" />,
      onExecute: async (ids: string[]) => {
        setParticipants(prev => prev.map(p => 
          ids.includes(p.participant_id) 
            ? { ...p, registration_status: 'waitlisted' }
            : p
        ));
        toast.info(`Đã chuyển ${ids.length} thí sinh vào danh sách chờ`);
      }
    },
    {
      id: 'bulk-export',
      label: 'Xuất danh sách',
      icon: <Download className="h-4 w-4" />,
      onExecute: async (ids: string[]) => {
        const selectedParticipants = participants.filter(p => ids.includes(p.participant_id));
        const csv = selectedParticipants.map(p => 
          `${p.user_name},${p.email},${p.phone},${p.elo_rating},${p.registration_status}`
        ).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${tournament.name}_participants.csv`;
        a.click();
        toast.success(`Đã xuất ${ids.length} thí sinh`);
      }
    },
  ];

  const columns: ColumnDef<TournamentParticipant>[] = [
    {
      key: 'participant_info',
      header: 'Thông tin thí sinh',
      render: (_, participant) => (
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={participant.avatar_url} />
            <AvatarFallback className="bg-blue-100 text-blue-600">
              {participant.user_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium flex items-center space-x-2">
              <span>{participant.user_name}</span>
              {participant.seed_number && (
                <Badge variant="outline" className="text-xs">
                  #{participant.seed_number}
                </Badge>
              )}
            </div>
            <div className="text-sm text-gray-500 flex items-center space-x-2">
              <Mail className="h-3 w-3" />
              <span>{participant.email || 'Chưa có email'}</span>
            </div>
            <div className="text-sm text-gray-500 flex items-center space-x-2">
              <Phone className="h-3 w-3" />
              <span>{participant.phone || 'Chưa có SĐT'}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'elo_rating',
      header: 'ELO Rating',
      sortable: true,
      render: (value) => (
        <div className="text-center">
          <div className="font-bold text-lg text-blue-600">{value}</div>
          <div className="text-xs text-gray-500">points</div>
        </div>
      ),
    },
    {
      key: 'registration_status',
      header: 'Trạng thái ĐK',
      render: (status) => {
        const config = {
          pending: { label: 'Chờ duyệt', className: 'bg-yellow-100 text-yellow-800' },
          confirmed: { label: 'Đã xác nhận', className: 'bg-green-100 text-green-800' },
          cancelled: { label: 'Đã hủy', className: 'bg-red-100 text-red-800' },
          waitlisted: { label: 'Danh sách chờ', className: 'bg-blue-100 text-blue-800' },
        };
        const statusConfig = config[status as keyof typeof config];
        return <Badge className={statusConfig.className}>{statusConfig.label}</Badge>;
      },
    },
    {
      key: 'payment_status',
      header: 'Thanh toán',
      render: (status) => {
        const config = {
          pending: { label: 'Chờ thanh toán', className: 'bg-yellow-100 text-yellow-800' },
          paid: { label: 'Đã thanh toán', className: 'bg-green-100 text-green-800' },
          refunded: { label: 'Đã hoàn tiền', className: 'bg-gray-100 text-gray-800' },
        };
        const statusConfig = config[status as keyof typeof config];
        return <Badge className={statusConfig.className}>{statusConfig.label}</Badge>;
      },
    },
    {
      key: 'club_affiliation',
      header: 'CLB',
      render: (value) => (
        <div className="text-sm">
          {value || <span className="text-gray-400">Chưa có CLB</span>}
        </div>
      ),
    },
    {
      key: 'registration_date',
      header: 'Ngày ĐK',
      render: (value) => (
        <div className="text-sm">
          {new Date(value).toLocaleDateString('vi-VN')}
        </div>
      ),
    },
    {
      key: 'notes',
      header: 'Ghi chú',
      render: (value) => (
        <div className="text-sm text-gray-600 max-w-xs truncate">
          {value || '-'}
        </div>
      ),
    },
  ];

  const actions = [
    {
      label: 'Xem chi tiết',
      onClick: (participant: TournamentParticipant) => {
        toast.info(`Xem chi tiết ${participant.user_name}`);
      },
      icon: <Eye className="h-4 w-4" />,
    },
    {
      label: 'Xác nhận',
      onClick: handleConfirmParticipant,
      icon: <CheckCircle className="h-4 w-4" />,
      condition: (participant: TournamentParticipant) => participant.registration_status === 'pending',
    },
    {
      label: 'Từ chối',
      onClick: handleRejectParticipant,
      icon: <XCircle className="h-4 w-4" />,
      variant: 'destructive' as const,
      condition: (participant: TournamentParticipant) => participant.registration_status === 'pending',
    },
    {
      label: 'Danh sách chờ',
      onClick: handleMoveToWaitlist,
      icon: <Clock className="h-4 w-4" />,
      condition: (participant: TournamentParticipant) => participant.registration_status === 'confirmed',
    },
  ];

  const stats = {
    total: participants.length,
    confirmed: participants.filter(p => p.registration_status === 'confirmed').length,
    pending: participants.filter(p => p.registration_status === 'pending').length,
    waitlisted: participants.filter(p => p.registration_status === 'waitlisted').length,
    paid: participants.filter(p => p.payment_status === 'paid').length,
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Quản lý thí sinh - {tournament.name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-sm text-gray-500">Tổng thí sinh</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">{stats.confirmed}</div>
                <div className="text-sm text-gray-500">Đã xác nhận</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                <div className="text-sm text-gray-500">Chờ duyệt</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-purple-600">{stats.waitlisted}</div>
                <div className="text-sm text-gray-500">Danh sách chờ</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-emerald-600">{stats.paid}</div>
                <div className="text-sm text-gray-500">Đã thanh toán</div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Thêm thí sinh
              </Button>
              <Button variant="outline">
                <Trophy className="h-4 w-4 mr-2" />
                Tạo bracket
              </Button>
            </div>
            <div className="flex space-x-2">
              <Input
                placeholder="Tìm kiếm thí sinh..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64"
              />
            </div>
          </div>

          {/* Participants Table */}
          <EnhancedAdminDataTable
            data={participants}
            columns={columns}
            actions={actions}
            bulkActions={bulkActions}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            idKey="participant_id"
            searchPlaceholder="Tìm kiếm tên, email, CLB..."
            emptyMessage="Chưa có thí sinh nào đăng ký"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TournamentParticipantManager;
