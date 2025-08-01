import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Trophy,
  Calendar,
  BarChart3,
  Settings,
  Users,
  Calculator,
} from 'lucide-react';
import RankVerificationTab from '@/components/club-management/RankVerificationTab';
import MemberManagementTab from '@/components/club-management/MemberManagementTab';
import ScheduleManagementTab from '@/components/club-management/ScheduleManagementTab';
import AdminTournamentResults from '@/components/tournament/AdminTournamentResults';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const ClubManagement = () => {
  const { user } = useAuth();
  const [clubId, setClubId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClubId = async () => {
      if (!user) return;

      try {
        const { data: clubData } = await supabase
          .from('club_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (clubData) {
          setClubId(clubData.id);
        }
      } catch (error) {
        console.error('Error fetching club ID:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClubId();
  }, [user]);

  if (loading) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4'></div>
          <p className='text-muted-foreground'>Đang tải thông tin club...</p>
        </div>
      </div>
    );
  }

  if (!clubId) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <Card>
          <CardContent className='pt-6'>
            <div className='text-center'>
              <Trophy className='w-12 h-12 mx-auto mb-4 text-muted' />
              <h2 className='text-xl font-semibold mb-2'>
                Chưa có thông tin club
              </h2>
              <p className='text-muted-foreground'>
                Bạn chưa đăng ký làm chủ club. Vui lòng liên hệ quản trị viên để
                được hỗ trợ.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold mb-2'>Quản lý club</h1>
        <p className='text-muted-foreground'>
          Quản lý yêu cầu xác thực hạng và lịch test của club
        </p>
      </div>

      <Tabs defaultValue='verification' className='space-y-6'>
        <TabsList className='grid w-full grid-cols-6'>
          <TabsTrigger
            value='verification'
            className='flex items-center space-x-2'
          >
            <Trophy className='w-4 h-4' />
            <span className='hidden sm:inline'>Xác thực hạng</span>
          </TabsTrigger>
          <TabsTrigger value='members' className='flex items-center space-x-2'>
            <Users className='w-4 h-4' />
            <span className='hidden sm:inline'>Thành viên</span>
          </TabsTrigger>
          <TabsTrigger value='schedule' className='flex items-center space-x-2'>
            <Calendar className='w-4 h-4' />
            <span className='hidden sm:inline'>Lịch test</span>
          </TabsTrigger>
          <TabsTrigger
            value='tournaments'
            className='flex items-center space-x-2'
          >
            <Calculator className='w-4 h-4' />
            <span className='hidden sm:inline'>Kết quả giải đấu</span>
          </TabsTrigger>
          <TabsTrigger
            value='analytics'
            className='flex items-center space-x-2'
          >
            <BarChart3 className='w-4 h-4' />
            <span className='hidden sm:inline'>Thống kê</span>
          </TabsTrigger>
          <TabsTrigger value='settings' className='flex items-center space-x-2'>
            <Settings className='w-4 h-4' />
            <span className='hidden sm:inline'>Cài đặt</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value='verification' className='space-y-6'>
          <RankVerificationTab clubId={clubId} />
        </TabsContent>

        <TabsContent value='members' className='space-y-6'>
          <MemberManagementTab clubId={clubId} />
        </TabsContent>

        <TabsContent value='schedule' className='space-y-6'>
          <ScheduleManagementTab clubId={clubId} />
        </TabsContent>

        <TabsContent value='tournaments' className='space-y-6'>
          <AdminTournamentResults />
        </TabsContent>

        <TabsContent value='analytics' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center'>
                <BarChart3 className='w-5 h-5 mr-2' />
                Thống kê hoạt động club
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <Card>
                  <CardContent className='pt-6'>
                    <div className='text-center'>
                      <Trophy className='w-8 h-8 mx-auto mb-2 text-yellow-500' />
                      <p className='text-2xl font-bold'>0</p>
                      <p className='text-sm text-muted-foreground'>
                        Yêu cầu chờ xử lý
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className='pt-6'>
                    <div className='text-center'>
                      <Users className='w-8 h-8 mx-auto mb-2 text-blue-500' />
                      <p className='text-2xl font-bold'>0</p>
                      <p className='text-sm text-muted-foreground'>
                        Lịch test tuần này
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className='pt-6'>
                    <div className='text-center'>
                      <Calendar className='w-8 h-8 mx-auto mb-2 text-green-500' />
                      <p className='text-2xl font-bold'>0</p>
                      <p className='text-sm text-muted-foreground'>
                        Hạng đã duyệt tháng này
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className='mt-8 text-center text-muted-foreground'>
                <p>
                  Thống kê chi tiết sẽ được cập nhật trong phiên bản tiếp theo
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='settings' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center'>
                <Settings className='w-5 h-5 mr-2' />
                Cài đặt club
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <div className='border rounded-lg p-4'>
                  <h3 className='font-medium mb-2'>Cài đặt test hạng</h3>
                  <p className='text-sm text-muted-foreground'>
                    Tùy chỉnh quy trình test hạng, tiêu chí đánh giá và thông
                    báo
                  </p>
                </div>

                <div className='border rounded-lg p-4'>
                  <h3 className='font-medium mb-2'>Quản lý giảng viên</h3>
                  <p className='text-sm text-muted-foreground'>
                    Thêm và quản lý danh sách giảng viên có thể thực hiện test
                    hạng
                  </p>
                </div>

                <div className='border rounded-lg p-4'>
                  <h3 className='font-medium mb-2'>Thông báo tự động</h3>
                  <p className='text-sm text-muted-foreground'>
                    Cấu hình các thông báo tự động gửi tới người chơi
                  </p>
                </div>
              </div>

              <div className='mt-8 text-center text-muted-foreground'>
                <p>
                  Các tính năng cài đặt sẽ được phát triển trong phiên bản tiếp
                  theo
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClubManagement;
