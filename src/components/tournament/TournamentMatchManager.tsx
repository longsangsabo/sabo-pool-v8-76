import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Trophy,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Filter,
  List,
  Grid3X3,
} from 'lucide-react';
import {
  useTournamentMatches,
  TournamentMatch,
} from '@/hooks/useTournamentMatches';
import { DoubleEliminationMatchCard } from '../tournament/DoubleEliminationMatchCard';

interface TournamentMatchManagerProps {
  tournamentId: string;
  isClubOwner?: boolean;
}

export const TournamentMatchManager: React.FC<TournamentMatchManagerProps> = ({
  tournamentId,
  isClubOwner = false,
}) => {
  const [activeRound, setActiveRound] = useState<number | 'all'>('all');
  const [activeView, setActiveView] = useState<'grid' | 'list'>('grid');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { matches, loading, error } = useTournamentMatches(tournamentId);

  // Group matches by round and bracket type
  const matchesByRound = useMemo(() => {
    const grouped: Record<string, TournamentMatch[]> = {};

    matches.forEach(match => {
      const key = `R${match.round_number}-${match.bracket_type}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(match);
    });

    // Sort matches within each group
    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) => a.match_number - b.match_number);
    });

    return grouped;
  }, [matches]);

  // Filter matches based on active filters
  const filteredMatches = useMemo(() => {
    let filtered = matches;

    if (activeRound !== 'all') {
      filtered = filtered.filter(match => match.round_number === activeRound);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(match => match.status === statusFilter);
    }

    return filtered;
  }, [matches, activeRound, statusFilter]);

  // Get unique rounds
  const rounds = useMemo(() => {
    const roundNumbers = [...new Set(matches.map(m => m.round_number))].sort(
      (a, b) => a - b
    );
    return roundNumbers;
  }, [matches]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = matches.length;
    const completed = matches.filter(m => m.status === 'completed').length;
    const ready = matches.filter(
      m => m.status === 'scheduled' && m.player1_id && m.player2_id
    ).length;
    const needingPlayers = matches.filter(
      m => !m.player1_id || !m.player2_id
    ).length;
    const ongoing = matches.filter(m => m.status === 'ongoing').length;

    return { total, completed, ready, needingPlayers, ongoing };
  }, [matches]);

  if (loading) {
    return (
      <div className='flex items-center justify-center py-8'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
        <span className='ml-2'>Loading matches...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className='p-6'>
          <div className='flex items-center gap-2 text-destructive'>
            <AlertCircle className='h-5 w-5' />
            <p>Error loading matches: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-700 border-green-200';
      case 'ongoing':
        return 'bg-blue-500/20 text-blue-700 border-blue-200';
      case 'scheduled':
        return 'bg-orange-500/20 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-500/20 text-gray-700 border-gray-200';
    }
  };

  const getBracketTypeLabel = (bracketType: string) => {
    switch (bracketType) {
      case 'winners':
        return 'Winners';
      case 'losers_branch_a':
        return 'Losers A';
      case 'losers_branch_b':
        return 'Losers B';
      case 'semifinal':
        return 'Semifinal';
      case 'final':
        return 'Final';
      default:
        return bracketType;
    }
  };

  return (
    <div className='space-y-6'>
      {/* Statistics Overview */}
      <Card className='bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <List className='h-5 w-5 text-primary' />
            Tournament Match Manager
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 md:grid-cols-5 gap-4'>
            <div className='flex items-center gap-2 p-3 bg-white/50 rounded-lg'>
              <Trophy className='h-4 w-4 text-gray-600' />
              <div>
                <div className='text-sm font-medium'>{stats.total}</div>
                <div className='text-xs text-muted-foreground'>Total</div>
              </div>
            </div>

            <div className='flex items-center gap-2 p-3 bg-white/50 rounded-lg'>
              <CheckCircle className='h-4 w-4 text-green-600' />
              <div>
                <div className='text-sm font-medium'>{stats.completed}</div>
                <div className='text-xs text-muted-foreground'>Completed</div>
              </div>
            </div>

            <div className='flex items-center gap-2 p-3 bg-white/50 rounded-lg'>
              <Clock className='h-4 w-4 text-orange-600' />
              <div>
                <div className='text-sm font-medium'>{stats.ready}</div>
                <div className='text-xs text-muted-foreground'>Ready</div>
              </div>
            </div>

            <div className='flex items-center gap-2 p-3 bg-white/50 rounded-lg'>
              <Users className='h-4 w-4 text-blue-600' />
              <div>
                <div className='text-sm font-medium'>
                  {stats.needingPlayers}
                </div>
                <div className='text-xs text-muted-foreground'>
                  Need Players
                </div>
              </div>
            </div>

            <div className='flex items-center gap-2 p-3 bg-white/50 rounded-lg'>
              <AlertCircle className='h-4 w-4 text-purple-600' />
              <div>
                <div className='text-sm font-medium'>{stats.ongoing}</div>
                <div className='text-xs text-muted-foreground'>Live</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters and Controls */}
      <Card>
        <CardContent className='p-4'>
          <div className='flex flex-wrap items-center gap-4'>
            {/* Round Filter */}
            <div className='flex items-center gap-2'>
              <Filter className='h-4 w-4 text-muted-foreground' />
              <span className='text-sm font-medium'>Round:</span>
              <Tabs
                value={activeRound.toString()}
                onValueChange={value =>
                  setActiveRound(value === 'all' ? 'all' : parseInt(value))
                }
              >
                <TabsList className='h-8'>
                  <TabsTrigger value='all' className='text-xs'>
                    All
                  </TabsTrigger>
                  {rounds.map(round => (
                    <TabsTrigger
                      key={round}
                      value={round.toString()}
                      className='text-xs'
                    >
                      R{round}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            {/* Status Filter */}
            <div className='flex items-center gap-2'>
              <span className='text-sm font-medium'>Status:</span>
              <div className='flex gap-1'>
                {['all', 'scheduled', 'ongoing', 'completed'].map(status => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? 'default' : 'outline'}
                    size='sm'
                    onClick={() => setStatusFilter(status)}
                    className='text-xs'
                  >
                    {status === 'all'
                      ? 'All'
                      : status.charAt(0).toUpperCase() + status.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            {/* View Toggle */}
            <div className='flex items-center gap-2 ml-auto'>
              <Button
                variant={activeView === 'grid' ? 'default' : 'outline'}
                size='sm'
                onClick={() => setActiveView('grid')}
              >
                <Grid3X3 className='h-4 w-4' />
              </Button>
              <Button
                variant={activeView === 'list' ? 'default' : 'outline'}
                size='sm'
                onClick={() => setActiveView('list')}
              >
                <List className='h-4 w-4' />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Matches Display */}
      {activeRound === 'all' ? (
        // Show matches grouped by round and bracket type
        <div className='space-y-6'>
          {Object.entries(matchesByRound).map(([key, roundMatches]) => {
            const [roundInfo, bracketType] = key.split('-');
            const roundNumber = parseInt(roundInfo.replace('R', ''));

            return (
              <Card key={key}>
                <CardHeader className='pb-4'>
                  <div className='flex items-center justify-between'>
                    <CardTitle className='text-lg'>
                      Round {roundNumber} - {getBracketTypeLabel(bracketType)}
                    </CardTitle>
                    <Badge variant='outline' className='bg-primary/10'>
                      {roundMatches.length} matches
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div
                    className={`grid gap-4 ${
                      activeView === 'grid'
                        ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                        : 'grid-cols-1'
                    }`}
                  >
                    {roundMatches.map(match => (
                      <DoubleEliminationMatchCard
                        key={match.id}
                        match={match}
                        isClubOwner={isClubOwner}
                        tournamentId={tournamentId}
                        variant={
                          match.bracket_type === 'winners'
                            ? 'blue'
                            : match.bracket_type === 'finals'
                              ? 'gold'
                              : 'orange'
                        } // SABO_REBUILD: Updated bracket type
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        // Show filtered matches
        <Card>
          <CardHeader>
            <CardTitle>
              {typeof activeRound === 'string'
                ? 'All Matches'
                : `Round ${activeRound} Matches`}
              {statusFilter !== 'all' &&
                ` - ${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`grid gap-4 ${
                activeView === 'grid'
                  ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                  : 'grid-cols-1'
              }`}
            >
              {filteredMatches.map(match => (
                <DoubleEliminationMatchCard
                  key={match.id}
                  match={match}
                  isClubOwner={isClubOwner}
                  tournamentId={tournamentId}
                  variant={
                    match.bracket_type === 'winners'
                      ? 'blue'
                      : match.bracket_type === 'finals'
                        ? 'gold'
                        : 'orange'
                  } // SABO_REBUILD: Updated bracket type
                />
              ))}
            </div>

            {filteredMatches.length === 0 && (
              <div className='text-center py-8 text-muted-foreground'>
                <Trophy className='h-12 w-12 mx-auto mb-4 opacity-50' />
                <p>No matches found with current filters</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
