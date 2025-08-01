import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertCircle, Trophy, Clock, User, Edit3, Save, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Match {
  id: string;
  round_number: number;
  match_number: number;
  player1_id: string | null;
  player2_id: string | null;
  winner_id: string | null;
  status: string;
  score_player1?: number;
  score_player2?: number;
  scheduled_time?: string;
  player1?: { full_name: string; display_name?: string };
  player2?: { full_name: string; display_name?: string };
}

interface MatchManagementProps {
  tournamentId: string;
  canEdit?: boolean;
}

export const MatchManagement: React.FC<MatchManagementProps> = ({
  tournamentId,
  canEdit = false,
}) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [scorePlayer1, setScorePlayer1] = useState(0);
  const [scorePlayer2, setScorePlayer2] = useState(0);
  const [updating, setUpdating] = useState(false);

  const fetchMatches = async () => {
    try {
      const { data, error } = await supabase
        .from('tournament_matches')
        .select(
          `
          *,
          player1:profiles!tournament_matches_player1_id_fkey(full_name, display_name),
          player2:profiles!tournament_matches_player2_id_fkey(full_name, display_name)
        `
        )
        .eq('tournament_id', tournamentId)
        .order('round_number')
        .order('match_number');

      if (error) throw error;
      setMatches((data as any[]) || []);
    } catch (error) {
      console.error('Error fetching matches:', error);
      toast.error('Lỗi khi tải danh sách trận đấu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [tournamentId]);

  const handleEditMatch = (match: Match) => {
    setEditingMatch(match);
    setScorePlayer1(match.score_player1 || 0);
    setScorePlayer2(match.score_player2 || 0);
  };

  const handleUpdateMatch = async () => {
    if (!editingMatch) return;

    setUpdating(true);
    try {
      const winnerId =
        scorePlayer1 > scorePlayer2
          ? editingMatch.player1_id
          : editingMatch.player2_id;

      console.log(
        '🏆 [MatchManagement] Updating match with auto-advancement:',
        {
          matchId: editingMatch.id,
          scorePlayer1,
          scorePlayer2,
          winnerId,
          tournament: tournamentId,
        }
      );

      // Update match with scores and winner - this will trigger the database automation
      const { error } = await supabase
        .from('tournament_matches')
        .update({
          score_player1: scorePlayer1,
          score_player2: scorePlayer2,
          winner_id: winnerId,
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingMatch.id);

      if (error) throw error;

      // The database trigger will automatically advance the winner
      console.log(
        '✅ [MatchManagement] Match updated successfully, auto-advancement triggered by database'
      );

      toast.success(
        '🎯 Kết quả đã được cập nhật! Người thắng sẽ tự động chuyển sang vòng tiếp theo.'
      );
      setEditingMatch(null);

      // Refresh matches to show the advancement
      setTimeout(() => {
        fetchMatches();
      }, 1000); // Small delay to allow database triggers to complete
    } catch (error) {
      console.error('Error updating match:', error);
      toast.error('Lỗi khi cập nhật kết quả trận đấu');
    } finally {
      setUpdating(false);
    }
  };

  const getMatchStatus = (match: Match) => {
    if (match.status === 'completed') {
      return <Badge className='bg-green-600'>Hoàn thành</Badge>;
    } else if (match.status === 'ongoing') {
      return <Badge className='bg-blue-600'>Đang diễn ra</Badge>;
    } else if (!match.player1_id || !match.player2_id) {
      return <Badge variant='secondary'>Chờ thí sinh</Badge>;
    } else {
      return <Badge variant='outline'>Chưa bắt đầu</Badge>;
    }
  };

  const getPlayerName = (player: any) => {
    if (!player) return 'TBD';
    return player.display_name || player.full_name || 'Unknown Player';
  };

  const groupedMatches = matches.reduce(
    (acc, match) => {
      if (!acc[match.round_number]) {
        acc[match.round_number] = [];
      }
      acc[match.round_number].push(match);
      return acc;
    },
    {} as Record<number, Match[]>
  );

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Trophy className='h-5 w-5 text-primary' />
              Quản Lý Trận Đấu
            </div>
            {canEdit && <Badge variant='outline'>Chế độ chỉnh sửa</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-3 gap-4 text-sm'>
            <div className='text-center'>
              <div className='text-2xl font-bold text-primary'>
                {matches.length}
              </div>
              <div className='text-muted-foreground'>Tổng số trận</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-green-600'>
                {matches.filter(m => m.status === 'completed').length}
              </div>
              <div className='text-muted-foreground'>Đã hoàn thành</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-blue-600'>
                {
                  matches.filter(
                    m => m.status === 'pending' && m.player1_id && m.player2_id
                  ).length
                }
              </div>
              <div className='text-muted-foreground'>Chờ đấu</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Matches by Round */}
      <div className='space-y-6'>
        {Object.entries(groupedMatches).map(([round, roundMatches]) => (
          <Card key={round}>
            <CardHeader>
              <CardTitle className='text-lg'>
                Vòng {round} ({roundMatches.length} trận)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {roundMatches.map(match => (
                  <Card key={match.id} className='border-l-4 border-l-primary'>
                    <CardContent className='pt-4'>
                      <div className='flex items-center justify-between mb-3'>
                        <div className='flex items-center gap-2'>
                          <span className='text-sm font-medium'>
                            Trận {match.match_number}
                          </span>
                          {getMatchStatus(match)}
                        </div>
                        {canEdit && match.player1_id && match.player2_id && (
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() => handleEditMatch(match)}
                          >
                            <Edit3 className='h-4 w-4 mr-1' />
                            Nhập kết quả
                          </Button>
                        )}
                      </div>

                      <div className='grid grid-cols-2 gap-4'>
                        {/* Player 1 */}
                        <div
                          className={`p-3 rounded-lg border ${
                            match.winner_id === match.player1_id
                              ? 'bg-green-50 border-green-200'
                              : 'bg-muted/50'
                          }`}
                        >
                          <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-2'>
                              <User className='h-4 w-4 text-muted-foreground' />
                              <span className='font-medium'>
                                {getPlayerName(match.player1)}
                              </span>
                            </div>
                            {match.status === 'completed' && (
                              <span className='text-lg font-bold'>
                                {match.score_player1 || 0}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Player 2 */}
                        <div
                          className={`p-3 rounded-lg border ${
                            match.winner_id === match.player2_id
                              ? 'bg-green-50 border-green-200'
                              : 'bg-muted/50'
                          }`}
                        >
                          <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-2'>
                              <User className='h-4 w-4 text-muted-foreground' />
                              <span className='font-medium'>
                                {getPlayerName(match.player2)}
                              </span>
                            </div>
                            {match.status === 'completed' && (
                              <span className='text-lg font-bold'>
                                {match.score_player2 || 0}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {match.scheduled_time && (
                        <div className='mt-3 flex items-center gap-2 text-sm text-muted-foreground'>
                          <Clock className='h-4 w-4' />
                          <span>
                            Lịch đấu:{' '}
                            {new Date(match.scheduled_time).toLocaleString(
                              'vi-VN'
                            )}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {matches.length === 0 && (
        <Card>
          <CardContent className='pt-6 text-center text-muted-foreground'>
            <Trophy className='h-12 w-12 mx-auto mb-4 opacity-50' />
            <p>Chưa có trận đấu nào được tạo</p>
          </CardContent>
        </Card>
      )}

      {/* Edit Match Dialog */}
      <Dialog
        open={!!editingMatch}
        onOpenChange={open => !open && setEditingMatch(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nhập Kết Quả Trận Đấu</DialogTitle>
          </DialogHeader>
          {editingMatch && (
            <div className='space-y-4'>
              <div className='text-center text-sm text-muted-foreground'>
                Vòng {editingMatch.round_number} - Trận{' '}
                {editingMatch.match_number}
              </div>

              <Separator />

              <div className='space-y-4'>
                {/* Player 1 Score */}
                <div className='flex items-center justify-between'>
                  <span className='font-medium'>
                    {getPlayerName(editingMatch.player1)}
                  </span>
                  <Input
                    type='number'
                    min='0'
                    value={scorePlayer1}
                    onChange={e =>
                      setScorePlayer1(parseInt(e.target.value) || 0)
                    }
                    className='w-20 text-center'
                  />
                </div>

                {/* Player 2 Score */}
                <div className='flex items-center justify-between'>
                  <span className='font-medium'>
                    {getPlayerName(editingMatch.player2)}
                  </span>
                  <Input
                    type='number'
                    min='0'
                    value={scorePlayer2}
                    onChange={e =>
                      setScorePlayer2(parseInt(e.target.value) || 0)
                    }
                    className='w-20 text-center'
                  />
                </div>
              </div>

              <Separator />

              <div className='flex justify-end gap-2'>
                <Button
                  variant='outline'
                  onClick={() => setEditingMatch(null)}
                  disabled={updating}
                >
                  <X className='h-4 w-4 mr-2' />
                  Hủy
                </Button>
                <Button onClick={handleUpdateMatch} disabled={updating}>
                  {updating ? (
                    <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2' />
                  ) : (
                    <Save className='h-4 w-4 mr-2' />
                  )}
                  Lưu kết quả
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
