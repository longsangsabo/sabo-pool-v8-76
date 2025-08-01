import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  RefreshCw,
  PlayCircle,
  Trophy,
  Users,
  Table,
  Settings,
} from 'lucide-react';
import { EnhancedMatchCard } from '@/components/tournament/EnhancedMatchCard';
import { EditScoreModal } from '@/components/tournament/EditScoreModal';
import { TournamentBracket } from '@/components/tournament/TournamentBracket';
import {
  useMatchManagement,
  TournamentMatch,
} from '@/hooks/useMatchManagement';
import { useAuth } from '@/hooks/useAuth';
import { SABODoubleEliminationViewer } from '@/tournaments/sabo/SABODoubleEliminationViewer';

interface AdminBracketViewerProps {
  tournamentId: string;
}

interface MatchData {
  id: string;
  round_number: number;
  match_number: number;
  player1_id: string | null;
  player2_id: string | null;
  winner_id: string | null;
  status: string;
  scheduled_time?: string;
  assigned_table_number: number | null;
  assigned_table_id: string | null;
  player1?: {
    full_name: string;
    display_name?: string;
    elo_rating?: number;
  } | null;
  player2?: {
    full_name: string;
    display_name?: string;
    elo_rating?: number;
  } | null;
  winner?: {
    full_name: string;
  } | null;
  assigned_table?: {
    table_number: number;
    table_name?: string | null;
    status: string;
  } | null;
}

interface ClubTable {
  id: string;
  table_number: number;
  table_name?: string;
  status: string;
  current_match_id?: string;
}

