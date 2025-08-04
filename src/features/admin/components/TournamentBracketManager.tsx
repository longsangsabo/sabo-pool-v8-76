import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Settings,
  Eye,
  Users,
} from 'lucide-react';
import { useDoubleEliminationBracket } from '@/hooks/useDoubleEliminationBracket';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Tournament {
  id: string;
  name: string;
  status: string;
  tournament_type: string;
  participant_count?: number;
  completed_matches?: number;
  total_matches?: number;
}

interface TournamentBracketManagerProps {
  tournaments: Tournament[];
  onRefresh: () => void;
}

export const TournamentBracketManager: React.FC<
  TournamentBracketManagerProps
> = ({ tournaments, onRefresh }) => {
  const { createBracket, isCreatingBracket } =
    useDoubleEliminationBracket('admin-hook');
  const { toast } = useToast();
  const [selectedTournament, setSelectedTournament] = useState<string | null>(
    null
  );

  const handleRepairBracket = async (
    tournamentId: string,
    tournamentName: string
  ) => {
    setSelectedTournament(tournamentId);

    try {
      createBracket(
        { tournamentId },
        {
          onSuccess: () => {
            toast({
              title: '🔧 Bracket Repaired',
              description: `Tournament "${tournamentName}" bracket has been fixed successfully.`,
              variant: 'default',
            });
            onRefresh();
          },
          onError: error => {
            toast({
              title: '❌ Repair Failed',
              description: `Failed to repair bracket: ${error.message}`,
              variant: 'destructive',
            });
          },
        }
      );
    } finally {
      setSelectedTournament(null);
    }
  };

  const getTournamentStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-700 border-green-200';
      case 'ongoing':
        return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'registration_open':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
      case 'registration_closed':
        return 'bg-orange-500/10 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const getProgressPercentage = (completed: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  };

  const doubleEliminationTournaments = tournaments.filter(
    t =>
      t.tournament_type === 'double_elimination' &&
      ['ongoing', 'registration_closed', 'completed'].includes(t.status)
  );

  if (doubleEliminationTournaments.length === 0) {
    return (
      <Card className='border-dashed'>
        <CardContent className='flex flex-col items-center justify-center py-8 text-muted-foreground'>
          <Settings className='h-12 w-12 mb-4 opacity-50' />
          <p className='text-lg font-medium'>
            No Double Elimination Tournaments
          </p>
          <p className='text-sm'>
            Active tournaments will appear here for bracket management
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold'>Tournament Bracket Manager</h2>
          <p className='text-muted-foreground'>
            Manage and repair double elimination tournament brackets
          </p>
        </div>
        <Button onClick={onRefresh} variant='outline' size='sm'>
          <RefreshCw className='h-4 w-4 mr-2' />
          Refresh
        </Button>
      </div>

      <Alert className='border-blue-200 bg-blue-50'>
        <AlertTriangle className='h-4 w-4' />
        <AlertDescription>
          This tool helps fix bracket progression issues in double elimination
          tournaments. Use the repair function when winners aren't advancing
          correctly to the next round.
        </AlertDescription>
      </Alert>

      <div className='grid gap-4'>
        {doubleEliminationTournaments.map(tournament => {
          const progress = getProgressPercentage(
            tournament.completed_matches || 0,
            tournament.total_matches || 1
          );

          const needsAttention =
            tournament.status === 'ongoing' && progress > 0;

          return (
            <Card
              key={tournament.id}
              className='transition-all hover:shadow-md'
            >
              <CardHeader className='pb-4'>
                <div className='flex items-start justify-between'>
                  <div className='space-y-2'>
                    <CardTitle className='text-lg flex items-center gap-2'>
                      {tournament.name}
                      {needsAttention && (
                        <Badge
                          variant='outline'
                          className='text-xs bg-yellow-50 text-yellow-700 border-yellow-200'
                        >
                          <AlertTriangle className='h-3 w-3 mr-1' />
                          Needs Attention
                        </Badge>
                      )}
                    </CardTitle>
                    <div className='flex items-center gap-3'>
                      <Badge
                        className={getTournamentStatusColor(tournament.status)}
                      >
                        {tournament.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <div className='flex items-center gap-1 text-sm text-muted-foreground'>
                        <Users className='h-3 w-3' />
                        {tournament.participant_count || 0} players
                      </div>
                    </div>
                  </div>

                  <div className='flex gap-2'>
                    <Button variant='outline' size='sm'>
                      <Eye className='h-4 w-4 mr-1' />
                      View
                    </Button>
                    <Button
                      onClick={() =>
                        handleRepairBracket(tournament.id, tournament.name)
                      }
                      disabled={
                        isCreatingBracket &&
                        selectedTournament === tournament.id
                      }
                      variant={needsAttention ? 'default' : 'outline'}
                      size='sm'
                    >
                      {isCreatingBracket &&
                      selectedTournament === tournament.id ? (
                        <>
                          <RefreshCw className='h-4 w-4 mr-1 animate-spin' />
                          Repairing...
                        </>
                      ) : (
                        <>
                          <Settings className='h-4 w-4 mr-1' />
                          Repair Bracket
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className='pt-0'>
                <div className='space-y-3'>
                  <div className='flex items-center justify-between text-sm'>
                    <span className='text-muted-foreground'>
                      Match Progress
                    </span>
                    <span className='font-medium'>
                      {tournament.completed_matches || 0} /{' '}
                      {tournament.total_matches || 0} completed
                    </span>
                  </div>

                  <div className='w-full bg-gray-200 rounded-full h-2 overflow-hidden'>
                    <div
                      className={`h-full transition-all duration-500 ${
                        progress === 100
                          ? 'bg-green-500'
                          : progress > 0
                            ? 'bg-blue-500'
                            : 'bg-gray-300'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className='flex items-center justify-between text-xs text-muted-foreground'>
                    <span>{progress}% complete</span>
                    {tournament.status === 'completed' && (
                      <div className='flex items-center gap-1 text-green-600'>
                        <CheckCircle className='h-3 w-3' />
                        Tournament Complete
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
