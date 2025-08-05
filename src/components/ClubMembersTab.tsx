import React from 'react';
import { Users } from 'lucide-react';
import ClubMemberManagement from '@/components/ClubMemberManagement';

const ClubMembersTab = () => {
  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-2xl font-bold text-foreground'>
          Quản lý thành viên
        </h2>
        <p className='text-muted-foreground'>
          Quản lý danh sách thành viên câu lạc bộ
        </p>
      </div>

      <ClubMemberManagement />
    </div>
  );
};

export default ClubMembersTab;
