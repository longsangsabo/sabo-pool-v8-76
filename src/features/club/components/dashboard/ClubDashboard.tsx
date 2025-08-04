import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Users, 
  Trophy,
  Calendar,
  DollarSign
} from 'lucide-react';
import { Loading } from '../common/Loading';
import { Error } from '../common/Error';
import { useClub } from '../../hooks/useClub';
import { ClubWithStats } from '../../types/stats.types';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  description
}) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className="text-2xl font-bold mt-1">{value}</h3>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        <div className="text-muted-foreground">{icon}</div>
      </div>
    </CardContent>
  </Card>
);

interface ClubDashboardProps {
  clubId: string;
}

export const ClubDashboard: React.FC<ClubDashboardProps> = ({ clubId }) => {
  const { club, loading, error } = useClub();
  const clubWithStats = club as ClubWithStats;

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <Error message={error.message} />;
  }

  if (!clubWithStats || !clubWithStats.stats) {
    return null;
  }

  const { stats } = clubWithStats;
  
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Thành viên"
          value={stats.total_members}
          icon={<Users className="h-6 w-6" />}
        />
        <StatsCard
          title="Giải đấu"
          value={stats.total_tournaments}
          icon={<Trophy className="h-6 w-6" />}
        />
        <StatsCard
          title="Đặt bàn hôm nay"
          value={stats.today_bookings}
          icon={<Calendar className="h-6 w-6" />}
        />
        <StatsCard
          title="Doanh thu tháng"
          value={new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.monthly_revenue)}
          icon={<DollarSign className="h-6 w-6" />}
        />
      </div>

      {/* TODO: Add charts and other dashboard widgets */}
    </div>
  );
};
