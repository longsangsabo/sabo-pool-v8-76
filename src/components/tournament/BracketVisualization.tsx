import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Trophy,
  Users,
  Calendar,
  ArrowRight,
  Crown,
  Medal,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';

interface BracketVisualizationProps {
  tournamentId: string;
  onClose?: () => void;
}

interface MatchData {
  id: string;
  round_number: number;
  match_number: number;
  player1_name?: string;
  player2_name?: string;
  player1_id?: string;
  player2_id?: string;
  player1_avatar?: string | null;
  player2_avatar?: string | null;
  player1_rank?: string;
  player2_rank?: string;
  status: string;
  winner_id?: string;
  scheduled_time?: string;
  score_player1?: number | null;
  score_player2?: number | null;
}

interface BracketData {
  tournament_id: string;
  tournament_type: string;
  bracket_size: number;
  participant_count: number;
  rounds: number;
  participants: any[];
  matches: any[];
}

export const BracketVisualization: React.FC<BracketVisualizationProps> = ({
  tournamentId,
  onClose,
}) => {
  const [bracketData, setBracketData] = useState<BracketData | null>(null);
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBracketData();
  }, [tournamentId]);

  // Real-time subscription để cập nhật thông tin người chơi
  useEffect(() => {
    const channel = supabase
      .channel('bracket-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
        },
        () => {
          console.log('🔄 Profile updated, refreshing bracket...');
          fetchBracketData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournament_matches',
        },
        () => {
          console.log('🔄 Match updated, refreshing bracket...');
          fetchBracketData();
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 Unsubscribing from bracket updates');
      channel.unsubscribe();
    };
  }, [tournamentId]);

  const fetchBracketData = async () => {
    try {
      setLoading(true);

      console.log('🔍 Fetching bracket data for tournament:', tournamentId);

      // Get tournament data first
      const { data: tournament, error: tournamentError } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', tournamentId)
        .single();

      if (tournamentError) {
        throw tournamentError;
      }

      // Get tournament registrations as participants
      const { data: registrations, error: regError } = await supabase
        .from('tournament_registrations')
        .select(
          `
          user_id,
          registration_status,
          payment_status
        `
        )
        .eq('tournament_id', tournamentId)
        .eq('registration_status', 'confirmed')
        .eq('payment_status', 'paid');

      if (regError) {
        console.error('Error fetching registrations:', regError);
      }

      // Get profile data separately to avoid join issues
      const userIds = registrations?.map(r => r.user_id) || [];
      let profiles: any[] = [];

      if (userIds.length > 0) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('user_id, full_name, display_name, avatar_url, verified_rank')
          .in('user_id', userIds);

        if (profileError) {
          console.error('Error fetching profiles:', profileError);
        } else {
          profiles = profileData || [];
        }
      }

      const participants =
        registrations?.map(reg => {
          const profile = profiles.find(p => p.user_id === reg.user_id);
          return {
            id: reg.user_id,
            name: profile?.full_name || profile?.display_name || 'Unknown',
            avatar: profile?.avatar_url || null,
            rank: profile?.verified_rank || 'K',
          };
        }) || [];

      // Get tournament matches with player details
      const { data: matchesData, error: matchesError } = await supabase
        .from('tournament_matches')
        .select(
          `
          id,
          round_number,
          match_number,
          player1_id,
          player2_id,
          winner_id,
          status,
          scheduled_time,
          score_player1,
          score_player2
        `
        )
        .eq('tournament_id', tournamentId)
        .order('round_number', { ascending: true })
        .order('match_number', { ascending: true });

      if (matchesError) {
        console.error('Error fetching matches:', matchesError);
      }

      // Enhance matches with player names
      const enhancedMatches = (matchesData || []).map(match => {
        const player1 = profiles.find(p => p.user_id === match.player1_id);
        const player2 = profiles.find(p => p.user_id === match.player2_id);

        return {
          ...match,
          player1_name: player1?.full_name || player1?.display_name || 'TBD',
          player2_name: player2?.full_name || player2?.display_name || 'TBD',
          player1_avatar: player1?.avatar_url || null,
          player2_avatar: player2?.avatar_url || null,
          player1_rank: player1?.verified_rank || 'K',
          player2_rank: player2?.verified_rank || 'K',
        };
      });

      setMatches(enhancedMatches);

      // Check if bracket exists in tournament_brackets table
      const { data: existingBracket, error: bracketError } = await supabase
        .from('tournament_brackets')
        .select('*')
        .eq('tournament_id', tournamentId)
        .single();

      if (bracketError && bracketError.code !== 'PGRST116') {
        console.error('Error fetching bracket:', bracketError);
      }

      // Calculate rounds based on matches or participants
      const maxRound =
        enhancedMatches.length > 0
          ? Math.max(...enhancedMatches.map(m => m.round_number))
          : Math.ceil(Math.log2(participants.length)) || 3;

      // Set bracket data based on available information
      const bracketInfo = {
        tournament_id: tournamentId,
        tournament_type: tournament.tournament_type || 'single_elimination',
        bracket_size: tournament.max_participants || 8,
        participant_count: participants.length,
        rounds: maxRound,
        participants,
        matches: enhancedMatches,
        bracket_exists: !!existingBracket,
        bracket_data: existingBracket?.bracket_data || null,
      };

      setBracketData(bracketInfo);
      console.log('✅ Bracket data loaded:', bracketInfo);
      console.log('✅ Matches loaded:', enhancedMatches.length);
    } catch (error) {
      console.error('Error fetching bracket data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMatchesByRound = (round: number) => {
    return matches.filter(match => match.round_number === round);
  };

  const getRoundName = (round: number, totalRounds: number) => {
    if (round === totalRounds) return 'Chung Kết';
    if (round === totalRounds - 1) return 'Bán Kết';
    if (round === totalRounds - 2) return 'Tứ Kết';
    return `Vòng ${round}`;
  };

  const getMatchHeight = (totalRounds: number, currentRound: number) => {
    const baseHeight = 100; // Tăng lên 100px cho đủ không gian
    const multiplier = Math.pow(2, currentRound - 1);
    return baseHeight * multiplier;
  };

  const getMatchTopMargin = (
    totalRounds: number,
    currentRound: number,
    matchIndex: number
  ) => {
    if (currentRound === 1) return matchIndex * 110; // Tăng spacing cho vòng 1

    const prevRoundHeight = getMatchHeight(totalRounds, currentRound - 1);
    const currentHeight = getMatchHeight(totalRounds, currentRound);
    const gap = (currentHeight - prevRoundHeight) / 2;

    return matchIndex * currentHeight + gap;
  };

  if (loading) {
    return (
      <Card className='w-full'>
        <CardContent className='flex items-center justify-center py-8'>
          <div className='text-center'>
            <Trophy className='h-8 w-8 animate-pulse mx-auto mb-2' />
            <p>Đang tải sơ đồ giải đấu...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!bracketData) {
    return (
      <Card className='w-full'>
        <CardContent className='text-center py-8'>
          <p>Không tìm thấy dữ liệu bảng đấu</p>
        </CardContent>
      </Card>
    );
  }

  const totalRounds = bracketData.rounds;

  return (
    <div className='space-y-6'>
      {/* Header */}
      <Card>
        <CardHeader className='pb-4'>
          <div className='flex items-center justify-between'>
            <CardTitle className='flex items-center gap-2'>
              <Trophy className='h-6 w-6 text-amber-500' />
              Sơ Đồ Giải Đấu
            </CardTitle>
            {onClose && (
              <Button variant='outline' onClick={onClose}>
                Đóng
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-3 gap-4 text-center'>
            <div className='flex items-center justify-center gap-2'>
              <Users className='h-4 w-4 text-blue-500' />
              <span className='text-sm font-medium'>
                {bracketData.participant_count} Người chơi
              </span>
            </div>
            <div className='flex items-center justify-center gap-2'>
              <Medal className='h-4 w-4 text-green-500' />
              <span className='text-sm font-medium'>
                {totalRounds} Vòng đấu
              </span>
            </div>
            <div className='flex items-center justify-center gap-2'>
              <Crown className='h-4 w-4 text-amber-500' />
              <span className='text-sm font-medium'>
                {bracketData.tournament_type}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tournament Bracket */}
      <Card>
        <CardHeader>
          <CardTitle className='text-lg'>Bảng Đấu</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='overflow-x-auto'>
            <div
              className='flex gap-8 min-w-max p-6'
              style={{ minHeight: `${Math.pow(2, totalRounds - 1) * 110}px` }}
            >
              {Array.from({ length: totalRounds }, (_, roundIndex) => {
                const round = roundIndex + 1;
                const roundMatches = getMatchesByRound(round);

                return (
                  <div
                    key={round}
                    className='flex flex-col relative min-w-[300px]'
                  >
                    {/* Round Header */}
                    <div className='sticky top-0 bg-background z-10 pb-4'>
                      <Badge
                        variant='outline'
                        className={`w-full justify-center py-2 ${
                          round === totalRounds
                            ? 'bg-gradient-to-r from-yellow-400 to-amber-400 text-white border-amber-500'
                            : round === totalRounds - 1
                              ? 'bg-gradient-to-r from-blue-400 to-indigo-400 text-white border-blue-500'
                              : 'bg-background'
                        }`}
                      >
                        {getRoundName(round, totalRounds)}
                      </Badge>
                    </div>

                    {/* Matches */}
                    <div className='relative flex-1'>
                      {roundMatches.map((match, matchIndex) => (
                        <div
                          key={match.id}
                          className='absolute w-full'
                          style={{
                            top: `${getMatchTopMargin(totalRounds, round, matchIndex)}px`,
                            height: `${getMatchHeight(totalRounds, round) - 20}px`,
                          }}
                        >
                          <Card
                            className={`h-full min-h-[90px] border-2 transition-all hover:shadow-md ${
                              match.winner_id
                                ? 'border-green-400 shadow-lg bg-green-50'
                                : 'border-gray-300 shadow-sm bg-white'
                            } ${
                              round === totalRounds
                                ? 'bg-gradient-to-br from-yellow-100 to-amber-200 border-amber-400'
                                : round === totalRounds - 1
                                  ? 'bg-gradient-to-br from-blue-100 to-indigo-200 border-blue-400'
                                  : ''
                            }`}
                          >
                            <CardContent className='p-2 h-full flex flex-col justify-center'>
                              {round === 1 ? (
                                /* Round 1: Both players on same line */
                                <div className='flex items-center justify-between gap-1'>
                                  {/* Player 1 */}
                                  <div
                                    className={`flex items-center gap-1.5 flex-1 p-1.5 rounded-lg ${
                                      match.winner_id === match.player1_id
                                        ? 'bg-green-200 border border-green-400'
                                        : match.player1_id
                                          ? 'bg-gray-100'
                                          : 'bg-gray-50 text-gray-400'
                                    }`}
                                  >
                                    <Avatar className='h-5 w-5 border border-white shadow-sm flex-shrink-0'>
                                      <AvatarImage src={match.player1_avatar} />
                                      <AvatarFallback className='text-xs font-semibold bg-blue-100 text-blue-700'>
                                        {match.player1_name
                                          ?.charAt(0)
                                          ?.toUpperCase() || 'T'}
                                      </AvatarFallback>
                                    </Avatar>

                                    <div className='flex-1 min-w-0'>
                                      <div className='text-xs font-semibold truncate'>
                                        {match.player1_name || 'TBD'}
                                      </div>
                                      <Badge
                                        variant='outline'
                                        className='text-xs px-1 py-0 bg-blue-50 text-blue-700'
                                      >
                                        {match.player1_rank || 'K'}
                                      </Badge>
                                    </div>

                                    <div className='flex items-center gap-1 flex-shrink-0'>
                                      {match.score_player1 !== null && (
                                        <div className='bg-white rounded w-6 h-6 flex items-center justify-center border'>
                                          <span className='text-xs font-bold'>
                                            {match.score_player1}
                                          </span>
                                        </div>
                                      )}
                                      {match.winner_id === match.player1_id && (
                                        <Crown className='h-3 w-3 text-amber-500' />
                                      )}
                                    </div>
                                  </div>

                                  {/* VS */}
                                  <div className='bg-gradient-to-r from-purple-500 to-blue-500 text-white px-2 py-1 rounded-full'>
                                    <span className='text-xs font-bold'>
                                      VS
                                    </span>
                                  </div>

                                  {/* Player 2 */}
                                  <div
                                    className={`flex items-center gap-1.5 flex-1 p-1.5 rounded-lg ${
                                      match.winner_id === match.player2_id
                                        ? 'bg-green-200 border border-green-400'
                                        : match.player2_id
                                          ? 'bg-gray-100'
                                          : 'bg-gray-50 text-gray-400'
                                    }`}
                                  >
                                    <Avatar className='h-5 w-5 border border-white shadow-sm flex-shrink-0'>
                                      <AvatarImage src={match.player2_avatar} />
                                      <AvatarFallback className='text-xs font-semibold bg-red-100 text-red-700'>
                                        {match.player2_name
                                          ?.charAt(0)
                                          ?.toUpperCase() || 'T'}
                                      </AvatarFallback>
                                    </Avatar>

                                    <div className='flex-1 min-w-0'>
                                      <div className='text-xs font-semibold truncate'>
                                        {match.player2_name || 'TBD'}
                                      </div>
                                      <Badge
                                        variant='outline'
                                        className='text-xs px-1 py-0 bg-blue-50 text-blue-700'
                                      >
                                        {match.player2_rank || 'K'}
                                      </Badge>
                                    </div>

                                    <div className='flex items-center gap-1 flex-shrink-0'>
                                      {match.score_player2 !== null && (
                                        <div className='bg-white rounded w-6 h-6 flex items-center justify-center border'>
                                          <span className='text-xs font-bold'>
                                            {match.score_player2}
                                          </span>
                                        </div>
                                      )}
                                      {match.winner_id === match.player2_id && (
                                        <Crown className='h-3 w-3 text-amber-500' />
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                /* Other rounds: Vertical layout */
                                <>
                                  {/* Player 1 Row */}
                                  <div
                                    className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
                                      match.winner_id === match.player1_id
                                        ? 'bg-green-200 border-2 border-green-400'
                                        : match.player1_id
                                          ? 'bg-gray-100 hover:bg-gray-150'
                                          : 'bg-gray-50 text-gray-400'
                                    }`}
                                  >
                                    <div className='flex items-center gap-2 flex-1 min-w-0'>
                                      <Avatar className='h-6 w-6 border border-white shadow-sm flex-shrink-0'>
                                        <AvatarImage
                                          src={match.player1_avatar}
                                        />
                                        <AvatarFallback className='text-xs font-semibold bg-blue-100 text-blue-700'>
                                          {match.player1_name
                                            ?.charAt(0)
                                            ?.toUpperCase() || 'T'}
                                        </AvatarFallback>
                                      </Avatar>

                                      <div className='flex-1 min-w-0 mr-2'>
                                        <div className='text-xs font-semibold truncate text-gray-800'>
                                          {match.player1_name || 'TBD'}
                                        </div>
                                      </div>

                                      <Badge
                                        variant='outline'
                                        className='text-xs px-1.5 py-0.5 bg-blue-50 text-blue-700 border-blue-200 flex-shrink-0'
                                      >
                                        {match.player1_rank || 'K'}
                                      </Badge>
                                    </div>

                                    <div className='flex items-center gap-2 ml-2 flex-shrink-0'>
                                      {match.score_player1 !== null && (
                                        <div className='bg-white rounded-full w-7 h-7 flex items-center justify-center border border-gray-300 shadow-sm'>
                                          <span className='text-sm font-bold text-gray-800'>
                                            {match.score_player1}
                                          </span>
                                        </div>
                                      )}
                                      {match.winner_id === match.player1_id && (
                                        <div className='bg-amber-400 rounded-full p-1'>
                                          <Crown className='h-3 w-3 text-white' />
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* VS Section */}
                                  <div className='flex items-center justify-center py-1'>
                                    <div className='bg-gradient-to-r from-purple-500 to-blue-500 text-white px-2 py-0.5 rounded-full shadow-sm'>
                                      <span className='text-xs font-bold'>
                                        VS
                                      </span>
                                    </div>
                                  </div>

                                  {/* Player 2 Row */}
                                  <div
                                    className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
                                      match.winner_id === match.player2_id
                                        ? 'bg-green-200 border-2 border-green-400'
                                        : match.player2_id
                                          ? 'bg-gray-100 hover:bg-gray-150'
                                          : 'bg-gray-50 text-gray-400'
                                    }`}
                                  >
                                    <div className='flex items-center gap-2 flex-1 min-w-0'>
                                      <Avatar className='h-6 w-6 border border-white shadow-sm flex-shrink-0'>
                                        <AvatarImage
                                          src={match.player2_avatar}
                                        />
                                        <AvatarFallback className='text-xs font-semibold bg-red-100 text-red-700'>
                                          {match.player2_name
                                            ?.charAt(0)
                                            ?.toUpperCase() || 'T'}
                                        </AvatarFallback>
                                      </Avatar>

                                      <div className='flex-1 min-w-0 mr-2'>
                                        <div className='text-xs font-semibold truncate text-gray-800'>
                                          {match.player2_name || 'TBD'}
                                        </div>
                                      </div>

                                      <Badge
                                        variant='outline'
                                        className='text-xs px-1.5 py-0.5 bg-blue-50 text-blue-700 border-blue-200 flex-shrink-0'
                                      >
                                        {match.player2_rank || 'K'}
                                      </Badge>
                                    </div>

                                    <div className='flex items-center gap-2 ml-2 flex-shrink-0'>
                                      {match.score_player2 !== null && (
                                        <div className='bg-white rounded-full w-7 h-7 flex items-center justify-center border border-gray-300 shadow-sm'>
                                          <span className='text-sm font-bold text-gray-800'>
                                            {match.score_player2}
                                          </span>
                                        </div>
                                      )}
                                      {match.winner_id === match.player2_id && (
                                        <div className='bg-amber-400 rounded-full p-1'>
                                          <Crown className='h-3 w-3 text-white' />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </>
                              )}

                              {/* Match Status - if needed */}
                              {match.status && (
                                <div className='text-center mt-1'>
                                  <Badge
                                    variant='secondary'
                                    className={`text-xs px-2 py-0.5 ${
                                      match.status === 'completed'
                                        ? 'bg-green-100 text-green-700'
                                        : match.status === 'ongoing'
                                          ? 'bg-orange-100 text-orange-700'
                                          : 'bg-gray-100 text-gray-600'
                                    }`}
                                  >
                                    {match.status === 'completed'
                                      ? 'Hoàn thành'
                                      : match.status === 'ongoing'
                                        ? 'Đang diễn ra'
                                        : 'Chờ đấu'}
                                  </Badge>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      ))}
                    </div>

                    {/* Connection Lines */}
                    {round < totalRounds && (
                      <div className='absolute -right-4 top-0 bottom-0 flex items-center'>
                        <ArrowRight className='h-5 w-5 text-muted-foreground' />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BracketVisualization;
