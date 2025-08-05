import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useClubRole } from '@/hooks/useClubRole';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Trophy,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { eloToSaboRank } from '@/utils/eloToSaboRank';

// Helper function to convert rank integer to SABO rank text
const getRankFromInteger = (rankInt: number): string => {
  const rankMap: { [key: number]: string } = {
    1: 'K',
    2: 'K+',
    3: 'I',
    4: 'I+',
    5: 'H',
    6: 'H+',
    7: 'G',
    8: 'G+',
    9: 'F',
    10: 'F+',
    11: 'E',
    12: 'E+',
  };
  return rankMap[rankInt] || 'K';
};

interface RankRequest {
  id: string;
  user_id: string;
  requested_rank: number;
  status: string;
  created_at: string;
  rejection_reason?: string;
  player_name?: string;
  player_phone?: string;
}

const RankVerificationTab = () => {
  const { user } = useAuth();
  const { isClubOwner, clubProfile, isLoading: clubLoading } = useClubRole();

  const [requests, setRequests] = useState<RankRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  // Simple effect to load data
  useEffect(() => {
    if (user && isClubOwner && clubProfile?.id) {
      loadRankRequests();
    }
  }, [user, isClubOwner, clubProfile?.id]);

  const loadRankRequests = async () => {
    if (!clubProfile?.id) {
      console.log('No club profile ID found:', clubProfile);
      return;
    }

    try {
      setLoading(true);
      console.log('Loading rank requests for club:', clubProfile.id);

      // For now, let's just set empty requests since rank_verifications table doesn't exist
      // This is a placeholder implementation
      console.log(
        'Rank verification feature not implemented - using placeholder'
      );
      setRequests([]);
    } catch (error) {
      console.error('Error loading rank requests:', error);
      toast.error(
        'Lỗi khi tải danh sách xác thực hạng: ' + (error as any)?.message
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId: string, newStatus: string) => {
    try {
      setProcessing(requestId);

      // Placeholder implementation since rank_verifications table doesn't exist
      toast.info('Chức năng xác thực hạng chưa được triển khai đầy đủ');

      // Update local state
      setRequests(prev =>
        prev.map(req =>
          req.id === requestId ? { ...req, status: newStatus } : req
        )
      );

      toast.success(`Đã cập nhật trạng thái thành "${newStatus}"`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Lỗi khi cập nhật trạng thái');
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge
            variant='outline'
            className='bg-yellow-50 text-yellow-700 border-yellow-200'
          >
            <Clock className='w-3 h-3 mr-1' />
            Chờ duyệt
          </Badge>
        );
      case 'approved':
        return (
          <Badge
            variant='outline'
            className='bg-green-50 text-green-700 border-green-200'
          >
            <CheckCircle className='w-3 h-3 mr-1' />
            Đã duyệt
          </Badge>
        );
      case 'rejected':
        return (
          <Badge
            variant='outline'
            className='bg-red-50 text-red-700 border-red-200'
          >
            <XCircle className='w-3 h-3 mr-1' />
            Từ chối
          </Badge>
        );
      case 'on_site_test':
        return (
          <Badge
            variant='outline'
            className='bg-blue-50 text-blue-700 border-blue-200'
          >
            <Trophy className='w-3 h-3 mr-1' />
            Đang test
          </Badge>
        );
      default:
        return <Badge variant='outline'>{status}</Badge>;
    }
  };

  // Loading state
  if (clubLoading || loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center'>
            <Trophy className='w-5 h-5 mr-2' />
            Xác thực hạng người chơi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-center py-8'>
            <RefreshCw className='w-6 h-6 animate-spin mr-2' />
            <span>Đang tải...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Not a club owner
  if (!isClubOwner) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center'>
            <AlertCircle className='w-5 h-5 mr-2 text-orange-500' />
            Không có quyền truy cập
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-center py-8'>
            <p className='text-muted-foreground'>
              Bạn cần là chủ câu lạc bộ để truy cập chức năng này.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center'>
            <Trophy className='w-5 h-5 mr-2' />
            Xác thực hạng người chơi
          </CardTitle>
          <Button
            variant='outline'
            size='sm'
            onClick={loadRankRequests}
            disabled={loading}
          >
            <RefreshCw
              className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`}
            />
            Làm mới
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <div className='text-center py-8'>
            <Trophy className='w-12 h-12 mx-auto text-muted-foreground mb-4' />
            <p className='text-muted-foreground'>
              Chưa có yêu cầu xác thực hạng nào.
            </p>
          </div>
        ) : (
          <div className='space-y-4'>
            {requests.map(request => (
              <div key={request.id} className='border rounded-lg p-4 space-y-3'>
                <div className='flex items-start justify-between'>
                  <div>
                    <h4 className='font-medium'>{request.player_name}</h4>
                    <p className='text-sm text-muted-foreground'>
                      Muốn xác thực hạng{' '}
                      <span className='font-medium text-primary'>
                        {getRankFromInteger(request.requested_rank)}
                      </span>
                    </p>
                    {request.player_phone && (
                      <p className='text-xs text-muted-foreground'>
                        📞 {request.player_phone}
                      </p>
                    )}
                  </div>
                  <div className='text-right'>
                    {getStatusBadge(request.status)}
                    <p className='text-xs text-muted-foreground mt-1'>
                      {new Date(request.created_at).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                </div>

                {request.status === 'pending' && (
                  <div className='flex gap-2 pt-2'>
                    <Button
                      size='sm'
                      onClick={() =>
                        handleStatusUpdate(request.id, 'on_site_test')
                      }
                      disabled={processing === request.id}
                      className='bg-blue-600 hover:bg-blue-700'
                    >
                      <Trophy className='w-4 h-4 mr-1' />
                      Chấp nhận test
                    </Button>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => handleStatusUpdate(request.id, 'rejected')}
                      disabled={processing === request.id}
                    >
                      <XCircle className='w-4 h-4 mr-1' />
                      Từ chối
                    </Button>
                  </div>
                )}

                {request.status === 'on_site_test' && (
                  <div className='flex gap-2 pt-2'>
                    <Button
                      size='sm'
                      onClick={() => handleStatusUpdate(request.id, 'approved')}
                      disabled={processing === request.id}
                      className='bg-green-600 hover:bg-green-700'
                    >
                      <CheckCircle className='w-4 h-4 mr-1' />
                      Đạt hạng
                    </Button>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => handleStatusUpdate(request.id, 'rejected')}
                      disabled={processing === request.id}
                    >
                      <XCircle className='w-4 h-4 mr-1' />
                      Không đạt
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RankVerificationTab;
