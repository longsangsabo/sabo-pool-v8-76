import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

// This component is deprecated - functionality moved to ClubTournamentManagement
const ClubTournamentsTab = () => {
  return (
    <Card className='border-yellow-200 bg-yellow-50'>
      <CardContent className='flex items-center gap-3 p-6'>
        <AlertTriangle className='h-6 w-6 text-yellow-600' />
        <div>
          <h3 className='font-medium text-yellow-800'>
            Tab này đã được chuyển
          </h3>
          <p className='text-sm text-yellow-700'>
            Chức năng quản lý giải đấu đã được tích hợp vào tab "Giải đấu" trong
            ClubTournamentManagement
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClubTournamentsTab;
