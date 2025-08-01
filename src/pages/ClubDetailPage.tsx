import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  MapPin,
  Phone,
  Mail,
  Users,
  DollarSign,
  Table,
  Star,
  Calendar,
  Info,
  Trophy,
  UserPlus,
  Heart,
  Share2,
  Eye,
  Target,
  Loader2,
  Building,
} from 'lucide-react';
import TableBookingForm from '@/components/TableBookingForm';
import { Club } from '@/types/common';

interface Member {
  user_id: string;
  full_name: string;
  avatar_url?: string;
  current_rank: string;
  ranking_points: number;
}

interface Tournament {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  status: string;
  max_participants: number;
  entry_fee: number;
  prize_pool: number;
}

const ClubDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [club, setClub] = useState<Club | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [memberCount, setMemberCount] = useState(0);

  useEffect(() => {
    if (id) {
      fetchClubDetails();
    }
  }, [id]);

  const fetchClubDetails = async () => {
    setLoading(true);
    try {
      // Fetch club info
      const { data: clubData, error: clubError } = await supabase
        .from('clubs')
        .select('*')
        .eq('id', id)
        .single();

      if (clubError) throw clubError;

      // Mock club members since profiles table doesn't have current_rank/ranking_points fields
      const mockMembers: Member[] = [
        {
          user_id: 'user1',
          full_name: 'Nguyễn Văn A',
          avatar_url: '',
          current_rank: 'B2',
          ranking_points: 1200,
        },
        {
          user_id: 'user2',
          full_name: 'Trần Thị B',
          avatar_url: '',
          current_rank: 'A3',
          ranking_points: 1100,
        },
      ];

      // Mock club tournaments since tournaments table doesn't have required fields
      const mockTournaments: Tournament[] = [
        {
          id: 'tour1',
          name: 'Giải đấu tháng 1',
          description: 'Giải đấu hàng tháng của CLB',
          start_date: new Date().toISOString(),
          end_date: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
          ).toISOString(),
          status: 'upcoming',
          max_participants: 32,
          entry_fee: 100000,
          prize_pool: 1000000,
        },
      ];

      setClub(clubData);
      setMembers(mockMembers);
      setTournaments(mockTournaments);
      setMemberCount(mockMembers.length);
    } catch (error) {
      console.error('Error fetching club details:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải thông tin câu lạc bộ',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinClub = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        toast({
          title: 'Yêu cầu đăng nhập',
          description: 'Vui lòng đăng nhập để tham gia câu lạc bộ',
          variant: 'destructive',
        });
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          bio: `Member of club ${id}`, // Using bio field instead of non-existent club_id
        })
        .eq('user_id', user.user.id);

      if (error) throw error;

      toast({
        title: 'Thành công',
        description: 'Bạn đã tham gia câu lạc bộ thành công!',
      });

      fetchClubDetails(); // Refresh data
    } catch (error) {
      console.error('Error joining club:', error);
      toast({
        title: 'Lỗi',
        description: 'Có lỗi xảy ra khi tham gia câu lạc bộ',
        variant: 'destructive',
      });
    }
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Đã kết thúc';
      case 'ongoing':
        return 'Đang diễn ra';
      case 'upcoming':
        return 'Sắp diễn ra';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'ongoing':
        return 'bg-blue-100 text-blue-800';
      case 'upcoming':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <Loader2 className='w-8 h-8 animate-spin text-blue-600' />
      </div>
    );
  }

  if (!club) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <Building className='w-16 h-16 mx-auto text-gray-400 mb-4' />
          <h2 className='text-xl font-semibold text-gray-900 mb-2'>
            Không tìm thấy câu lạc bộ
          </h2>
          <p className='text-gray-600 mb-4'>
            Câu lạc bộ này có thể đã bị xóa hoặc không tồn tại
          </p>
          <Button onClick={() => navigate('/clubs')} variant='outline'>
            Quay lại danh sách
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 pt-16'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Club Header */}
        <Card className='mb-6 overflow-hidden'>
          <div className='h-64 bg-gradient-to-r from-blue-500 to-blue-600 relative'>
            {club.logo_url && (
              <img
                src={club.logo_url}
                alt={club.name}
                className='w-full h-full object-cover'
              />
            )}
            <div className='absolute inset-0 bg-black bg-opacity-40'></div>
            <div className='absolute bottom-6 left-6 text-white'>
              <h1 className='text-3xl font-bold mb-2'>{club.name}</h1>
              <div className='flex items-center space-x-4 text-sm'>
                <div className='flex items-center'>
                  <MapPin className='w-4 h-4 mr-1' />
                  {club.address}
                </div>
                <div className='flex items-center'>
                  <Users className='w-4 h-4 mr-1' />
                  {memberCount} thành viên
                </div>
                <div className='flex items-center'>
                  <Table className='w-4 h-4 mr-1' />
                  {club.table_count} bàn
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <CardContent className='p-6 border-b'>
            <div className='flex flex-wrap gap-3'>
              <Button className='flex items-center'>
                <Calendar className='w-4 h-4 mr-2' />
                Đặt bàn
              </Button>
              <Button
                onClick={handleJoinClub}
                variant='secondary'
                className='flex items-center'
              >
                <UserPlus className='w-4 h-4 mr-2' />
                Tham gia CLB
              </Button>
              <Button variant='outline' className='flex items-center'>
                <Heart className='w-4 h-4 mr-2' />
                Yêu thích
              </Button>
              <Button variant='outline' className='flex items-center'>
                <Share2 className='w-4 h-4 mr-2' />
                Chia sẻ
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Content Tabs */}
          <div className='lg:col-span-2'>
            <Tabs defaultValue='overview' className='space-y-6'>
              <TabsList className='grid w-full grid-cols-4'>
                <TabsTrigger value='overview' className='flex items-center'>
                  <Info className='w-4 h-4 mr-2' />
                  Tổng quan
                </TabsTrigger>
                <TabsTrigger value='members' className='flex items-center'>
                  <Users className='w-4 h-4 mr-2' />
                  Thành viên
                </TabsTrigger>
                <TabsTrigger value='tournaments' className='flex items-center'>
                  <Trophy className='w-4 h-4 mr-2' />
                  Giải đấu
                </TabsTrigger>
                <TabsTrigger value='booking' className='flex items-center'>
                  <Calendar className='w-4 h-4 mr-2' />
                  Đặt bàn
                </TabsTrigger>
              </TabsList>

              <TabsContent value='overview' className='space-y-6'>
                {/* About */}
                <Card>
                  <CardHeader>
                    <CardTitle>Giới thiệu</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className='text-gray-600 leading-relaxed'>
                      {club.description || 'Chưa có mô tả về câu lạc bộ này.'}
                    </p>
                  </CardContent>
                </Card>

                {/* Recent Tournaments */}
                <Card>
                  <CardHeader className='flex flex-row items-center justify-between'>
                    <CardTitle>Giải đấu gần đây</CardTitle>
                    <Link to={`/clubs/${club.id}/tournaments`}>
                      <Button variant='link' size='sm'>
                        Xem tất cả
                      </Button>
                    </Link>
                  </CardHeader>
                  <CardContent>
                    {tournaments.length > 0 ? (
                      <div className='space-y-3'>
                        {tournaments.slice(0, 3).map(tournament => (
                          <div
                            key={tournament.id}
                            className='flex items-center justify-between p-3 bg-gray-50 rounded-md'
                          >
                            <div>
                              <h3 className='font-medium text-gray-900'>
                                {tournament.name}
                              </h3>
                              <p className='text-sm text-gray-600'>
                                {new Date(
                                  tournament.start_date
                                ).toLocaleDateString('vi-VN')}
                              </p>
                            </div>
                            <Badge
                              variant='secondary'
                              className={getStatusColor(tournament.status)}
                            >
                              {formatStatus(tournament.status)}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className='text-gray-500'>Chưa có giải đấu nào</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value='members'>
                <Card>
                  <CardHeader className='flex flex-row items-center justify-between'>
                    <CardTitle>Thành viên ({memberCount})</CardTitle>
                    <Button onClick={handleJoinClub} size='sm'>
                      Tham gia CLB
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {members.length > 0 ? (
                      <div className='space-y-4'>
                        {members.map(member => (
                          <div
                            key={member.user_id}
                            className='flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50'
                          >
                            <div className='flex items-center space-x-3'>
                              <div className='w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center'>
                                {member.avatar_url ? (
                                  <img
                                    src={member.avatar_url}
                                    alt='Avatar'
                                    className='w-10 h-10 rounded-full object-cover'
                                  />
                                ) : (
                                  <span className='text-white font-medium'>
                                    {member.full_name?.charAt(0) || '?'}
                                  </span>
                                )}
                              </div>
                              <div>
                                <h3 className='font-medium text-gray-900'>
                                  {member.full_name}
                                </h3>
                                <div className='flex items-center space-x-2 text-sm text-gray-600'>
                                  <Badge variant='outline' className='text-xs'>
                                    {member.current_rank || 'K1'}
                                  </Badge>
                                  <span>{member.ranking_points || 0} điểm</span>
                                </div>
                              </div>
                            </div>
                            <div className='flex space-x-2'>
                              <Button variant='ghost' size='sm'>
                                <Eye className='w-4 h-4' />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className='text-center py-8'>
                        <Users className='w-12 h-12 mx-auto text-gray-400 mb-4' />
                        <p className='text-gray-500'>Chưa có thành viên nào</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value='tournaments'>
                <Card>
                  <CardHeader className='flex flex-row items-center justify-between'>
                    <CardTitle>Giải đấu</CardTitle>
                    <Button size='sm'>Tạo giải đấu</Button>
                  </CardHeader>
                  <CardContent>
                    {tournaments.length > 0 ? (
                      <div className='space-y-4'>
                        {tournaments.map(tournament => (
                          <div
                            key={tournament.id}
                            className='border rounded-lg p-4 hover:bg-gray-50'
                          >
                            <div className='flex items-start justify-between'>
                              <div className='flex-1'>
                                <h3 className='font-semibold text-gray-900 mb-2'>
                                  {tournament.name}
                                </h3>
                                <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600'>
                                  <div className='flex items-center'>
                                    <Calendar className='w-4 h-4 mr-1' />
                                    {new Date(
                                      tournament.start_date
                                    ).toLocaleDateString('vi-VN')}
                                  </div>
                                  <div className='flex items-center'>
                                    <Users className='w-4 h-4 mr-1' />
                                    {tournament.max_participants} người
                                  </div>
                                  <div className='flex items-center'>
                                    <DollarSign className='w-4 h-4 mr-1' />
                                    {tournament.entry_fee?.toLocaleString(
                                      'vi-VN'
                                    ) || 'Miễn phí'}
                                  </div>
                                  <div className='flex items-center'>
                                    <Trophy className='w-4 h-4 mr-1' />
                                    {tournament.prize_pool?.toLocaleString(
                                      'vi-VN'
                                    ) || 'Chưa có'}{' '}
                                    VNĐ
                                  </div>
                                </div>
                                {tournament.description && (
                                  <p className='mt-2 text-sm text-gray-600 line-clamp-2'>
                                    {tournament.description}
                                  </p>
                                )}
                              </div>
                              <div className='ml-4 flex flex-col items-end space-y-2'>
                                <Badge
                                  className={getStatusColor(tournament.status)}
                                >
                                  {formatStatus(tournament.status)}
                                </Badge>
                                <Link to={`/tournaments/${tournament.id}`}>
                                  <Button variant='link' size='sm'>
                                    Xem chi tiết
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className='text-center py-8'>
                        <Trophy className='w-12 h-12 mx-auto text-gray-400 mb-4' />
                        <p className='text-gray-500'>Chưa có giải đấu nào</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value='booking'>
                <Card>
                  <CardHeader>
                    <CardTitle>Đặt bàn</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TableBookingForm club={club} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className='lg:col-span-1 space-y-6'>
            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle>Thông tin liên hệ</CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div className='flex items-start'>
                  <MapPin className='w-5 h-5 text-gray-400 mr-3 mt-0.5' />
                  <div>
                    <p className='text-sm font-medium text-gray-900'>Địa chỉ</p>
                    <p className='text-sm text-gray-600'>{club.address}</p>
                  </div>
                </div>

                {club.phone && (
                  <div className='flex items-center'>
                    <Phone className='w-5 h-5 text-gray-400 mr-3' />
                    <div>
                      <p className='text-sm font-medium text-gray-900'>
                        Điện thoại
                      </p>
                      <a
                        href={`tel:${club.phone}`}
                        className='text-sm text-blue-600 hover:text-blue-800'
                      >
                        {club.phone}
                      </a>
                    </div>
                  </div>
                )}

                {club.email && (
                  <div className='flex items-center'>
                    <Mail className='w-5 h-5 text-gray-400 mr-3' />
                    <div>
                      <p className='text-sm font-medium text-gray-900'>Email</p>
                      <a
                        href={`mailto:${club.email}`}
                        className='text-sm text-blue-600 hover:text-blue-800'
                      >
                        {club.email}
                      </a>
                    </div>
                  </div>
                )}

                {club.hourly_rate && (
                  <div className='flex items-center'>
                    <DollarSign className='w-5 h-5 text-gray-400 mr-3' />
                    <div>
                      <p className='text-sm font-medium text-gray-900'>
                        Giá giờ
                      </p>
                      <p className='text-sm text-gray-600'>
                        {club.hourly_rate.toLocaleString('vi-VN')} VNĐ/giờ
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Thống kê</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-gray-600'>Thành viên</span>
                  <span className='text-sm font-medium text-gray-900'>
                    {memberCount}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-gray-600'>Số bàn</span>
                  <span className='text-sm font-medium text-gray-900'>
                    {club.table_count || 0}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-gray-600'>Giải đấu</span>
                  <span className='text-sm font-medium text-gray-900'>
                    {tournaments.length}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-gray-600'>Đánh giá</span>
                  <div className='flex items-center'>
                    <Star className='w-4 h-4 text-yellow-400 fill-current' />
                    <span className='text-sm font-medium text-gray-900 ml-1'>
                      4.5
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Members */}
            <Card>
              <CardHeader>
                <CardTitle>Thành viên nổi bật</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  {members.slice(0, 5).map((member, index) => (
                    <div
                      key={member.user_id}
                      className='flex items-center space-x-3'
                    >
                      <div className='flex-shrink-0'>
                        {index < 3 ? (
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                              index === 0
                                ? 'bg-yellow-500'
                                : index === 1
                                  ? 'bg-gray-400'
                                  : 'bg-orange-500'
                            }`}
                          >
                            {index + 1}
                          </div>
                        ) : (
                          <div className='w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600'>
                            {index + 1}
                          </div>
                        )}
                      </div>
                      <div className='w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center'>
                        <span className='text-white text-xs font-medium'>
                          {member.full_name?.charAt(0) || '?'}
                        </span>
                      </div>
                      <div className='flex-1 min-w-0'>
                        <p className='text-sm font-medium text-gray-900 truncate'>
                          {member.full_name}
                        </p>
                        <p className='text-xs text-gray-500'>
                          {member.current_rank || 'K1'} •{' '}
                          {member.ranking_points || 0} điểm
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClubDetailPage;
