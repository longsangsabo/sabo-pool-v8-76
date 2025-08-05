import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  Trophy,
  Calendar,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { useRankRequests } from '@/hooks/useRankRequests';
import { RankRequest } from '@/types/rankRequests';
import { toast } from 'sonner';

interface RankRequestsTabProps {
  clubId: string;
  user: any;
}

const RankRequestsTab = ({ clubId, user }: RankRequestsTabProps) => {
  const {
    rankRequests,
    loading,
    stats,
    fetchRankRequests,
    updateRankRequest,
    getStatusText,
    getStatusColor,
  } = useRankRequests();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<RankRequest | null>(
    null
  );
  const [rejectionReason, setRejectionReason] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchRankRequests({ club_id: clubId });
  }, [clubId, fetchRankRequests]);

  const filteredRequests =
    statusFilter === 'all'
      ? rankRequests
      : rankRequests.filter(req => req.status === statusFilter);

  const handleStatusUpdate = async (requestId: string, status: string) => {
    setUpdating(true);
    try {
      const updateData: any = { status };

      if (status === 'rejected' && rejectionReason) {
        updateData.rejection_reason = rejectionReason;
      }

      await updateRankRequest(requestId, updateData);

      // Refresh the list
      await fetchRankRequests({ club_id: clubId });

      // Reset form
      setSelectedRequest(null);
      setRejectionReason('');
    } catch (error) {
      console.error('Error updating rank request:', error);
    } finally {
      setUpdating(false);
    }
  };

  const getActionButtons = (request: RankRequest) => {
    if (request.status !== 'pending') {
      return null;
    }

    return (
      <div className='flex space-x-2'>
        <Button
          size='sm'
          onClick={() => handleStatusUpdate(request.id, 'approved')}
          disabled={updating}
          className='bg-green-600 hover:bg-green-700'
        >
          <CheckCircle className='w-4 h-4 mr-1' />
          Phê duyệt
        </Button>

        <Dialog>
          <DialogTrigger asChild>
            <Button
              size='sm'
              variant='outline'
              disabled={updating}
              className='border-blue-500 text-blue-600 hover:bg-blue-50'
            >
              <Clock className='w-4 h-4 mr-1' />
              Kiểm tra tại chỗ
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yêu cầu kiểm tra tại chỗ</DialogTitle>
            </DialogHeader>
            <div className='space-y-4'>
              <p className='text-sm text-gray-600'>
                Người dùng sẽ được thông báo đến CLB để kiểm tra trước khi xác
                nhận rank.
              </p>
              <div className='flex justify-end space-x-2'>
                <Button
                  variant='outline'
                  onClick={() => setSelectedRequest(null)}
                >
                  Hủy
                </Button>
                <Button
                  onClick={() => handleStatusUpdate(request.id, 'on_site_test')}
                  disabled={updating}
                >
                  Xác nhận
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger asChild>
            <Button
              size='sm'
              variant='outline'
              disabled={updating}
              className='border-red-500 text-red-600 hover:bg-red-50'
            >
              <XCircle className='w-4 h-4 mr-1' />
              Từ chối
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Từ chối yêu cầu rank</DialogTitle>
            </DialogHeader>
            <div className='space-y-4'>
              <div>
                <label className='text-sm font-medium'>
                  Lý do từ chối (tùy chọn)
                </label>
                <Textarea
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  placeholder='Nhập lý do từ chối...'
                  rows={3}
                />
              </div>
              <div className='flex justify-end space-x-2'>
                <Button
                  variant='outline'
                  onClick={() => {
                    setSelectedRequest(null);
                    setRejectionReason('');
                  }}
                >
                  Hủy
                </Button>
                <Button
                  variant='destructive'
                  onClick={() => handleStatusUpdate(request.id, 'rejected')}
                  disabled={updating}
                >
                  Từ chối
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <Loader2 className='w-8 h-8 animate-spin' />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Stats Cards */}
      <div className='grid grid-cols-2 md:grid-cols-5 gap-4'>
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center space-x-2'>
              <Trophy className='w-5 h-5 text-blue-600' />
              <div>
                <p className='text-sm text-gray-600'>Tổng cộng</p>
                <p className='text-2xl font-bold'>{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center space-x-2'>
              <Clock className='w-5 h-5 text-yellow-600' />
              <div>
                <p className='text-sm text-gray-600'>Chờ xử lý</p>
                <p className='text-2xl font-bold'>{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center space-x-2'>
              <CheckCircle className='w-5 h-5 text-green-600' />
              <div>
                <p className='text-sm text-gray-600'>Đã phê duyệt</p>
                <p className='text-2xl font-bold'>{stats.approved}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center space-x-2'>
              <AlertTriangle className='w-5 h-5 text-blue-600' />
              <div>
                <p className='text-sm text-gray-600'>Kiểm tra tại chỗ</p>
                <p className='text-2xl font-bold'>{stats.on_site_test}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center space-x-2'>
              <XCircle className='w-5 h-5 text-red-600' />
              <div>
                <p className='text-sm text-gray-600'>Bị từ chối</p>
                <p className='text-2xl font-bold'>{stats.rejected}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <CardTitle>Yêu cầu Rank</CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className='w-48'>
                <SelectValue placeholder='Lọc theo trạng thái' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tất cả</SelectItem>
                <SelectItem value='pending'>Chờ xử lý</SelectItem>
                <SelectItem value='approved'>Đã phê duyệt</SelectItem>
                <SelectItem value='on_site_test'>Kiểm tra tại chỗ</SelectItem>
                <SelectItem value='rejected'>Bị từ chối</SelectItem>
                <SelectItem value='banned'>Bị cấm</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredRequests.length === 0 ? (
            <div className='text-center py-8 text-gray-500'>
              Không có yêu cầu rank nào
            </div>
          ) : (
            <div className='space-y-4'>
              {filteredRequests.map(request => (
                <Card key={request.id} className='p-4'>
                  <div className='flex items-start justify-between'>
                    <div className='flex items-start space-x-4 flex-1'>
                      <Avatar className='w-12 h-12'>
                        <AvatarImage src={request.user?.profiles?.avatar_url} />
                        <AvatarFallback>
                          <User className='w-6 h-6' />
                        </AvatarFallback>
                      </Avatar>

                      <div className='flex-1 space-y-2'>
                        <div className='flex items-center space-x-2'>
                          <h3 className='font-medium'>
                            {request.user?.profiles?.nickname ||
                              request.user?.profiles?.full_name ||
                              request.user?.email}
                          </h3>
                          <Badge className={getStatusColor(request.status)}>
                            {getStatusText(request.status)}
                          </Badge>
                        </div>

                        <div className='flex items-center space-x-4 text-sm text-gray-600'>
                          <div className='flex items-center space-x-1'>
                            <Trophy className='w-4 h-4' />
                            <span>Rank yêu cầu: {request.requested_rank}</span>
                          </div>

                          <div className='flex items-center space-x-1'>
                            <Calendar className='w-4 h-4' />
                            <span>{formatDate(request.created_at)}</span>
                          </div>
                        </div>

                        {request.rejection_reason && (
                          <div className='text-sm text-red-600 bg-red-50 p-2 rounded'>
                            <strong>Lý do từ chối:</strong>{' '}
                            {request.rejection_reason}
                          </div>
                        )}

                        {request.approved_by && (
                          <div className='text-sm text-green-600'>
                            <strong>Phê duyệt bởi:</strong>{' '}
                            {request.approver?.profiles?.nickname ||
                              request.approver?.email}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className='ml-4'>{getActionButtons(request)}</div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RankRequestsTab;
