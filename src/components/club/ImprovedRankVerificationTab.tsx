import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  UserCheck,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RankRequest {
  id: string;
  user_id: string;
  current_rank: string | null;
  requested_rank: string;
  status: string;
  created_at: string;
  evidence_url: string | null;
  rejection_reason: string | null;
  profiles?: {
    full_name: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
}

const ImprovedRankVerificationTab = ({ clubId }: { clubId?: string }) => {
  const [requests, setRequests] = useState<RankRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    loadRankRequests();
  }, [clubId]);

  const loadRankRequests = async () => {
    try {
      setLoading(true);

      // Get rank requests first
      let query = supabase
        .from('rank_requests')
        .select(
          `
          id,
          user_id,
          current_rank,
          requested_rank,
          status,
          created_at,
          evidence_url,
          rejection_reason,
          club_id
        `
        )
        .order('created_at', { ascending: false });

      if (clubId) {
        query = query.eq('club_id', clubId);
      }

      const { data: rankData, error } = await query;

      if (error) throw error;

      // Get profile data separately to avoid join issues
      const userIds = rankData?.map(r => r.user_id) || [];
      let profiles: any[] = [];

      if (userIds.length > 0) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('user_id, full_name, display_name, avatar_url')
          .in('user_id', userIds);

        if (profileError) {
          console.error('Error fetching profiles:', profileError);
        } else {
          profiles = profileData || [];
        }
      }

      // Combine rank requests with profile data
      const requestsWithProfiles =
        rankData?.map(request => {
          const profile = profiles.find(p => p.user_id === request.user_id);
          return {
            ...request,
            profiles: profile
              ? {
                  full_name: profile.full_name,
                  display_name: profile.display_name,
                  avatar_url: profile.avatar_url,
                }
              : null,
          };
        }) || [];

      setRequests(requestsWithProfiles);
    } catch (error) {
      console.error('Error loading rank requests:', error);
      toast.error('Lỗi tải danh sách yêu cầu xác minh');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    setProcessing(requestId);
    try {
      const { error } = await supabase.rpc('update_rank_verification_simple', {
        p_request_id: requestId,
        p_status: 'approved',
        p_admin_notes: 'Đã được phê duyệt',
      });

      if (error) throw error;

      toast.success('Đã phê duyệt yêu cầu xác minh hạng');
      await loadRankRequests();
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Lỗi phê duyệt yêu cầu');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (requestId: string, reason: string) => {
    setProcessing(requestId);
    try {
      const { error } = await supabase.rpc('update_rank_verification_simple', {
        p_request_id: requestId,
        p_status: 'rejected',
        p_admin_notes: reason,
      });

      if (error) throw error;

      toast.success('Đã từ chối yêu cầu xác minh hạng');
      await loadRankRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Lỗi từ chối yêu cầu');
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: {
        label: 'Chờ xử lý',
        variant: 'secondary' as const,
        icon: Clock,
      },
      approved: {
        label: 'Đã duyệt',
        variant: 'default' as const,
        icon: CheckCircle,
      },
      rejected: {
        label: 'Đã từ chối',
        variant: 'destructive' as const,
        icon: XCircle,
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className='flex items-center gap-1'>
        <Icon className='h-3 w-3' />
        {config.label}
      </Badge>
    );
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const processedRequests = requests.filter(r => r.status !== 'pending');

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <UserCheck className='h-5 w-5 text-primary' />
          Quản lý Xác minh Hạng
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue='pending' className='w-full'>
          <TabsList className='grid w-full grid-cols-2'>
            <TabsTrigger value='pending' className='flex items-center gap-2'>
              <Clock className='h-4 w-4' />
              Chờ xử lý ({pendingRequests.length})
            </TabsTrigger>
            <TabsTrigger value='processed' className='flex items-center gap-2'>
              <CheckCircle className='h-4 w-4' />
              Đã xử lý ({processedRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value='pending' className='space-y-4'>
            {loading ? (
              <div className='text-center py-8'>
                <div className='animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto'></div>
                <p className='mt-2 text-muted-foreground'>Đang tải...</p>
              </div>
            ) : pendingRequests.length === 0 ? (
              <div className='text-center py-8'>
                <AlertCircle className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
                <p className='text-muted-foreground'>
                  Không có yêu cầu nào đang chờ xử lý
                </p>
              </div>
            ) : (
              <div className='space-y-4'>
                {pendingRequests.map(request => (
                  <Card
                    key={request.id}
                    className='hover:shadow-md transition-shadow'
                  >
                    <CardContent className='p-4'>
                      <div className='flex items-center justify-between'>
                        <div className='flex-1'>
                          <div className='flex items-center gap-3 mb-2'>
                            <h4 className='font-medium'>
                              {request.profiles?.full_name ||
                                request.profiles?.display_name ||
                                'Unknown User'}
                            </h4>
                            {getStatusBadge(request.status)}
                          </div>

                          <div className='text-sm text-muted-foreground space-y-1'>
                            <p>
                              Hạng hiện tại:{' '}
                              <span className='font-medium'>
                                {request.current_rank || 'Chưa có'}
                              </span>
                            </p>
                            <p>
                              Hạng yêu cầu:{' '}
                              <span className='font-medium text-primary'>
                                {request.requested_rank}
                              </span>
                            </p>
                            <p>
                              Ngày gửi:{' '}
                              {new Date(request.created_at).toLocaleDateString(
                                'vi-VN'
                              )}
                            </p>
                            {request.evidence_url && (
                              <p>
                                <a
                                  href={request.evidence_url}
                                  target='_blank'
                                  rel='noopener noreferrer'
                                  className='text-blue-600 hover:underline'
                                >
                                  Xem bằng chứng →
                                </a>
                              </p>
                            )}
                          </div>
                        </div>

                        <div className='flex gap-2'>
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() =>
                              handleReject(request.id, 'Không đủ bằng chứng')
                            }
                            disabled={processing === request.id}
                            className='text-red-600 hover:text-red-700'
                          >
                            Từ chối
                          </Button>

                          <Button
                            size='sm'
                            onClick={() => handleApprove(request.id)}
                            disabled={processing === request.id}
                          >
                            {processing === request.id
                              ? 'Đang xử lý...'
                              : 'Phê duyệt'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value='processed' className='space-y-4'>
            {processedRequests.length === 0 ? (
              <div className='text-center py-8'>
                <CheckCircle className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
                <p className='text-muted-foreground'>
                  Chưa có yêu cầu nào được xử lý
                </p>
              </div>
            ) : (
              <div className='space-y-4'>
                {processedRequests.map(request => (
                  <Card key={request.id}>
                    <CardContent className='p-4'>
                      <div className='flex items-center justify-between'>
                        <div className='flex-1'>
                          <div className='flex items-center gap-3 mb-2'>
                            <h4 className='font-medium'>
                              {request.profiles?.full_name ||
                                request.profiles?.display_name ||
                                'Unknown User'}
                            </h4>
                            {getStatusBadge(request.status)}
                          </div>

                          <div className='text-sm text-muted-foreground space-y-1'>
                            <p>
                              Hạng yêu cầu:{' '}
                              <span className='font-medium'>
                                {request.requested_rank}
                              </span>
                            </p>
                            <p>
                              Ngày xử lý:{' '}
                              {new Date(request.created_at).toLocaleDateString(
                                'vi-VN'
                              )}
                            </p>
                            {request.rejection_reason && (
                              <p className='text-red-600'>
                                Lý do từ chối: {request.rejection_reason}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ImprovedRankVerificationTab;
