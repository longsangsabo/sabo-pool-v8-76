import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  Trophy,
  Calendar,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { ClubStats } from '../../types/club.types';
import { formatCurrency } from '../../utils/clubHelpers';

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
  const [stats, setStats] = React.useState<ClubStats | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Import QuickActions
  const { QuickActions } = require('./QuickActions');

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data, error } = await supabase
          .from('club_stats')
          .select('*')
          .eq('club_id', clubId)
          .single();

        if (error) throw error;
        setStats(data);
      } catch (error) {
        console.error('Error fetching club stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [clubId]);
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <QuickActions />
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Thành viên hoạt động"
          value={stats.active_members}
          icon={<Users className="h-6 w-6" />}
        />
        <StatsCard
          title="Thành viên đã xác thực"
          value={stats.verified_members}
          icon={<Trophy className="h-6 w-6" />}
        />
        <StatsCard
          title="Trận đấu"
          value={stats.total_matches_hosted}
          icon={<Calendar className="h-6 w-6" />}
          description="Trong tháng này"
        />
        <StatsCard
          title="Doanh thu"
          value={formatCurrency(stats.total_revenue)}
          icon={<DollarSign className="h-6 w-6" />}
          description="Trong tháng này"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Thống kê chi tiết
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Điểm tin cậy trung bình</p>
              <p className="font-medium">{stats.avg_trust_score.toFixed(1)}</p>
            </div>
            {stats.peak_hours && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Giờ cao điểm</p>
                <p className="font-medium">{stats.peak_hours}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
