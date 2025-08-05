import React from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/shared/components/ui/tabs';
import { Card } from '@/shared/components/ui/card';
import {
  Users,
  Trophy,
  Settings,
  BarChart3,
  Table,
  CheckCircle,
} from 'lucide-react';
import { ClubProvider } from '../contexts/ClubContext';
import { Dashboard } from './dashboard/Dashboard';
import { MemberManagement } from './members/MemberManagement';
import { TournamentManagement } from './tournament/TournamentManagementNew';
import { TableManagement } from './table/TableManagement';
import { VerificationManagement } from './VerificationManagement';
import { Settings as CLBSettings } from './settings/Settings';
import { useClubContext } from '../contexts/ClubContext';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';

const CLBManagementContent = () => {
  const { selectedClub, loading, error } = useClubContext();

  if (loading) {
    return (
      <div className='flex justify-center items-center min-h-[400px]'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
        <p className='ml-4 text-muted-foreground'>Đang tải dữ liệu CLB...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant='destructive'>
        <AlertDescription>
          {error}
          {error.includes('tạo CLB mới') && (
            <div className='mt-2'>
              <a href='/club-registration' className='text-blue-600 underline'>
                Đăng ký CLB mới tại đây
              </a>
            </div>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (!selectedClub) {
    return (
      <Alert>
        <AlertDescription>
          Chưa có CLB nào được chọn. Vui lòng chọn CLB hoặc tạo CLB mới.
        </AlertDescription>
      </Alert>
    );
  }

  const clubId = selectedClub.id;

  return (
    <Tabs defaultValue='dashboard' className='space-y-6'>
      <TabsList>
        <TabsTrigger value='dashboard' className='flex items-center gap-2'>
          <BarChart3 className='w-4 h-4' />
          Tổng quan
        </TabsTrigger>
        <TabsTrigger value='members' className='flex items-center gap-2'>
          <Users className='w-4 h-4' />
          Thành viên
        </TabsTrigger>
        <TabsTrigger value='tournaments' className='flex items-center gap-2'>
          <Trophy className='w-4 h-4' />
          Giải đấu
        </TabsTrigger>
        <TabsTrigger value='tables' className='flex items-center gap-2'>
          <Table className='w-4 h-4' />
          Bàn chơi
        </TabsTrigger>
        <TabsTrigger value='verification' className='flex items-center gap-2'>
          <CheckCircle className='w-4 h-4' />
          Xác thực
        </TabsTrigger>
        <TabsTrigger value='settings' className='flex items-center gap-2'>
          <Settings className='w-4 h-4' />
          Cài đặt
        </TabsTrigger>
      </TabsList>

      <TabsContent value='dashboard'>
        <Dashboard clubId={clubId} />
      </TabsContent>

      <TabsContent value='members'>
        <MemberManagement clubId={clubId} />
      </TabsContent>

      <TabsContent value='tournaments'>
        <TournamentManagement clubId={clubId} />
      </TabsContent>

      <TabsContent value='tables'>
        <TableManagement clubId={clubId} />
      </TabsContent>

      <TabsContent value='verification'>
        <VerificationManagement clubId={clubId} />
      </TabsContent>

      <TabsContent value='settings'>
        <CLBSettings clubId={clubId} />
      </TabsContent>
    </Tabs>
  );
};

export const CLBManagement = () => {
  return (
    <ClubProvider>
      <Card className='p-6'>
        <CLBManagementContent />
      </Card>
    </ClubProvider>
  );
};
