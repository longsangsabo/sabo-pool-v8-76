import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Trophy,
  Plus,
  CreditCard,
  Table,
  Network,
  GitBranch,
  Workflow,
  Award,
  Settings,
  Zap,
} from 'lucide-react';

// Import components
import TournamentManagementHub, {
  TournamentManagementHubRef,
} from '@/components/tournament/TournamentManagementHub';
import { EnhancedTournamentForm } from '@/components/tournament/EnhancedTournamentForm';
import EnhancedTableManager from '@/components/tournament/EnhancedTableManager';
import TournamentPaymentManager from '@/components/TournamentPaymentManager';
import { SingleEliminationTemplate } from '@/components/tournament/templates/SingleEliminationTemplate';
import { DoubleEliminationTemplate } from '@/components/tournament/templates/DoubleEliminationTemplate';
import { TournamentSelector } from '@/components/shared/TournamentSelector';
import { TournamentBracket } from '@/components/tournament/TournamentBracket';

import { ManualResultsGenerator } from '@/components/tournament/ManualResultsGenerator';
import TournamentResults from '@/components/tournament/TournamentResults';
import { TournamentControlPanel } from '@/components/tournament/TournamentControlPanel';
import { TournamentMatchManager } from '@/components/tournament/TournamentMatchManager';

// Import contexts
import { TournamentProvider } from '@/contexts/TournamentContext';

import { ProfileProvider } from '@/contexts/ProfileContext';
import {
  TournamentStateProvider,
  useTournamentState,
} from '@/contexts/TournamentStateContext';
import { toast } from 'sonner';
import { createTestTournamentFlow } from '@/utils/tournamentTestFlow';

