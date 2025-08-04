import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Trophy,
  Users,
  Settings,
  Calendar,
  ChartBar,
  Table
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EnhancedTournamentForm } from './EnhancedTournamentForm';
import { TournamentBracket } from './TournamentBracket';
import { TournamentControlPanel } from './TournamentControlPanel';
import { TournamentMatchManager } from './TournamentMatchManager';
import { TournamentResults } from './TournamentResults';
import { TableAssignmentDisplay } from './TableAssignmentDisplay';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Tournament } from '@/types/tournament';
import { useTournamentState } from '@/contexts/TournamentStateContext';

export const EnhancedTournamentHub: React.FC = () => {
  const {
    selectedTournament,
    refreshTournaments,
    setSelectedTournament
  } = useTournamentState();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);

  // Enhanced tournament stats
  const [tournamentStats, setTournamentStats] = useState({
    totalParticipants: 0,
    completedMatches: 0,
    upcomingMatches: 0,
    averageMatchDuration: 0
  });

  useEffect(() => {
    if (selectedTournament) {
      loadTournamentStats();
    }
  }, [selectedTournament]);

  const loadTournamentStats = async () => {
    if (!selectedTournament) return;
    
    try {
      setIsLoading(true);
      
      // Get participant count
      const { data: participants, error: participantsError } = await supabase
        .from('tournament_registrations')
        .select('count', { count: 'exact' })
        .eq('tournament_id', selectedTournament.id);

      if (participantsError) throw participantsError;

      // Get match statistics
      const { data: matches, error: matchesError } = await supabase
        .from('tournament_matches')
        .select('*')
        .eq('tournament_id', selectedTournament.id);

      if (matchesError) throw matchesError;

      const completedMatches = matches?.filter(m => m.status === 'completed') || [];
      const upcomingMatches = matches?.filter(m => m.status === 'pending') || [];

      // Calculate average match duration for completed matches
      const avgDuration = completedMatches.reduce((acc, match) => {
        if (match.actual_start_time && match.actual_end_time) {
          const duration = new Date(match.actual_end_time).getTime() - 
                         new Date(match.actual_start_time).getTime();
          return acc + duration;
        }
        return acc;
      }, 0) / (completedMatches.length || 1);

      setTournamentStats({
        totalParticipants: participants?.count || 0,
        completedMatches: completedMatches.length,
        upcomingMatches: upcomingMatches.length,
        averageMatchDuration: avgDuration / (1000 * 60) // Convert to minutes
      });

    } catch (error) {
      console.error('Error loading tournament stats:', error);
      toast.error('Không thể tải thống kê giải đấu');
    } finally {
      setIsLoading(false);
    }
  };

  if (!selectedTournament) {
    return (
      <div className="text-center py-12">
        <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">
          Chưa chọn giải đấu
        </h3>
        <p className="text-muted-foreground">
          Vui lòng chọn một giải đấu để xem chi tiết
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl mb-2">
                {selectedTournament.name}
              </CardTitle>
              <p className="text-muted-foreground">
                {selectedTournament.description}
              </p>
            </div>
            <Button variant="outline" onClick={() => setSelectedTournament(null)}>
              Quay lại danh sách
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Người tham gia</p>
                <p className="font-medium">
                  {tournamentStats.totalParticipants}/{selectedTournament.max_participants}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Trận đã hoàn thành</p>
                <p className="font-medium">{tournamentStats.completedMatches}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Trận sắp diễn ra</p>
                <p className="font-medium">{tournamentStats.upcomingMatches}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ChartBar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Thời gian trung bình</p>
                <p className="font-medium">
                  {Math.round(tournamentStats.averageMatchDuration)} phút
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 lg:grid-cols-6 w-full">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Tổng quan
          </TabsTrigger>
          <TabsTrigger value="bracket" className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Bảng đấu
          </TabsTrigger>
          <TabsTrigger value="matches" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Trận đấu
          </TabsTrigger>
          <TabsTrigger value="tables" className="flex items-center gap-2">
            <Table className="w-4 h-4" />
            Quản lý bàn
          </TabsTrigger>
          <TabsTrigger value="control" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Điều khiển
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-2">
            <ChartBar className="w-4 h-4" />
            Kết quả
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardContent className="pt-6">
              <EnhancedTournamentForm
                tournament={selectedTournament}
                onSubmit={async (data) => {
                  try {
                    const { error } = await supabase
                      .from('tournaments')
                      .update(data)
                      .eq('id', selectedTournament.id);

                    if (error) throw error;
                    
                    toast.success('Cập nhật giải đấu thành công');
                    refreshTournaments();
                  } catch (error) {
                    console.error('Error updating tournament:', error);
                    toast.error('Không thể cập nhật giải đấu');
                  }
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bracket">
          <TournamentBracket
            tournamentId={selectedTournament.id}
            tournament={selectedTournament}
          />
        </TabsContent>

        <TabsContent value="matches">
          <TournamentMatchManager
            tournamentId={selectedTournament.id}
            isClubOwner={true}
          />
        </TabsContent>

        <TabsContent value="tables">
          <TableAssignmentDisplay
            clubId={selectedTournament.club_id}
            tournamentId={selectedTournament.id}
            showManagement={true}
          />
        </TabsContent>

        <TabsContent value="control">
          <TournamentControlPanel
            tournamentId={selectedTournament.id}
            isClubOwner={true}
          />
        </TabsContent>

        <TabsContent value="results">
          <TournamentResults
            tournamentId={selectedTournament.id}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
