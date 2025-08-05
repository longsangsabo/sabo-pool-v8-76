import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import {
  Users,
  Search,
  MessageSquare,
  UserCheck,
  Plus,
  Filter,
  Edit,
  Trash2,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { useClubMembers } from '@/hooks/useClubMembers';

interface MemberManagementProps {
  clubId: string;
}

export const MemberManagement: React.FC<MemberManagementProps> = ({
  clubId,
}) => {
  const {
    members,
    loading,
    error,
    addMember,
    updateMember,
    removeMember,
    getMemberStats,
  } = useClubMembers(clubId);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);

  // New member form state
  const [newMemberData, setNewMemberData] = useState({
    user_id: '',
    membership_type: 'regular',
    membership_fee: 0,
  });

  const stats = getMemberStats();

  const filteredMembers = React.useMemo(() => {
    return members.filter(member => {
      const matchesSearch =
        member.profiles?.full_name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        member.profiles?.phone?.includes(searchTerm);
      const matchesStatus =
        statusFilter === 'all' || member.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [members, searchTerm, statusFilter]);

  const handleAddMember = async () => {
    try {
      await addMember(newMemberData);
      setShowAddDialog(false);
      setNewMemberData({
        user_id: '',
        membership_type: 'regular',
        membership_fee: 0,
      });
      toast.success('Thêm thành viên thành công!');
    } catch (error) {
      toast.error('Lỗi khi thêm thành viên');
    }
  };

  const handleUpdateMember = async (memberId: string, updates: any) => {
    try {
      await updateMember(memberId, updates);
      setEditingMember(null);
      toast.success('Cập nhật thành viên thành công!');
    } catch (error) {
      toast.error('Lỗi khi cập nhật thành viên');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (window.confirm('Bạn có chắc muốn xóa thành viên này?')) {
      try {
        await removeMember(memberId);
        toast.success('Xóa thành viên thành công!');
      } catch (error) {
        toast.error('Lỗi khi xóa thành viên');
      }
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className='p-6'>
          <div className='flex justify-center'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className='p-6'>
          <div className='text-center text-red-500'>Lỗi: {error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center'>
              <Users className='h-8 w-8 text-blue-500' />
              <div className='ml-4'>
                <p className='text-sm font-medium text-muted-foreground'>
                  Tổng thành viên
                </p>
                <p className='text-2xl font-bold'>{stats.totalMembers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center'>
              <UserCheck className='h-8 w-8 text-green-500' />
              <div className='ml-4'>
                <p className='text-sm font-medium text-muted-foreground'>
                  Đang hoạt động
                </p>
                <p className='text-2xl font-bold'>{stats.activeMembers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center'>
              <Users className='h-8 w-8 text-purple-500' />
              <div className='ml-4'>
                <p className='text-sm font-medium text-muted-foreground'>VIP</p>
                <p className='text-2xl font-bold'>{stats.vipMembers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center'>
              <div className='ml-4'>
                <p className='text-sm font-medium text-muted-foreground'>
                  Doanh thu thành viên
                </p>
                <p className='text-2xl font-bold'>
                  {stats.totalRevenue.toLocaleString()}đ
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header with Search and Actions */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <CardTitle className='flex items-center gap-2'>
              <Users className='w-5 h-5' />
              Quản lý Thành viên ({filteredMembers.length})
            </CardTitle>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className='w-4 h-4 mr-2' />
                  Thêm thành viên
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Thêm thành viên mới</DialogTitle>
                </DialogHeader>
                <div className='space-y-4'>
                  <div>
                    <Label htmlFor='user_id'>User ID</Label>
                    <Input
                      id='user_id'
                      value={newMemberData.user_id}
                      onChange={e =>
                        setNewMemberData({
                          ...newMemberData,
                          user_id: e.target.value,
                        })
                      }
                      placeholder='Nhập User ID'
                    />
                  </div>
                  <div>
                    <Label htmlFor='membership_type'>Loại thành viên</Label>
                    <Select
                      value={newMemberData.membership_type}
                      onValueChange={value =>
                        setNewMemberData({
                          ...newMemberData,
                          membership_type: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='regular'>Thường</SelectItem>
                        <SelectItem value='vip'>VIP</SelectItem>
                        <SelectItem value='premium'>Premium</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor='membership_fee'>Phí thành viên</Label>
                    <Input
                      id='membership_fee'
                      type='number'
                      value={newMemberData.membership_fee}
                      onChange={e =>
                        setNewMemberData({
                          ...newMemberData,
                          membership_fee: parseInt(e.target.value),
                        })
                      }
                      placeholder='0'
                    />
                  </div>
                  <Button onClick={handleAddMember} className='w-full'>
                    Thêm thành viên
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col md:flex-row gap-4 mb-6'>
            <div className='flex-1 relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
              <Input
                placeholder='Tìm kiếm thành viên...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='pl-10'
              />
            </div>
            <div className='flex gap-2'>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className='w-[150px]'>
                  <SelectValue placeholder='Trạng thái' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Tất cả</SelectItem>
                  <SelectItem value='active'>Hoạt động</SelectItem>
                  <SelectItem value='inactive'>Không hoạt động</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Members List */}
          <div className='grid gap-4'>
            {filteredMembers.map(member => (
              <Card
                key={member.id}
                className='hover:shadow-md transition-shadow'
              >
                <CardContent className='p-4'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-4'>
                      <Avatar className='h-12 w-12'>
                        <AvatarImage src={member.profiles?.avatar_url || ''} />
                        <AvatarFallback>
                          {member.profiles?.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>

                      <div className='space-y-1'>
                        <h3 className='font-semibold'>
                          {member.profiles?.full_name || 'Chưa có tên'}
                        </h3>
                        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                          <span>
                            📞 {member.profiles?.phone || 'Chưa có SĐT'}
                          </span>
                          <span>•</span>
                          <span>
                            Tham gia:{' '}
                            {member.join_date
                              ? new Date(member.join_date).toLocaleDateString(
                                  'vi-VN'
                                )
                              : 'N/A'}
                          </span>
                        </div>
                        <div className='flex items-center gap-2'>
                          <Badge
                            variant={
                              member.status === 'active'
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {member.status === 'active'
                              ? 'Hoạt động'
                              : 'Không hoạt động'}
                          </Badge>
                          <Badge variant='outline'>
                            {member.membership_type || 'regular'}
                          </Badge>
                          {member.profiles?.verified_rank && (
                            <Badge variant='secondary'>
                              Rank {member.profiles.verified_rank}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className='flex items-center gap-2'>
                      <Button size='sm' variant='outline'>
                        <Eye className='h-4 w-4 mr-1' />
                        Xem
                      </Button>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => setEditingMember(member)}
                      >
                        <Edit className='h-4 w-4 mr-1' />
                        Sửa
                      </Button>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => handleRemoveMember(member.id)}
                      >
                        <Trash2 className='h-4 w-4 mr-1' />
                        Xóa
                      </Button>
                      <Button size='sm' variant='outline'>
                        <MessageSquare className='h-4 w-4 mr-1' />
                        Nhắn tin
                      </Button>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className='mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
                    <div>
                      <span className='text-muted-foreground'>
                        Tổng giờ chơi:
                      </span>
                      <span className='ml-2 font-medium'>
                        {member.total_hours_played || 0}h
                      </span>
                    </div>
                    <div>
                      <span className='text-muted-foreground'>Lượt thăm:</span>
                      <span className='ml-2 font-medium'>
                        {member.total_visits || 0}
                      </span>
                    </div>
                    <div>
                      <span className='text-muted-foreground'>
                        Phí thành viên:
                      </span>
                      <span className='ml-2 font-medium'>
                        {member.membership_fee?.toLocaleString() || 0}đ
                      </span>
                    </div>
                    <div>
                      <span className='text-muted-foreground'>Lần cuối:</span>
                      <span className='ml-2 font-medium'>
                        {member.last_visit
                          ? new Date(member.last_visit).toLocaleDateString(
                              'vi-VN'
                            )
                          : 'Chưa có'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredMembers.length === 0 && (
            <div className='text-center py-8 text-muted-foreground'>
              Không tìm thấy thành viên nào
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const MemberCard: React.FC<{
  member: ClubMember;
  onViewDetails?: (memberId: string) => void;
  onMessage?: (memberId: string) => void;
}> = ({ member, onViewDetails, onMessage }) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'moderator':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className='hover:shadow-md transition-shadow'>
      <CardContent className='p-4'>
        <div className='flex items-center space-x-4'>
          <Avatar className='h-12 w-12'>
            <AvatarImage src={member.profiles?.avatar_url} />
            <AvatarFallback className='bg-primary/10'>
              {getInitials(member.profiles.full_name)}
            </AvatarFallback>
          </Avatar>

          <div className='flex-1 min-w-0'>
            <div className='flex items-center justify-between'>
              <p className='text-sm font-medium truncate'>
                {member.profiles.full_name}
              </p>
              <div className='flex gap-1'>
                <Badge
                  variant={
                    member.profiles.verified_rank ? 'default' : 'secondary'
                  }
                >
                  {member.profiles.verified_rank || 'Chưa xác thực'}
                </Badge>
                {member.role !== 'member' && (
                  <Badge className={getRoleBadgeColor(member.role)}>
                    {member.role === 'admin' ? 'Quản lý' : 'Điều hành viên'}
                  </Badge>
                )}
              </div>
            </div>

            <div className='mt-1 text-xs text-muted-foreground'>
              <p>
                Thành viên từ:{' '}
                {new Date(member.join_date).toLocaleDateString('vi-VN')}
              </p>
              {member.last_visit && (
                <p>
                  Lần cuối:{' '}
                  {new Date(member.last_visit).toLocaleDateString('vi-VN')}
                </p>
              )}
              <div className='flex items-center gap-2 mt-1'>
                <span
                  className={`w-2 h-2 rounded-full ${member.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}
                ></span>
                <span>
                  {member.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                </span>
              </div>
            </div>

            <div className='mt-3 flex gap-2'>
              {onViewDetails && (
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => onViewDetails(member.id)}
                >
                  <UserCheck className='w-4 h-4 mr-1' />
                  Chi tiết
                </Button>
              )}
              {onMessage && (
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => onMessage(member.id)}
                >
                  <MessageSquare className='w-4 h-4 mr-1' />
                  Nhắn tin
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface MemberManagementProps {
  clubId: string;
}

export const MemberManagement: React.FC<MemberManagementProps> = ({
  clubId,
}) => {
  const [members] = React.useState(mockMembers);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filterStatus, setFilterStatus] = React.useState<
    'all' | 'active' | 'inactive'
  >('all');

  const filteredMembers = React.useMemo(() => {
    return members.filter(member => {
      const matchesSearch = member.profiles.full_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesStatus =
        filterStatus === 'all' || member.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [members, searchTerm, filterStatus]);

  const handleViewDetails = (memberId: string) => {
    console.log('View details for member:', memberId);
    // Implement member details view
  };

  const handleMessage = (memberId: string) => {
    console.log('Send message to member:', memberId);
    // Implement messaging functionality
  };

  const handleAddMember = () => {
    console.log('Add new member');
    // Implement add member functionality
  };

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2'>
            <Users className='w-5 h-5' />
            Quản lý thành viên ({filteredMembers.length})
          </CardTitle>
          <Button onClick={handleAddMember} className='flex items-center gap-2'>
            <Plus className='w-4 h-4' />
            Thêm thành viên
          </Button>
        </div>

        <div className='flex gap-4 items-center'>
          <div className='relative flex-1'>
            <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
            <Input
              placeholder='Tìm kiếm thành viên...'
              className='pl-8'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className='flex items-center gap-2'>
            <Filter className='w-4 h-4 text-muted-foreground' />
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as any)}
              className='px-3 py-2 border rounded-md text-sm'
            >
              <option value='all'>Tất cả</option>
              <option value='active'>Hoạt động</option>
              <option value='inactive'>Không hoạt động</option>
            </select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {filteredMembers.map(member => (
            <MemberCard
              key={member.id}
              member={member}
              onViewDetails={handleViewDetails}
              onMessage={handleMessage}
            />
          ))}
        </div>

        {filteredMembers.length === 0 && (
          <div className='text-center py-8 text-muted-foreground'>
            <Users className='w-12 h-12 mx-auto mb-4 opacity-50' />
            <p>Không tìm thấy thành viên nào</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
