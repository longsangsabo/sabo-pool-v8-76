import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Trophy,
  Medal,
  Star,
  TrendingUp,
  Calendar,
  Target,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface TournamentResult {
  id: string;
  tournament_id: string;
  tournament_name: string;
  final_position: number;
  matches_played: number;
  matches_won: number;
  matches_lost: number;
  spa_points_earned: number;
  elo_points_earned: number;
  prize_amount: number;
  created_at: string;
  tournament_date: string;
}

interface EloSummary {
  total_tournaments: number;
  total_elo_earned: number;
  total_spa_earned: number;
  championships: number;
  runner_ups: number;
  top_3_finishes: number;
  average_position: number;
}

export const TournamentEloHistory: React.FC = () => {
  const { user } = useAuth();
  const [tournamentResults, setTournamentResults] = useState<
    TournamentResult[]
  >([]);
  const [eloSummary, setEloSummary] = useState<EloSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchTournamentHistory();
    }
  }, [user?.id]);

  const fetchTournamentHistory = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Fetch tournament results with tournament details
      const { data: results, error: resultsError } = await supabase
        .from('tournament_results')
        .select(
          `
          id,
          tournament_id,
          final_position,
          matches_played,
          matches_won,
          matches_lost,
          spa_points_earned,
          elo_points_earned,
          prize_amount,
          created_at,
          tournaments!inner(
            id,
            name,
            start_date,
            created_at
          )
        `
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (resultsError) {
        console.error('Error fetching tournament results:', resultsError);
        return;
      }

      // Transform data
      const transformedResults: TournamentResult[] = (results || []).map(
        result => ({
          id: result.id,
          tournament_id: result.tournament_id,
          tournament_name:
            (result.tournaments as any)?.name || 'Unknown Tournament',
          final_position: result.final_position,
          matches_played: result.matches_played,
          matches_won: result.matches_won,
          matches_lost: result.matches_lost,
          spa_points_earned: result.spa_points_earned || 0,
          elo_points_earned: result.elo_points_earned || 0,
          prize_amount: result.prize_amount || 0,
          created_at: result.created_at,
          tournament_date:
            (result.tournaments as any)?.start_date ||
            (result.tournaments as any)?.created_at ||
            result.created_at,
        })
      );

      setTournamentResults(transformedResults);

      // Calculate summary
      const summary: EloSummary = {
        total_tournaments: transformedResults.length,
        total_elo_earned: transformedResults.reduce(
          (sum, r) => sum + r.elo_points_earned,
          0
        ),
        total_spa_earned: transformedResults.reduce(
          (sum, r) => sum + r.spa_points_earned,
          0
        ),
        championships: transformedResults.filter(r => r.final_position === 1)
          .length,
        runner_ups: transformedResults.filter(r => r.final_position === 2)
          .length,
        top_3_finishes: transformedResults.filter(r => r.final_position <= 3)
          .length,
        average_position:
          transformedResults.length > 0
            ? transformedResults.reduce((sum, r) => sum + r.final_position, 0) /
              transformedResults.length
            : 0,
      };

      setEloSummary(summary);
    } catch (error) {
      console.error('Error in fetchTournamentHistory:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPositionBadge = (position: number) => {
    if (position === 1) {
      return (
        <Badge className='bg-yellow-500 text-black'>
          <Trophy className='w-3 h-3 mr-1' />
          Champion
        </Badge>
      );
    } else if (position === 2) {
      return (
        <Badge className='bg-gray-400 text-black'>
          <Medal className='w-3 h-3 mr-1' />
          Runner-up
        </Badge>
      );
    } else if (position === 3) {
      return (
        <Badge className='bg-amber-600 text-white'>
          <Star className='w-3 h-3 mr-1' />
          3rd Place
        </Badge>
      );
    } else if (position <= 8) {
      return <Badge variant='secondary'>Top 8 (#{position})</Badge>;
    } else {
      return <Badge variant='outline'>#{position}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <TrendingUp className='w-5 h-5' />
            Lịch sử tham gia giải đấu & ELO
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex justify-center items-center h-32'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!eloSummary || tournamentResults.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <TrendingUp className='w-5 h-5' />
            Lịch sử tham gia giải đấu & ELO
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-center text-gray-500 py-8'>
            <Target className='w-12 h-12 mx-auto mb-4 opacity-50' />
            <p>Chưa có lịch sử tham gia giải đấu</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Summary Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <TrendingUp className='w-5 h-5' />
            Tổng quan ELO từ giải đấu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <div className='text-center'>
              <div className='text-2xl font-bold text-blue-600'>
                {eloSummary.total_elo_earned}
              </div>
              <div className='text-sm text-gray-600'>Tổng ELO kiếm được</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-green-600'>
                {eloSummary.total_spa_earned.toLocaleString()}
              </div>
              <div className='text-sm text-gray-600'>Tổng SPA kiếm được</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-yellow-600'>
                {eloSummary.championships}
              </div>
              <div className='text-sm text-gray-600'>Vô địch</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-purple-600'>
                {eloSummary.total_tournaments}
              </div>
              <div className='text-sm text-gray-600'>Giải đấu</div>
            </div>
          </div>

          <div className='mt-4 pt-4 border-t'>
            <div className='grid grid-cols-2 md:grid-cols-3 gap-4 text-sm'>
              <div className='flex justify-between'>
                <span>Á quân:</span>
                <span className='font-medium'>{eloSummary.runner_ups}</span>
              </div>
              <div className='flex justify-between'>
                <span>Top 3:</span>
                <span className='font-medium'>{eloSummary.top_3_finishes}</span>
              </div>
              <div className='flex justify-between'>
                <span>Vị trí TB:</span>
                <span className='font-medium'>
                  {eloSummary.average_position.toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tournament History */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Calendar className='w-5 h-5' />
            Lịch sử chi tiết ({tournamentResults.length} giải đấu)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {tournamentResults.map(result => (
              <div key={result.id} className='border rounded-lg p-4 space-y-3'>
                <div className='flex justify-between items-start'>
                  <div className='flex-1'>
                    <h4 className='font-medium text-lg'>
                      {result.tournament_name}
                    </h4>
                    <p className='text-sm text-gray-500'>
                      {formatDate(result.tournament_date)}
                    </p>
                  </div>
                  <div className='text-right'>
                    {getPositionBadge(result.final_position)}
                  </div>
                </div>

                <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
                  <div>
                    <span className='text-gray-600'>Trận đấu:</span>
                    <div className='font-medium'>
                      {result.matches_won}W - {result.matches_lost}L
                    </div>
                  </div>
                  <div>
                    <span className='text-gray-600'>ELO nhận:</span>
                    <div className='font-medium text-blue-600'>
                      +{result.elo_points_earned}
                    </div>
                  </div>
                  <div>
                    <span className='text-gray-600'>SPA nhận:</span>
                    <div className='font-medium text-green-600'>
                      +{result.spa_points_earned.toLocaleString()}
                    </div>
                  </div>
                  {result.prize_amount > 0 && (
                    <div>
                      <span className='text-gray-600'>Tiền thưởng:</span>
                      <div className='font-medium text-yellow-600'>
                        {result.prize_amount.toLocaleString()}đ
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TournamentEloHistory;
