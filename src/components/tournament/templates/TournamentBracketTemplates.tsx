import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Users, GitBranch, RefreshCw, Settings } from 'lucide-react';
import { SingleEliminationTemplate } from './SingleEliminationTemplate';
import { DoubleEliminationTemplate } from './DoubleEliminationTemplate';
import { useTournamentsForTemplates } from '@/hooks/useTournamentsForTemplates';
import { useTournamentRegistrations } from '@/hooks/useTournamentRegistrations';
import { useCompletedTournamentTemplates } from '@/hooks/useCompletedTournamentTemplates';
import { useBracketGeneration } from '@/hooks/useBracketGeneration';
import { toast } from 'sonner';

interface TournamentBracketTemplatesProps {
  className?: string;
}

export const TournamentBracketTemplates: React.FC<
  TournamentBracketTemplatesProps
> = ({ className }) => {
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('');
  const [activeTemplate, setActiveTemplate] = useState('single');
  const { tournaments, loading: tournamentsLoading } =
    useTournamentsForTemplates();
  const {
    registrations,
    loading: registrationsLoading,
    fetchRegistrations,
  } = useTournamentRegistrations(selectedTournamentId);

  // Completed tournament integration
  const { loadTournamentBracketData, convertToTemplateFormat, isConnected } =
    useCompletedTournamentTemplates();

  // Bracket generation for closed registration tournaments
  const { isGenerating, generateBracket, validateTournament } =
    useBracketGeneration();

  // Show ALL tournaments as requested - no filtering by status
  const availableTournaments = tournaments;

  // Get tournament data for selected tournament
  const selectedTournament = tournaments.find(
    t => t.id === selectedTournamentId
  );

  // Prepare participant data from registrations - enhanced mapping
  const participants = registrations
    .filter(r => r.registration_status === 'confirmed')
    .map((r, index) => ({
      id: r.user_id,
      name: r.player?.full_name || r.player?.display_name || 'Unknown Player',
      displayName:
        r.player?.display_name || r.player?.full_name || 'Unknown Player',
      rank:
        (r.player as any)?.verified_rank ||
        (r.player as any)?.current_rank ||
        'Unranked',
      avatarUrl: r.player?.avatar_url,
      elo: r.player?.elo || 1000,
      registrationOrder: (r as any)?.priority_order || index + 1,
    }))
    .sort((a, b) => {
      // Primary sort: registration order (seeding)
      if (a.registrationOrder !== b.registrationOrder) {
        return a.registrationOrder - b.registrationOrder;
      }
      // Secondary sort: ELO descending
      return b.elo - a.elo;
    });

  const handleTournamentChange = (tournamentId: string) => {
    setSelectedTournamentId(tournamentId);
  };

  const handleRefresh = () => {
    if (selectedTournamentId) {
      fetchRegistrations();
    }
  };

  const handleGenerateBracket = async () => {
    if (!selectedTournamentId || !selectedTournament) return;

    // Validate tournament first
    const validation = await validateTournament(selectedTournamentId);

    if (!validation.valid) {
      toast.error(`Không thể tạo sơ đồ: ${validation.reason}`);
      return;
    }

    // Generate bracket
    const result = await generateBracket(selectedTournamentId, {
      method: 'elo_ranking',
      forceRegenerate: false,
    });

    if (result.success) {
      toast.success('Tạo sơ đồ giải đấu thành công!');
      handleRefresh(); // Refresh data
    } else {
      toast.error('Lỗi khi tạo sơ đồ giải đấu');
    }
  };

  const renderTournamentInfo = () => {
    if (!selectedTournament) return null;

    return (
      <Card className='mb-6 border-blue-200 bg-blue-50/50'>
        <CardHeader className='pb-3'>
          <CardTitle className='flex items-center justify-between text-lg'>
            <div className='flex items-center gap-2'>
              <Trophy className='h-5 w-5 text-blue-600' />
              Thông tin giải đấu
            </div>
            <div className='flex gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={handleRefresh}
                disabled={registrationsLoading}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${registrationsLoading ? 'animate-spin' : ''}`}
                />
                Làm mới
              </Button>

              <Button
                variant='default'
                size='sm'
                onClick={handleGenerateBracket}
                disabled={
                  isGenerating ||
                  !selectedTournament ||
                  (selectedTournament.status !== 'locked' &&
                    selectedTournament.status !== 'ready' &&
                    selectedTournament.status !== 'registration_open') ||
                  participants.length < 2
                }
              >
                <Settings
                  className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`}
                />
                Tạo sơ đồ
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div>
              <p className='font-semibold text-blue-800'>
                {selectedTournament.name}
              </p>
              <p className='text-sm text-blue-600'>
                {selectedTournament.tournament_type === 'single_elimination'
                  ? 'Loại trực tiếp'
                  : selectedTournament.tournament_type === 'double_elimination'
                    ? 'Loại kép'
                    : selectedTournament.tournament_type}
              </p>
            </div>
            <div className='flex items-center gap-2'>
              <Users className='h-4 w-4 text-blue-600' />
              <span className='text-sm'>
                {participants.length}/{selectedTournament.max_participants}{' '}
                người tham gia
              </span>
            </div>
            <div>
              <Badge
                variant={
                  selectedTournament.status === 'completed'
                    ? 'default'
                    : 'secondary'
                }
                className='text-xs'
              >
                {selectedTournament.status === 'completed'
                  ? 'Đã hoàn thành'
                  : selectedTournament.status === 'ongoing'
                    ? 'Đang diễn ra'
                    : selectedTournament.status === 'locked'
                      ? 'Đã khóa đăng ký'
                      : selectedTournament.status === 'registration_open'
                        ? 'Sẵn sàng'
                        : selectedTournament.status}
              </Badge>
            </div>
          </div>

          {participants.length > 0 && (
            <div>
              <p className='text-sm text-blue-700 mb-2'>
                Thứ tự hạt giống (theo đăng ký + ELO):
              </p>
              <div className='flex flex-wrap gap-2'>
                {participants.slice(0, 8).map((participant, index) => (
                  <Badge
                    key={participant.id}
                    variant='outline'
                    className='text-xs'
                  >
                    #{index + 1} {participant.displayName}
                    <span className='ml-1 text-muted-foreground'>
                      ({participant.elo})
                    </span>
                  </Badge>
                ))}
                {participants.length > 8 && (
                  <Badge variant='outline' className='text-xs'>
                    +{participants.length - 8} khác...
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={className}>
      <div className='space-y-6'>
        {/* Tournament Selection */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <GitBranch className='h-5 w-5' />
              Chọn giải đấu để hiển thị bracket
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <Select
                value={selectedTournamentId}
                onValueChange={handleTournamentChange}
                disabled={tournamentsLoading}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Chọn giải đấu...' />
                </SelectTrigger>
                <SelectContent className='max-h-96 overflow-y-auto'>
                  {availableTournaments.map(tournament => (
                    <SelectItem key={tournament.id} value={tournament.id}>
                      <div className='flex items-center justify-between w-full min-w-[300px]'>
                        <div className='flex flex-col items-start'>
                          <span className='font-medium'>{tournament.name}</span>
                          <div className='text-xs text-muted-foreground'>
                            {tournament.tournament_type === 'single_elimination'
                              ? 'Loại trực tiếp'
                              : tournament.tournament_type ===
                                  'double_elimination'
                                ? 'Loại kép'
                                : tournament.tournament_type}
                          </div>
                        </div>
                        <div className='flex items-center gap-2 ml-4'>
                          <Badge variant='outline' className='text-xs'>
                            {tournament.current_participants || 0}/
                            {tournament.max_participants}
                          </Badge>
                          <Badge
                            variant={
                              tournament.status === 'completed'
                                ? 'default'
                                : tournament.status === 'ongoing'
                                  ? 'destructive'
                                  : tournament.status === 'cancelled'
                                    ? 'secondary'
                                    : 'outline'
                            }
                            className='text-xs'
                          >
                            {tournament.status === 'completed'
                              ? 'Hoàn thành'
                              : tournament.status === 'ongoing'
                                ? 'Đang chơi'
                                : tournament.status === 'cancelled'
                                  ? 'Đã hủy'
                                  : tournament.status === 'upcoming'
                                    ? 'Sắp diễn ra'
                                    : tournament.status === 'locked'
                                      ? 'Đã khóa'
                                      : tournament.status ===
                                          'registration_open'
                                        ? 'Đăng ký'
                                        : 'Sẵn sàng'}
                          </Badge>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                  {availableTournaments.length === 0 && (
                    <SelectItem value='none' disabled>
                      Không có giải đấu nào trong hệ thống
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tournament Info */}
        {renderTournamentInfo()}

        {/* Bracket Templates */}
        {selectedTournamentId && (
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Trophy className='h-5 w-5' />
                Mẫu sơ đồ giải đấu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs
                value={activeTemplate}
                onValueChange={setActiveTemplate}
                className='space-y-6'
              >
                <TabsList className='grid w-full grid-cols-2'>
                  <TabsTrigger
                    value='single'
                    className='flex items-center gap-2'
                  >
                    <GitBranch className='h-4 w-4' />
                    Loại trực tiếp (16 người)
                  </TabsTrigger>
                  <TabsTrigger
                    value='double'
                    className='flex items-center gap-2'
                  >
                    <GitBranch className='h-4 w-4' />
                    Loại kép (16 người)
                  </TabsTrigger>
                </TabsList>

                <TabsContent value='single' className='space-y-6'>
                  <SingleEliminationTemplate
                    participants={participants}
                    tournamentId={selectedTournamentId}
                    tournamentData={selectedTournament}
                    completedTournamentId={
                      selectedTournament?.status === 'completed'
                        ? selectedTournamentId
                        : undefined
                    }
                    isCompletedTemplate={
                      selectedTournament?.status === 'completed'
                    }
                  />
                </TabsContent>

                <TabsContent value='double' className='space-y-6'>
                  <DoubleEliminationTemplate
                    participants={participants}
                    tournamentId={selectedTournamentId}
                    tournamentData={selectedTournament}
                    completedTournamentId={
                      selectedTournament?.status === 'completed'
                        ? selectedTournamentId
                        : undefined
                    }
                    isCompletedTemplate={
                      selectedTournament?.status === 'completed'
                    }
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {!selectedTournamentId && (
          <Card className='border-dashed border-2 border-gray-300'>
            <CardContent className='p-12 text-center'>
              <GitBranch className='h-12 w-12 text-gray-400 mx-auto mb-4' />
              <h3 className='text-lg font-semibold text-gray-600 mb-2'>
                Chưa chọn giải đấu
              </h3>
              <p className='text-gray-500'>
                Vui lòng chọn một giải đấu để xem mẫu sơ đồ với dữ liệu thực.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TournamentBracketTemplates;
