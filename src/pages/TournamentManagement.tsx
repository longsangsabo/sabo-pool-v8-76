import { useParams } from 'react-router-dom';
import { useTournamentManagement } from '@/hooks/useTournamentManagement';
import { TournamentBracketGenerator } from '@/components/tournaments/TournamentBracketGenerator';
import { SingleEliminationBracket } from '@/components/tournaments/SingleEliminationBracket';
import { DoubleBracketVisualization } from '@/components/tournaments/DoubleBracketVisualization';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Loader2,
  Users,
  Trophy,
  Calendar,
  DollarSign,
  Settings,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function TournamentManagement() {
  const { id } = useParams<{ id: string }>();
  const tournamentId = id!;

  const {
    tournament,
    registrations,
    hasBracket,
    isLoading,
    participantCount,
    generateBracket,
    startTournament,
    refreshData,
  } = useTournamentManagement(tournamentId);

  if (isLoading) {
    return (
      <div className='container mx-auto p-4'>
        <div className='flex items-center justify-center py-8'>
          <Loader2 className='h-8 w-8 animate-spin' />
          <span className='ml-2'>Loading tournament...</span>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className='container mx-auto p-4'>
        <Card>
          <CardContent className='text-center py-8'>
            <h2 className='text-2xl font-bold mb-2'>Tournament Not Found</h2>
            <p className='text-muted-foreground'>
              The tournament you're looking for doesn't exist.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      registration_open: {
        label: 'Registration Open',
        variant: 'secondary' as const,
      },
      registration_closed: {
        label: 'Registration Closed',
        variant: 'outline' as const,
      },
      ongoing: { label: 'In Progress', variant: 'default' as const },
      completed: { label: 'Completed', variant: 'secondary' as const },
    };
    const statusInfo = statusMap[status as keyof typeof statusMap] || {
      label: status,
      variant: 'outline' as const,
    };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const canGenerateBracket = () => {
    return (
      tournament.status === 'registration_closed' &&
      !hasBracket &&
      [4, 8, 16, 32].includes(participantCount)
    );
  };

  const canStartTournament = () => {
    return (
      hasBracket &&
      tournament.status !== 'ongoing' &&
      tournament.status !== 'completed'
    );
  };

  const handleManualAdvance = async () => {
    try {
      toast.loading('Đang tiến hành manual advance...');

      const { data, error } = await supabase.functions.invoke(
        'manual-tournament-advance',
        {
          body: { tournament_id: tournamentId },
        }
      );

      if (error) {
        throw error;
      }

      if (data?.success) {
        toast.success(
          `Manual advance thành công! Đã cập nhật ${data.updated_matches} trận đấu`
        );
        refreshData();
      } else {
        toast.error(data?.error || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Manual advance error:', error);
      toast.error('Lỗi khi thực hiện manual advance');
    }
  };

  return (
    <div className='container mx-auto p-4 space-y-6'>
      {/* Tournament Header */}
      <Card>
        <CardHeader>
          <div className='flex justify-between items-start'>
            <div>
              <CardTitle className='text-2xl mb-2'>{tournament.name}</CardTitle>
              {getStatusBadge(tournament.status)}
            </div>
            <Trophy className='h-8 w-8 text-primary' />
          </div>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            <div className='flex items-center gap-2'>
              <Users className='h-4 w-4 text-muted-foreground' />
              <span className='text-sm'>
                {participantCount}/{tournament.max_participants} participants
              </span>
            </div>

            <div className='flex items-center gap-2'>
              <DollarSign className='h-4 w-4 text-muted-foreground' />
              <span className='text-sm'>
                Entry: {tournament.entry_fee?.toLocaleString()} VNĐ
              </span>
            </div>

            <div className='flex items-center gap-2'>
              <Trophy className='h-4 w-4 text-muted-foreground' />
              <span className='text-sm'>
                Prize: {tournament.prize_pool?.toLocaleString()} VNĐ
              </span>
            </div>

            <div className='flex items-center gap-2'>
              <Calendar className='h-4 w-4 text-muted-foreground' />
              <span className='text-sm'>
                {tournament.tournament_type === 'single_elimination'
                  ? 'Single Elimination'
                  : tournament.tournament_type === 'double_elimination'
                    ? 'Double Elimination'
                    : tournament.tournament_type}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tournament Actions */}
      {(tournament.tournament_type === 'single_elimination' ||
        tournament.tournament_type === 'double_elimination') && (
        <Card>
          <CardHeader>
            <CardTitle>Tournament Management</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            {!hasBracket && (
              <div>
                <h3 className='font-semibold mb-2'>Step 1: Generate Bracket</h3>
                <TournamentBracketGenerator
                  tournamentId={tournamentId}
                  tournamentType={
                    tournament?.tournament_type || 'single_elimination'
                  }
                  participantCount={participantCount}
                  onBracketGenerated={refreshData}
                />
              </div>
            )}

            {hasBracket && canStartTournament() && (
              <div>
                <h3 className='font-semibold mb-2'>Step 2: Start Tournament</h3>
                <Button onClick={startTournament} className='w-full'>
                  Start Tournament
                </Button>
              </div>
            )}

            {tournament.status === 'ongoing' && (
              <div className='text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg'>
                <h3 className='font-semibold text-green-800 dark:text-green-200'>
                  Tournament is Live!
                </h3>
                <p className='text-sm text-green-600 dark:text-green-300'>
                  Club owners can now enter match scores below
                </p>
              </div>
            )}

            {tournament.status === 'ongoing' &&
              tournament.tournament_type === 'double_elimination' && (
                <div className='space-y-2'>
                  <h3 className='font-semibold'>Manual Advancement</h3>
                  <p className='text-sm text-muted-foreground'>
                    Nếu các trận đấu đã hoàn tất nhưng chưa tự động advance, hãy
                    sử dụng nút này
                  </p>
                  <Button
                    onClick={handleManualAdvance}
                    variant='outline'
                    className='w-full'
                  >
                    <Settings className='h-4 w-4 mr-2' />
                    Manual Advance Tournament
                  </Button>
                </div>
              )}

            {tournament.status === 'completed' && (
              <div className='text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg'>
                <h3 className='font-semibold text-blue-800 dark:text-blue-200'>
                  Tournament Completed!
                </h3>
                <p className='text-sm text-blue-600 dark:text-blue-300'>
                  View final results and rankings below
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Participants List */}
      <Card>
        <CardHeader>
          <CardTitle>Registered Participants ({participantCount})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2'>
            {registrations.map((registration, index) => (
              <div
                key={registration.id}
                className='flex items-center gap-2 p-2 rounded border'
              >
                <Badge variant='outline'>{index + 1}</Badge>
                <span className='text-sm'>
                  {(registration.profiles as any)?.full_name ||
                    'Unknown Player'}
                </span>
              </div>
            ))}
          </div>

          {participantCount === 0 && (
            <p className='text-muted-foreground text-center py-4'>
              No participants registered yet
            </p>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Tournament Bracket */}
      {hasBracket && tournament.tournament_type === 'single_elimination' && (
        <SingleEliminationBracket
          tournamentId={tournamentId}
          isClubOwner={true} // For now, assume club owner access
        />
      )}

      {hasBracket && tournament.tournament_type === 'double_elimination' && (
        <DoubleBracketVisualization
          tournamentId={tournamentId}
          isClubOwner={true} // For now, assume club owner access
        />
      )}

      {!hasBracket &&
        (tournament.tournament_type === 'single_elimination' ||
          tournament.tournament_type === 'double_elimination') &&
        participantCount > 0 && (
          <Card>
            <CardContent className='text-center py-8'>
              <Trophy className='h-12 w-12 mx-auto mb-4 text-muted-foreground' />
              <h3 className='text-lg font-semibold mb-2'>
                No Bracket Generated Yet
              </h3>
              <p className='text-muted-foreground'>
                Generate the tournament bracket above to start the competition
              </p>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
