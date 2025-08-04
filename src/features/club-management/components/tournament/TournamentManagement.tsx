import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Trophy,
  Calendar,
  Users,
  Table2,
  Settings,
  Plus,
  ClipboardList,
  GitBranch
} from 'lucide-react';
import { TournamentList } from './TournamentList';
import { TournamentForm } from './TournamentForm';
import { TournamentParticipants } from './TournamentParticipants';
import { TournamentBracket } from './TournamentBracket';
import { TournamentSettings } from './TournamentSettings';
import { useTournamentManagement } from '../hooks/useTournamentManagement';
import { LoadingCard } from '@/components/ui/loading-card';

export function TournamentManagement() {
  const {
    tournaments,
    selectedTournament,
    loading,
    error,
    setSelectedTournament,
    createTournament,
    updateTournament,
    deleteTournament,
    startTournament,
    endTournament,
  } = useTournamentManagement();

  if (loading) {
    return (
      <div className="space-y-4">
        <LoadingCard />
        <LoadingCard />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center text-red-500">
            <p className="font-semibold">Error loading tournaments</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Quản lý giải đấu</h2>
          <p className="text-muted-foreground">
            Quản lý tất cả các giải đấu tại câu lạc bộ
          </p>
        </div>
        <Button onClick={() => setSelectedTournament(null)}>
          <Plus className="w-4 h-4 mr-2" />
          Tạo giải đấu
        </Button>
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4" />
            Danh sách
          </TabsTrigger>
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Tạo mới
          </TabsTrigger>
          {selectedTournament && (
            <>
              <TabsTrigger value="participants" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Người tham gia
              </TabsTrigger>
              <TabsTrigger value="bracket" className="flex items-center gap-2">
                <GitBranch className="w-4 h-4" />
                Bảng đấu
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Cài đặt
              </TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="list">
          <TournamentList
            tournaments={tournaments}
            onSelect={setSelectedTournament}
            onStart={startTournament}
            onEnd={endTournament}
            onDelete={deleteTournament}
          />
        </TabsContent>

        <TabsContent value="create">
          <TournamentForm
            tournament={selectedTournament}
            onSubmit={selectedTournament ? updateTournament : createTournament}
          />
        </TabsContent>

        {selectedTournament && (
          <>
            <TabsContent value="participants">
              <TournamentParticipants tournament={selectedTournament} />
            </TabsContent>

            <TabsContent value="bracket">
              <TournamentBracket tournament={selectedTournament} />
            </TabsContent>

            <TabsContent value="settings">
              <TournamentSettings
                tournament={selectedTournament}
                onUpdate={updateTournament}
                onDelete={deleteTournament}
              />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
