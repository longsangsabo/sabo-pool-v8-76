import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Users, Trophy, Settings, BarChart3 } from 'lucide-react';
import { ClubProvider } from '../contexts/ClubContext';
import { ClubDashboard } from './dashboard/ClubDashboard';
import { MemberList } from './members/MemberList';
import { VerificationList } from './verification/VerificationList';
import { ClubSettings } from './settings/ClubSettings';
import { useClubContext } from '../contexts/ClubContext';
import { Alert, AlertDescription } from '@/components/ui/alert';

const ClubManagementContent = () => {
  const { selectedClub, loading, error } = useClubContext();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!selectedClub) {
    return (
      <Alert>
        <AlertDescription>
          Vui lòng chọn một câu lạc bộ để quản lý
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Tabs defaultValue="dashboard" className="space-y-6">
      <TabsList>
        <TabsTrigger value="dashboard" className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          Tổng quan
        </TabsTrigger>
        <TabsTrigger value="members" className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          Thành viên
        </TabsTrigger>
        <TabsTrigger value="verification" className="flex items-center gap-2">
          <Trophy className="w-4 h-4" />
          Xác thực
        </TabsTrigger>
        <TabsTrigger value="settings" className="flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Cài đặt
        </TabsTrigger>
      </TabsList>

      <TabsContent value="dashboard">
        <ClubDashboard clubId={selectedClub.id} />
      </TabsContent>

      <TabsContent value="members">
        <MemberList clubId={selectedClub.id} />
      </TabsContent>

      <TabsContent value="verification">
        <VerificationList clubId={selectedClub.id} />
      </TabsContent>

      <TabsContent value="settings">
        <ClubSettings club={selectedClub} />
      </TabsContent>
    </Tabs>
  );
};

export const ClubManagement = () => {
  return (
    <ClubProvider>
      <Card className="p-6">
        <ClubManagementContent />
      </Card>
    </ClubProvider>
  );
};
