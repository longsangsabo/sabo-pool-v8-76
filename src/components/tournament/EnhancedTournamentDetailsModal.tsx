import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar,
  MapPin,
  Users,
  Trophy,
  Star,
  Clock,
  DollarSign,
  Target,
  Award,
  Gift,
  BarChart3,
  Activity,
  Zap,
  TrendingUp,
  FileText,
} from 'lucide-react';
import { Tournament } from '@/types/tournament';
import { TournamentParticipantsTab } from './TournamentParticipantsTab';
import { TournamentBracket } from './TournamentBracket';
import { TournamentResults } from './TournamentResults';
import { TournamentRealTimeSync } from './TournamentRealTimeSync';
import { useTournamentRegistrations } from '@/hooks/useTournamentRegistrations';
import { useTournamentMatches } from '@/hooks/useTournamentMatches';
import { useTournamentResults } from '@/hooks/useTournamentResults';
import {
  calculateTotalPrizePool,
  formatPrizeDistribution,
  formatCurrency,
} from '@/utils/prizeUtils';
import { formatSafeDate as formatSafeDateUtil } from '@/utils/dateUtils';

export interface EnhancedTournamentDetailsModalProps {
  tournament: Tournament | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'upcoming':
    case 'registration_open':
      return 'bg-blue-500';
    case 'registration_closed':
      return 'bg-orange-500';
    case 'ongoing':
      return 'bg-green-500';
    case 'completed':
      return 'bg-gray-500';
    case 'cancelled':
      return 'bg-red-500';
    default:
      return 'bg-gray-400';
  }
};

const getStatusText = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'upcoming':
      return 'Sắp diễn ra';
    case 'registration_open':
      return 'Đang mở đăng ký';
    case 'registration_closed':
      return 'Đã đóng đăng ký';
    case 'ongoing':
      return 'Đang diễn ra';
    case 'completed':
      return 'Đã kết thúc';
    case 'cancelled':
      return 'Đã hủy';
    default:
      return status || 'Không xác định';
  }
};

const formatSafeDate = (dateString: string | null | undefined) => {
  if (!dateString) return 'Chưa xác định';

  const date = new Date(dateString);

  // Check if the date is valid and not the epoch date (1970-01-01)
  if (isNaN(date.getTime()) || date.getFullYear() === 1970) {
    return 'Chưa xác định';
  }

  return date.toLocaleString('vi-VN');
};

export const EnhancedTournamentDetailsModal: React.FC<
  EnhancedTournamentDetailsModalProps
