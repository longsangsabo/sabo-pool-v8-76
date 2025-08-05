import React from 'react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useClubRole } from '@/hooks/useClubRole';
import { Separator } from '@/shared/components/ui/separator';
import { Button } from '@/shared/components/ui/button';
import { useRankVerification } from '@/hooks/useRankVerification';
import { DataTable } from '@/shared/components/DataTable';
import { columns } from '@/features/club/components/tables/verification-columns';

/**
 * Club Rank Verification Tab - For club owners to verify member rank claims
 */
const ClubRankVerificationTab = () => {
  const { user } = useAuth();
  const { clubProfile } = useClubRole();
  const { pendingVerifications, isLoading, approveRankClaim, rejectRankClaim } =
    useRankVerification(clubProfile?.id);

  if (isLoading) {
    return (
      <Card className='p-6'>
        <CardContent className='pt-6'>
          <div className='flex justify-center items-center h-64'>
            <div className='loading-spinner'></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='p-4'>
      <CardContent className='pt-6'>
        <div className='flex justify-between items-center mb-6'>
          <div>
            <h2 className='text-2xl font-bold'>Xác thực cấp độ</h2>
            <p className='text-muted-foreground'>
              Xác nhận hoặc từ chối yêu cầu xác thực cấp độ từ thành viên
            </p>
          </div>
          <div className='bg-muted px-4 py-2 rounded-lg'>
            <span className='font-semibold'>{pendingVerifications.length}</span>{' '}
            yêu cầu đang chờ
          </div>
        </div>

        <Separator className='my-6' />

        {pendingVerifications.length === 0 ? (
          <div className='flex flex-col items-center justify-center h-64'>
            <div className='text-6xl mb-4'>✓</div>
            <h3 className='text-xl font-semibold mb-2'>Không có yêu cầu nào</h3>
            <p className='text-muted-foreground text-center max-w-md'>
              Hiện tại không có thành viên nào yêu cầu xác thực cấp độ. Yêu cầu
              mới sẽ xuất hiện ở đây.
            </p>
          </div>
        ) : (
          <DataTable columns={columns} data={pendingVerifications} />
        )}
      </CardContent>
    </Card>
  );
};

export default ClubRankVerificationTab;
