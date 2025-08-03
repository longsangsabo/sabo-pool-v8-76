import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Calculator,
  Trophy,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

interface TournamentWithResults {
  id: string;
  name: string;
  status: string;
  completed_at: string | null;
  results_count: number;
}

export const AdminTournamentResults: React.FC = () => {
  const [tournaments, setTournaments] = useState<TournamentWithResults[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingTournaments, setProcessingTournaments] = useState<
    Set<string>
  >(new Set());

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select(
          `
          id,
          name,
          status,
          completed_at,
          tournament_results(count)
        `
        )
        .eq('status', 'completed')
        .order('completed_at', { ascending: false });

      if (error) throw error;

      const formattedData = data.map(t => ({
        id: t.id,
        name: t.name,
        status: t.status,
        completed_at: t.completed_at,
        results_count: t.tournament_results?.[0]?.count || 0,
      }));

      setTournaments(formattedData);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
      toast.error('Không thể tải danh sách giải đấu');
    } finally {
      setLoading(false);
    }
  };

  const calculateTournamentResults = async (
    tournamentId: string,
    tournamentName: string
  ) => {
    setProcessingTournaments(prev => new Set(prev).add(tournamentId));

    try {
      console.log('🧮 Calculating results for tournament:', tournamentId);

      const { data, error } = await supabase.rpc(
        'complete_tournament_automatically',
        {
          p_tournament_id: tournamentId,
        }
      );

      if (error) throw error;

      const result = data as any;
      if (result?.success) {
        toast.success(
          `🎉 Đã tính toán kết quả cho giải đấu "${tournamentName}"`
        );
        await fetchTournaments(); // Refresh the list
      } else {
        throw new Error(result?.error || 'Không thể tính toán kết quả');
      }
    } catch (error: any) {
      console.error('❌ Error calculating results:', error);
      toast.error(
        `Lỗi tính toán kết quả cho "${tournamentName}": ${error.message}`
      );
    } finally {
      setProcessingTournaments(prev => {
        const newSet = new Set(prev);
        newSet.delete(tournamentId);
        return newSet;
      });
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Chưa rõ';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className='p-6'>
          <div className='flex items-center justify-center'>
            <Loader2 className='h-6 w-6 animate-spin mr-2' />
            <span>Đang tải danh sách giải đấu...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Calculator className='h-5 w-5' />
          Tính toán kết quả giải đấu
        </CardTitle>
      </CardHeader>
      <CardContent>
        {tournaments.length === 0 ? (
          <div className='text-center py-8 text-muted-foreground'>
            <Trophy className='h-12 w-12 mx-auto mb-4 opacity-50' />
            <p>Không có giải đấu nào đã hoàn thành</p>
          </div>
        ) : (
          <div className='space-y-4'>
            {tournaments.map(tournament => (
              <div
                key={tournament.id}
                className='flex items-center justify-between p-4 border rounded-lg'
              >
                <div className='flex-1'>
                  <h3 className='font-semibold text-lg'>{tournament.name}</h3>
                  <p className='text-sm text-muted-foreground'>
                    Hoàn thành: {formatDate(tournament.completed_at)}
                  </p>
                  <div className='flex items-center gap-2 mt-2'>
                    <Badge variant='outline'>{tournament.status}</Badge>
                    {tournament.results_count > 0 ? (
                      <Badge
                        variant='default'
                        className='bg-green-100 text-green-800'
                      >
                        <CheckCircle className='h-3 w-3 mr-1' />
                        {tournament.results_count} kết quả
                      </Badge>
                    ) : (
                      <Badge
                        variant='destructive'
                        className='bg-red-100 text-red-800'
                      >
                        <AlertCircle className='h-3 w-3 mr-1' />
                        Chưa có kết quả
                      </Badge>
                    )}
                  </div>
                </div>

                <div className='flex items-center gap-2'>
                  <Button
                    onClick={() =>
                      calculateTournamentResults(tournament.id, tournament.name)
                    }
                    disabled={processingTournaments.has(tournament.id)}
                    variant={
                      tournament.results_count > 0 ? 'outline' : 'default'
                    }
                    size='sm'
                  >
                    {processingTournaments.has(tournament.id) ? (
                      <>
                        <Loader2 className='h-4 w-4 animate-spin mr-2' />
                        Đang tính toán...
                      </>
                    ) : (
                      <>
                        <Calculator className='h-4 w-4 mr-2' />
                        {tournament.results_count > 0
                          ? 'Tính lại'
                          : 'Tính toán kết quả'}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminTournamentResults;
