import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  Plus,
  RefreshCw,
  Table,
  Clock,
  Trophy,
  Zap,
  ArrowRight,
  Target,
  Users,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MatchPlayer {
  id: string;
  full_name: string;
  display_name?: string;
  avatar_url?: string;
  elo?: number;
  rank?: string;
}

interface MatchDetails {
  id: string;
  player1: MatchPlayer | null;
  player2: MatchPlayer | null;
  tournament_id?: string;
  tournament?: { name: string; tournament_type: string };
  round_number?: number;
  match_number?: number;
  status: string;
  created_at: string;
  started_at?: string;
}

interface PendingMatch {
  id: string;
  tournament_id: string;
  round_number: number;
  match_number: number;
  status: string;
  player1_id: string;
  player2_id: string;
  tournament_name: string;
  tournament_type: string;
  player1_name: string;
  player1_display: string;
  player2_name: string;
  player2_display: string;
  player1_avatar?: string;
  player2_avatar?: string;
  player1_elo?: number;
  player2_elo?: number;
  player1_rank?: string;
  player2_rank?: string;
}

interface EnhancedClubTable {
  id: string;
  table_number: number;
  table_name: string | null;
  status: string;
  current_match_id: string | null;
  last_used_at: string | null;
  match_details?: MatchDetails | null;
}

interface EnhancedTableManagerProps {
  onTablesInitialized?: () => void;
}

