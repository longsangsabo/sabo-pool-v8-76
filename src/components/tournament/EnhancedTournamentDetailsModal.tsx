
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  FileText 
} from 'lucide-react';
import { Tournament } from '@/types/tournament';
import { TournamentParticipantsTab } from './TournamentParticipantsTab';
import { BracketVisualization } from './BracketVisualization';
import { TournamentResults } from './TournamentResults';
import { TournamentRealTimeSync } from './TournamentRealTimeSync';
import { useTournamentRegistrations } from '@/hooks/useTournamentRegistrations';
import { useTournamentMatches } from '@/hooks/useTournamentMatches';
import { useTournamentResults } from '@/hooks/useTournamentResults';
import { calculateTotalPrizePool, formatPrizeDistribution, formatCurrency } from '@/utils/prizeUtils';

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

export const EnhancedTournamentDetailsModal: React.FC<EnhancedTournamentDetailsModalProps> = ({
  tournament,
  open,
  onOpenChange
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  // Real-time data hooks
  const { registrations, loading: registrationsLoading } = useTournamentRegistrations(tournament?.id || '');
  const { matches, loading: matchesLoading } = useTournamentMatches(tournament?.id || null);
  const { results, loading: resultsLoading } = useTournamentResults(tournament?.id);

  if (!tournament) {
    return null;
  }

  const confirmedParticipants = registrations.filter(reg => 
    ['confirmed', 'paid'].includes(reg.registration_status.toLowerCase())
  ).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <DialogTitle className="text-2xl font-bold">{tournament.name}</DialogTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(tournament.tournament_start).toLocaleDateString('vi-VN')}
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {tournament.venue_address}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {confirmedParticipants}/{tournament.max_participants}
                </div>
              </div>
            </div>
            <Badge className={`${getStatusColor(tournament.status)} text-white`}>
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Tổng quan</TabsTrigger>
            <TabsTrigger value="participants">
              Người tham gia {!registrationsLoading && `(${confirmedParticipants})`}
            </TabsTrigger>
            <TabsTrigger value="bracket">
              Bảng đấu {!matchesLoading && matches.length > 0 && `(${matches.length})`}
            </TabsTrigger>
            <TabsTrigger value="results">
              Kết quả {!resultsLoading && results.length > 0 && `(${results.length})`}
            </TabsTrigger>
            <TabsTrigger value="awards">Giải thưởng</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tournament Information */}
              <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  Thông tin giải đấu
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-blue-500" />
                    <span className="text-muted-foreground">Loại giải:</span>
                    <span className="font-medium ml-auto">{tournament.tournament_type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-purple-500" />
                    <span className="text-muted-foreground">Hình thức:</span>
                    <span className="font-medium ml-auto">{tournament.game_format}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-indigo-500" />
                    <span className="text-muted-foreground">Cấp độ:</span>
                    <span className="font-medium ml-auto">Tier {tournament.tier_level}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="text-muted-foreground">Lệ phí:</span>
                    <span className="font-medium text-green-600 ml-auto">
                      {tournament.entry_fee.toLocaleString('vi-VN')} VNĐ
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Gift className="h-4 w-4 text-amber-600" />
                    <span className="text-muted-foreground">Tổng giải thưởng:</span>
                    <span className="font-medium text-orange-600 ml-auto">
                      {formatCurrency(calculateTotalPrizePool(tournament))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Schedule */}
              <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-green-500" />
                  Lịch trình
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span className="text-muted-foreground">Mở đăng ký:</span>
                    <span className="font-medium ml-auto">
                      {new Date(tournament.registration_start).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-500" />
                    <span className="text-muted-foreground">Đóng đăng ký:</span>
                    <span className="font-medium ml-auto">
                      {new Date(tournament.registration_end).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-green-500" />
                    <span className="text-muted-foreground">Bắt đầu:</span>
                    <span className="font-medium ml-auto">
                      {new Date(tournament.tournament_start).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-amber-500" />
                    <span className="text-muted-foreground">Kết thúc:</span>
                    <span className="font-medium ml-auto">
                      {new Date(tournament.tournament_end).toLocaleString('vi-VN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-indigo-500" />
                  Thống kê
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span className="text-muted-foreground">Người tham gia:</span>
                    <span className="font-medium ml-auto">
                      {confirmedParticipants} / {tournament.max_participants}
                    </span>
                  </div>
                  {matches.length > 0 && (
                    <>
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-yellow-500" />
                        <span className="text-muted-foreground">Trận đấu:</span>
                        <span className="font-medium ml-auto">
                          {matches.filter(m => m.status === 'completed').length} / {matches.length}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="text-muted-foreground">Tiến độ:</span>
                        <span className="font-medium ml-auto">
                          {matches.length > 0 ? Math.round((matches.filter(m => m.status === 'completed').length / matches.length) * 100) : 0}%
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Location */}
              <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-red-500" />
                  Địa điểm
                </h3>
                <p className="text-muted-foreground">{tournament.venue_address}</p>
                {tournament.contact_info && (
                  <div className="pt-2 border-t">
                    <p className="text-sm font-medium mb-1">Liên hệ:</p>
                    <p className="text-sm text-muted-foreground">{tournament.contact_info}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Description & Rules */}
            {(tournament.description || tournament.rules) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tournament.description && (
                  <div className="space-y-2 p-4 border rounded-lg">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <FileText className="h-5 w-5 text-slate-500" />
                      Mô tả
                    </h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {tournament.description}
                    </p>
                  </div>
                )}

                {tournament.rules && (
                  <div className="space-y-2 p-4 border rounded-lg">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Award className="h-5 w-5 text-orange-500" />
                      Luật chơi
                    </h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {tournament.rules}
                    </p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="participants">
            <TournamentParticipantsTab 
              tournamentId={tournament.id}
              maxParticipants={tournament.max_participants}
            />
          </TabsContent>

          <TabsContent value="bracket">
          <BracketVisualization 
            tournamentId={tournament.id}
          />
          </TabsContent>

          <TabsContent value="results">
            <TournamentResults tournamentId={tournament.id} />
          </TabsContent>

          <TabsContent value="awards" className="space-y-6">
            {/* Prize Configuration */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Gift className="h-5 w-5 text-amber-500" />
                <h3 className="text-lg font-semibold">Cấu hình giải thưởng</h3>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Prize Money Distribution */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <h4 className="font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    Giải thưởng tiền mặt
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                      <span className="font-medium">Tổng giải thưởng:</span>
                      <span className="font-bold text-green-600">
                        {formatCurrency(calculateTotalPrizePool(tournament))}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {formatPrizeDistribution(tournament).map((prize, index) => (
                        <div key={index} className="flex justify-between items-center p-2 rounded text-sm">
                          <span className="text-muted-foreground">{prize.position}:</span>
                          <span className="font-medium">{formatCurrency(prize.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* SPA & ELO Points */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <h4 className="font-medium flex items-center gap-2">
                    <Zap className="h-4 w-4 text-blue-600" />
                    Điểm thưởng
                  </h4>
                  <div className="space-y-3">
                    {tournament.spa_points_config && (
                      <div>
                        <span className="text-sm font-medium text-blue-600">SPA Points:</span>
                        <p className="text-sm text-muted-foreground mt-1">
                          Cấu hình điểm SPA theo vị trí hoàn thành
                        </p>
                      </div>
                    )}
                    {tournament.elo_points_config && (
                      <div>
                        <span className="text-sm font-medium text-purple-600">ELO Points:</span>
                        <p className="text-sm text-muted-foreground mt-1">
                          Cấu hình điểm ELO theo kết quả trận đấu
                        </p>
                      </div>
                    )}
                    {(!tournament.spa_points_config && !tournament.elo_points_config) && (
                      <p className="text-sm text-muted-foreground">
                        Chưa cấu hình điểm thưởng
                      </p>
                    )}
                  </div>
                </div>

                {/* Physical Prizes */}
                {tournament.physical_prizes && Array.isArray(tournament.physical_prizes) && tournament.physical_prizes.length > 0 && (
                  <div className="space-y-4 p-4 border rounded-lg lg:col-span-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-amber-600" />
                      Giải thưởng vật phẩm
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {tournament.physical_prizes.map((prize: any, index: number) => (
                        <div key={index} className="p-3 bg-muted/50 rounded text-sm">
                          <div className="font-medium">{prize.name || `Giải ${index + 1}`}</div>
                          {prize.description && (
                            <div className="text-muted-foreground mt-1">{prize.description}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tournament Results (if completed) */}
            {tournament.status === 'completed' && (
              <div className="border-t pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="h-5 w-5 text-green-500" />
                  <h3 className="text-lg font-semibold">Kết quả cuối cùng</h3>
                </div>
                <TournamentResults 
                  tournamentId={tournament.id} 
                  showTitle={false}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