// Internal component that uses TournamentState
const ClubTournamentManagementInternal: React.FC = () => {
  console.log('🔧 ClubTournamentManagementInternal rendering...');
  const [managementActiveTab, setManagementActiveTab] = useState('create');

  const tournamentManagementRef = useRef<TournamentManagementHubRef>(null);
  const { selectedTournamentId, selectedTournament, refreshAll } =
    useTournamentState();

  const handleTournamentSuccess = (tournament: any) => {
    console.log('✅ Tournament created successfully:', tournament);
    toast.success('Giải đấu đã được tạo thành công!');

    // Always go to tournaments list after creation
    setTimeout(() => {
      tournamentManagementRef.current?.refreshTournaments();
      setManagementActiveTab('tournaments');
      if (tournament?.tournament_type === 'double_elimination') {
        toast.info(
          'Giải đấu đã được tạo! Vào "Quản lý Bảng đấu" để tạo bảng đấu loại kép'
        );
      }
    }, 500);
  };

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-2xl font-bold text-foreground'>Quản lý Giải đấu</h2>
        <p className='text-muted-foreground'>
          Tạo mới và quản lý các giải đấu của câu lạc bộ
        </p>
      </div>

      {/* Tournament Management Section */}
      <div className='space-y-6'>
        <Tabs
          value={managementActiveTab}
          onValueChange={setManagementActiveTab}
          className='space-y-4'
        >
          <TabsList className='grid w-full grid-cols-3 lg:grid-cols-5'>
            <TabsTrigger
              value='tournaments'
              className='flex items-center gap-2'
            >
              <Trophy className='w-4 h-4' />
              Quản lý Giải đấu
            </TabsTrigger>
            <TabsTrigger value='create' className='flex items-center gap-2'>
              <Plus className='w-4 h-4' />
              Tạo & Sửa
            </TabsTrigger>
            <TabsTrigger value='automation' className='flex items-center gap-2'>
              <Zap className='w-4 h-4' />
              Automation
            </TabsTrigger>
            <TabsTrigger
              value='bracket-view'
              className='flex items-center gap-2'
            >
              <Workflow className='w-4 h-4' />
              Sơ đồ giải đấu
            </TabsTrigger>
            <TabsTrigger value='results' className='flex items-center gap-2'>
              <Award className='w-4 h-4' />
              Kết quả giải đấu
            </TabsTrigger>
          </TabsList>

          <TabsContent value='create'>
            <ProfileProvider>
              <TournamentProvider>
                {(() => {
                  console.log(
                    '🎯 About to render EnhancedTournamentForm inside providers'
                  );
                  return (
                    <EnhancedTournamentForm
                      onSuccess={handleTournamentSuccess}
                      onCancel={() => {
                        console.log('❌ Form canceled');
                      }}
                    />
                  );
                })()}
              </TournamentProvider>
            </ProfileProvider>
          </TabsContent>

          <TabsContent value='tournaments'>
            <TournamentManagementHub ref={tournamentManagementRef} />
          </TabsContent>

          <TabsContent value='automation'>
            <div className='space-y-6'>
              {/* Tournament Selector */}
              <TournamentSelector />

              {/* Tournament Control Panel */}
              {selectedTournamentId && (
                <TournamentControlPanel
                  tournamentId={selectedTournamentId}
                  isClubOwner={true}
                />
              )}

              {/* Tournament Match Manager */}
              {selectedTournamentId && (
                <TournamentMatchManager
                  tournamentId={selectedTournamentId}
                  isClubOwner={true}
                />
              )}

              {!selectedTournamentId && (
                <div className='text-center py-12'>
                  <Zap className='w-16 h-16 text-muted-foreground mx-auto mb-4' />
                  <h3 className='text-lg font-semibold text-foreground mb-2'>
                    Chọn giải đấu
                  </h3>
                  <p className='text-muted-foreground'>
                    Vui lòng chọn một giải đấu để quản lý automation
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value='bracket-view'>
            <div className='space-y-6'>
              {/* Tournament Selector */}
              <TournamentSelector />

              {/* Tournament Control Panel for selected tournament */}
              {selectedTournamentId && (
                <TournamentControlPanel
                  tournamentId={selectedTournamentId}
                  isClubOwner={true}
                />
              )}

              {/* Test Button for Development */}
              {process.env.NODE_ENV === 'development' &&
                selectedTournamentId && (
                  <Card className='border-dashed border-orange-200 bg-orange-50/50'>
                    <CardContent className='pt-6'>
                      <div className='flex items-center justify-between'>
                        <div>
                          <h3 className='font-semibold text-orange-800'>
                            🧪 Development Test
                          </h3>
                          <p className='text-sm text-orange-600'>
                            Test complete tournament flow: scores → advancement
                            → completion
                          </p>
                        </div>
                        <Button
                          onClick={createTestTournamentFlow}
                          variant='outline'
                          className='border-orange-200 text-orange-700 hover:bg-orange-100'
                        >
                          🚀 Test Flow
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

              {/* Auto Bracket Display */}
              {selectedTournamentId ? (
                <TournamentBracket
                  tournamentId={selectedTournamentId}
                  adminMode={true}
                />
              ) : (
                <div className='text-center py-12'>
                  <Workflow className='w-16 h-16 text-muted-foreground mx-auto mb-4' />
                  <h3 className='text-lg font-semibold text-foreground mb-2'>
                    Chọn giải đấu
                  </h3>
                  <p className='text-muted-foreground'>
                    Vui lòng chọn một giải đấu để xem sơ đồ giải đấu
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value='results'>
            <div className='space-y-6'>
              {/* Tournament Selector */}
              <TournamentSelector />

              {/* Manual Results Generator for Completed Tournaments */}
              {selectedTournamentId &&
                selectedTournament?.status === 'completed' && (
                  <ManualResultsGenerator
                    tournamentId={selectedTournamentId}
                    tournamentName={selectedTournament.name}
                    onResultsGenerated={refreshAll}
                  />
                )}

              {/* Tournament Results Display */}
              <TournamentResults tournamentId={selectedTournamentId} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Main wrapper component with context
interface ClubTournamentManagementProps {
  clubId: string;
}

const ClubTournamentManagement: React.FC<ClubTournamentManagementProps> = ({
  clubId,
}) => {
  console.log('🔧 ClubTournamentManagement rendering with clubId:', clubId);

  try {
    return (
      <TournamentStateProvider clubId={clubId}>
        <ClubTournamentManagementInternal />
      </TournamentStateProvider>
    );
  } catch (error) {
    console.error('🚨 Error in ClubTournamentManagement:', error);
    return <div>Error loading tournament management: {String(error)}</div>;
  }
};

export default ClubTournamentManagement;
