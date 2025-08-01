import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Trophy,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface ClubOption {
  id: string;
  club_name: string;
  address: string;
  verification_status: string;
}

interface RankVerification {
  id: string;
  requested_rank: string;
  status: string;
  club_id: string;
  club_profiles: {
    club_name: string;
  };
  created_at: string;
  rejection_reason: string | null;
}

const rankDescriptions = {
  'E+': 'Tay cơ chuyên nghiệp tiến bộ - Đỉnh cao kỹ thuật',
  E: 'Tay cơ chuyên nghiệp - Thắng được hạng F thường xuyên',
  'F+': 'Tay cơ xuất sắc tiến bộ - Kỹ thuật rất tốt',
  F: 'Tay cơ xuất sắc - Thắng được hạng G thường xuyên',
  'G+': 'Tay cơ giỏi tiến bộ - Có thể thắng hạng H ổn định',
  G: 'Tay cơ giỏi - Thắng được hạng H thường xuyên',
  'H+': 'Tay cơ khá tiến bộ - Có thể thắng hạng I ổn định',
  H: 'Tay cơ khá - Thắng được hạng I thường xuyên',
  'I+': 'Tay cơ trung bình tiến bộ - Có thể thắng hạng K ổn định',
  I: 'Tay cơ trung bình - Biết các kỹ thuật cơ bản',
  'K+': 'Tay cơ người mới tiến bộ - Đang học hỏi',
  K: 'Tay cơ người mới - Chưa thành thạo các kỹ thuật',
};

