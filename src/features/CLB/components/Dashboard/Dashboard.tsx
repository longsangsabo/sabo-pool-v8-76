import React from 'react';
import { QuickActions } from './QuickActions';
import { StatsOverview as StatsOverviewEnhanced } from './StatsOverviewEnhanced';
import { RecentActivity } from './RecentActivity';
import { TablesStatus } from './TablesStatus';

interface DashboardProps {
  clubId: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ clubId }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="text-sm text-gray-500">
          Câu lạc bộ: {clubId}
        </div>
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StatsOverviewEnhanced clubId={clubId} />
        <TablesStatus clubId={clubId} />
      </div>

      {/* Recent Activity */}
      <RecentActivity clubId={clubId} />
    </div>
  );
};
