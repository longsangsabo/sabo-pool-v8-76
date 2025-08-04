import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Trophy,
  Calendar,
  Users,
  MapPin,
  DollarSign,
  Clock,
  Filter,
  Search,
  Plus,
  TrendingUp,
} from 'lucide-react';
import TournamentCard from './TournamentCard';
import TournamentFeedCard from './TournamentFeedCard';

interface Tournament {
  id: string;
  name: string;
  description: string;
  tournament_start: string;
  tournament_end: string;
  status: 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled';
  max_participants: number;
  current_participants: number;
  entry_fee: number;
  prize_pool: number;
  tournament_type: string;
  venue_name?: string;
  venue_address?: string;
  created_by: string;
  club_id?: string;
}

interface UserTournament extends Tournament {
  registration_status: 'registered' | 'confirmed' | 'cancelled';
  registration_date: string;
  final_position?: number;
  prize_won?: number;
}

interface UserTournamentsProps {
  className?: string;
}

const UserTournaments: React.FC<UserTournamentsProps> = ({ className }) => {
  const { user } = useAuth();
  const [availableTournaments, setAvailableTournaments] = useState<Tournament[]>([]);
  const [myTournaments, setMyTournaments] = useState<UserTournament[]>([]);
  const [completedTournaments, setCompletedTournaments] = useState<UserTournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('available');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (user) {
      fetchTournaments();
    }
  }, [user]);

  const fetchTournaments = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch available tournaments (not registered yet)
      const { data: available, error: availableError } = await supabase
        .from('tournaments')
        .select('*')
        .eq('status', 'open')
        .not('id', 'in', 
          `(SELECT tournament_id FROM tournament_registrations WHERE user_id = '${user.id}')`
        );

      if (availableError) throw availableError;

      // Fetch my tournaments (registered/ongoing)
      const { data: myTournamentsData, error: myError } = await supabase
        .from('tournament_registrations')
        .select(`
          registration_status,
          registration_date,
          final_position,
          prize_won,
          tournaments (*)
        `)
        .eq('user_id', user.id)
        .in('registration_status', ['registered', 'confirmed'])
        .in('tournaments.status', ['open', 'in_progress']);

      if (myError) throw myError;

      // Fetch completed tournaments
      const { data: completedData, error: completedError } = await supabase
        .from('tournament_registrations')
        .select(`
          registration_status,
          registration_date,
          final_position,
          prize_won,
          tournaments (*)
        `)
        .eq('user_id', user.id)
        .eq('tournaments.status', 'completed');

      if (completedError) throw completedError;

      setAvailableTournaments(available || []);
      setMyTournaments(
        myTournamentsData?.map(reg => ({
          ...(reg.tournaments as Tournament),
          registration_status: reg.registration_status,
          registration_date: reg.registration_date,
          final_position: reg.final_position,
          prize_won: reg.prize_won,
        })) || []
      );
      setCompletedTournaments(
        completedData?.map(reg => ({
          ...(reg.tournaments as Tournament),
          registration_status: reg.registration_status,
          registration_date: reg.registration_date,
          final_position: reg.final_position,
          prize_won: reg.prize_won,
        })) || []
      );
    } catch (error: any) {
      console.error('Error fetching tournaments:', error);
      toast.error('Lỗi khi tải danh sách giải đấu');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (tournamentId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('tournament_registrations')
        .insert({
          tournament_id: tournamentId,
          user_id: user.id,
          registration_status: 'registered',
        });

      if (error) throw error;

      toast.success('Đăng ký giải đấu thành công!');
      fetchTournaments(); // Refresh data
    } catch (error: any) {
      console.error('Error registering for tournament:', error);
      toast.error('Lỗi khi đăng ký giải đấu');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      open: { label: 'Mở đăng ký', color: 'bg-green-100 text-green-800' },
      in_progress: { label: 'Đang diễn ra', color: 'bg-blue-100 text-blue-800' },
      completed: { label: 'Đã kết thúc', color: 'bg-gray-100 text-gray-800' },
      cancelled: { label: 'Đã hủy', color: 'bg-red-100 text-red-800' },
      draft: { label: 'Nháp', color: 'bg-yellow-100 text-yellow-800' },
    };
    const status_info = statusMap[status as keyof typeof statusMap];
    return (
      <Badge className={status_info.color}>
        {status_info.label}
      </Badge>
    );
  };

  const filteredTournaments = (tournaments: Tournament[]) => {
    return tournaments.filter(tournament => {
      const matchesSearch = tournament.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filter === 'all' || tournament.tournament_type === filter;
      return matchesSearch && matchesFilter;
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Giải đấu</h2>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Tạo giải đấu
        </Button>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm giải đấu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả</option>
              <option value="single_elimination">Loại trực tiếp</option>
              <option value="round_robin">Vòng tròn</option>
              <option value="swiss">Swiss</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="available">
            Có thể tham gia ({availableTournaments.length})
          </TabsTrigger>
          <TabsTrigger value="my_tournaments">
            Đang tham gia ({myTournaments.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Đã hoàn thành ({completedTournaments.length})
          </TabsTrigger>
        </TabsList>

        {/* Available Tournaments */}
        <TabsContent value="available" className="space-y-4">
          {filteredTournaments(availableTournaments).length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">Không có giải đấu nào phù hợp</p>
              </CardContent>
            </Card>
          ) : (
            filteredTournaments(availableTournaments).map(tournament => (
              <TournamentFeedCard
                key={tournament.id}
                tournament={{
                  ...tournament,
                  organizer: {
                    id: tournament.created_by,
                    name: 'Organizer',
                    avatar: '',
                    rank: 'K',
                  },
                  club_name: tournament.venue_name || 'SABO Arena',
                }}
                onRegister={() => handleRegister(tournament.id)}
              />
            ))
          )}
        </TabsContent>

        {/* My Tournaments */}
        <TabsContent value="my_tournaments" className="space-y-4">
          {myTournaments.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">Bạn chưa tham gia giải đấu nào</p>
              </CardContent>
            </Card>
          ) : (
            myTournaments.map(tournament => (
              <Card key={tournament.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{tournament.name}</h3>
                      <p className="text-gray-600">{tournament.description}</p>
                    </div>
                    {getStatusBadge(tournament.status)}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span>{new Date(tournament.tournament_start).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span>{tournament.current_participants}/{tournament.max_participants}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      <span>{tournament.prize_pool.toLocaleString()} VNĐ</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-gray-500" />
                      <Badge variant="outline">
                        {tournament.registration_status === 'confirmed' ? 'Đã xác nhận' : 'Chờ xác nhận'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Completed Tournaments */}
        <TabsContent value="completed" className="space-y-4">
          {completedTournaments.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">Bạn chưa hoàn thành giải đấu nào</p>
              </CardContent>
            </Card>
          ) : (
            completedTournaments.map(tournament => (
              <Card key={tournament.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{tournament.name}</h3>
                      <p className="text-gray-600">{tournament.description}</p>
                    </div>
                    <div className="text-right">
                      {tournament.final_position && (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          Vị trí: #{tournament.final_position}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span>{new Date(tournament.tournament_end).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span>{tournament.current_participants} người tham gia</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      <span>{tournament.prize_pool.toLocaleString()} VNĐ</span>
                    </div>
                    {tournament.prize_won && (
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="text-green-600 font-medium">
                          +{tournament.prize_won.toLocaleString()} VNĐ
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserTournaments;
