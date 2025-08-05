import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Trophy,
  Users,
  PlayCircle,
  CheckCircle2,
  Clock,
  Settings,
  Target,
  GitBranch,
} from 'lucide-react';
import { TournamentBracketGenerator } from '@/components/tournaments/TournamentBracketGenerator';
import { TournamentBracket } from './TournamentBracket';
import { useTournamentManagement } from '@/hooks/useTournamentManagement';
import { useToast } from '@/hooks/use-toast';

interface TournamentManagementFlowProps {
  tournamentId: string;
  onTabChange?: (tab: string) => void;
  onShowResults?: () => void;
}

const TournamentManagementFlow: React.FC<TournamentManagementFlowProps> = ({
  tournamentId,
  onTabChange,
  onShowResults,
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const {
    tournament,
    registrations,
    hasBracket,
    isLoading,
    participantCount,
    generateBracket,
    startTournament,
    checkTournamentCompletion,
    refreshData,
  } = useTournamentManagement(tournamentId);

  const { toast } = useToast();

  const handleTabChange = useCallback(
    (tab: string) => {
      setActiveTab(tab);
      onTabChange?.(tab);
    },
    [onTabChange]
  );

  const handleBracketGenerated = useCallback(() => {
    refreshData();
    toast({
      title: 'Success',
      description: 'Tournament bracket has been generated successfully',
    });
  }, [refreshData, toast]);

  const handleStartTournament = async () => {
    const success = await startTournament();
    if (success) {
      refreshData();
    }
  };

  const handleCheckCompletion = async () => {
    const isCompleted = await checkTournamentCompletion();
    if (isCompleted) {
      toast({
        title: 'Tournament Completed!',
        description:
          'All matches have been completed. Results are now available.',
      });
      onShowResults?.();
    }
  };

  if (isLoading || !tournament) {
    return (
      <div className='flex items-center justify-center p-8'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
      </div>
    );
  }

  const canGenerateBracket =
    (tournament.status === 'registration_closed' ||
      tournament.status === 'registration_open') &&
    !hasBracket;
  const canStartTournament =
    tournament.status === 'registration_closed' && hasBracket;
  const isOngoing = tournament.status === 'ongoing';
  const isCompleted = tournament.status === 'completed';

  const getTournamentTypeIcon = () => {
    if (tournament.tournament_type === 'double_elimination') {
      return <GitBranch className='h-5 w-5' />;
    }
    return <Target className='h-5 w-5' />;
  };

  const getTournamentTypeName = () => {
    if (tournament.tournament_type === 'double_elimination') {
      return 'Double Elimination';
    }
    return 'Single Elimination';
  };

  return (
    <div className='space-y-6'>
      {/* Tournament Status Header */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <Trophy className='h-6 w-6 text-gold' />
              <div>
                <CardTitle className='flex items-center gap-2'>
                  {tournament.name}
                  <Badge
                    variant={
                      isCompleted
                        ? 'default'
                        : isOngoing
                          ? 'secondary'
                          : 'outline'
                    }
                  >
                    {tournament.status}
                  </Badge>
                </CardTitle>
                <div className='flex items-center gap-2 mt-1'>
                  {getTournamentTypeIcon()}
                  <span className='text-sm text-muted-foreground'>
                    {getTournamentTypeName()}
                  </span>
                </div>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <Users className='h-4 w-4' />
              <span className='text-sm'>
                {participantCount}/{tournament.max_participants} players
              </span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Management Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className='grid w-full grid-cols-4'>
          <TabsTrigger value='overview' className='flex items-center gap-2'>
            <Settings className='h-4 w-4' />
            Overview
          </TabsTrigger>
          <TabsTrigger value='generate' className='flex items-center gap-2'>
            <Target className='h-4 w-4' />
            Generate Bracket
          </TabsTrigger>
          <TabsTrigger value='bracket' className='flex items-center gap-2'>
            <Trophy className='h-4 w-4' />
            View Bracket
          </TabsTrigger>
          <TabsTrigger value='control' className='flex items-center gap-2'>
            <PlayCircle className='h-4 w-4' />
            Tournament Control
          </TabsTrigger>
        </TabsList>

        <TabsContent value='overview' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Tournament Status</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div className='flex items-center gap-3 p-3 border rounded-lg'>
                  <Users className='h-5 w-5 text-blue-500' />
                  <div>
                    <p className='font-medium'>{participantCount} Players</p>
                    <p className='text-sm text-muted-foreground'>Registered</p>
                  </div>
                </div>

                <div className='flex items-center gap-3 p-3 border rounded-lg'>
                  {getTournamentTypeIcon()}
                  <div>
                    <p className='font-medium'>{getTournamentTypeName()}</p>
                    <p className='text-sm text-muted-foreground'>
                      Tournament Type
                    </p>
                  </div>
                </div>

                <div className='flex items-center gap-3 p-3 border rounded-lg'>
                  {hasBracket ? (
                    <CheckCircle2 className='h-5 w-5 text-green-500' />
                  ) : (
                    <Clock className='h-5 w-5 text-orange-500' />
                  )}
                  <div>
                    <p className='font-medium'>
                      {hasBracket ? 'Generated' : 'Pending'}
                    </p>
                    <p className='text-sm text-muted-foreground'>
                      Bracket Status
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='generate' className='space-y-4'>
          <TournamentBracketGenerator
            tournamentId={tournamentId}
            tournamentType={tournament.tournament_type}
            participantCount={participantCount}
            onBracketGenerated={handleBracketGenerated}
          />
        </TabsContent>

        <TabsContent value='bracket' className='space-y-4'>
          {hasBracket ? (
            <TournamentBracket tournamentId={tournamentId} adminMode={true} />
          ) : (
            <Card>
              <CardContent className='p-6 text-center'>
                <Target className='h-12 w-12 mx-auto mb-4 text-muted-foreground' />
                <p className='text-muted-foreground'>
                  Generate a bracket first to view tournament matches
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value='control' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Tournament Control</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex flex-col gap-4'>
                {canStartTournament && (
                  <Button onClick={handleStartTournament} className='w-full'>
                    <PlayCircle className='mr-2 h-4 w-4' />
                    Start Tournament
                  </Button>
                )}

                {isOngoing && (
                  <Button
                    onClick={handleCheckCompletion}
                    variant='outline'
                    className='w-full'
                  >
                    <CheckCircle2 className='mr-2 h-4 w-4' />
                    Check Tournament Completion
                  </Button>
                )}

                {isCompleted && (
                  <Button onClick={() => onShowResults?.()} className='w-full'>
                    <Trophy className='mr-2 h-4 w-4' />
                    View Results
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TournamentManagementFlow;