> = ({ tournament, open, onOpenChange }) => {
  const [activeTab, setActiveTab] = useState('overview');

  // Real-time data hooks
  const { registrations, loading: registrationsLoading } =
    useTournamentRegistrations(tournament?.id || '');
  const { matches, loading: matchesLoading } = useTournamentMatches(
    tournament?.id || null
  );
  const { results, loading: resultsLoading } = useTournamentResults(
    tournament?.id
  );

  if (!tournament) {
    return null;
  }

  const confirmedParticipants = registrations.filter(reg =>
    ['confirmed', 'paid'].includes(reg.registration_status.toLowerCase())
  ).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-6xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader className='space-y-4'>
          <div className='flex items-start justify-between'>
            <div className='space-y-2'>
              <DialogTitle className='text-2xl font-bold'>
                {tournament.name}
              </DialogTitle>
              <div className='flex items-center gap-4 text-sm text-muted-foreground'>
                <div className='flex items-center gap-1'>
                  <Calendar className='h-4 w-4' />
                  {formatSafeDateUtil(
                    tournament.tournament_start,
                    (tournament as any).start_date
                  )}
                </div>
                <div className='flex items-center gap-1'>
                  <MapPin className='h-4 w-4' />
                  {tournament.venue_address}
                </div>
                <div className='flex items-center gap-1'>
                  <Users className='h-4 w-4' />
                  {confirmedParticipants}/{tournament.max_participants}
                </div>
              </div>
            </div>
            <Badge
              className={`${getStatusColor(tournament.status)} text-white`}
            >
              {getStatusText(tournament.status)}
            </Badge>
          </div>

          {/* Real-time sync indicator */}
          <TournamentRealTimeSync
            tournamentId={tournament.id}
            onTournamentUpdate={() => {}}
            onParticipantUpdate={() => {}}
            onResultsUpdate={() => {}}
          />
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
          <TabsList className='grid w-full grid-cols-4'>
            <TabsTrigger value='overview'>Tổng quan</TabsTrigger>
            <TabsTrigger value='participants'>
              Người tham gia{' '}
              {!registrationsLoading && `(${confirmedParticipants})`}
            </TabsTrigger>
            <TabsTrigger value='bracket'>
              Bảng đấu{' '}
              {!matchesLoading && matches.length > 0 && `(${matches.length})`}
            </TabsTrigger>
            <TabsTrigger value='results'>
              Kết quả{' '}
              {!resultsLoading && results.length > 0 && `(${results.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value='overview' className='space-y-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {/* Tournament Information */}
              <div className='space-y-4 p-4 border rounded-lg'>
                <h3 className='text-lg font-semibold flex items-center gap-2'>
                  <Trophy className='h-5 w-5 text-amber-500' />
                  Thông tin giải đấu
                </h3>
                <div className='space-y-3 text-sm'>
                  <div className='flex items-center gap-2'>
                    <Target className='h-4 w-4 text-blue-500' />
                    <span className='text-muted-foreground'>Loại giải:</span>
                    <span className='font-medium ml-auto'>
                      {tournament.tournament_type}
                    </span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Activity className='h-4 w-4 text-purple-500' />
                    <span className='text-muted-foreground'>Hình thức:</span>
                    <span className='font-medium ml-auto'>
                      {tournament.game_format}
                    </span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Star className='h-4 w-4 text-indigo-500' />
                    <span className='text-muted-foreground'>Cấp độ:</span>
                    <span className='font-medium ml-auto'>
                      Tier {tournament.tier_level}
                    </span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <DollarSign className='h-4 w-4 text-green-600' />
                    <span className='text-muted-foreground'>Lệ phí:</span>
                    <span className='font-medium text-green-600 ml-auto'>
                      {tournament.entry_fee.toLocaleString('vi-VN')} VNĐ
                    </span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Gift className='h-4 w-4 text-amber-600' />
                    <span className='text-muted-foreground'>
                      Tổng giải thưởng:
                    </span>
                    <span className='font-medium text-orange-600 ml-auto'>
                      {formatCurrency(calculateTotalPrizePool(tournament))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Schedule */}
              <div className='space-y-4 p-4 border rounded-lg'>
                <h3 className='text-lg font-semibold flex items-center gap-2'>
                  <Calendar className='h-5 w-5 text-green-500' />
                  Lịch trình
                </h3>
                <div className='space-y-3 text-sm'>
                  <div className='flex items-center gap-2'>
                    <Clock className='h-4 w-4 text-blue-500' />
                    <span className='text-muted-foreground'>Mở đăng ký:</span>
                    <span className='font-medium ml-auto'>
                      {formatSafeDate(tournament.registration_start)}
                    </span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Clock className='h-4 w-4 text-orange-500' />
                    <span className='text-muted-foreground'>Đóng đăng ký:</span>
                    <span className='font-medium ml-auto'>
                      {formatSafeDate(tournament.registration_end)}
                    </span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Zap className='h-4 w-4 text-green-500' />
                    <span className='text-muted-foreground'>Bắt đầu:</span>
                    <span className='font-medium ml-auto'>
                      {formatSafeDate(tournament.tournament_start)}
                    </span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Trophy className='h-4 w-4 text-amber-500' />
                    <span className='text-muted-foreground'>Kết thúc:</span>
                    <span className='font-medium ml-auto'>
                      {formatSafeDate(tournament.tournament_end)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className='space-y-4 p-4 border rounded-lg'>
                <h3 className='text-lg font-semibold flex items-center gap-2'>
                  <BarChart3 className='h-5 w-5 text-indigo-500' />
                  Thống kê
                </h3>
                <div className='space-y-3 text-sm'>
                  <div className='flex items-center gap-2'>
                    <Users className='h-4 w-4 text-blue-500' />
                    <span className='text-muted-foreground'>
                      Người tham gia:
                    </span>
                    <span className='font-medium ml-auto'>
                      {confirmedParticipants} / {tournament.max_participants}
                    </span>
                  </div>
                  {matches.length > 0 && (
                    <>
                      <div className='flex items-center gap-2'>
                        <Award className='h-4 w-4 text-yellow-500' />
                        <span className='text-muted-foreground'>Trận đấu:</span>
                        <span className='font-medium ml-auto'>
                          {matches.filter(m => m.status === 'completed').length}{' '}
                          / {matches.length}
                        </span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <TrendingUp className='h-4 w-4 text-green-500' />
                        <span className='text-muted-foreground'>Tiến độ:</span>
                        <span className='font-medium ml-auto'>
                          {matches.length > 0
                            ? Math.round(
                                (matches.filter(m => m.status === 'completed')
                                  .length /
                                  matches.length) *
                                  100
                              )
                            : 0}
                          %
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Location */}
              <div className='space-y-4 p-4 border rounded-lg'>
                <h3 className='text-lg font-semibold flex items-center gap-2'>
                  <MapPin className='h-5 w-5 text-red-500' />
                  Địa điểm
                </h3>
                <p className='text-muted-foreground'>
                  {tournament.venue_address}
                </p>
                {tournament.contact_info && (
                  <div className='pt-2 border-t'>
                    <p className='text-sm font-medium mb-1'>Liên hệ:</p>
                    <p className='text-sm text-muted-foreground'>
                      {tournament.contact_info}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Description & Rules */}
            {(tournament.description || tournament.rules) && (
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                {tournament.description && (
                  <div className='space-y-2 p-4 border rounded-lg'>
                    <h3 className='text-lg font-semibold flex items-center gap-2'>
                      <FileText className='h-5 w-5 text-slate-500' />
                      Mô tả
                    </h3>
                    <p className='text-muted-foreground whitespace-pre-wrap'>
                      {tournament.description}
                    </p>
                  </div>
                )}

                {tournament.rules && (
                  <div className='space-y-2 p-4 border rounded-lg'>
                    <h3 className='text-lg font-semibold flex items-center gap-2'>
                      <Award className='h-5 w-5 text-orange-500' />
                      Luật chơi
                    </h3>
                    <p className='text-muted-foreground whitespace-pre-wrap'>
                      {tournament.rules}
                    </p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value='participants'>
            <TournamentParticipantsTab
              tournamentId={tournament.id}
              maxParticipants={tournament.max_participants}
            />
          </TabsContent>

          <TabsContent value='bracket'>
            <TournamentBracket tournamentId={tournament.id} adminMode={false} />
          </TabsContent>

          <TabsContent value='results'>
            <TournamentResults tournamentId={tournament.id} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
