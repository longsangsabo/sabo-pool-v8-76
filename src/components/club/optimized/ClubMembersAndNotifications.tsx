import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Bell } from 'lucide-react';
import ClubMembersTab from '@/components/ClubMembersTab';
import ClubNotifications from '@/components/ClubNotifications';

const ClubMembersAndNotifications: React.FC = () => {
  return (
    <div className='space-y-6'>
      <Tabs defaultValue='members' className='w-full'>
        <TabsList className='grid w-full grid-cols-2'>
          <TabsTrigger value='members' className='flex items-center gap-2'>
            <Users className='w-4 h-4' />
            Thành viên
          </TabsTrigger>
          <TabsTrigger
            value='notifications'
            className='flex items-center gap-2'
          >
            <Bell className='w-4 h-4' />
            Thông báo
          </TabsTrigger>
        </TabsList>

        <TabsContent value='members' className='mt-6'>
          <ClubMembersTab />
        </TabsContent>

        <TabsContent value='notifications' className='mt-6'>
          <ClubNotifications />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClubMembersAndNotifications;
