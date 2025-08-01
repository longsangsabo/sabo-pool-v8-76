import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  RefreshCw,
  Trophy,
  Users,
  Settings,
  Play,
  CheckCircle,
} from 'lucide-react';
import { BracketGenerator } from './BracketGenerator';
import { MatchManagement } from './MatchManagement';
import { TournamentBracket } from './TournamentBracket';
import TournamentResults from './TournamentResults';
import { TournamentAutomationStatus } from './TournamentAutomationStatus';
import { TournamentAutomationTest } from './TournamentAutomationTest';
import { useBracketGeneration } from '@/hooks/useBracketGeneration';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TournamentBracketFlowProps {
  tournamentId: string;
  tournament: any;
  canManage?: boolean;
  onTabChange?: (tab: string) => void;
}

export const TournamentBracketFlow: React.FC<TournamentBracketFlowProps> = ({
  tournamentId,
  tournament,
  canManage = false,
  onTabChange,
}) => {
  const [bracketData, setBracketData] = useState<any>(null);
  const [seeding, setSeeding] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const { fetchBracketData, fetchSeeding } = useBracketGeneration();

  const loadBracketInfo = async () => {
    setLoading(true);
    try {
      const [bracket, seedingData] = await Promise.all([
        fetchBracketData(tournamentId),
        fetchSeeding(tournamentId),
      ]);

      setBracketData(bracket);
      setSeeding(seedingData);
    } catch (error) {
      console.error('Error loading bracket info:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBracketInfo();
  }, [tournamentId]);

  const handleBracketGenerated = () => {
    loadBracketInfo();
    toast.success('Bảng đấu đã được tạo thành công!');
  };

  const handleStartTournament = async () => {
    try {
      const { error } = await supabase
        .from('tournaments')
        .update({
          status: 'ongoing',
          management_status: 'ongoing',
        })
        .eq('id', tournamentId);

      if (error) throw error;

      toast.success('Giải đấu đã được bắt đầu!');
      window.location.reload(); // Refresh to update tournament status
    } catch (error) {
      console.error('Error starting tournament:', error);
      toast.error('Lỗi khi bắt đầu giải đấu');
    }
  };

  const getTournamentStatus = () => {
    if (!bracketData) {
      return {
        status: 'pending',
        label: 'Chưa tạo bảng đấu',
        color: 'secondary' as const,
        description: 'Cần tạo bảng đấu trước khi bắt đầu',
      };
    }

    if (tournament?.status === 'ongoing') {
      return {
        status: 'ongoing',
        label: 'Đang diễn ra',
        color: 'default' as const,
        description: 'Giải đấu đang được thi đấu',
      };
    }

    if (tournament?.status === 'completed') {
      return {
        status: 'completed',
        label: 'Đã hoàn thành',
        color: 'outline' as const,
        description: 'Giải đấu đã kết thúc',
      };
    }

    return {
      status: 'ready',
      label: 'Sẵn sàng bắt đầu',
      color: 'destructive' as const,
      description: 'Bảng đấu đã sẵn sàng, có thể bắt đầu giải',
    };
  };

  const tournamentStatus = getTournamentStatus();
  const participantCount = tournament?.current_participants || 0;
  const maxParticipants = tournament?.max_participants || 16;

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Tournament Status Header */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <CardTitle className='flex items-center gap-2'>
              <Trophy className='h-5 w-5 text-primary' />
              Quản Lý Bảng Đấu
            </CardTitle>
            <div className='flex items-center gap-4'>
              <Badge variant={tournamentStatus.color}>
                {tournamentStatus.label}
              </Badge>
              <Button variant='outline' size='sm' onClick={loadBracketInfo}>
                <RefreshCw className='h-4 w-4 mr-2' />
                Làm mới
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Alert>
            <Trophy className='h-4 w-4' />
            <AlertDescription>{tournamentStatus.description}</AlertDescription>
          </Alert>

          <div className='grid grid-cols-4 gap-4 mt-4 text-sm'>
            <div className='text-center'>
              <div className='text-2xl font-bold text-primary'>
                {participantCount}
              </div>
              <div className='text-muted-foreground'>Người tham gia</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-secondary'>
                {bracketData ? 'Đã tạo' : 'Chưa tạo'}
              </div>
              <div className='text-muted-foreground'>Bảng đấu</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-green-600'>
                {seeding.length}
              </div>
              <div className='text-muted-foreground'>Đã seeding</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-blue-600'>
                {bracketData?.total_rounds || 0}
              </div>
              <div className='text-muted-foreground'>Số vòng</div>
            </div>
          </div>

          {/* Quick Actions */}
          {canManage && (
            <div className='flex gap-2 mt-4 pt-4 border-t'>
              {!bracketData && (
                <Button
                  onClick={() => setActiveTab('generator')}
                  disabled={participantCount < 2}
                >
                  <Settings className='h-4 w-4 mr-2' />
                  Tạo bảng đấu
                </Button>
              )}

              {bracketData &&
                tournament?.status !== 'ongoing' &&
                tournament?.status !== 'completed' && (
                  <Button
                    onClick={handleStartTournament}
                    className='bg-green-600 hover:bg-green-700'
                  >
                    <Play className='h-4 w-4 mr-2' />
                    Bắt đầu giải đấu
                  </Button>
                )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bracket Management Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className='grid w-full grid-cols-6'>
          <TabsTrigger value='overview'>Tổng quan</TabsTrigger>
          <TabsTrigger value='automation'>Automation</TabsTrigger>
          <TabsTrigger value='bracket'>Bảng đấu</TabsTrigger>
          <TabsTrigger value='results'>Kết quả</TabsTrigger>
          {canManage && <TabsTrigger value='generator'>Tạo bảng</TabsTrigger>}
          {canManage && <TabsTrigger value='management'>Quản lý</TabsTrigger>}
        </TabsList>

        <TabsContent value='overview' className='space-y-4'>
          <div className='grid md:grid-cols-2 gap-6'>
            {/* Seeding Info */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Users className='h-5 w-5' />
                  Thông Tin Seeding
                </CardTitle>
              </CardHeader>
              <CardContent>
                {seeding.length > 0 ? (
                  <div className='space-y-2 max-h-64 overflow-y-auto'>
                    {seeding.map(seed => (
                      <div
                        key={seed.id}
                        className='flex items-center justify-between p-2 border rounded'
                      >
                        <span className='font-medium'>
                          #{seed.seed_position} -{' '}
                          {seed.player?.full_name ||
                            seed.player?.display_name ||
                            'TBD'}
                        </span>
                        <div className='flex items-center gap-2'>
                          <Badge variant='outline'>{seed.elo_rating} ELO</Badge>
                          {seed.is_bye && <Badge>BYE</Badge>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='text-center text-muted-foreground py-8'>
                    Chưa có thông tin seeding
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bracket Info */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Trophy className='h-5 w-5' />
                  Thông Tin Bảng Đấu
                </CardTitle>
              </CardHeader>
              <CardContent>
                {bracketData ? (
                  <div className='space-y-3'>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>
                        Loại bảng đấu:
                      </span>
                      <span className='font-medium'>
                        {bracketData.bracket_type}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>
                        Tổng số vòng:
                      </span>
                      <span className='font-medium'>
                        {bracketData.total_rounds}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>
                        Vòng hiện tại:
                      </span>
                      <span className='font-medium'>
                        {bracketData.current_round}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>Trạng thái:</span>
                      <Badge variant='outline'>{bracketData.status}</Badge>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>Tạo lúc:</span>
                      <span className='text-sm'>
                        {new Date(bracketData.created_at).toLocaleString(
                          'vi-VN'
                        )}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className='text-center text-muted-foreground py-8'>
                    Chưa có bảng đấu
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value='automation'>
          <div className='space-y-6'>
            <TournamentAutomationStatus
              tournamentId={tournamentId}
              tournament={tournament}
            />

            {canManage && (
              <TournamentAutomationTest
                tournamentId={tournamentId}
                tournament={tournament}
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value='bracket'>
          <TournamentBracket tournamentId={tournamentId} />
        </TabsContent>

        <TabsContent value='results'>
          <TournamentResults tournamentId={tournamentId} />
        </TabsContent>

        {canManage && (
          <TabsContent value='generator'>
            <BracketGenerator
              tournamentId={tournamentId}
              currentParticipants={participantCount}
              maxParticipants={maxParticipants}
              onBracketGenerated={handleBracketGenerated}
            />
          </TabsContent>
        )}

        {canManage && (
          <TabsContent value='management'>
            <MatchManagement tournamentId={tournamentId} canEdit={true} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};
