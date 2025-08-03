import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Users, Trophy, Play, CheckCircle } from 'lucide-react';

interface TournamentMatch {
  id: string;
  tournament_id: string;
  round_number: number;
  match_number: number;
  bracket_type: string;
  player1_id?: string;
  player2_id?: string;
  score_player1?: number;
  score_player2?: number;
  winner_id?: string;
  status: string;
  scheduled_time?: string;
  player1_profile?: { full_name: string };
  player2_profile?: { full_name: string };
}

interface TournamentBracketViewProps {
  tournamentId: string;
  isOwner?: boolean;
}

export function TournamentBracketView({
  tournamentId,
  isOwner = false,
}: TournamentBracketViewProps) {
  const [matches, setMatches] = useState<TournamentMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingBracket, setGeneratingBracket] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<TournamentMatch | null>(
    null
  );
  const [scorePlayer1, setScorePlayer1] = useState('');
  const [scorePlayer2, setScorePlayer2] = useState('');
  const [savingResult, setSavingResult] = useState(false);

  useEffect(() => {
    fetchMatches();
  }, [tournamentId]);

  const fetchMatches = async () => {
    try {
      const { data, error } = await supabase
        .from('tournament_matches')
        .select(
          `
          *,
          player1_profile:profiles!tournament_matches_player1_id_fkey(full_name),
          player2_profile:profiles!tournament_matches_player2_id_fkey(full_name)
        `
        )
        .eq('tournament_id', tournamentId)
        .order('round_number')
        .order('match_number');

      if (error) throw error;
      setMatches((data as any[]) || []);
    } catch (error) {
      console.error('Error fetching matches:', error);
      toast.error('Không thể tải thông tin bracket');
    } finally {
      setLoading(false);
    }
  };

  const generateBracket = async () => {
    setGeneratingBracket(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        'generate-tournament-bracket',
        {
          body: { tournament_id: tournamentId },
        }
      );

      if (error) throw error;

      toast.success('Bracket đã được tạo thành công!');
      await fetchMatches();
    } catch (error: any) {
      console.error('Error generating bracket:', error);
      toast.error(error.message || 'Không thể tạo bracket');
    } finally {
      setGeneratingBracket(false);
    }
  };

  const saveMatchResult = async () => {
    if (!selectedMatch || !scorePlayer1 || !scorePlayer2) {
      toast.error('Vui lòng nhập đầy đủ tỷ số');
      return;
    }

    const score1 = parseInt(scorePlayer1);
    const score2 = parseInt(scorePlayer2);

    if (score1 === score2) {
      toast.error('Tỷ số không thể hòa');
      return;
    }

    setSavingResult(true);
    try {
      const winnerId =
        score1 > score2 ? selectedMatch.player1_id : selectedMatch.player2_id;

      const { error } = await supabase
        .from('tournament_matches')
        .update({
          score_player1: score1,
          score_player2: score2,
          winner_id: winnerId,
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedMatch.id);

      if (error) throw error;

      toast.success('Kết quả đã được lưu!');
      setSelectedMatch(null);
      setScorePlayer1('');
      setScorePlayer2('');
      await fetchMatches();
    } catch (error) {
      console.error('Error saving match result:', error);
      toast.error('Không thể lưu kết quả');
    } finally {
      setSavingResult(false);
    }
  };

  const getMatchStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant='secondary'>Đã lên lịch</Badge>;
      case 'in_progress':
        return <Badge variant='default'>Đang diễn ra</Badge>;
      case 'completed':
        return (
          <Badge
            variant='outline'
            className='bg-green-50 text-green-700 border-green-200'
          >
            Hoàn thành
          </Badge>
        );
      case 'pending':
        return <Badge variant='outline'>Chờ</Badge>;
      default:
        return <Badge variant='outline'>{status}</Badge>;
    }
  };

  const organizeMatchesByRound = () => {
    const rounds: { [key: number]: TournamentMatch[] } = {};
    matches.forEach(match => {
      if (!rounds[match.round_number]) {
        rounds[match.round_number] = [];
      }
      rounds[match.round_number].push(match);
    });
    return rounds;
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <Loader2 className='h-6 w-6 animate-spin mr-2' />
        <span>Đang tải bracket...</span>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Trophy className='h-5 w-5' />
            Tournament Bracket
          </CardTitle>
        </CardHeader>
        <CardContent className='text-center py-8'>
          <Users className='h-12 w-12 mx-auto mb-4 text-muted-foreground' />
          <p className='text-muted-foreground mb-4'>
            Bracket chưa được tạo cho giải đấu này
          </p>
          {isOwner && (
            <Button
              onClick={generateBracket}
              disabled={generatingBracket}
              className='mx-auto'
            >
              {generatingBracket ? (
                <>
                  <Loader2 className='h-4 w-4 animate-spin mr-2' />
                  Đang tạo bracket...
                </>
              ) : (
                <>
                  <Play className='h-4 w-4 mr-2' />
                  Tạo Bracket
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  const roundsData = organizeMatchesByRound();
  const roundNumbers = Object.keys(roundsData)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Trophy className='h-5 w-5' />
            Tournament Bracket
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid gap-6'>
            {roundNumbers.map(roundNumber => (
              <div key={roundNumber} className='space-y-4'>
                <h3 className='text-lg font-semibold'>
                  {roundNumber === 1
                    ? 'Vòng 1'
                    : roundNumber === roundNumbers.length
                      ? 'Chung kết'
                      : roundNumber === roundNumbers.length - 1
                        ? 'Bán kết'
                        : `Vòng ${roundNumber}`}
                </h3>
                <div className='grid gap-3 md:grid-cols-2 lg:grid-cols-3'>
                  {roundsData[roundNumber].map(match => (
                    <Card key={match.id} className='relative'>
                      <CardContent className='p-4'>
                        <div className='flex justify-between items-start mb-3'>
                          <div className='text-sm text-muted-foreground'>
                            Trận {match.match_number}
                          </div>
                          {getMatchStatusBadge(match.status)}
                        </div>

                        <div className='space-y-2'>
                          <div className='flex justify-between items-center'>
                            <span className='font-medium'>
                              {match.player1_profile?.full_name ||
                                'Chờ xác định'}
                            </span>
                            {match.status === 'completed' && (
                              <span className='text-lg font-bold'>
                                {match.score_player1}
                              </span>
                            )}
                          </div>

                          <div className='text-center text-muted-foreground text-sm'>
                            VS
                          </div>

                          <div className='flex justify-between items-center'>
                            <span className='font-medium'>
                              {match.player2_profile?.full_name ||
                                'Chờ xác định'}
                            </span>
                            {match.status === 'completed' && (
                              <span className='text-lg font-bold'>
                                {match.score_player2}
                              </span>
                            )}
                          </div>
                        </div>

                        {match.status === 'completed' && match.winner_id && (
                          <div className='mt-3 pt-3 border-t'>
                            <div className='flex items-center gap-2 text-green-700'>
                              <CheckCircle className='h-4 w-4' />
                              <span className='text-sm font-medium'>
                                Thắng:{' '}
                                {match.winner_id === match.player1_id
                                  ? match.player1_profile?.full_name
                                  : match.player2_profile?.full_name}
                              </span>
                            </div>
                          </div>
                        )}

                        {isOwner &&
                          match.status === 'scheduled' &&
                          match.player1_id &&
                          match.player2_id && (
                            <div className='mt-3 pt-3 border-t'>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    size='sm'
                                    className='w-full'
                                    onClick={() => setSelectedMatch(match)}
                                  >
                                    Nhập kết quả
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>
                                      Nhập kết quả trận đấu
                                    </DialogTitle>
                                  </DialogHeader>
                                  <div className='space-y-4'>
                                    <div className='grid grid-cols-2 gap-4'>
                                      <div>
                                        <Label>
                                          {
                                            selectedMatch?.player1_profile
                                              ?.full_name
                                          }
                                        </Label>
                                        <Input
                                          type='number'
                                          value={scorePlayer1}
                                          onChange={e =>
                                            setScorePlayer1(e.target.value)
                                          }
                                          placeholder='Tỷ số'
                                          min='0'
                                        />
                                      </div>
                                      <div>
                                        <Label>
                                          {
                                            selectedMatch?.player2_profile
                                              ?.full_name
                                          }
                                        </Label>
                                        <Input
                                          type='number'
                                          value={scorePlayer2}
                                          onChange={e =>
                                            setScorePlayer2(e.target.value)
                                          }
                                          placeholder='Tỷ số'
                                          min='0'
                                        />
                                      </div>
                                    </div>
                                    <Button
                                      onClick={saveMatchResult}
                                      disabled={savingResult}
                                      className='w-full'
                                    >
                                      {savingResult ? (
                                        <>
                                          <Loader2 className='h-4 w-4 animate-spin mr-2' />
                                          Đang lưu...
                                        </>
                                      ) : (
                                        'Lưu kết quả'
                                      )}
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