const RankVerificationForm = () => {
  const { user } = useAuth();
  const [clubs, setClubs] = useState<ClubOption[]>([]);
  const [selectedRank, setSelectedRank] = useState('');
  const [selectedClub, setSelectedClub] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifications, setVerifications] = useState<RankVerification[]>([]);

  useEffect(() => {
    fetchClubs();
    fetchVerifications();
  }, [user]);

  const fetchClubs = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('club_profiles')
        .select('id, club_name, address, verification_status')
        .eq('verification_status', 'approved')
        .order('club_name');

      if (error) throw error;
      setClubs((data as ClubOption[]) || []);
    } catch (error) {
      console.error('Error fetching clubs:', error);
    }
  };

  const fetchVerifications = async () => {
    if (!user) return;

    try {
      const { data, error } = await (supabase as any)
        .from('rank_requests')
        .select(
          `
        id,
        requested_rank,
        status,
        club_id,
        created_at,
        rejection_reason,
        club_profiles!club_id(club_name)
      `
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data to handle the club_profiles join correctly
      const transformedData = (data || []).map((item: any) => ({
        ...item,
        club_profiles: Array.isArray(item.club_profiles)
          ? item.club_profiles[0]
          : item.club_profiles,
      }));

      setVerifications(transformedData as RankVerification[]);
    } catch (error) {
      console.error('Error fetching verifications:', error);
    }
  };

  const handleSubmit = async () => {
    if (!user || !selectedRank || !selectedClub) {
      toast.error('Vui lòng chọn đầy đủ thông tin');
      return;
    }

    setLoading(true);

    try {
      const { error } = await (supabase as any).from('rank_requests').insert({
        user_id: user.id,
        club_id: selectedClub,
        requested_rank: selectedRank, // Keep as string to match DB schema
        status: 'pending',
      });

      if (error) throw error;

      toast.success('Đã gửi yêu cầu xác thực hạng!');
      setSelectedRank('');
      setSelectedClub('');
      fetchVerifications();
    } catch (error: any) {
      console.error('Error submitting verification:', error);
      toast.error('Lỗi khi gửi yêu cầu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className='bg-green-100 text-green-800'>
            <CheckCircle className='w-3 h-3 mr-1' />
            Đã xác thực
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className='bg-red-100 text-red-800'>
            <XCircle className='w-3 h-3 mr-1' />
            Bị từ chối
          </Badge>
        );
      case 'testing':
        return (
          <Badge className='bg-blue-100 text-blue-800'>
            <Clock className='w-3 h-3 mr-1' />
            Đang test
          </Badge>
        );
      default:
        return (
          <Badge className='bg-yellow-100 text-yellow-800'>
            <Clock className='w-3 h-3 mr-1' />
            Chờ xử lý
          </Badge>
        );
    }
  };

  return (
    <div className='space-y-6'>
      {/* New Verification Request */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center'>
            <Trophy className='w-5 h-5 mr-2' />
            Xác thực hạng tay cơ
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          {/* New User Information */}
          {verifications.length === 0 && (
            <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
              <div className='flex'>
                <Trophy className='w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5' />
                <div className='text-sm text-blue-800'>
                  <strong>Thông tin quan trọng:</strong>
                  <ul className='mt-2 space-y-1'>
                    <li>• Đây là lần đầu bạn xác thực hạng</li>
                    <li>• Bạn cần đến CLB để test trực tiếp</li>
                    <li>• Sau khi có hạng, bạn có thể xác thực tại CLB khác</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Rank Selection */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Chọn hạng muốn xác thực
            </label>
            <Select value={selectedRank} onValueChange={setSelectedRank}>
              <SelectTrigger className='h-12'>
                <SelectValue placeholder='Chọn hạng...' />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(rankDescriptions).map(([rank, description]) => (
                  <SelectItem key={rank} value={rank}>
                    <div>
                      <div className='font-medium'>Hạng {rank}</div>
                      <div className='text-sm text-gray-600'>{description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Club Selection */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Chọn câu lạc bộ xác thực
            </label>
            <Select value={selectedClub} onValueChange={setSelectedClub}>
              <SelectTrigger className='h-12'>
                <SelectValue placeholder='Chọn câu lạc bộ...' />
              </SelectTrigger>
              <SelectContent>
                {clubs.map(club => (
                  <SelectItem key={club.id} value={club.id}>
                    <div>
                      <div className='font-medium'>{club.club_name}</div>
                      <div className='text-sm text-gray-600'>
                        {club.address}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Warning */}
          <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
            <div className='flex'>
              <AlertTriangle className='w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5' />
              <div className='text-sm text-red-800'>
                <strong>Cảnh báo quan trọng:</strong>
                <ul className='mt-2 space-y-1'>
                  <li>• Bịp hạng = BỊ BAN vĩnh viễn khỏi hệ thống</li>
                  <li>• Câu lạc bộ sẽ test trực tiếp tay cơ của bạn</li>
                  <li>• Chỉ chọn hạng phù hợp với trình độ thực tế</li>
                </ul>
              </div>
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={loading || !selectedRank || !selectedClub}
            className='w-full h-12'
          >
            {loading ? 'Đang gửi...' : 'Gửi yêu cầu xác thực'}
          </Button>
        </CardContent>
      </Card>

      {/* Verification History */}
      {verifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Lịch sử xác thực</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              {verifications.map(verification => (
                <div key={verification.id} className='border rounded-lg p-4'>
                  <div className='flex items-center justify-between mb-2'>
                    <div className='flex items-center space-x-2'>
                      <span className='font-medium'>
                        Hạng {verification.requested_rank}
                      </span>
                      {getStatusBadge(verification.status)}
                    </div>
                    <span className='text-sm text-gray-500'>
                      {new Date(verification.created_at).toLocaleDateString(
                        'vi-VN'
                      )}
                    </span>
                  </div>
                  <p className='text-sm text-gray-600 mb-1'>
                    CLB: {verification.club_profiles.club_name}
                  </p>
                  {verification.rejection_reason && (
                    <div className='bg-red-50 p-2 rounded text-sm text-red-800 mt-2'>
                      <strong>Lý do từ chối:</strong>{' '}
                      {verification.rejection_reason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RankVerificationForm;
