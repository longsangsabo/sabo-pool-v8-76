import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, CheckCircle, Clock, RefreshCw, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BracketUpdate {
  id: string;
  tournament_id: string;
  tournament_name: string;
  match_id: string;
  winner_id: string;
  winner_name: string;
  round_number: number;
  match_number: number;
  bracket_type: string;
  timestamp: string;
  type: 'match_completed' | 'winner_advanced' | 'tournament_completed';
}

interface RealTimeBracketUpdatesProps {
  tournamentId?: string;
  maxUpdates?: number;
}

export const RealTimeBracketUpdates: React.FC<RealTimeBracketUpdatesProps> = ({
  tournamentId,
  maxUpdates = 10,
}) => {
  const [updates, setUpdates] = useState<BracketUpdate[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Subscribe to real-time tournament updates
    const channel = supabase
      .channel('tournament_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tournament_matches',
          filter: tournamentId ? `tournament_id=eq.${tournamentId}` : undefined,
        },
        payload => {
          const match = payload.new;
          if (match.status === 'completed' && match.winner_id) {
            // Fetch additional match details
            fetchMatchDetails(match.id, match.tournament_id, match.winner_id);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tournaments',
          filter: tournamentId ? `id=eq.${tournamentId}` : undefined,
        },
        payload => {
          const tournament = payload.new;
          if (tournament.status === 'completed') {
            addUpdate({
              id: `tournament_${tournament.id}_${Date.now()}`,
              tournament_id: tournament.id,
              tournament_name: tournament.name,
              match_id: '',
              winner_id: '',
              winner_name: '',
              round_number: 0,
              match_number: 0,
              bracket_type: 'finals', // SABO_REBUILD: Updated bracket type
              timestamp: new Date().toISOString(),
              type: 'tournament_completed',
            });
          }
        }
      )
      .subscribe(status => {
        setIsConnected(status === 'SUBSCRIBED');
        if (status === 'SUBSCRIBED') {
          console.log('🔄 Connected to real-time bracket updates');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tournamentId]);

  const fetchMatchDetails = async (
    matchId: string,
    tournamentId: string,
    winnerId: string
  ) => {
    try {
      // Get match details
      const { data: match } = await supabase
        .from('tournament_matches')
        .select('*')
        .eq('id', matchId)
        .single();

      // Get tournament name
      const { data: tournament } = await supabase
        .from('tournaments')
        .select('name')
        .eq('id', tournamentId)
        .single();

      // Get winner name
      const { data: winner } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', winnerId)
        .single();

      if (match && tournament) {
        const winnerName = winner?.full_name || 'Unknown Player';

        addUpdate({
          id: `match_${matchId}_${Date.now()}`,
          tournament_id: tournamentId,
          tournament_name: tournament.name,
          match_id: matchId,
          winner_id: winnerId,
          winner_name: winnerName,
          round_number: match.round_number,
          match_number: match.match_number,
          bracket_type: match.bracket_type,
          timestamp: new Date().toISOString(),
          type: 'match_completed',
        });
      }
    } catch (error) {
      console.error('Failed to fetch match details:', error);
    }
  };

  const addUpdate = (update: BracketUpdate) => {
    setUpdates(prev => [update, ...prev.slice(0, maxUpdates - 1)]);
    setLastUpdateTime(new Date());

    // Show toast notification
    toast({
      title: getUpdateTitle(update),
      description: getUpdateDescription(update),
      variant: 'default',
    });
  };

  const getUpdateTitle = (update: BracketUpdate) => {
    switch (update.type) {
      case 'match_completed':
        return '🏆 Match Completed';
      case 'winner_advanced':
        return '⏭️ Player Advanced';
      case 'tournament_completed':
        return '🎉 Tournament Completed';
      default:
        return '📢 Bracket Update';
    }
  };

  const getUpdateDescription = (update: BracketUpdate) => {
    switch (update.type) {
      case 'match_completed':
        return `${update.winner_name} won ${update.bracket_type} R${update.round_number}M${update.match_number}`;
      case 'winner_advanced':
        return `${update.winner_name} advanced to the next round`;
      case 'tournament_completed':
        return `${update.tournament_name} has been completed`;
      default:
        return 'Bracket has been updated';
    }
  };

  const getUpdateIcon = (type: BracketUpdate['type']) => {
    switch (type) {
      case 'match_completed':
        return <CheckCircle className='h-4 w-4 text-green-600' />;
      case 'winner_advanced':
        return <Users className='h-4 w-4 text-blue-600' />;
      case 'tournament_completed':
        return <Activity className='h-4 w-4 text-purple-600' />;
      default:
        return <Clock className='h-4 w-4 text-gray-600' />;
    }
  };

  const getBracketTypeBadge = (type: string) => {
    const colors = {
      winner: 'bg-green-500/10 text-green-700 border-green-200',
      loser: 'bg-red-500/10 text-red-700 border-red-200',
      semifinal: 'bg-blue-500/10 text-blue-700 border-blue-200',
      final: 'bg-purple-500/10 text-purple-700 border-purple-200',
    };
    return (
      colors[type as keyof typeof colors] ||
      'bg-gray-500/10 text-gray-700 border-gray-200'
    );
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card className='h-full'>
      <CardHeader className='pb-4'>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle className='text-lg flex items-center gap-2'>
              <Activity className='h-5 w-5' />
              Real-time Updates
            </CardTitle>
            <CardDescription>
              Live bracket progression and match results
            </CardDescription>
          </div>
          <div className='flex items-center gap-2'>
            <div className='flex items-center gap-1'>
              <div
                className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
              />
              <span className='text-xs text-muted-foreground'>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            {lastUpdateTime && (
              <span className='text-xs text-muted-foreground'>
                Last: {formatTime(lastUpdateTime.toISOString())}
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className='p-0'>
        <ScrollArea className='h-96 px-6 pb-6'>
          {updates.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-8 text-muted-foreground'>
              <Clock className='h-8 w-8 mb-2 opacity-50' />
              <p className='text-sm'>Waiting for bracket updates...</p>
              <p className='text-xs'>Match completions will appear here</p>
            </div>
          ) : (
            <div className='space-y-3'>
              {updates.map((update, index) => (
                <div
                  key={update.id}
                  className={`p-3 rounded-lg border transition-all ${
                    index === 0
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-background border-border'
                  }`}
                >
                  <div className='flex items-start gap-3'>
                    {getUpdateIcon(update.type)}
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center gap-2 mb-1'>
                        <p className='font-medium text-sm truncate'>
                          {update.tournament_name}
                        </p>
                        {update.bracket_type && (
                          <Badge
                            className={getBracketTypeBadge(update.bracket_type)}
                          >
                            {update.bracket_type}
                          </Badge>
                        )}
                      </div>

                      <p className='text-sm text-muted-foreground mb-2'>
                        {getUpdateDescription(update)}
                      </p>

                      <div className='flex items-center justify-between text-xs text-muted-foreground'>
                        {update.round_number > 0 && (
                          <span>
                            Round {update.round_number}, Match{' '}
                            {update.match_number}
                          </span>
                        )}
                        <span>{formatTime(update.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
