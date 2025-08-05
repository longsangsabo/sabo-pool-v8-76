import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Settings, Users } from 'lucide-react';
import { AdminBracketViewer } from '@/components/admin/AdminBracketViewer';
import TournamentManagementFlow from '@/components/tournament/TournamentManagementFlow';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Tournament {
  id: string;
  name: string;
  status: string;
  max_participants: number;
  tournament_type: string;
}

const ClubBracketManagementTab = ({ clubId }: { clubId?: string }) => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] =
    useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTournaments();
  }, [clubId]);

  const loadTournaments = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('tournaments')
        .select('id, name, status, max_participants, tournament_type, club_id')
        .in('status', ['registration_closed', 'ongoing', 'completed'])
        .order('created_at', { ascending: false });

      if (clubId) {
        query = query.eq('club_id', clubId);
      }

      const { data, error } = await query;

      if (error) throw error;

      setTournaments(data || []);
    } catch (error) {
      console.error('Error loading tournaments:', error);
      toast.error('Lỗi tải danh sách giải đấu');
    } finally {
      setLoading(false);
    }
  };

  if (selectedTournament) {
    return (
      <div className='space-y-4'>
        <div className='flex items-center gap-4'>
          <Button variant='outline' onClick={() => setSelectedTournament(null)}>
            ← Quay lại danh sách
          </Button>
          <h3 className='text-lg font-semibold'>{selectedTournament.name}</h3>
        </div>

        <Tabs defaultValue='bracket' className='w-full'>
          <TabsList className='grid w-full grid-cols-2'>
            <TabsTrigger value='bracket'>Bảng đấu</TabsTrigger>
            <TabsTrigger value='management'>Quản lý trận đấu</TabsTrigger>
          </TabsList>

          <TabsContent value='bracket'>
            <AdminBracketViewer tournamentId={selectedTournament.id} />
          </TabsContent>

          <TabsContent value='management'>
            <TournamentManagementFlow tournamentId={selectedTournament.id} />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Trophy className='h-5 w-5 text-primary' />
          Quản lý Bảng đấu Club
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          <p className='text-muted-foreground'>
            Quản lý bảng đấu và trận đấu cho các giải đấu của club
          </p>

          {loading ? (
            <div className='text-center py-8'>
              <div className='animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto'></div>
              <p className='mt-2 text-muted-foreground'>Đang tải...</p>
            </div>
          ) : tournaments.length === 0 ? (
            <div className='text-center py-8'>
              <Trophy className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
              <p className='text-muted-foreground'>
                Chưa có giải đấu nào có bảng đấu
              </p>
            </div>
          ) : (
            <div className='grid gap-4'>
              {tournaments.map(tournament => (
                <Card
                  key={tournament.id}
                  className='hover:shadow-md transition-shadow cursor-pointer'
                  onClick={() => setSelectedTournament(tournament)}
                >
                  <CardContent className='p-4'>
                    <div className='flex items-center justify-between'>
                      <div className='flex-1'>
                        <h4 className='font-medium mb-1'>{tournament.name}</h4>
                        <div className='flex items-center gap-4 text-sm text-muted-foreground'>
                          <div className='flex items-center gap-1'>
                            <Users className='h-4 w-4' />
                            <span>Tối đa: {tournament.max_participants}</span>
                          </div>
                          <div className='flex items-center gap-1'>
                            <Settings className='h-4 w-4' />
                            <span>{tournament.tournament_type}</span>
                          </div>
                          <div className='flex items-center gap-1'>
                            <Trophy className='h-4 w-4' />
                            <span className='capitalize'>
                              {tournament.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Button variant='outline' size='sm'>
                        Quản lý →
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ClubBracketManagementTab;
