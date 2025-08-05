import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  Trophy,
  Building,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { RankRequest, UpdateRankRequestData } from '@/types/rankRequests';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface RankRequestCardProps {
  rankRequest: RankRequest;
  onUpdate: (id: string, data: UpdateRankRequestData) => Promise<void>;
  isClubOwner: boolean;
}

const RankRequestCard = ({
  rankRequest,
  onUpdate,
  isClubOwner,
}: RankRequestCardProps) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const getStatusColor = (status: RankRequest['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'on_site_test':
        return 'bg-blue-100 text-blue-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'banned':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: RankRequest['status']) => {
    switch (status) {
      case 'pending':
        return 'Chờ xử lý';
      case 'approved':
        return 'Đã phê duyệt';
      case 'on_site_test':
        return 'Kiểm tra tại chỗ';
      case 'rejected':
        return 'Bị từ chối';
      case 'banned':
        return 'Bị cấm';
      default:
        return 'Không xác định';
    }
  };

  const getStatusIcon = (status: RankRequest['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className='w-4 h-4' />;
      case 'approved':
        return <CheckCircle className='w-4 h-4' />;
      case 'on_site_test':
        return <AlertTriangle className='w-4 h-4' />;
      case 'rejected':
        return <XCircle className='w-4 h-4' />;
      case 'banned':
        return <XCircle className='w-4 h-4' />;
      default:
        return <Clock className='w-4 h-4' />;
    }
  };

  const handleAction = async (status: UpdateRankRequestData['status']) => {
    if (status === 'rejected' && !rejectionReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }

    setIsUpdating(true);
    try {
      await onUpdate(rankRequest.id, {
        status,
        rejection_reason: status === 'rejected' ? rejectionReason : undefined,
      });

      if (status === 'rejected') {
        setShowRejectDialog(false);
        setRejectionReason('');
      }
    } catch (error) {
      console.error('Error updating rank request:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const user = rankRequest.user?.profiles;
  const club = rankRequest.club;

  return (
    <Card className='w-full'>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-3'>
            <Avatar className='w-10 h-10'>
              <AvatarImage src={user?.avatar_url} />
              <AvatarFallback>
                <User className='w-5 h-5' />
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className='text-lg'>
                {user?.nickname ||
                  user?.full_name ||
                  'Người dùng không xác định'}
              </CardTitle>
              <p className='text-sm text-gray-600'>{rankRequest.user?.email}</p>
            </div>
          </div>
          <Badge className={getStatusColor(rankRequest.status)}>
            <div className='flex items-center space-x-1'>
              {getStatusIcon(rankRequest.status)}
              <span>{getStatusText(rankRequest.status)}</span>
            </div>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className='space-y-4'>
        {/* Rank Information */}
        <div className='flex items-center space-x-2'>
          <Trophy className='w-4 h-4 text-yellow-600' />
          <span className='font-medium'>Yêu cầu rank:</span>
          <Badge variant='outline' className='text-lg font-bold'>
            {rankRequest.requested_rank}
          </Badge>
          {user?.elo && (
            <>
              <span className='text-gray-500'>(Hiện tại: {user.elo})</span>
            </>
          )}
        </div>

        {/* Club Information */}
        {club && (
          <div className='flex items-center space-x-2'>
            <Building className='w-4 h-4 text-blue-600' />
            <span className='font-medium'>CLB:</span>
            <span>{club.name}</span>
            <span className='text-gray-500'>- {club.address}</span>
          </div>
        )}

        {/* Timestamp */}
        <div className='flex items-center space-x-2 text-sm text-gray-500'>
          <Calendar className='w-4 h-4' />
          <span>
            {formatDistanceToNow(new Date(rankRequest.created_at), {
              addSuffix: true,
              locale: vi,
            })}
          </span>
        </div>

        {/* Rejection Reason */}
        {rankRequest.status === 'rejected' && rankRequest.rejection_reason && (
          <div className='p-3 bg-red-50 border border-red-200 rounded-md'>
            <p className='text-sm text-red-800'>
              <strong>Lý do từ chối:</strong> {rankRequest.rejection_reason}
            </p>
          </div>
        )}

        {/* Action Buttons for Club Owners */}
        {isClubOwner && rankRequest.status === 'pending' && (
          <div className='flex space-x-2 pt-2'>
            <Button
              onClick={() => handleAction('approved')}
              disabled={isUpdating}
              className='flex-1 bg-green-600 hover:bg-green-700'
            >
              <CheckCircle className='w-4 h-4 mr-2' />
              Phê duyệt
            </Button>

            <Button
              onClick={() => handleAction('on_site_test')}
              disabled={isUpdating}
              variant='outline'
              className='flex-1'
            >
              <AlertTriangle className='w-4 h-4 mr-2' />
              Kiểm tra tại chỗ
            </Button>

            <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
              <DialogTrigger asChild>
                <Button
                  variant='outline'
                  className='flex-1 border-red-200 text-red-700 hover:bg-red-50'
                >
                  <XCircle className='w-4 h-4 mr-2' />
                  Từ chối
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Từ chối yêu cầu rank</DialogTitle>
                </DialogHeader>
                <div className='space-y-4'>
                  <div>
                    <Label htmlFor='rejection-reason'>Lý do từ chối *</Label>
                    <Textarea
                      id='rejection-reason'
                      value={rejectionReason}
                      onChange={e => setRejectionReason(e.target.value)}
                      placeholder='Nhập lý do từ chối yêu cầu...'
                      rows={3}
                    />
                  </div>
                  <div className='flex space-x-2'>
                    <Button
                      onClick={() => handleAction('rejected')}
                      disabled={isUpdating || !rejectionReason.trim()}
                      className='bg-red-600 hover:bg-red-700'
                    >
                      {isUpdating ? 'Đang xử lý...' : 'Xác nhận từ chối'}
                    </Button>
                    <Button
                      variant='outline'
                      onClick={() => setShowRejectDialog(false)}
                    >
                      Hủy
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Ban Button for Club Owners */}
        {isClubOwner && rankRequest.status !== 'banned' && (
          <div className='pt-2'>
            <Button
              onClick={() => handleAction('banned')}
              disabled={isUpdating}
              variant='destructive'
              className='w-full'
            >
              <XCircle className='w-4 h-4 mr-2' />
              Cấm người dùng
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RankRequestCard;
