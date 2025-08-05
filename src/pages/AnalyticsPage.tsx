import React from 'react';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';

const AnalyticsPage: React.FC = () => {
  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto px-4 py-6'>
        <AnalyticsDashboard userId='current-user' />
      </div>
    </div>
  );
};

export default AnalyticsPage;
