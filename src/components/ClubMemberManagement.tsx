import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  Search,
  Users,
  Trophy,
  Eye,
  MessageSquare,
  RefreshCw,
} from 'lucide-react';
import TrustScoreBadge from '@/components/TrustScoreBadge';
import { toast } from 'sonner';

interface ClubMember {
  id: string;
  username: string;
  display_name: string;
  verified_rank: string | null;
  current_elo: number;
  phone: string;
  avatar_url?: string;
  verification_date?: string;
  verification_status: 'verified' | 'unverified';
  total_matches?: number;
  wins?: number;
  trust_score?: number;
}

// ✅ SIMPLE APPROACH: Use profiles.verified_rank as SINGLE SOURCE OF TRUTH
export const useClubMembers = (clubId: string) => {
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ SIMPLE APPROACH: Single query using verified_rank
  const fetchClubMembers = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!clubId) {
        setMembers([]);
        return;
      }

      // ✅ For now, check if we have a clubId parameter
      if (!clubId) {
        setMembers([]);
        return;
      }

      // ✅ Simple approach: get all profiles for demonstration
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(
          `
          user_id,
          full_name,
          display_name,
          verified_rank,
          elo,
          avatar_url,
          updated_at
        `
        )
        .limit(10);

      if (profilesError) throw profilesError;

      // ✅ Map profiles to club members format
      const membersWithVerification =
        profilesData?.map(profile => {
          return {
            id: profile.user_id,
            username: profile.display_name || profile.full_name || 'Unknown',
            display_name:
              profile.full_name || profile.display_name || 'Unknown',
            verified_rank: profile.verified_rank,
            current_elo: profile.elo || 1000,
            phone: '',
            avatar_url: profile.avatar_url,
            verification_date: profile.updated_at,
            verification_status: profile.verified_rank
              ? 'verified'
              : 'unverified',
            total_matches: 0,
            wins: 0,
            trust_score: 50.0, // Default trust score
          } as ClubMember;
        }) || [];

      setMembers(membersWithVerification);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch club members';
      setError(errorMessage);
      console.error('Club members fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Real-time subscription for profile updates
  useEffect(() => {
    if (!clubId) return;

    fetchClubMembers();

    // ✅ Listen for profile changes (when ranks get updated)
    const subscription = supabase
      .channel(`club_members_${clubId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
        },
        payload => {
          console.log('Profile updated, refreshing members:', payload);
          fetchClubMembers(); // Refresh entire list
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rank_requests',
          filter: `club_id=eq.${clubId}`,
        },
        payload => {
          console.log('Rank request updated, refreshing members:', payload);
          fetchClubMembers(); // Refresh when new approvals happen
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [clubId]);

  return {
    members,
    loading,
    error,
    refetch: fetchClubMembers,
  };
};

// ✅ SIMPLIFIED CLUB MEMBER DISPLAY COMPONENT
interface ClubMemberCardProps {
  member: ClubMember;
  onViewDetails?: (memberId: string) => void;
}

const ClubMemberCard = ({ member, onViewDetails }: ClubMemberCardProps) => {
  // ✅ Simple rank display logic
  const getRankDisplay = () => {
    if (!member.verified_rank) {
      return 'Chưa xác thực';
    }
    return `${member.verified_rank} - ${member.current_elo || 1000} ELO`;
  };

  const getStatusBadge = () => {
    if (member.verification_status === 'verified') {
      return (
        <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'>
          ✓ Đã xác thực
        </span>
      );
    }
    return (
      <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800'>
        Chưa xác thực
      </span>
    );
  };

  const sendMessage = (memberId: string, memberName: string) => {
    toast.info(`Chức năng nhắn tin với ${memberName} sẽ có sẵn sớm`);
  };

  return (
    <div className='bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-3'>
          {/* Avatar */}
          <div className='flex-shrink-0'>
            {member.avatar_url ? (
              <img
                src={member.avatar_url}
                alt={member.display_name}
                className='w-10 h-10 rounded-full object-cover'
              />
            ) : (
              <div className='w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center'>
                <span className='text-gray-600 font-medium'>
                  {member.display_name?.charAt(0)?.toUpperCase() || '?'}
                </span>
              </div>
            )}
          </div>

          {/* Member Info */}
          <div className='flex-1 min-w-0'>
            <h4 className='text-sm font-medium text-gray-900 truncate'>
              {member.display_name || member.username}
            </h4>
            <p className='text-sm text-gray-500'>
              {member.phone || 'Không có số điện thoại'}
            </p>
            <p className='text-sm font-medium text-blue-600'>
              {getRankDisplay()}
            </p>
            <div className='flex items-center gap-2 mt-1'>
              <span className='text-xs font-medium text-purple-600'>
                {(member.trust_score || 50).toFixed(1)}% tin cậy
              </span>
              {member.total_matches && member.total_matches > 0 && (
                <span className='text-xs text-gray-500'>
                  • {member.wins}/{member.total_matches} thắng
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Status and Actions */}
        <div className='flex flex-col items-end space-y-2'>
          {getStatusBadge()}

          {member.verification_date && (
            <p className='text-xs text-gray-500'>
              Xác thực:{' '}
              {new Date(member.verification_date).toLocaleDateString('vi-VN')}
            </p>
          )}

          <div className='flex gap-1'>
            {onViewDetails && (
              <button
                onClick={() => onViewDetails(member.id)}
                className='text-xs text-blue-600 hover:text-blue-800 px-2 py-1 border border-blue-200 rounded'
              >
                Xem
              </button>
            )}
            <button
              onClick={() => sendMessage(member.id, member.display_name)}
              className='text-xs text-gray-600 hover:text-gray-800 px-2 py-1 border border-gray-200 rounded'
            >
              Nhắn tin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ✅ MAIN CLUB MEMBER MANAGEMENT COMPONENT
const ClubMemberManagement = () => {
  const { user } = useAuth();
  const [clubId, setClubId] = useState<string>('');
  const [filter, setFilter] = useState<'all' | 'verified' | 'unverified'>(
    'all'
  );
  const [searchTerm, setSearchTerm] = useState('');

  // Get club ID first
  useEffect(() => {
    const getClubId = async () => {
      if (!user) return;

      const { data: clubData } = await supabase
        .from('clubs')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (clubData) {
        setClubId(clubData.id);
      }
    };

    getClubId();
  }, [user]);

  const { members, loading, error, refetch } = useClubMembers(clubId);

  // ✅ Simple filtering logic
  const filteredMembers = members.filter(member => {
    const matchesSearch =
      member.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.phone && member.phone.includes(searchTerm));

    const matchesFilter =
      filter === 'all' ||
      (filter === 'verified' && member.verification_status === 'verified') ||
      (filter === 'unverified' && member.verification_status === 'unverified');

    return matchesSearch && matchesFilter;
  });

  const verifiedCount = members.filter(
    m => m.verification_status === 'verified'
  ).length;
  const unverifiedCount = members.filter(
    m => m.verification_status === 'unverified'
  ).length;

  if (loading) {
    return (
      <Card>
        <CardContent className='pt-6'>
          <div className='flex items-center justify-center py-8'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
            <span className='ml-2 text-gray-600'>Đang tải thành viên...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className='pt-6'>
          <div className='bg-red-50 border border-red-200 rounded-md p-4'>
            <p className='text-red-800'>
              Lỗi tải danh sách thành viên: {error}
            </p>
            <button
              onClick={refetch}
              className='mt-2 text-red-600 hover:text-red-800 underline'
            >
              Thử lại
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Users className='w-5 h-5' />
            Thành viên đã xác thực ({verifiedCount})
          </div>
          <Button
            variant='outline'
            size='sm'
            onClick={refetch}
            disabled={loading}
            className='flex items-center gap-2'
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Search and Filter */}
        <div className='flex flex-col sm:flex-row gap-4 mb-6'>
          <div className='relative flex-1'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4' />
            <Input
              placeholder='Tìm kiếm theo tên hoặc số điện thoại...'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className='pl-10'
            />
          </div>
          <div className='flex gap-2'>
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size='sm'
              onClick={() => setFilter('all')}
            >
              Tất cả ({members.length})
            </Button>
            <Button
              variant={filter === 'verified' ? 'default' : 'outline'}
              size='sm'
              onClick={() => setFilter('verified')}
            >
              Đã xác thực ({verifiedCount})
            </Button>
            <Button
              variant={filter === 'unverified' ? 'default' : 'outline'}
              size='sm'
              onClick={() => setFilter('unverified')}
            >
              Chưa xác thực ({unverifiedCount})
            </Button>
          </div>
        </div>

        {/* Member list */}
        {filteredMembers.length === 0 ? (
          <div className='text-center py-8'>
            <Users className='w-12 h-12 mx-auto mb-4 text-gray-400' />
            <p className='text-gray-500'>
              {filter === 'all'
                ? 'Chưa có thành viên nào được xác thực'
                : `Không có thành viên ${filter === 'verified' ? 'đã xác thực' : 'chưa xác thực'}`}
            </p>
          </div>
        ) : (
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
            {filteredMembers.map(member => (
              <ClubMemberCard
                key={member.id}
                member={member}
                onViewDetails={id => window.open(`/players/${id}`, '_blank')}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ClubMemberManagement;