export const AdminBracketViewer: React.FC<AdminBracketViewerProps> = ({
  tournamentId,
}) => {
  const [bracket, setBracket] = useState<any>(null);
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [clubTables, setClubTables] = useState<ClubTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [autoAssigning, setAutoAssigning] = useState(false);
  const [editingMatch, setEditingMatch] = useState<TournamentMatch | null>(
    null
  );
  const [tournamentType, setTournamentType] =
    useState<string>('single_elimination');

  const { user } = useAuth();
  const { editScore, isEditingScore } = useMatchManagement(tournamentId);

  useEffect(() => {
    loadBracket();
    loadClubTables();

    // Set up real-time subscription
    const channel = supabase
      .channel('bracket-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournament_brackets',
          filter: `tournament_id=eq.${tournamentId}`,
        },
        () => {
          console.log('🔄 Bracket updated, reloading...');
          loadBracket();
        }
      )
      // tournament_matches table subscription disabled - table doesn't exist
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tournamentId]);

  const loadBracket = async () => {
    try {
      console.log('📊 Loading bracket for tournament:', tournamentId);

      // Load bracket data from tournament metadata instead
      const { data: tournamentData, error: bracketError } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', tournamentId)
        .single();

      if (bracketError && bracketError.code !== 'PGRST116') {
        throw bracketError;
      }

      // Get existing bracket data
      const { data: bracketData, error: bracketQueryError } = await supabase
        .from('tournament_brackets')
        .select('*')
        .eq('tournament_id', tournamentId)
        .single();

      if (bracketQueryError && bracketQueryError.code !== 'PGRST116') {
        console.warn('Bracket not found:', bracketQueryError);
      }

      // Combine tournament and bracket data
      const combinedBracket = {
        ...tournamentData,
        bracket_data: bracketData?.bracket_data || null,
        total_rounds: bracketData?.total_rounds || 0,
        current_round: 1, // Default to round 1
        status: bracketData ? 'generated' : 'not_generated',
        bracket_type: tournamentData?.tournament_type || 'single_elimination',
      };

      // Set tournament type for conditional rendering
      setTournamentType(
        tournamentData?.tournament_type || 'single_elimination'
      );

      setBracket(combinedBracket);
      setMatches([]);

      console.log(
        '✅ Loaded tournament:',
        tournamentData ? 'exists' : 'not found'
      );
      console.log('✅ Loaded matches:', 0);
    } catch (error) {
      console.error('❌ Error loading bracket:', error);
      toast.error('Lỗi tải bảng đấu');
    } finally {
      setLoading(false);
    }
  };

  const loadClubTables = async () => {
    try {
      // Get tournament's club_id first
      const { data: tournament, error: tournamentError } = await supabase
        .from('tournaments')
        .select('club_id')
        .eq('id', tournamentId)
        .single();

      if (tournamentError) throw tournamentError;

      if (tournament?.club_id) {
        // Get club tables
        const { data: tables, error: tablesError } = await supabase
          .from('club_tables')
          .select('*')
          .eq('club_id', tournament.club_id);

        if (tablesError) {
          console.error('Error loading tables:', tablesError);
        } else {
          setClubTables(tables || []);
        }
      }
    } catch (error) {
      console.error('Error loading club tables:', error);
    }
  };

  const assignTableToMatch = async (matchId: string, tableId: string) => {
    try {
      // Update club table status directly since assigned_table_id doesn't exist
      const { error: tableError } = await supabase
        .from('club_tables')
        .update({ status: 'occupied', current_match_id: matchId })
        .eq('id', tableId);

      if (tableError) throw tableError;

      toast.success('Đã phân bàn thành công');
      await loadBracket();
      await loadClubTables();
    } catch (error) {
      console.error('Error assigning table:', error);
      toast.error('Lỗi phân bàn');
    }
  };

  const releaseTableFromMatch = async (matchId: string) => {
    try {
      // Find tables assigned to this match directly from club_tables
      const { data: tables, error: tablesError } = await supabase
        .from('club_tables')
        .select('*')
        .eq('current_match_id', matchId);

      if (tablesError) throw tablesError;

      if (tables && tables.length > 0) {
        // Update all tables assigned to this match to available
        const { error: tableError } = await supabase
          .from('club_tables')
          .update({ status: 'available', current_match_id: null })
          .eq('current_match_id', matchId);

        if (tableError) throw tableError;

        toast.success('Đã thu hồi bàn thành công');
        await loadBracket();
        await loadClubTables();
      } else {
        toast.info('Không tìm thấy bàn được phân cho trận đấu này');
      }
    } catch (error) {
      console.error('Error releasing table:', error);
      toast.error('Lỗi thu hồi bàn');
    }
  };

  const autoAssignTables = async () => {
    setAutoAssigning(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        'tournament-table-manager',
        {
          body: {
            action: 'auto_assign',
            tournament_id: tournamentId,
          },
        }
      );

      if (error) throw error;

      if (data?.success) {
        toast.success(
          `Đã phân bàn tự động cho ${data.assigned_count} trận đấu`
        );
        await loadBracket();
        await loadClubTables();
      } else {
        throw new Error(data?.error || 'Failed to auto assign tables');
      }
    } catch (error) {
      console.error('Error auto assigning tables:', error);
      toast.error('Lỗi phân bàn tự động');
    } finally {
      setAutoAssigning(false);
    }
  };

  const generateBracket = async () => {
    setGenerating(true);
    try {
      console.log('🏆 Generating bracket for tournament:', tournamentId);

      // Use the edge function instead of RPC
      const { data: result, error } = await supabase.functions.invoke(
        'generate-tournament-bracket',
        {
          body: {
            tournament_id: tournamentId,
            seeding_method: 'elo_ranking',
          },
        }
      );

      if (error) throw error;

      const bracketResult = result as any;
      if (!bracketResult?.success) {
        throw new Error(bracketResult?.error || 'Failed to generate bracket');
      }

      toast.success('🏆 Bảng đấu đã được tạo thành công!');
      await loadBracket();
    } catch (error) {
      console.error('❌ Error generating bracket:', error);
      toast.error('Lỗi tạo bảng đấu: ' + (error as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  const simulateResults = async () => {
    try {
      const { data, error } = await supabase.functions.invoke(
        'tournament-automation',
        {
          body: {
            action: 'simulate_results',
            tournament_id: tournamentId,
          },
        }
      );

      if (error) throw error;

      if (data?.success) {
        toast.success('Đã mô phỏng kết quả thành công');
        await loadBracket();
      } else {
        throw new Error(data?.error || 'Simulation failed');
      }
    } catch (error) {
      console.error('Error simulating results:', error);
      toast.error('Lỗi mô phỏng kết quả');
    }
  };

  const handleEditScore = async (
    matchId: string,
    newPlayer1Score: number,
    newPlayer2Score: number,
    editorId: string
  ) => {
    try {
      await editScore({
        matchId,
        newPlayer1Score,
        newPlayer2Score,
        editorId,
      });
      await loadBracket(); // Reload the bracket after edit
      setEditingMatch(null);
    } catch (error) {
      console.error('Error editing score:', error);
    }
  };

  const openEditModal = (match: any) => {
    // Convert MatchData to TournamentMatch format
    const tournamentMatch: TournamentMatch = {
      id: match.id,
      tournament_id: tournamentId,
      round_number: match.round_number,
      match_number: match.match_number,
      player1_id: match.player1_id,
      player2_id: match.player2_id,
      winner_id: match.winner_id,
      player1_score: match.score_player1 || 0,
      player2_score: match.score_player2 || 0,
      status: match.status,
      scheduled_time: match.scheduled_time,
      started_at: match.started_at,
      completed_at: match.completed_at,
      referee_id: match.referee_id,
      notes: match.notes,
      is_third_place_match: match.is_third_place_match || false,
      player1: match.player1
        ? {
            user_id: match.player1_id!,
            full_name: match.player1.full_name,
            display_name: match.player1.display_name || match.player1.full_name,
          }
        : undefined,
      player2: match.player2
        ? {
            user_id: match.player2_id!,
            full_name: match.player2.full_name,
            display_name: match.player2.display_name || match.player2.full_name,
          }
        : undefined,
    };
    setEditingMatch(tournamentMatch);
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <div className='animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full'></div>
        <span className='ml-2'>Đang tải bảng đấu...</span>
      </div>
    );
  }

  if (!bracket) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Trophy className='h-5 w-5' />
            Chưa có bảng đấu
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <p className='text-muted-foreground'>
            Bảng đấu chưa được tạo cho giải đấu này.
          </p>
          <Button
            onClick={generateBracket}
            disabled={generating}
            className='w-full'
          >
            {generating ? (
              <div className='flex items-center gap-2'>
                <div className='animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full'></div>
                Đang tạo bảng đấu...
              </div>
            ) : (
              <div className='flex items-center gap-2'>
                <Trophy className='h-4 w-4' />
                Tạo bảng đấu
              </div>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // If this is a double elimination tournament, use the enhanced double elimination viewer
  if (tournamentType === 'double_elimination') {
    return (
      <div className='space-y-6'>
        {/* Tournament Info */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Trophy className='h-5 w-5' />
              Double Elimination Tournament - Admin View
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
              <div className='flex items-center gap-2'>
                <Users className='h-4 w-4 text-blue-500' />
                <span>Total Matches: 27</span>
              </div>
              <div className='flex items-center gap-2'>
                <PlayCircle className='h-4 w-4 text-green-500' />
                <span>Enhanced Double Elimination System</span>
              </div>
              <div>
                <Badge
                  variant={
                    bracket.status === 'generated' ? 'default' : 'secondary'
                  }
                >
                  {bracket.status === 'generated' ? 'Đã tạo' : bracket.status}
                </Badge>
              </div>
              <div>
                Participants: {bracket.bracket_data?.total_participants || 0}
              </div>
            </div>

            {/* Admin Controls */}
            <div className='flex gap-2 mt-4 pt-4 border-t'>
              <Button onClick={generateBracket} disabled={generating} size='sm'>
                {generating ? 'Generating...' : 'Generate Bracket'}
              </Button>
              <Button onClick={simulateResults} variant='outline' size='sm'>
                Simulate Results
              </Button>
              <Button
                onClick={autoAssignTables}
                disabled={autoAssigning}
                variant='outline'
                size='sm'
              >
                {autoAssigning ? 'Assigning...' : 'Auto Assign Tables'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced SABO Double Elimination Bracket Viewer */}
        <SABODoubleEliminationViewer
          tournamentId={tournamentId}
          adminMode={true}
        />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Bracket Header */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Trophy className='h-5 w-5' />
            Bảng đấu {bracket.bracket_type}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
            <div className='flex items-center gap-2'>
              <Users className='h-4 w-4 text-blue-500' />
              <span>Số vòng: {bracket.total_rounds}</span>
            </div>
            <div className='flex items-center gap-2'>
              <PlayCircle className='h-4 w-4 text-green-500' />
              <span>Vòng hiện tại: {bracket.current_round}</span>
            </div>
            <div>
              <Badge
                variant={
                  bracket.status === 'generated' ? 'default' : 'secondary'
                }
              >
                {bracket.status === 'generated' ? 'Đã tạo' : bracket.status}
              </Badge>
            </div>
            <div>
              Người chơi: {bracket.bracket_data?.total_participants || 0}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bracket Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Sơ đồ bảng đấu</CardTitle>
        </CardHeader>
        <CardContent>
          <TournamentBracket tournamentId={tournamentId} adminMode={true} />
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            ⚡ Thao tác nhanh
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex flex-wrap gap-3'>
            <Button onClick={loadBracket} variant='outline' size='sm'>
              <RefreshCw className='w-4 h-4 mr-2' />
              Refresh
            </Button>
            <Button
              onClick={autoAssignTables}
              disabled={autoAssigning}
              variant='outline'
              size='sm'
              className='bg-blue-50 hover:bg-blue-100 text-blue-700'
            >
              {autoAssigning ? (
                <div className='flex items-center gap-2'>
                  <div className='animate-spin h-3 w-3 border border-blue-500 border-t-transparent rounded-full'></div>
                  Đang phân bàn...
                </div>
              ) : (
                <>
                  <Table className='w-4 h-4 mr-2' />
                  Phân bàn tự động
                </>
              )}
            </Button>
            <Button
              onClick={simulateResults}
              variant='outline'
              size='sm'
              className='bg-green-50 hover:bg-green-100 text-green-700'
            >
              🎲 Random kết quả (Test)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Edit Score Modal */}
      {editingMatch && user && (
        <EditScoreModal
          isOpen={!!editingMatch}
          onClose={() => setEditingMatch(null)}
          match={editingMatch}
          onEditScore={handleEditScore}
          editorId={user.id}
          isLoading={isEditingScore}
        />
      )}
    </div>
  );
};
