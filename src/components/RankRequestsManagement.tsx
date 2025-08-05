import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Trophy,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Calendar,
  MessageSquare,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface RankRequest {
  id: string;
  user_id: string;
  requested_rank: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'scheduled';
  created_at: string;
  scheduled_time?: string;
  rejection_reason?: string;
  user_profile?: {
    full_name: string;
    display_name: string;
    phone: string;
  };
}

interface RankRequestsManagementProps {
  clubId: string;
}

const RankRequestsManagement = ({ clubId }: RankRequestsManagementProps) => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<RankRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RankRequest | null>(
    null
  );
  const [showDialog, setShowDialog] = useState(false);
  const [actionType, setActionType] = useState<
    'approve' | 'reject' | 'schedule' | null
  >(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  const ranks = [
    { value: 'K', label: 'Hạng K', color: 'bg-gray-100 text-gray-800' },
    { value: 'K+', label: 'Hạng K+', color: 'bg-gray-100 text-gray-800' },
    { value: 'I', label: 'Hạng I', color: 'bg-amber-100 text-amber-800' },
    { value: 'I+', label: 'Hạng I+', color: 'bg-amber-100 text-amber-800' },
    { value: 'H', label: 'Hạng H', color: 'bg-green-100 text-green-800' },
    { value: 'H+', label: 'Hạng H+', color: 'bg-green-100 text-green-800' },
    { value: 'G', label: 'Hạng G', color: 'bg-blue-100 text-blue-800' },
    { value: 'G+', label: 'Hạng G+', color: 'bg-blue-100 text-blue-800' },
    { value: 'F', label: 'Hạng F', color: 'bg-purple-100 text-purple-800' },
    { value: 'F+', label: 'Hạng F+', color: 'bg-purple-100 text-purple-800' },
    { value: 'E', label: 'Hạng E', color: 'bg-red-100 text-red-800' },
    { value: 'E+', label: 'Hạng E+', color: 'bg-red-100 text-red-800' },
  ];

  useEffect(() => {
    if (clubId) {
      fetchRankRequests();
    }
  }, [clubId]);

  const fetchRankRequests = async () => {
    try {
      setLoading(true);

      // Using mock data for now - will update when database structure is ready
      const mockRequests = [
        {
          id: '1',
          user_id: 'user1',
          requested_rank: 'H+',
          reason: 'Có kinh nghiệm tournament và thắng nhiều trận thách đấu',
          status: 'pending' as const,
          created_at: new Date().toISOString(),
          user_profile: {
            full_name: 'Nguyễn Văn A',
            display_name: 'Player A',
            phone: '0901234567',
          },
        },
        {
          id: '2',
          user_id: 'user2',
          requested_rank: 'G',
          reason: 'Đã chơi 2 năm và có kỹ thuật tốt',
          status: 'pending' as const,
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          user_profile: {
            full_name: 'Trần Thị B',
            display_name: 'Player B',
            phone: '0901234568',
          },
        },
      ];

      setRequests(mockRequests);
    } catch (error) {
      console.error('Error fetching rank requests:', error);
      toast.error('Có lỗi khi tải danh sách yêu cầu');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAction = async () => {
    if (!selectedRequest || !actionType) return;

    try {
      setLoading(true);

      const { data, error } = await supabase.functions.invoke(
        'rank-request-notification',
        {
          body: {
            rank_request_id: selectedRequest.id,
            action: actionType,
            rejection_reason: rejectionReason,
            scheduled_time: scheduledTime,
          },
        }
      );

      if (error) throw error;

      if (data.success) {
        toast.success(
          `Yêu cầu đã được ${actionType === 'approve' ? 'phê duyệt' : actionType === 'reject' ? 'từ chối' : 'lên lịch'} thành công!`
        );
        setShowDialog(false);
        setSelectedRequest(null);
        setActionType(null);
        setRejectionReason('');
        setScheduledTime('');
        fetchRankRequests();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error handling request:', error);
      toast.error('Có lỗi khi xử lý yêu cầu');
    } finally {
      setLoading(false);
    }
  };

  const openActionDialog = (
    request: RankRequest,
    action: 'approve' | 'reject' | 'schedule'
  ) => {
    setSelectedRequest(request);
    setActionType(action);
    setShowDialog(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant='secondary' className='bg-yellow-100 text-yellow-800'>
            <Clock className='w-3 h-3 mr-1' />
            Chờ xử lý
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant='secondary' className='bg-green-100 text-green-800'>
            <CheckCircle className='w-3 h-3 mr-1' />
            Đã phê duyệt
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant='secondary' className='bg-red-100 text-red-800'>
            <AlertCircle className='w-3 h-3 mr-1' />
            Từ chối
          </Badge>
        );
      case 'scheduled':
        return (
          <Badge variant='secondary' className='bg-blue-100 text-blue-800'>
            <Calendar className='w-3 h-3 mr-1' />
            Đã lên lịch
          </Badge>
        );
      default:
        return <Badge variant='secondary'>{status}</Badge>;
    }
  };

  const getRankBadgeColor = (rank: string) => {
    return (
      ranks.find(r => r.value === rank)?.color || 'bg-gray-100 text-gray-800'
    );
  };

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Trophy className='h-5 w-5' />
            Yêu cầu xác thực hạng ({requests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <div className='text-center py-4'>Đang tải...</div>}

          {!loading && requests.length === 0 && (
            <div className='text-center py-8 text-gray-500'>
              <Trophy className='h-12 w-12 mx-auto mb-4 opacity-50' />
              <p>Không có yêu cầu xác thực hạng nào</p>
            </div>
          )}

          {!loading && requests.length > 0 && (
            <div className='space-y-4'>
              {requests.map(request => (
                <div
                  key={request.id}
                  className='border rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors'
                >
                  <div className='flex items-start justify-between'>
                    <div className='flex-1'>
                      <div className='flex items-center gap-3 mb-2'>
                        <div className='flex items-center gap-2'>
                          <User className='h-4 w-4 text-gray-400' />
                          <span className='font-medium'>
                            {request.user_profile?.display_name ||
                              request.user_profile?.full_name}
                          </span>
                        </div>
                        <Badge
                          className={getRankBadgeColor(request.requested_rank)}
                        >
                          {request.requested_rank}
                        </Badge>
                        {getStatusBadge(request.status)}
                      </div>

                      <div className='flex items-center gap-2 text-sm text-gray-600 mb-2'>
                        <Calendar className='h-4 w-4' />
                        <span>
                          {new Date(request.created_at).toLocaleDateString(
                            'vi-VN',
                            {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            }
                          )}
                        </span>
                      </div>

                      <div className='flex items-start gap-2 text-sm'>
                        <MessageSquare className='h-4 w-4 text-gray-400 mt-0.5' />
                        <p className='text-gray-700'>{request.reason}</p>
                      </div>
                    </div>

                    {request.status === 'pending' && (
                      <div className='flex gap-2 ml-4'>
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() => openActionDialog(request, 'approve')}
                          className='text-green-600 hover:text-green-700'
                        >
                          <CheckCircle className='h-4 w-4 mr-1' />
                          Phê duyệt
                        </Button>
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() => openActionDialog(request, 'schedule')}
                          className='text-blue-600 hover:text-blue-700'
                        >
                          <Calendar className='h-4 w-4 mr-1' />
                          Lên lịch
                        </Button>
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() => openActionDialog(request, 'reject')}
                          className='text-red-600 hover:text-red-700'
                        >
                          <AlertCircle className='h-4 w-4 mr-1' />
                          Từ chối
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' && 'Phê duyệt yêu cầu'}
              {actionType === 'reject' && 'Từ chối yêu cầu'}
              {actionType === 'schedule' && 'Lên lịch kiểm tra'}
            </DialogTitle>
          </DialogHeader>

          <div className='space-y-4'>
            {selectedRequest && (
              <div className='p-4 bg-gray-50 rounded-lg'>
                <div className='flex items-center gap-2 mb-2'>
                  <User className='h-4 w-4' />
                  <span className='font-medium'>
                    {selectedRequest.user_profile?.display_name ||
                      selectedRequest.user_profile?.full_name}
                  </span>
                  <Badge
                    className={getRankBadgeColor(
                      selectedRequest.requested_rank
                    )}
                  >
                    {selectedRequest.requested_rank}
                  </Badge>
                </div>
                <p className='text-sm text-gray-600'>
                  {selectedRequest.reason}
                </p>
              </div>
            )}

            {actionType === 'reject' && (
              <div>
                <label className='block text-sm font-medium mb-2'>
                  Lý do từ chối *
                </label>
                <Textarea
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  placeholder='Nhập lý do từ chối yêu cầu...'
                  rows={3}
                />
              </div>
            )}

            {actionType === 'schedule' && (
              <div>
                <label className='block text-sm font-medium mb-2'>
                  Thời gian kiểm tra *
                </label>
                <input
                  type='datetime-local'
                  value={scheduledTime}
                  onChange={e => setScheduledTime(e.target.value)}
                  className='w-full p-2 border rounded-md'
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setShowDialog(false)}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button
              onClick={handleRequestAction}
              disabled={
                loading ||
                (actionType === 'reject' && !rejectionReason.trim()) ||
                (actionType === 'schedule' && !scheduledTime)
              }
            >
              {loading ? 'Đang xử lý...' : 'Xác nhận'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RankRequestsManagement;
