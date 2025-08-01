import React from 'react';
import { Helmet } from 'react-helmet-async';
import PracticeFinder from '@/components/PracticeFinder';
import PointsDisplay from '@/components/PointsDisplay';
import RewardsCenter from '@/components/RewardsCenter';
import AvailabilityStatus from '@/components/AvailabilityStatus';

const PracticeFinderPage = () => {
  return (
    <>
      <Helmet>
        <title>Tìm bạn tập - SABO Pool Arena</title>
        <meta
          name='description'
          content='Tìm kiếm bạn tập luyện bi-a cùng trình độ'
        />
      </Helmet>

      <div className='container mx-auto px-4 py-6 max-w-6xl'>
        <div className='mb-6'>
          <h1 className='text-2xl font-bold text-gray-900 mb-2'>
            Tìm bạn tập hôm nay
          </h1>
          <p className='text-gray-600'>
            Kết nối với người chơi cùng trình độ để tập luyện và nâng cao kỹ
            năng
          </p>
        </div>

        <div className='grid md:grid-cols-3 gap-6'>
          {/* Main Practice Finder */}
          <div className='md:col-span-2 space-y-6'>
            <PointsDisplay />
            <PracticeFinder />
          </div>

          {/* Sidebar */}
          <div className='space-y-6'>
            <AvailabilityStatus />
            <RewardsCenter />
          </div>
        </div>
      </div>
    </>
  );
};

export default PracticeFinderPage;