const EnhancedTableManager = ({
  onTablesInitialized,
}: EnhancedTableManagerProps) => {
  const { user } = useAuth();
  const [tables, setTables] = useState<EnhancedClubTable[]>([]);
  const [pendingMatches, setPendingMatches] = useState<PendingMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<string>('');
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loadingTournaments, setLoadingTournaments] = useState(false);
  const [tableCount, setTableCount] = useState(8);
  const [clubId, setClubId] = useState<string>('');
  const [autoAssigning, setAutoAssigning] = useState(false);
  const [assignmentProgress, setAssignmentProgress] = useState({
    current: 0,
    total: 0,
  });

  useEffect(() => {
    if (user) {
      fetchClubId();
      fetchActiveTournaments();
    }
  }, [user]);

  useEffect(() => {
    if (clubId) {
      fetchTables();
    }
  }, [clubId]);

  useEffect(() => {
    if (selectedTournament) {
      fetchPendingMatches();
    } else {
      setPendingMatches([]);
    }
  }, [selectedTournament]);

  const fetchActiveTournaments = async () => {
    setLoadingTournaments(true);
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('id, name, status, tournament_start, tournament_end')
        .in('status', ['registration_closed', 'upcoming', 'ongoing'])
        .order('tournament_start', { ascending: false });

      if (error) throw error;
      setTournaments(data || []);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
      toast.error('Không thể tải danh sách giải đấu');
    } finally {
      setLoadingTournaments(false);
    }
  };

  const fetchClubId = async () => {
    try {
      const { data, error } = await supabase
        .from('club_profiles')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (data) {
        setClubId(data.id);
      }
    } catch (error) {
      console.error('Error fetching club ID:', error);
    }
  };

  const fetchTables = async () => {
    setLoading(true);
    try {
      const { data: tablesData, error } = await supabase
        .from('club_tables')
        .select(
          `
          *,
          match:tournament_matches!current_match_id(
            id,
            status,
            round_number,
            match_number,
            created_at,
            player1:profiles!tournament_matches_player1_id_fkey(
              id,
              full_name,
              display_name,
              avatar_url
            ),
            player2:profiles!tournament_matches_player2_id_fkey(
              id,
              full_name,
              display_name,
              avatar_url
            ),
            tournament:tournaments(
              name,
              tournament_type
            )
          )
        `
        )

        .eq('club_id', clubId)
        .order('table_number');

      if (error) throw error;

      // Process the data to add player ELO and ranks
      const enhancedTables = await Promise.all(
        (tablesData || []).map(async table => {
          let matchDetails = null;

          if (
            table.match &&
            Array.isArray(table.match) &&
            table.match.length > 0
          ) {
            const match = table.match[0] as any;

            // Fetch player rankings for ELO and rank
            const player1Id = match.player1?.[0]?.id;
            const player2Id = match.player2?.[0]?.id;
            const playerIds = [player1Id, player2Id].filter(Boolean);

            const playersWithRanks = {
              player1: match.player1?.[0] || null,
              player2: match.player2?.[0] || null,
            };

            if (playerIds.length > 0) {
              const { data: rankings } = await supabase
                .from('player_rankings')
                .select('user_id, elo_points, verified_rank')
                .in('user_id', playerIds);

              if (rankings) {
                const rankingMap = rankings.reduce((acc, rank) => {
                  acc[rank.user_id] = rank;
                  return acc;
                }, {} as any);

                if (player1Id && rankingMap[player1Id]) {
                  playersWithRanks.player1 = {
                    ...playersWithRanks.player1,
                    elo: rankingMap[player1Id].elo_points,
                    rank: rankingMap[player1Id].verified_rank || 'K',
                  };
                }

                if (player2Id && rankingMap[player2Id]) {
                  playersWithRanks.player2 = {
                    ...playersWithRanks.player2,
                    elo: rankingMap[player2Id].elo_points,
                    rank: rankingMap[player2Id].verified_rank || 'K',
                  };
                }
              }
            }

            matchDetails = {
              id: match.id,
              status: match.status,
              round_number: match.round_number,
              match_number: match.match_number,
              created_at: match.created_at,
              started_at: match.started_at,
              player1: playersWithRanks.player1,
              player2: playersWithRanks.player2,
              tournament: match.tournament?.[0] || null,
            };
          }

          return {
            ...table,
            match_details: matchDetails,
          };
        })
      );

      setTables(enhancedTables);
    } catch (error) {
      console.error('Error fetching tables:', error);
      toast.error('Không thể tải danh sách bàn');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingMatches = async () => {
    if (!selectedTournament) {
      setPendingMatches([]);
      return;
    }

    try {
      console.log(
        '🔍 Fetching pending matches for tournament:',
        selectedTournament
      );
      const { data: matches, error } = await supabase
        .from('tournament_matches')
        .select(
          `
          id,
          tournament_id,
          round_number,
          match_number,
          status,
          player1_id,
          player2_id,
          assigned_table_id,
          tournament:tournaments(name, tournament_type, status),
          player1:profiles!tournament_matches_player1_id_fkey(
            full_name,
            display_name,
            avatar_url
          ),
          player2:profiles!tournament_matches_player2_id_fkey(
            full_name,
            display_name,
            avatar_url
          )
        `
        )
        .eq('status', 'scheduled')
        .is('assigned_table_id', null)
        .eq('tournament_id', selectedTournament)
        .order('round_number')
        .order('match_number');

      if (error) throw error;

      console.log('📊 Raw matches data:', matches);
      console.log(
        '📊 Number of unassigned matches found:',
        matches?.length || 0
      );

      // Fetch player rankings for each match
      const enhancedMatches = await Promise.all(
        (matches || []).map(async (match: any) => {
          const playerIds = [match.player1_id, match.player2_id].filter(
            Boolean
          );
          let playerRankings = {};

          if (playerIds.length > 0) {
            const { data: rankings } = await supabase
              .from('player_rankings')
              .select('user_id, elo_points, verified_rank')
              .in('user_id', playerIds);

            if (rankings) {
              playerRankings = rankings.reduce((acc, rank) => {
                acc[rank.user_id] = rank;
                return acc;
              }, {} as any);
            }
          }

          const player1Ranking = playerRankings[match.player1_id] || {};
          const player2Ranking = playerRankings[match.player2_id] || {};

          return {
            id: match.id,
            tournament_id: match.tournament_id,
            round_number: match.round_number,
            match_number: match.match_number,
            status: match.status,
            player1_id: match.player1_id,
            player2_id: match.player2_id,
            tournament_name: match.tournament?.name || 'Unknown Tournament',
            tournament_type:
              match.tournament?.tournament_type || 'single_elimination',
            player1_name: match.player1?.full_name || 'Player 1',
            player1_display:
              match.player1?.display_name ||
              match.player1?.full_name ||
              'Player 1',
            player2_name: match.player2?.full_name || 'Player 2',
            player2_display:
              match.player2?.display_name ||
              match.player2?.full_name ||
              'Player 2',
            player1_avatar: match.player1?.avatar_url,
            player2_avatar: match.player2?.avatar_url,
            player1_elo: player1Ranking.elo_points || 1000,
            player2_elo: player2Ranking.elo_points || 1000,
            player1_rank: player1Ranking.verified_rank || 'K',
            player2_rank: player2Ranking.verified_rank || 'K',
          };
        })
      );

      console.log('✅ Enhanced matches with players:', enhancedMatches);
      setPendingMatches(enhancedMatches);
    } catch (error) {
      console.error('Error fetching pending matches:', error);
    }
  };

  const assignMatchToTable = async (matchId: string, tableId: string) => {
    setAssigning(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        'table-assignment',
        {
          body: {
            action: 'assign_match',
            match_id: matchId,
            table_id: tableId,
          },
        }
      );

      if (error) throw error;

      if (data.success) {
        toast.success('Đã gán trận đấu vào bàn thành công!');
        // Refresh data
        await fetchTables();
        await fetchPendingMatches();
      } else {
        throw new Error(data.error || 'Failed to assign match');
      }
    } catch (error) {
      console.error('Error assigning match to table:', error);
      toast.error('Không thể gán trận đấu vào bàn');
    } finally {
      setAssigning(false);
    }
  };

  const autoAssignAllMatches = async () => {
    setAutoAssigning(true);

    try {
      if (!selectedTournament || !clubId) {
        toast.error('Thiếu thông tin giải đấu hoặc câu lạc bộ');
        return;
      }

      console.log('🚀 Starting auto-assignment with:', {
        tournament_id: selectedTournament,
        club_id: clubId,
        pending_matches: pendingMatches.length,
        available_tables: tables.filter(t => t.status === 'available').length,
      });

      const availableTables = tables.filter(t => t.status === 'available');

      if (pendingMatches.length === 0) {
        toast.info('Không có trận đấu nào để gán');
        return;
      }

      if (availableTables.length === 0) {
        toast.info('Không có bàn trống để gán trận đấu');
        return;
      }

      // Call edge function to auto-assign all matches
      const { data, error } = await supabase.functions.invoke(
        'table-assignment',
        {
          body: {
            action: 'auto_assign_all',
            tournament_id: selectedTournament,
            club_id: clubId,
          },
        }
      );

      console.log('📋 Assignment response:', { data, error });

      if (error) throw error;

      if (data.success) {
        const { assignments_made, total_matches, total_tables, assignments } =
          data;

        console.log('✅ Assignment results:', {
          assignments_made,
          total_matches,
          total_tables,
          assignments,
        });

        if (assignments_made > 0) {
          if (assignments_made === total_matches) {
            toast.success(
              `🎯 Đã gán thành công ${assignments_made} trận đấu vào bàn!`
            );
          } else {
            toast.success(`✅ Đã gán ${assignments_made} trận đấu vào bàn`, {
              description: `⚠️ Còn ${total_matches - assignments_made} trận chờ gán (thiếu bàn)`,
            });
          }
        } else {
          toast.warning('Không thể gán trận đấu nào - vui lòng kiểm tra lại');
        }

        // Refresh data to show updates
        await fetchTables();
        await fetchPendingMatches();
      } else {
        throw new Error(data.error || 'Failed to auto-assign matches');
      }
    } catch (error) {
      console.error('❌ Error auto-assigning matches:', error);
      toast.error(`Không thể tự động gán trận đấu: ${error.message}`);
    } finally {
      setAutoAssigning(false);
      setAssignmentProgress({ current: 0, total: 0 });
    }
  };

  const initializeTables = async () => {
    if (!clubId) {
      toast.error('Không tìm thấy thông tin câu lạc bộ');
      return;
    }

    setInitializing(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        'tournament-table-manager',
        {
          body: {
            action: 'initialize_tables',
            club_id: clubId,
            table_count: tableCount,
          },
        }
      );

      if (error) throw error;

      if (data.success) {
        toast.success(`Đã khởi tạo ${tableCount} bàn thành công!`);
        await fetchTables();
        onTablesInitialized?.();
      } else {
        throw new Error(data.error || 'Failed to initialize tables');
      }
    } catch (error) {
      console.error('Error initializing tables:', error);
      toast.error('Không thể khởi tạo bàn');
    } finally {
      setInitializing(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      available: {
        label: 'Sẵn sàng',
        color: 'bg-green-500',
        badge: 'bg-green-500/10 text-green-400 border-green-500/20',
        icon: '🟢',
      },
      occupied: {
        label: 'Đang đấu',
        color: 'bg-red-500',
        badge: 'bg-red-500/10 text-red-400 border-red-500/20',
        icon: '🔴',
      },
      reserved: {
        label: 'Đã đặt',
        color: 'bg-blue-500',
        badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        icon: '🔵',
      },
      maintenance: {
        label: 'Bảo trì',
        color: 'bg-yellow-500',
        badge: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
        icon: '🟡',
      },
    };

    return configs[status as keyof typeof configs] || configs.available;
  };

  const getRankBadge = (rank: string) => {
    const rankColors = {
      K: 'bg-gray-600 text-white',
      'K+': 'bg-gray-500 text-white',
      I: 'bg-amber-600 text-white',
      'I+': 'bg-amber-500 text-white',
      H: 'bg-orange-600 text-white',
      'H+': 'bg-orange-500 text-white',
      G: 'bg-red-600 text-white',
      'G+': 'bg-red-500 text-white',
      F: 'bg-purple-600 text-white',
      'F+': 'bg-purple-500 text-white',
      E: 'bg-blue-600 text-white',
      'E+': 'bg-blue-500 text-white',
    };

    return rankColors[rank as keyof typeof rankColors] || rankColors['K'];
  };

  const formatDuration = (startTime: string) => {
    const start = new Date(startTime);
    const now = new Date();
    const diff = Math.floor((now.getTime() - start.getTime()) / 1000);

    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (tables.length === 0) {
    return (
      <Card className='w-full'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Table className='h-5 w-5' />
            🎱 Quản lý Bàn Billiards
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='text-center py-8'>
            <div className='text-muted-foreground mb-4'>
              Chưa có bàn nào được khởi tạo
            </div>

            <div className='max-w-sm mx-auto space-y-4'>
              <div>
                <Label htmlFor='tableCount'>Số lượng bàn</Label>
                <Input
                  id='tableCount'
                  type='number'
                  min='1'
                  max='20'
                  value={tableCount}
                  onChange={e => setTableCount(parseInt(e.target.value) || 1)}
                  className='text-center'
                />
              </div>

              <Button
                onClick={initializeTables}
                disabled={initializing}
                className='w-full'
                size='lg'
              >
                {initializing ? (
                  <>
                    <RefreshCw className='mr-2 h-4 w-4 animate-spin' />
                    Đang khởi tạo...
                  </>
                ) : (
                  <>
                    <Plus className='mr-2 h-4 w-4' />
                    Khởi tạo {tableCount} bàn
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const nextMatch = pendingMatches[0]; // Next pending match for auto-assignment

  return (
    <div className='space-y-6'>
      {/* Tournament Selection Header */}
      <Card className='w-full'>
        <CardHeader>
          <CardTitle className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Table className='h-5 w-5' />
              🎱 Quản lý Bàn Billiards
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {/* Tournament Selector */}
            <div className='flex items-center gap-4'>
              <Trophy className='h-5 w-5 text-primary' />
              <div className='flex-1'>
                <Label
                  htmlFor='tournament-select'
                  className='text-sm font-medium'
                >
                  Chọn giải đấu
                </Label>
                <Select
                  value={selectedTournament}
                  onValueChange={setSelectedTournament}
                  disabled={loadingTournaments}
                >
                  <SelectTrigger className='w-full mt-1'>
                    <SelectValue placeholder='Chọn giải đấu để bắt đầu...' />
                  </SelectTrigger>
                  <SelectContent>
                    {tournaments.map(tournament => (
                      <SelectItem key={tournament.id} value={tournament.id}>
                        <div className='flex items-center justify-between w-full'>
                          <span>{tournament.name}</span>
                          <Badge variant='outline' className='ml-2 text-xs'>
                            {tournament.status === 'ongoing'
                              ? 'Đang diễn ra'
                              : tournament.status === 'upcoming'
                                ? 'Sắp diễn ra'
                                : tournament.status === 'registration_closed'
                                  ? 'Đã đóng ĐK'
                                  : tournament.status}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedTournament && (
                <Button
                  onClick={fetchPendingMatches}
                  disabled={loading}
                  variant='outline'
                  size='sm'
                >
                  {loading ? (
                    <RefreshCw className='h-4 w-4 animate-spin' />
                  ) : (
                    <RefreshCw className='h-4 w-4' />
                  )}
                  <span className='ml-2'>Làm mới</span>
                </Button>
              )}
            </div>

            {/* Quick Stats - Only show when tournament selected */}
            {selectedTournament && (
              <div className='flex items-center gap-4 p-4 bg-muted/20 rounded-lg'>
                <Badge variant='outline' className='text-sm'>
                  {tables.filter(t => t.status === 'available').length} bàn
                  trống
                </Badge>
                <Badge variant='outline' className='text-sm'>
                  {tables.filter(t => t.status === 'occupied').length} đang đấu
                </Badge>
                <Badge variant='outline' className='text-sm'>
                  {pendingMatches.length} trận chờ gán
                </Badge>

                {pendingMatches.length > 0 &&
                  tables.filter(t => t.status === 'available').length > 0 && (
                    <Button
                      onClick={autoAssignAllMatches}
                      disabled={autoAssigning}
                      size='sm'
                      className='ml-auto bg-primary hover:bg-primary/90'
                    >
                      {autoAssigning ? (
                        <>
                          <RefreshCw className='mr-2 h-3 w-3 animate-spin' />
                          {assignmentProgress.total > 0
                            ? `Đang gán... ${assignmentProgress.current}/${assignmentProgress.total}`
                            : 'Đang gán...'}
                        </>
                      ) : (
                        <>
                          <Zap className='mr-2 h-3 w-3' />✨ Auto Assign All
                        </>
                      )}
                    </Button>
                  )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tournament Not Selected State */}
      {!selectedTournament ? (
        <Card>
          <CardContent className='flex flex-col items-center justify-center py-12 text-center'>
            <Trophy className='h-16 w-16 text-muted-foreground mb-4' />
            <h3 className='text-lg font-semibold mb-2'>
              Chọn giải đấu để bắt đầu
            </h3>
            <p className='text-muted-foreground max-w-md'>
              Vui lòng chọn một giải đấu từ dropdown phía trên để xem và gán các
              trận đấu vào bàn billiards.
            </p>
          </CardContent>
        </Card>
      ) : (
        /* Tournament Selected - Show Table Management */
        <>
          {/* Unified Tables Grid */}
          <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4'>
            {tables.map(table => {
              const statusConfig = getStatusConfig(table.status);
              const match = table.match_details;

              return (
                <Card
                  key={table.id}
                  className={`relative overflow-hidden transition-all duration-300 hover:scale-[1.02] ${
                    table.status === 'occupied'
                      ? 'ring-2 ring-red-500/20 shadow-lg'
                      : ''
                  }`}
                >
                  {/* Status Indicator Bar */}
                  <div
                    className={`absolute top-0 left-0 w-full h-1 ${statusConfig.color}`}
                  />

                  <CardHeader className='pb-3'>
                    <div className='flex items-center justify-between'>
                      <CardTitle className='text-lg flex items-center gap-2'>
                        🎱 Bàn {table.table_number}
                        {table.table_name && (
                          <span className='text-sm text-muted-foreground'>
                            ({table.table_name})
                          </span>
                        )}
                      </CardTitle>
                      <Badge className={`text-xs ${statusConfig.badge}`}>
                        {statusConfig.icon} {statusConfig.label}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className='space-y-4'>
                    {match ? (
                      /* OCCUPIED TABLE - Show Match Details */
                      <div className='space-y-4'>
                        {/* Match Players */}
                        <div className='space-y-3'>
                          {/* Player 1 */}
                          <div className='flex items-center gap-3 p-2 bg-muted/30 rounded-lg'>
                            <Avatar className='h-10 w-10'>
                              <AvatarImage src={match.player1?.avatar_url} />
                              <AvatarFallback className='text-sm font-medium'>
                                {match.player1?.display_name?.[0] ||
                                  match.player1?.full_name?.[0] ||
                                  'P'}
                              </AvatarFallback>
                            </Avatar>
                            <div className='flex-1'>
                              <div className='font-medium text-sm'>
                                {match.player1?.display_name ||
                                  match.player1?.full_name ||
                                  'Player 1'}
                              </div>
                              <div className='flex items-center gap-2'>
                                <Badge
                                  className={`text-xs px-1.5 py-0.5 ${getRankBadge(match.player1?.rank || 'K')}`}
                                >
                                  {match.player1?.rank || 'K'}
                                </Badge>
                                <span className='text-xs text-muted-foreground'>
                                  {match.player1?.elo || 1000} ELO
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* VS Divider */}
                          <div className='text-center'>
                            <div className='text-muted-foreground font-bold text-lg'>
                              VS
                            </div>
                          </div>

                          {/* Player 2 */}
                          <div className='flex items-center gap-3 p-2 bg-muted/30 rounded-lg'>
                            <Avatar className='h-10 w-10'>
                              <AvatarImage src={match.player2?.avatar_url} />
                              <AvatarFallback className='text-sm font-medium'>
                                {match.player2?.display_name?.[0] ||
                                  match.player2?.full_name?.[0] ||
                                  'P'}
                              </AvatarFallback>
                            </Avatar>
                            <div className='flex-1'>
                              <div className='font-medium text-sm'>
                                {match.player2?.display_name ||
                                  match.player2?.full_name ||
                                  'Player 2'}
                              </div>
                              <div className='flex items-center gap-2'>
                                <Badge
                                  className={`text-xs px-1.5 py-0.5 ${getRankBadge(match.player2?.rank || 'K')}`}
                                >
                                  {match.player2?.rank || 'K'}
                                </Badge>
                                <span className='text-xs text-muted-foreground'>
                                  {match.player2?.elo || 1000} ELO
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Match Info Footer */}
                        <div className='pt-3 border-t border-border/50 space-y-2'>
                          <div className='flex items-center justify-between text-xs text-muted-foreground'>
                            <div className='flex items-center gap-1'>
                              <Clock className='h-3 w-3' />
                              {match.started_at ? (
                                <span>
                                  Playing: {formatDuration(match.started_at)}
                                </span>
                              ) : (
                                <span>
                                  Started:{' '}
                                  {new Date(
                                    match.created_at
                                  ).toLocaleTimeString()}
                                </span>
                              )}
                            </div>
                            <div className='flex items-center gap-1'>
                              <Trophy className='h-3 w-3' />
                              <span className='truncate max-w-[120px]'>
                                {match.tournament?.name || 'Tournament'}
                              </span>
                            </div>
                          </div>

                          {match.round_number && (
                            <div className='text-xs text-muted-foreground text-center bg-muted/20 rounded px-2 py-1'>
                              Round {match.round_number} • Match{' '}
                              {match.match_number}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* AVAILABLE TABLE - Show Assignment Options */
                      <div className='text-center py-8 space-y-4'>
                        <div className='space-y-2'>
                          <div className='text-2xl'>🎯</div>
                          <div className='text-muted-foreground'>
                            <div className='text-sm font-medium'>Available</div>
                            <div className='text-xs'>Ready for assignment</div>
                          </div>
                        </div>

                        {(() => {
                          // Get unique match for this table index to show different matches
                          const tableIndex = tables.findIndex(
                            t => t.id === table.id
                          );
                          const assignedMatchIds = new Set(
                            tables
                              .filter(t => t.current_match_id)
                              .map(t => t.current_match_id)
                          );
                          const availableMatch =
                            pendingMatches.find(
                              (match, index) =>
                                index === tableIndex &&
                                !assignedMatchIds.has(match.id)
                            ) ||
                            pendingMatches.find(
                              match => !assignedMatchIds.has(match.id)
                            );

                          return availableMatch ? (
                            /* Show Next Match to Assign */
                            <div className='space-y-3'>
                              <div className='text-xs text-muted-foreground font-medium'>
                                💡 Next match ready:
                              </div>

                              {/* Preview of next match */}
                              <div className='bg-muted/20 rounded-lg p-3 space-y-2'>
                                <div className='text-xs text-muted-foreground'>
                                  {availableMatch.tournament_name} • R
                                  {availableMatch.round_number}
                                </div>

                                <div className='space-y-1'>
                                  <div className='flex items-center gap-2 text-xs'>
                                    <Avatar className='h-4 w-4'>
                                      <AvatarImage
                                        src={availableMatch.player1_avatar}
                                      />
                                      <AvatarFallback className='text-xs'>
                                        {availableMatch.player1_display[0]}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className='truncate font-medium'>
                                      {availableMatch.player1_display}
                                    </span>
                                    <Badge
                                      className={`text-xs px-1 py-0 ${getRankBadge(availableMatch.player1_rank)}`}
                                    >
                                      {availableMatch.player1_rank}
                                    </Badge>
                                  </div>

                                  <div className='flex items-center gap-2 text-xs'>
                                    <Avatar className='h-4 w-4'>
                                      <AvatarImage
                                        src={availableMatch.player2_avatar}
                                      />
                                      <AvatarFallback className='text-xs'>
                                        {availableMatch.player2_display[0]}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className='truncate font-medium'>
                                      {availableMatch.player2_display}
                                    </span>
                                    <Badge
                                      className={`text-xs px-1 py-0 ${getRankBadge(availableMatch.player2_rank)}`}
                                    >
                                      {availableMatch.player2_rank}
                                    </Badge>
                                  </div>
                                </div>
                              </div>

                              <Button
                                onClick={() =>
                                  assignMatchToTable(
                                    availableMatch.id,
                                    table.id
                                  )
                                }
                                disabled={assigning}
                                size='sm'
                                className='w-full'
                              >
                                {assigning ? (
                                  <>
                                    <RefreshCw className='mr-2 h-3 w-3 animate-spin' />
                                    Đang gán...
                                  </>
                                ) : (
                                  <>
                                    <ArrowRight className='mr-2 h-3 w-3' />
                                    Assign Match
                                  </>
                                )}
                              </Button>
                            </div>
                          ) : (
                            /* No Pending Matches */
                            <div className='space-y-2'>
                              <div className='text-xs text-muted-foreground'>
                                No pending matches
                              </div>
                              <div className='text-xs text-muted-foreground'>
                                Waiting for tournament assignments...
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Additional Pending Matches Info (if more than can be auto-assigned) */}
          {pendingMatches.length >
            tables.filter(t => t.status === 'available').length && (
            <Card className='border-dashed'>
              <CardContent className='pt-6'>
                <div className='text-center space-y-2'>
                  <div className='text-sm text-muted-foreground'>
                    <Target className='h-4 w-4 inline mr-2' />
                    {pendingMatches.length -
                      tables.filter(t => t.status === 'available').length}{' '}
                    matches still waiting for available tables
                  </div>
                  <div className='text-xs text-muted-foreground'>
                    Matches will be auto-assigned as tables become available
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default EnhancedTableManager;
