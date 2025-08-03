import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  UserCheck,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  AlertCircle,
  FileText,
  Camera,
  Users,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useClubRole } from '@/hooks/useClubRole';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RankRequest {
  id: string;
  user_id: string;
  requested_rank: string;
  current_rank: string;
  evidence_url?: string;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  profile?: {
    full_name: string;
    display_name: string;
    avatar_url?: string;
    verified_rank?: string;
  };
}

const ClubRankVerificationTab = () => {
  const { user } = useAuth();
  const { isClubOwner, clubProfile } = useClubRole();
  const [requests, setRequests] = useState<RankRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (user && isClubOwner && clubProfile?.id) {
      loadRankRequests();

      // Set up realtime subscription
      const channel = supabase
        .channel('rank-requests-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'rank_requests',
            filter: `club_id=eq.${clubProfile.id}`,
          },
          payload => {
            console.log('Rank request change:', payload);
            // Reload data when there's a change
            loadRankRequests();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, isClubOwner, clubProfile?.id]);

  const loadRankRequests = async () => {
    if (!clubProfile?.id) return;

    try {
      setLoading(true);

      // Query rank_requests with basic data first
      const { data: requestsData, error } = await supabase
        .from('rank_requests')
        .select('*')
        .eq('club_id', clubProfile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get user profiles separately
      const userIds = requestsData?.map(r => r.user_id).filter(Boolean) || [];

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name, display_name, avatar_url, verified_rank')
        .in('user_id', userIds);

      // Combine data
      const requestsWithProfiles = (requestsData || []).map((request: any) => {
        const profile = profilesData?.find(p => p.user_id === request.user_id);
        return {
          ...request,
          status: request.status as 'pending' | 'approved' | 'rejected',
          profile: profile
            ? {
                full_name: profile.full_name,
                display_name: profile.display_name,
                avatar_url: profile.avatar_url,
                verified_rank: profile.verified_rank,
              }
            : undefined,
        };
      });

      setRequests(requestsWithProfiles as RankRequest[]);
    } catch (error: any) {
      console.error('Error loading rank requests:', error);
      toast.error('Lỗi khi tải danh sách xác thực hạng: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (
    requestId: string,
    newStatus: 'approved' | 'rejected',
    notes?: string
  ) => {
    try {
      setProcessing(requestId);

      const { error } = await supabase
        .from('rank_requests')
        .update({
          status: newStatus,
          rejection_reason: newStatus === 'rejected' ? notes : null,
          approved_by: newStatus === 'approved' ? user?.id : null,
          approved_at:
            newStatus === 'approved' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;

      // Note: Profile update and SPA point rewards are now handled automatically by database triggers

      toast.success(
        newStatus === 'approved' ? 'Đã phê duyệt yêu cầu' : 'Đã từ chối yêu cầu'
      );
      loadRankRequests();
    } catch (error: any) {
      console.error('Error updating rank request:', error);
      toast.error('Lỗi khi cập nhật yêu cầu: ' + error.message);
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant='secondary'>
            <Clock className='w-3 h-3 mr-1' />
            Chờ duyệt
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant='default'>
            <CheckCircle className='w-3 h-3 mr-1' />
            Đã duyệt
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant='destructive'>
            <XCircle className='w-3 h-3 mr-1' />
            Từ chối
          </Badge>
        );
      default:
        return <Badge variant='secondary'>Không xác định</Badge>;
    }
  };

  const getRankBadgeColor = (rank: string) => {
    const rankColors: Record<string, string> = {
      A: 'bg-red-100 text-red-700',
      B: 'bg-orange-100 text-orange-700',
      C: 'bg-yellow-100 text-yellow-700',
      D: 'bg-green-100 text-green-700',
      K: 'bg-gray-100 text-gray-700',
    };
    return rankColors[rank] || 'bg-gray-100 text-gray-700';
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const processedRequests = requests.filter(r => r.status !== 'pending');

  if (loading) {
    return (
      <Card>
        <CardContent className='p-6'>
          <div className='text-center text-muted-foreground'>
            Đang tải danh sách xác thực hạng...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-2xl font-bold text-foreground'>
          Xác thực hạng người chơi
        </h2>
        <p className='text-muted-foreground'>
          Xét duyệt yêu cầu xác thực hạng từ các thành viên
        </p>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center gap-3'>
              <Clock className='w-8 h-8 text-orange-500' />
              <div>
                <p className='text-2xl font-bold'>{pendingRequests.length}</p>
                <p className='text-sm text-muted-foreground'>Chờ duyệt</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center gap-3'>
              <CheckCircle className='w-8 h-8 text-green-500' />
              <div>
                <p className='text-2xl font-bold'>
                  {
                    processedRequests.filter(r => r.status === 'approved')
                      .length
                  }
                </p>
                <p className='text-sm text-muted-foreground'>Đã duyệt</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center gap-3'>
              <Users className='w-8 h-8 text-blue-500' />
              <div>
                <p className='text-2xl font-bold'>{requests.length}</p>
                <p className='text-sm text-muted-foreground'>Tổng yêu cầu</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue='pending' className='w-full'>
        <TabsList className='grid w-full grid-cols-2'>
          <TabsTrigger value='pending' className='flex items-center gap-2'>
            <Clock className='w-4 h-4' />
            Chờ duyệt ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value='processed' className='flex items-center gap-2'>
            <FileText className='w-4 h-4' />
            Đã xử lý ({processedRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value='pending' className='space-y-4'>
          {pendingRequests.length === 0 ? (
            <Card>
              <CardContent className='p-8'>
                <div className='text-center text-muted-foreground'>
                  <UserCheck className='h-12 w-12 mx-auto mb-4 text-gray-400' />
                  <p className='font-medium'>
                    Không có yêu cầu nào đang chờ duyệt
                  </p>
                  <p className='text-sm mt-1'>
                    Các yêu cầu xác thực hạng sẽ hiển thị tại đây
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            pendingRequests.map(request => (
              <Card key={request.id} className='border-orange-200 bg-orange-50'>
                <CardContent className='p-6'>
                  <div className='flex items-start justify-between mb-4'>
                    <div className='flex items-center gap-3'>
                      <Avatar className='w-12 h-12'>
                        <AvatarImage src={request.profile?.avatar_url} />
                        <AvatarFallback>
                          {request.profile?.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className='font-semibold'>
                          {request.profile?.display_name ||
                            request.profile?.full_name ||
                            'Người dùng'}
                        </h3>
                        <div className='flex items-center gap-2 mt-1'>
                          <span className='text-sm text-muted-foreground'>
                            Hạng hiện tại:
                          </span>
                          <Badge
                            className={getRankBadgeColor(
                              request.current_rank || 'K'
                            )}
                          >
                            {request.current_rank || 'Chưa xác định'}
                          </Badge>
                          <span className='text-sm text-muted-foreground'>
                            →
                          </span>
                          <Badge
                            className={getRankBadgeColor(
                              request.requested_rank
                            )}
                          >
                            {request.requested_rank}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>

                  {request.notes && (
                    <div className='mb-4 p-3 bg-white rounded-lg'>
                      <p className='text-sm font-medium mb-1'>
                        Ghi chú từ người chơi:
                      </p>
                      <p className='text-sm text-muted-foreground'>
                        {request.notes}
                      </p>
                    </div>
                  )}

                  {request.evidence_url && (
                    <div className='mb-4'>
                      <p className='text-sm font-medium mb-2'>
                        Bằng chứng đính kèm:
                      </p>
                      <a
                        href={request.evidence_url}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='flex items-center gap-2 text-blue-600 hover:text-blue-800'
                      >
                        <Camera className='w-4 h-4' />
                        Xem bằng chứng
                      </a>
                    </div>
                  )}

                  <div className='flex gap-2 pt-4 border-t'>
                    <Button
                      size='sm'
                      onClick={() => handleStatusUpdate(request.id, 'approved')}
                      disabled={processing === request.id}
                      className='flex items-center gap-2'
                    >
                      <CheckCircle className='w-4 h-4' />
                      Phê duyệt
                    </Button>
                    <Button
                      variant='destructive'
                      size='sm'
                      onClick={() => handleStatusUpdate(request.id, 'rejected')}
                      disabled={processing === request.id}
                      className='flex items-center gap-2'
                    >
                      <XCircle className='w-4 h-4' />
                      Từ chối
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value='processed' className='space-y-4'>
          {processedRequests.length === 0 ? (
            <Card>
              <CardContent className='p-8'>
                <div className='text-center text-muted-foreground'>
                  <FileText className='h-12 w-12 mx-auto mb-4 text-gray-400' />
                  <p className='font-medium'>Chưa có yêu cầu nào được xử lý</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            processedRequests.map(request => (
              <Card key={request.id}>
                <CardContent className='p-6'>
                  <div className='flex items-start justify-between'>
                    <div className='flex items-center gap-3'>
                      <Avatar className='w-10 h-10'>
                        <AvatarImage src={request.profile?.avatar_url} />
                        <AvatarFallback>
                          {request.profile?.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className='font-medium'>
                          {request.profile?.display_name ||
                            request.profile?.full_name ||
                            'Người dùng'}
                        </h3>
                        <div className='flex items-center gap-2 mt-1'>
                          <Badge
                            className={getRankBadgeColor(
                              request.current_rank || 'K'
                            )}
                          >
                            {request.current_rank || 'K'}
                          </Badge>
                          <span className='text-sm text-muted-foreground'>
                            →
                          </span>
                          <Badge
                            className={getRankBadgeColor(
                              request.requested_rank
                            )}
                          >
                            {request.requested_rank}
                          </Badge>
                        </div>
                        <p className='text-xs text-muted-foreground mt-1'>
                          {new Date(request.updated_at).toLocaleDateString(
                            'vi-VN'
                          )}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClubRankVerificationTab;
