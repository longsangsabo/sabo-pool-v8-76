import React from 'react';
import { Helmet } from 'react-helmet-async';
import PageLayout from '@/components/layout/PageLayout';
import RankRegistrationMock from '@/components/RankRegistrationMock';

const RankRegistrationPage = () => {
  return (
    <PageLayout variant='dashboard'>
      <Helmet>
        <title>Đăng ký hạng - SABO ARENA</title>
        <meta
          name='description'
          content='Đăng ký xác nhận hạng bida của bạn tại các câu lạc bộ uy tín'
        />
      </Helmet>

      <div className='container mx-auto px-4 py-6 space-y-6'>
        <div className='text-center mb-6'>
          <h1 className='text-2xl font-bebas-neue text-foreground mb-2'>
            Đăng ký xác nhận hạng
          </h1>
          <p className='text-muted-foreground'>
            Xác nhận trình độ chơi bida của bạn thông qua câu lạc bộ uy tín
          </p>
        </div>

        <RankRegistrationMock />
      </div>
    </PageLayout>
  );
};

export default RankRegistrationPage;
