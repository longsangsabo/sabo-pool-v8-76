import React from 'react';
import { StatsOverview } from '@/features/club/components/Dashboard/StatsOverview';

interface DashboardStatsProps {
  dashboardType: 'admin' | 'club' | 'player';
  stats?: any;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ 
  dashboardType, 
  stats 
}) => {
  // For now, return a simple placeholder
  // This can be expanded later with type-specific stats
  return (
    <div className="dashboard-stats">
      <h3>Dashboard Stats - {dashboardType}</h3>
      {stats && <pre>{JSON.stringify(stats, null, 2)}</pre>}
    </div>
  );
};
