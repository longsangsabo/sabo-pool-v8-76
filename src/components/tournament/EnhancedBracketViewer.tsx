import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Trophy,
  Users,
  Calendar,
  Play,
  Clock,
  Crown,
  Medal,
  Award,
  Zap,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useBracketGeneration } from '@/hooks/useBracketGeneration';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface MatchData {
  id: string;
  round_number: number;
  match_number: number;
  player1_id?: string;
  player2_id?: string;
  winner_id?: string;
  player1_score: number;
  player2_score: number;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  scheduled_time?: string;
  player1?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  player2?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

interface BracketData {
  tournament_type: string;
  bracket_size: number;
  participant_count: number;
  rounds: number;
  participants: any[];
  matches: any[];
  generated_at: string;
  seeding_method: string;
}

interface EnhancedBracketViewerProps {
  tournamentId: string;
  canManage?: boolean;
  showGenerator?: boolean;
}

export const EnhancedBracketViewer: React.FC<EnhancedBracketViewerProps> = ({
  tournamentId,
  canManage = false,
  showGenerator = true,
}) => {
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [bracketData, setBracketData] = useState<BracketData | null>(null);
  const [seeding, setSeeding] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRound, setSelectedRound] = useState(1);

  const { fetchBracketData, fetchSeeding } = useBracketGeneration();

  useEffect(() => {
    loadBracketData();
  }, [tournamentId]);

  const loadBracketData = async () => {
    try {
      setLoading(true);

      // Load bracket metadata
      const bracket = await fetchBracketData(tournamentId);
      if (bracket?.bracket_data) {
        setBracketData(bracket.bracket_data as any as BracketData);
      }

      // Load seeding data
      const seedingData = await fetchSeeding(tournamentId);
      setSeeding(seedingData);

      // Load matches
      const { data: matchesData, error } = await supabase
        .from('tournament_matches')
        .select(
          `
          id,
          round_number,
          match_number,
          player1_id,
          player2_id,
          winner_id,
          score_player1,
          score_player2,
          status,
          scheduled_time,
          player1:player1_id(full_name, avatar_url),
          player2:player2_id(full_name, avatar_url)
        `
        )
        .eq('tournament_id', tournamentId)
        .order('round_number')
        .order('match_number');

      if (error) throw error;

      // Transform data to match interface
      const transformedMatches = (matchesData || []).map((match: any) => ({
        id: match.id,
        round_number: match.round_number,
        match_number: match.match_number,
        player1_id: match.player1_id,
        player2_id: match.player2_id,
        winner_id: match.winner_id,
        player1_score: match.score_player1 || 0,
        player2_score: match.score_player2 || 0,
        status: match.status as
          | 'scheduled'
          | 'ongoing'
          | 'completed'
          | 'cancelled',
        scheduled_time: match.scheduled_time,
        player1: match.player1
          ? {
              id: match.player1.id || match.player1_id,
              full_name: match.player1.full_name || 'Unknown',
              avatar_url: match.player1.avatar_url,
            }
          : undefined,
        player2: match.player2
          ? {
              id: match.player2.id || match.player2_id,
              full_name: match.player2.full_name || 'Unknown',
              avatar_url: match.player2.avatar_url,
            }
          : undefined,
      }));

      setMatches(transformedMatches);
    } catch (error) {
      console.error('Error loading bracket:', error);
      toast.error('Không thể tải dữ liệu bảng đấu');
    } finally {
      setLoading(false);
    }
  };

  const getMatchStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'ongoing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'scheduled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoundName = (round: number, totalRounds: number) => {
    const remainingRounds = totalRounds - round;

    if (remainingRounds === 0) return 'Chung kết';
    if (remainingRounds === 1) return 'Bán kết';
    if (remainingRounds === 2) return 'Tứ kết';
    return `Vòng ${round}`;
  };

  const renderMatch = (match: MatchData) => {
    const isPlayer1Winner = match.winner_id === match.player1_id;
    const isPlayer2Winner = match.winner_id === match.player2_id;
    const isCompleted = match.status === 'completed';

    return (
      <Card
        key={match.id}
        className='w-full max-w-sm mb-4 hover:shadow-md transition-shadow'
      >
        <CardHeader className='pb-2'>
          <div className='flex items-center justify-between'>
            <span className='text-sm font-medium'>
              Trận {match.match_number}
            </span>
            <Badge className={getMatchStatusColor(match.status)}>
              {match.status === 'completed' && '✓ Hoàn thành'}
              {match.status === 'ongoing' && '▶️ Đang đấu'}
              {match.status === 'scheduled' && '⏱️ Đã lên lịch'}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className='space-y-3'>
          {/* Player 1 */}
          <div
            className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-colors ${
              isCompleted && isPlayer1Winner
                ? 'bg-green-50 border-green-200'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <Avatar className='h-8 w-8'>
              <AvatarImage src={match.player1?.avatar_url} />
              <AvatarFallback>
                {match.player1?.full_name?.[0] || 'P1'}
              </AvatarFallback>
            </Avatar>
            <div className='flex-1 min-w-0'>
              <p className='font-medium text-sm truncate'>
                {match.player1?.full_name || 'TBD'}
              </p>
            </div>
            <div className='flex items-center gap-2'>
              {isCompleted && isPlayer1Winner && (
                <Crown className='h-4 w-4 text-yellow-500' />
              )}
              <div className='text-lg font-bold'>{match.player1_score}</div>
            </div>
          </div>

          {/* VS Divider */}
          <div className='text-center'>
            <span className='text-xs font-medium text-muted-foreground bg-background px-2'>
              VS
            </span>
          </div>

          {/* Player 2 */}
          <div
            className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-colors ${
              isCompleted && isPlayer2Winner
                ? 'bg-green-50 border-green-200'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <Avatar className='h-8 w-8'>
              <AvatarImage src={match.player2?.avatar_url} />
              <AvatarFallback>
                {match.player2?.full_name?.[0] || 'P2'}
              </AvatarFallback>
            </Avatar>
            <div className='flex-1 min-w-0'>
              <p className='font-medium text-sm truncate'>
                {match.player2?.full_name || 'TBD'}
              </p>
            </div>
            <div className='flex items-center gap-2'>
              {isCompleted && isPlayer2Winner && (
                <Crown className='h-4 w-4 text-yellow-500' />
              )}
              <div className='text-lg font-bold'>{match.player2_score}</div>
            </div>
          </div>

          {/* Match Info */}
          {match.scheduled_time && (
            <div className='flex items-center gap-1 text-xs text-muted-foreground pt-2 border-t'>
              <Clock className='h-3 w-3' />
              {new Date(match.scheduled_time).toLocaleString('vi-VN')}
            </div>
          )}

          {/* Actions */}
          {canManage && match.status === 'scheduled' && (
            <Button size='sm' className='w-full mt-2'>
              <Play className='h-3 w-3 mr-1' />
              Bắt đầu trận đấu
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderSeeding = () => (
    <div className='space-y-4'>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {seeding.map((seed, index) => (
          <Card key={seed.id} className={seed.is_bye ? 'opacity-60' : ''}>
            <CardContent className='p-4'>
              <div className='flex items-center gap-3'>
                <div className='flex-shrink-0'>
                  <Badge
                    variant={index < 4 ? 'default' : 'secondary'}
                    className='w-8 h-8 rounded-full flex items-center justify-center'
                  >
                    {seed.seed_position}
                  </Badge>
                </div>

                {!seed.is_bye ? (
                  <>
                    <Avatar className='h-10 w-10'>
                      <AvatarImage src={seed.player?.avatar_url} />
                      <AvatarFallback>
                        {seed.player?.full_name?.[0] ||
                          seed.player?.display_name?.[0] ||
                          '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className='flex-1 min-w-0'>
                      <p className='font-medium truncate'>
                        {seed.player?.full_name ||
                          seed.player?.display_name ||
                          'Unknown Player'}
                      </p>
                      <div className='flex items-center gap-2 mt-1'>
                        <Badge variant='outline' className='text-xs'>
                          ELO: {seed.elo_rating}
                        </Badge>
                        {index === 0 && (
                          <Crown className='h-3 w-3 text-yellow-500' />
                        )}
                        {index === 1 && (
                          <Medal className='h-3 w-3 text-gray-400' />
                        )}
                        {index === 2 && (
                          <Award className='h-3 w-3 text-amber-600' />
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className='flex-1'>
                    <p className='text-muted-foreground font-medium'>BYE</p>
                    <p className='text-xs text-muted-foreground'>
                      Tự động vào vòng sau
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <LoadingSpinner />
        <span className='ml-2'>Đang tải bảng đấu...</span>
      </div>
    );
  }

  if (!bracketData && matches.length === 0) {
    return (
      <Card>
        <CardContent className='py-12 text-center'>
          <Trophy className='h-12 w-12 mx-auto text-muted-foreground mb-4' />
          <h3 className='text-lg font-semibold mb-2'>Chưa có bảng đấu</h3>
          <p className='text-muted-foreground mb-4'>
            Bảng đấu chưa được tạo cho giải đấu này.
          </p>
          {showGenerator && canManage && (
            <div className='max-w-md mx-auto'>
              {/* BracketGenerator would be imported and used here */}
              <Button onClick={loadBracketData}>
                <Zap className='h-4 w-4 mr-2' />
                Tạo bảng đấu
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Group matches by round
  const matchesByRound = matches.reduce(
    (acc, match) => {
      if (!acc[match.round_number]) {
        acc[match.round_number] = [];
      }
      acc[match.round_number].push(match);
      return acc;
    },
    {} as Record<number, MatchData[]>
  );

  const rounds = Object.keys(matchesByRound)
    .map(Number)
    .sort((a, b) => a - b);
  const maxRounds = Math.max(...rounds);

  return (
    <div className='space-y-6'>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Trophy className='h-5 w-5' />
            Bảng Đấu Nâng Cao
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bracketData && (
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-4'>
              <div className='text-center'>
                <div className='text-2xl font-bold text-primary'>
                  {bracketData.participant_count}
                </div>
                <div className='text-sm text-muted-foreground'>
                  Người tham gia
                </div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-blue-600'>
                  {bracketData.bracket_size}
                </div>
                <div className='text-sm text-muted-foreground'>
                  Kích thước bracket
                </div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-green-600'>
                  {bracketData.rounds}
                </div>
                <div className='text-sm text-muted-foreground'>Số vòng</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-purple-600'>
                  {matches.length}
                </div>
                <div className='text-sm text-muted-foreground'>Tổng trận</div>
              </div>
            </div>
          )}

          <div className='flex items-center gap-4 text-sm text-muted-foreground'>
            <div className='flex items-center gap-1'>
              <Users className='h-4 w-4' />
              Phương thức:{' '}
              {bracketData?.seeding_method === 'elo_ranking'
                ? 'ELO Ranking'
                : bracketData?.seeding_method === 'registration_order'
                  ? 'Thứ tự đăng ký'
                  : 'Ngẫu nhiên'}
            </div>
            {bracketData && (
              <div className='flex items-center gap-1'>
                <Calendar className='h-4 w-4' />
                Tạo lúc:{' '}
                {new Date(bracketData.generated_at).toLocaleDateString('vi-VN')}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different views */}
      <Tabs defaultValue='matches' className='w-full'>
        <TabsList className='grid w-full grid-cols-2'>
          <TabsTrigger value='matches'>Trận đấu</TabsTrigger>
          <TabsTrigger value='seeding'>Xếp hạng</TabsTrigger>
        </TabsList>

        <TabsContent value='matches' className='space-y-4'>
          {rounds.length > 0 && (
            <div className='flex gap-2 overflow-x-auto pb-2'>
              {rounds.map(round => (
                <Button
                  key={round}
                  variant={selectedRound === round ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => setSelectedRound(round)}
                  className='whitespace-nowrap'
                >
                  {getRoundName(round, maxRounds)}
                  <Badge variant='secondary' className='ml-2'>
                    {matchesByRound[round]?.length || 0}
                  </Badge>
                </Button>
              ))}
            </div>
          )}

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {matchesByRound[selectedRound]?.map(match => renderMatch(match))}
          </div>

          {(!matchesByRound[selectedRound] ||
            matchesByRound[selectedRound].length === 0) && (
            <div className='text-center py-8 text-muted-foreground'>
              Không có trận đấu nào trong vòng này
            </div>
          )}
        </TabsContent>

        <TabsContent value='seeding' className='space-y-4'>
          {seeding.length > 0 ? (
            renderSeeding()
          ) : (
            <div className='text-center py-8 text-muted-foreground'>
              Chưa có dữ liệu xếp hạng
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
