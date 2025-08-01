import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useTournamentResults } from '@/hooks/useTournamentResults';
import { useTournament } from '@/hooks/useTournament';
import { TournamentResults } from '@/components/tournament/TournamentResults';
import { TournamentRewardsSync } from '@/components/admin/TournamentRewardsSync';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy, Calendar, Users, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const TournamentResultsPage: React.FC = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const { tournaments } = useTournament();
  const { results, refetch } = useTournamentResults(tournamentId);

  if (!tournamentId) {
    return <Navigate to='/tournaments' replace />;
  }

  const tournament = tournaments.find(t => t.id === tournamentId);

  if (!tournament) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <Card>
          <CardContent className='p-6'>
            <div className='text-center'>
              <Trophy className='h-12 w-12 mx-auto mb-4 opacity-50' />
              <p className='text-muted-foreground'>Không tìm thấy giải đấu</p>
              <Button
                variant='outline'
                className='mt-4'
                onClick={() => window.history.back()}
              >
                <ArrowLeft className='h-4 w-4 mr-2' />
                Quay lại
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'ongoing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'upcoming':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Đã hoàn thành';
      case 'ongoing':
        return 'Đang diễn ra';
      case 'upcoming':
        return 'Sắp diễn ra';
      case 'registration_open':
        return 'Đang mở đăng ký';
      case 'registration_closed':
        return 'Đã đóng đăng ký';
      default:
        return status;
    }
  };

  return (
    <div className='container mx-auto px-4 py-8 space-y-6'>
      {/* Tournament Header */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <Button
              variant='outline'
              onClick={() => window.history.back()}
              className='mb-4'
            >
              <ArrowLeft className='h-4 w-4 mr-2' />
              Quay lại
            </Button>

            <Badge className={getStatusColor(tournament.status)}>
              {getStatusText(tournament.status)}
            </Badge>
          </div>

          <CardTitle className='flex items-center gap-3'>
            <Trophy className='h-6 w-6 text-yellow-500' />
            {tournament.name}
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div className='flex items-center gap-2'>
              <Calendar className='h-4 w-4 text-muted-foreground' />
              <div>
                <p className='text-sm text-muted-foreground'>Ngày tổ chức</p>
                <p className='font-medium'>
                  {new Date(tournament.tournament_start).toLocaleDateString(
                    'vi-VN'
                  )}
                </p>
              </div>
            </div>

            <div className='flex items-center gap-2'>
              <Users className='h-4 w-4 text-muted-foreground' />
              <div>
                <p className='text-sm text-muted-foreground'>
                  Số người tham gia
                </p>
                <p className='font-medium'>{results.length} người</p>
              </div>
            </div>

            {tournament.venue_address && (
              <div className='flex items-center gap-2'>
                <MapPin className='h-4 w-4 text-muted-foreground' />
                <div>
                  <p className='text-sm text-muted-foreground'>Địa điểm</p>
                  <p className='font-medium'>{tournament.venue_address}</p>
                </div>
              </div>
            )}
          </div>

          {tournament.description && (
            <div className='mt-4'>
              <p className='text-sm text-muted-foreground mb-1'>Mô tả</p>
              <p>{tournament.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rewards Sync (Debug Tool) */}
      <TournamentRewardsSync
        tournamentId={tournamentId}
        tournamentName={tournament?.name}
        onSyncCompleted={refetch}
      />

      {/* Tournament Results */}
      <TournamentResults tournamentId={tournamentId} showTitle={false} />

      {/* Statistics Summary */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Thống kê giải đấu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
              <div className='text-center'>
                <p className='text-2xl font-bold text-blue-600'>
                  {results.reduce((sum, r) => sum + r.total_matches, 0)}
                </p>
                <p className='text-sm text-muted-foreground'>Tổng số trận</p>
              </div>

              <div className='text-center'>
                <p className='text-2xl font-bold text-purple-600'>
                  {results.reduce((sum, r) => sum + r.spa_points_earned, 0)}
                </p>
                <p className='text-sm text-muted-foreground'>Tổng SPA Points</p>
              </div>

              <div className='text-center'>
                <p className='text-2xl font-bold text-orange-600'>
                  {results.reduce((sum, r) => sum + r.elo_points_awarded, 0)}
                </p>
                <p className='text-sm text-muted-foreground'>Tổng ELO Points</p>
              </div>

              <div className='text-center'>
                <p className='text-2xl font-bold text-green-600'>
                  {new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND',
                    notation: 'compact',
                  }).format(
                    results.reduce((sum, r) => sum + r.prize_amount, 0)
                  )}
                </p>
                <p className='text-sm text-muted-foreground'>
                  Tổng tiền thưởng
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TournamentResultsPage;
