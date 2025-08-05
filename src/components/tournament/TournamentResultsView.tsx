import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Trophy, Medal, Crown, Loader2, Calculator } from 'lucide-react';

interface TournamentResult {
  id: string;
  user_id: string;
  final_position: number;
  matches_played: number;
  matches_won: number;
  matches_lost: number;
  spa_points_earned: number;
  elo_points_earned: number;
  prize_amount: number;
  profile: {
    full_name: string;
    display_name?: string;
  };
}

interface TournamentResultsViewProps {
  tournamentId: string;
  tournamentStatus: string;
  isOwner?: boolean;
}

export function TournamentResultsView({
  tournamentId,
  tournamentStatus,
  isOwner = false,
}: TournamentResultsViewProps) {
  const [results, setResults] = useState<TournamentResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    fetchResults();
  }, [tournamentId]);

  const fetchResults = async () => {
    try {
      const { data, error } = await supabase
        .from('tournament_results')
        .select(
          `
          *,
          profile:profiles!tournament_results_user_id_fkey(
            full_name,
            display_name
          )
        `
        )
        .eq('tournament_id', tournamentId)
        .order('final_position');

      if (error) throw error;
      setResults((data as any[]) || []);
    } catch (error) {
      console.error('Error fetching results:', error);
      toast.error('Không thể tải kết quả giải đấu');
    } finally {
      setLoading(false);
    }
  };

  const calculateResults = async () => {
    setCalculating(true);
    try {
      console.log(
        '🧮 Starting tournament results calculation for:',
        tournamentId
      );

      // Sử dụng database function thay vì edge function
      const { data, error } = await supabase.rpc(
        'complete_tournament_automatically',
        {
          p_tournament_id: tournamentId,
        }
      );

      if (error) throw error;

      console.log('✅ Tournament results calculated:', data);

      const result = data as any;
      if (result?.success) {
        toast.success('🎉 Kết quả đã được tính toán và lưu thành công!');
        await fetchResults();
      } else {
        throw new Error(result?.error || 'Không thể tính toán kết quả');
      }
    } catch (error: any) {
      console.error('❌ Error calculating results:', error);
      toast.error(error.message || 'Không thể tính toán kết quả');
    } finally {
      setCalculating(false);
    }
  };

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className='h-5 w-5 text-yellow-500' />;
      case 2:
        return <Medal className='h-5 w-5 text-gray-400' />;
      case 3:
        return <Medal className='h-5 w-5 text-amber-600' />;
      default:
        return <Trophy className='h-4 w-4 text-muted-foreground' />;
    }
  };

  const getPositionText = (position: number) => {
    switch (position) {
      case 1:
        return 'Vô địch';
      case 2:
        return 'Á quân';
      case 3:
        return 'Hạng 3';
      default:
        return `Hạng ${position}`;
    }
  };

  const formatPrizeMoney = (amount: number) => {
    if (amount === 0) return '-';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <Loader2 className='h-6 w-6 animate-spin mr-2' />
        <span>Đang tải kết quả...</span>
      </div>
    );
  }

  if (results.length === 0 && tournamentStatus !== 'completed') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Trophy className='h-5 w-5' />
            Kết quả giải đấu
          </CardTitle>
        </CardHeader>
        <CardContent className='text-center py-8'>
          <Trophy className='h-12 w-12 mx-auto mb-4 text-muted-foreground' />
          <p className='text-muted-foreground mb-4'>
            Kết quả sẽ hiển thị khi giải đấu hoàn thành
          </p>
          {isOwner && tournamentStatus === 'in_progress' && (
            <Button
              onClick={calculateResults}
              disabled={calculating}
              variant='outline'
            >
              {calculating ? (
                <>
                  <Loader2 className='h-4 w-4 animate-spin mr-2' />
                  Đang tính toán...
                </>
              ) : (
                <>
                  <Calculator className='h-4 w-4 mr-2' />
                  Tính toán kết quả
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (results.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Trophy className='h-5 w-5' />
            Kết quả giải đấu
          </CardTitle>
        </CardHeader>
        <CardContent className='text-center py-8'>
          <Trophy className='h-12 w-12 mx-auto mb-4 text-muted-foreground' />
          <p className='text-muted-foreground mb-4'>
            Chưa có kết quả cho giải đấu này
          </p>
          {isOwner && (
            <Button onClick={calculateResults} disabled={calculating}>
              {calculating ? (
                <>
                  <Loader2 className='h-4 w-4 animate-spin mr-2' />
                  Đang tính toán...
                </>
              ) : (
                <>
                  <Calculator className='h-4 w-4 mr-2' />
                  Tính toán kết quả
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Trophy className='h-5 w-5' />
          Kết quả giải đấu
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {results.map((result, index) => (
            <div
              key={result.id}
              className={`flex items-center justify-between p-4 rounded-lg border ${
                result.final_position <= 3
                  ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200'
                  : 'bg-card'
              }`}
            >
              <div className='flex items-center gap-4'>
                <div className='flex items-center gap-2'>
                  {getPositionIcon(result.final_position)}
                  <div className='text-lg font-bold'>
                    #{result.final_position}
                  </div>
                </div>

                <div>
                  <h3 className='font-semibold'>
                    {result.profile?.display_name || result.profile?.full_name}
                  </h3>
                  <p className='text-sm text-muted-foreground'>
                    {getPositionText(result.final_position)}
                  </p>
                </div>
              </div>

              <div className='text-right space-y-1'>
                <div className='flex gap-4 text-sm'>
                  <div>
                    <span className='text-muted-foreground'>Trận: </span>
                    <span className='font-medium'>{result.matches_played}</span>
                  </div>
                  <div>
                    <span className='text-muted-foreground'>T/B: </span>
                    <span className='font-medium text-green-600'>
                      {result.matches_won}
                    </span>
                    /
                    <span className='font-medium text-red-600'>
                      {result.matches_lost}
                    </span>
                  </div>
                </div>

                <div className='flex gap-4 text-sm'>
                  <div>
                    <span className='text-muted-foreground'>SPA: </span>
                    <Badge variant='secondary'>
                      +{result.spa_points_earned}
                    </Badge>
                  </div>
                  <div>
                    <span className='text-muted-foreground'>ELO: </span>
                    <Badge variant='outline'>+{result.elo_points_earned}</Badge>
                  </div>
                </div>

                {result.prize_amount > 0 && (
                  <div className='text-sm'>
                    <span className='text-muted-foreground'>Tiền thưởng: </span>
                    <span className='font-bold text-green-600'>
                      {formatPrizeMoney(result.prize_amount)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {isOwner && results.length > 0 && (
          <div className='mt-6 pt-4 border-t'>
            <Button
              onClick={calculateResults}
              disabled={calculating}
              variant='outline'
              size='sm'
            >
              {calculating ? (
                <>
                  <Loader2 className='h-4 w-4 animate-spin mr-2' />
                  Đang tính lại...
                </>
              ) : (
                <>
                  <Calculator className='h-4 w-4 mr-2' />
                  Tính lại kết quả
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
