import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  RankRequest,
  CreateRankRequestData,
  RankRequestFilters,
} from '@/types/rankRequests';

export const useRankRequests = (clubId?: string) => {
  const [requests, setRequests] = useState<RankRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<RankRequestFilters>({
    status: undefined,
    club_id: clubId,
    dateRange: undefined,
  });

  const fetchRankRequests = async (filterOptions?: RankRequestFilters) => {
    setLoading(true);
    setError('');
    try {
      // Query rank_requests with basic data - foreign keys are for integrity
      let query = supabase
        .from('rank_requests')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      const activeFilters = filterOptions || filters;

      if (activeFilters.club_id || clubId) {
        query = query.eq('club_id', activeFilters.club_id || clubId);
      }

      if (activeFilters.status) {
        query = query.eq('status', activeFilters.status);
      }

      if (activeFilters.date_from) {
        query = query.gte('created_at', activeFilters.date_from);
      }

      if (activeFilters.date_to) {
        query = query.lte('created_at', activeFilters.date_to);
      }

      const { data: verificationData, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      // Get additional data in separate queries (now with proper foreign key constraints)
      const playerIds =
        verificationData?.map(v => v.user_id).filter(Boolean) || [];
      const clubIds =
        verificationData?.map(v => v.club_id).filter(Boolean) || [];

      // Fetch player profiles
      const { data: playersData } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, phone, elo')
        .in('user_id', playerIds);

      // Fetch club profiles
      const { data: clubsData } = await supabase
        .from('club_profiles')
        .select('id, club_name, address, phone')
        .in('id', clubIds);

      // Transform data to match RankRequest interface
      const transformedRequests: RankRequest[] = (verificationData || []).map(
        item => {
          const playerProfile = playersData?.find(
            p => p.user_id === item.user_id
          );
          const clubProfile = clubsData?.find(c => c.id === item.club_id);

          return {
            id: item.id,
            user_id: item.user_id,
            requested_rank: item.requested_rank,
            club_id: item.club_id,
            status: item.status as RankRequest['status'],
            rejection_reason: item.rejection_reason,
            created_at: item.created_at,
            updated_at: item.updated_at,
            approved_by: item.approved_by,
            approved_at: item.approved_at,
            user: playerProfile
              ? {
                  id: playerProfile.user_id,
                  email: '', // Email not needed for display
                  profiles: {
                    full_name: playerProfile.full_name,
                    avatar_url: playerProfile.avatar_url,
                    elo: playerProfile.elo || 1000,
                  },
                }
              : undefined,
            club: clubProfile
              ? {
                  id: clubProfile.id,
                  name: clubProfile.club_name,
                  address: clubProfile.address,
                }
              : undefined,
          };
        }
      );

      setRequests(transformedRequests);
    } catch (err) {
      console.error('Error fetching rank requests:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to fetch rank requests'
      );
    } finally {
      setLoading(false);
    }
  };

  const checkExistingPendingRequest = async (
    userId: string,
    clubId: string
  ) => {
    try {
      const { data, error } = await supabase
        .from('rank_requests')
        .select('*')
        .eq('user_id', userId)
        .eq('club_id', clubId)
        .eq('status', 'pending');

      if (error) throw error;
      return data?.length > 0 ? data[0] : null;
    } catch (err) {
      console.error('Error checking existing request:', err);
      return null;
    }
  };

  const createRankRequest = async (data: CreateRankRequestData) => {
    try {
      // Ensure user_id is provided
      const userId = data.user_id;
      if (!userId) {
        throw new Error('User ID is required');
      }

      // Check for existing pending request first
      const existingRequest = await checkExistingPendingRequest(
        userId,
        data.club_id
      );
      if (existingRequest) {
        throw new Error(
          'Bạn đã có yêu cầu rank đang chờ xét duyệt tại CLB này. Vui lòng chờ CLB xét duyệt trước khi gửi yêu cầu mới.'
        );
      }

      const { data: newRequest, error } = await supabase
        .from('rank_requests')
        .insert({
          user_id: userId,
          club_id: data.club_id,
          requested_rank: data.requested_rank,
          evidence_files: data.evidence_files || [],
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        // Handle specific constraint violation errors
        if (
          error.code === '23P01' &&
          error.message.includes('unique_pending_rank_request')
        ) {
          throw new Error(
            'Bạn đã có yêu cầu rank đang chờ xét duyệt tại CLB này.'
          );
        }
        throw error;
      }

      // Refresh the requests list
      await fetchRankRequests();
    } catch (err) {
      console.error('Error creating rank request:', err);
      if (err instanceof Error) {
        throw err; // Re-throw with original message
      }
      throw new Error('Lỗi khi gửi yêu cầu rank');
    }
  };

  const updateRankRequest = async (id: string, updateData: any) => {
    try {
      const { error } = await supabase
        .from('rank_requests')
        .update({
          status: updateData.status,
          rejection_reason: updateData.rejection_reason,
          approved_by: updateData.approved_by,
          approved_at:
            updateData.status === 'approved' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      // Refresh the requests list
      await fetchRankRequests();
    } catch (err) {
      console.error('Error updating rank request:', err);
      throw new Error('Failed to update rank request');
    }
  };

  const deleteRankRequest = async (id: string) => {
    try {
      const { error } = await supabase
        .from('rank_requests')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Refresh the requests list
      await fetchRankRequests();
    } catch (err) {
      console.error('Error deleting rank request:', err);
      throw new Error('Failed to delete rank request');
    }
  };

  const approveRankRequest = async (id: string, verifierId?: string) => {
    return updateRankRequest(id, {
      status: 'approved',
      approved_by: verifierId,
    });
  };

  const rejectRankRequest = async (
    id: string,
    reason: string,
    verifierId?: string
  ) => {
    return updateRankRequest(id, {
      status: 'rejected',
      rejection_reason: reason,
      approved_by: verifierId,
    });
  };

  const getUserRankRequests = (userId: string) => {
    return requests.filter(req => req.user_id === userId);
  };

  const getPendingRequests = () => {
    return requests.filter(req => req.status === 'pending');
  };

  const getApprovedRequests = () => {
    return requests.filter(req => req.status === 'approved');
  };

  const getRejectedRequests = () => {
    return requests.filter(req => req.status === 'rejected');
  };

  const getEligibleRanks = (currentRank: string): string[] => {
    const ranks = ['K1', 'K2', 'K3', 'D1', 'D2', 'D3'];
    const currentIndex = ranks.indexOf(currentRank);
    return ranks.slice(currentIndex + 1);
  };

  const rankRequests = requests;

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Đang chờ';
      case 'approved':
        return 'Đã duyệt';
      case 'rejected':
        return 'Từ chối';
      case 'on_site_test':
        return 'Kiểm tra tại chỗ';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'approved':
        return 'text-green-600 bg-green-100';
      case 'rejected':
        return 'text-red-600 bg-red-100';
      case 'on_site_test':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const stats = {
    total: requests.length,
    pending: getPendingRequests().length,
    approved: getApprovedRequests().length,
    rejected: getRejectedRequests().length,
    on_site_test: requests.filter(req => req.status === 'on_site_test').length,
  };

  useEffect(() => {
    fetchRankRequests();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('rank-requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rank_requests',
          filter: clubId ? `club_id=eq.${clubId}` : undefined,
        },
        () => {
          console.log('Rank request changed, refetching...');
          fetchRankRequests(); // Refetch on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clubId]);

  // Also refetch when filters change
  useEffect(() => {
    if (
      filters.club_id ||
      filters.status ||
      filters.date_from ||
      filters.date_to
    ) {
      fetchRankRequests(filters);
    }
  }, [filters]);

  return {
    requests,
    loading,
    error,
    filters,
    fetchRankRequests,
    createRankRequest,
    updateRankRequest,
    deleteRankRequest,
    approveRankRequest,
    rejectRankRequest,
    getUserRankRequests,
    getPendingRequests,
    getApprovedRequests,
    getRejectedRequests,
    getEligibleRanks,
    rankRequests,
    getStatusText,
    getStatusColor,
    stats,
    checkExistingPendingRequest,
  };
};
