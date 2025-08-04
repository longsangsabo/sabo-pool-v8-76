import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Users, Clock, Calendar } from 'lucide-react';
import { useTournamentStats } from '../hooks/useTournamentStats';

interface TournamentStatsProps {
  tournamentId: string;
}

export const TournamentStats: React.FC<TournamentStatsProps> = ({ tournamentId }) => {
  const { stats, loading } = useTournamentStats(tournamentId);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center gap-4">
            <Users className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Người tham gia</p>
              <p className="text-2xl font-bold">
                {stats.registeredParticipants}/{stats.totalParticipants}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Trophy className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Trận đã hoàn thành</p>
              <p className="text-2xl font-bold">{stats.completedMatches}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Calendar className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Trận sắp diễn ra</p>
              <p className="text-2xl font-bold">{stats.upcomingMatches}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Clock className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Thời gian trung bình</p>
              <p className="text-2xl font-bold">
                {Math.round(stats.averageMatchDuration)} phút
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
