import React from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import ELORankingDashboard from '@/components/ranking/ELORankingDashboard';
import { SEOHead } from '@/components/SEOHead';
import PageLayout from '@/components/layout/PageLayout';

const RankingDashboardPage: React.FC = () => {
  return (
    <>
      <SEOHead
        title='Hệ Thống Ranking ELO - SABO Pool Arena'
        description='Theo dõi và phân tích chi tiết thứ hạng ELO, lịch sử thay đổi ranking và thống kê hiệu suất thi đấu tại SABO Pool Arena'
        keywords='ELO ranking, bảng xếp hạng, thống kê billiards, SABO Pool Arena, phân tích ELO'
      />
      <Navigation />

      <PageLayout variant='dashboard'>
        <div className='pt-20'>
          <ELORankingDashboard />
        </div>
      </PageLayout>

      <Footer />
    </>
  );
};

export default RankingDashboardPage;
