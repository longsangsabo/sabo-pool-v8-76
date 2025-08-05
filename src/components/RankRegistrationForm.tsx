import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Trophy,
  Loader2,
  AlertTriangle,
  CheckCircle,
  FileImage,
} from 'lucide-react';
import { useRankRequests } from '@/hooks/useRankRequests';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import EvidenceUpload from './EvidenceUpload';

interface RankRegistrationFormProps {
  onSuccess?: () => void;
}

interface Club {
  id: string;
  club_name: string;
  address: string;
  verification_status: string;
}

interface EvidenceFile {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
}

const RankRegistrationForm = ({ onSuccess }: RankRegistrationFormProps) => {
  const { user, profile } = useAuth();
  const {
    createRankRequest,
    rankRequests,
    getStatusText,
    getStatusColor,
    checkExistingPendingRequest,
  } = useRankRequests();

  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [userRankRequests, setUserRankRequests] = useState<any[]>([]);
  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceFile[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm();

  const selectedClub = watch('club_id');
  const requestedRank = watch('requested_rank');

  useEffect(() => {
    fetchClubs();
    fetchUserRankRequests();
  }, []);

  useEffect(() => {
    if (rankRequests.length > 0) {
      setUserRankRequests(rankRequests.filter(req => req.user_id === user?.id));
    }
  }, [rankRequests, user?.id]);

  const fetchClubs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clubs')
        .select('id, name, address, status')
        .eq('status', 'active')
        .order('club_name');

      if (error) throw error;
      setClubs((data as any) || []);
    } catch (error) {
      console.error('Error fetching clubs:', error);
      toast.error('Lỗi khi tải danh sách CLB');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRankRequests = async () => {
    if (!user?.id) return;

    try {
      // First get rank requests
      const { data: requests, error: requestsError } = await supabase
        .from('rank_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;

      if (!requests || requests.length === 0) {
        setUserRankRequests([]);
        return;
      }

      // Get club data separately
      const clubIds = [...new Set(requests.map(req => req.club_id))];
      const { data: clubs, error: clubsError } = await supabase
        .from('clubs')
        .select('id, name, address')
        .in('id', clubIds);

      if (clubsError) throw clubsError;

      const transformedRequests = requests.map(req => ({
        ...req,
        club: {
          name:
            clubs?.find(club => (club as any).id === (req as any).user_id)
              ?.name || 'Unknown Club',
          address:
            clubs?.find(club => (club as any).id === (req as any).user_id)
              ?.address || '',
        },
      }));

      setUserRankRequests(transformedRequests);
    } catch (error) {
      console.error('Error fetching user rank requests:', error);
      setUserRankRequests([]);
    }
  };

  const onSubmit = async (formData: any) => {
    if (!user?.id) {
      toast.error('Vui lòng đăng nhập để đăng ký rank');
      return;
    }

    setSubmitting(true);
    try {
      // Check for existing pending request before attempting to create
      const existingRequest = await checkExistingPendingRequest(
        user.id,
        formData.club_id
      );
      if (existingRequest) {
        toast.error(
          'Bạn đã có yêu cầu rank đang chờ xét duyệt tại CLB này. Vui lòng chờ CLB xét duyệt trước khi gửi yêu cầu mới.'
        );
        return;
      }

      await createRankRequest({
        requested_rank: formData.requested_rank, // Keep as string to match DB schema
        club_id: formData.club_id,
        user_id: user?.id,
        evidence_files: evidenceFiles,
      });

      reset();
      setEvidenceFiles([]);
      toast.success(
        'Đã gửi yêu cầu rank thành công! CLB sẽ xem xét và phản hồi sớm.'
      );

      // Refresh user's rank requests
      await fetchUserRankRequests();

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error submitting rank request:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Lỗi khi gửi yêu cầu rank';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const getRankDescription = (rank: number) => {
    switch (rank) {
      case 1000:
        return 'K - Người mới tập (2-4 bi khi hình dễ)';
      case 1100:
        return 'K+ - Biết luật, kê cơ đúng';
      case 1200:
        return 'I - Người chơi cơ bản (3-5 bi, chưa điều được chấm)';
      case 1300:
        return 'I+ - Tân binh tiến bộ';
      case 1400:
        return 'H - Trung bình (đi 5-8 bi, có thể "rùa" 1 chấm hình dễ)';
      case 1500:
        return 'H+ - Chuẩn bị lên G';
      case 1600:
        return 'G - Khá (clear 1 chấm + 3-7 bi kế, bắt đầu điều bi 3 băng)';
      case 1700:
        return 'G+ - Trình phong trào "ngon"';
      case 1800:
        return 'F - Giỏi (60-80% clear 1 chấm, đôi khi phá 2 chấm)';
      case 1900:
        return 'F+ - Cao nhất nhóm trung cấp';
      case 2000:
        return 'E - Xuất sắc (90-100% clear 1 chấm, 70% phá 2 chấm)';
      case 2100:
        return 'E+ - Sát ngưỡng lên D (chưa mở)';
      default:
        return '';
    }
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
      {/* Current Status */}
      {profile?.elo && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Trophy className='w-5 h-5' />
              Rank hiện tại
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex items-center space-x-4'>
              <Badge className='text-lg px-4 py-2'>{profile.elo} ELO</Badge>
              <span className='text-gray-600'>
                {getRankDescription(profile.elo)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Previous Requests */}
      {userRankRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Yêu cầu rank trước đây</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              {userRankRequests.map(request => (
                <div
                  key={request.id}
                  className='flex items-center justify-between p-3 border rounded-lg'
                >
                  <div className='flex items-center space-x-3'>
                    <div>
                      <div className='font-medium'>
                        {request.requested_rank} ELO - {request.club?.name}
                      </div>
                      <div className='text-sm text-gray-500'>
                        {formatDate(request.created_at)}
                      </div>
                    </div>
                  </div>
                  <Badge className={getStatusColor(request.status)}>
                    {getStatusText(request.status)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Registration Form */}
      <Card>
        <CardHeader>
          <CardTitle>Đăng ký rank mới</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
            {/* Club Selection */}
            <div>
              <Label htmlFor='club_id'>Chọn CLB *</Label>
              <Select onValueChange={value => setValue('club_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder='Chọn CLB để đăng ký rank' />
                </SelectTrigger>
                <SelectContent>
                  {clubs.map(club => (
                    <SelectItem key={club.id} value={club.id}>
                      <div className='flex flex-col'>
                        <span className='font-medium'>
                          {(club as any).name}
                        </span>
                        <span className='text-sm text-gray-500'>
                          {club.address}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.club_id && (
                <p className='mt-1 text-sm text-red-600'>
                  {String(errors.club_id.message)}
                </p>
              )}
            </div>

            {/* Rank Selection */}
            <div>
              <Label htmlFor='requested_rank'>Rank yêu cầu *</Label>
              <Select
                onValueChange={value => setValue('requested_rank', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Chọn rank bạn muốn đăng ký' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='1000'>
                    1000 ELO - K (Người mới tập)
                  </SelectItem>
                  <SelectItem value='1100'>
                    1100 ELO - K+ (Biết luật, kê cơ đúng)
                  </SelectItem>
                  <SelectItem value='1200'>
                    1200 ELO - I (Người chơi cơ bản)
                  </SelectItem>
                  <SelectItem value='1300'>
                    1300 ELO - I+ (Tân binh tiến bộ)
                  </SelectItem>
                  <SelectItem value='1400'>
                    1400 ELO - H (Trung bình)
                  </SelectItem>
                  <SelectItem value='1500'>
                    1500 ELO - H+ (Chuẩn bị lên G)
                  </SelectItem>
                  <SelectItem value='1600'>1600 ELO - G (Khá)</SelectItem>
                  <SelectItem value='1700'>
                    1700 ELO - G+ (Trình phong trào "ngon")
                  </SelectItem>
                  <SelectItem value='1800'>1800 ELO - F (Giỏi)</SelectItem>
                  <SelectItem value='1900'>
                    1900 ELO - F+ (Cao nhất nhóm trung cấp)
                  </SelectItem>
                  <SelectItem value='2000'>2000 ELO - E (Xuất sắc)</SelectItem>
                  <SelectItem value='2100'>
                    2100 ELO - E+ (Sát ngưỡng lên D)
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.requested_rank && (
                <p className='mt-1 text-sm text-red-600'>
                  {String(errors.requested_rank.message)}
                </p>
              )}

              {requestedRank && (
                <div className='mt-2 p-3 bg-blue-50 rounded-lg'>
                  <div className='text-sm text-blue-800'>
                    <strong>Mô tả rank:</strong>{' '}
                    {getRankDescription(parseInt(requestedRank))}
                  </div>
                </div>
              )}
            </div>

            {/* Evidence Upload */}
            <div>
              <Label className='flex items-center gap-2 mb-3'>
                <FileImage className='w-4 h-4' />
                Bằng chứng (Không bắt buộc)
              </Label>
              <EvidenceUpload
                files={evidenceFiles}
                onFilesChange={setEvidenceFiles}
                maxFiles={5}
                userId={user?.id}
                disabled={submitting}
              />
              <p className='text-sm text-muted-foreground mt-2'>
                Upload hình ảnh lịch sử tham gia giải đấu, bảng xếp hạng, hoặc
                thành tích để CLB có thể đánh giá chính xác hơn.
              </p>
            </div>

            {/* Warning */}
            <Alert>
              <AlertTriangle className='h-4 w-4' />
              <AlertDescription>
                <strong>Lưu ý:</strong> Việc đăng ký rank sai có thể dẫn đến
                việc tài khoản bị cấm. Hãy đăng ký rank phù hợp với khả năng
                thực tế của bạn.
              </AlertDescription>
            </Alert>

            {/* Submit Button */}
            <div className='flex justify-end'>
              <Button
                type='submit'
                disabled={submitting || !selectedClub || !requestedRank}
                className='flex items-center'
              >
                {submitting ? (
                  <>
                    <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <Trophy className='w-4 h-4 mr-2' />
                    Gửi yêu cầu rank
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default RankRegistrationForm;
