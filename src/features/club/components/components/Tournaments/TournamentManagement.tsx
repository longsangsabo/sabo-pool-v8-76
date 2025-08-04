import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Trophy, 
  Users, 
  Calendar,
  Clock,
  Star,
  Eye,
  Edit,
  Plus,
  Search,
  Settings,
  Target,
  Award
} from 'lucide-react';

// Import TournamentForm from legacy system
import { TournamentForm } from '@/features/club-management/components/tournament/TournamentForm';

interface Tournament {
  id: number;
  name: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  type: 'single' | 'double' | 'league';
  participants: number;
  maxParticipants: number;
  startDate: string;
  endDate?: string;
  entryFee: number;
  prizePool: number;
  description: string;
}

interface TournamentManagementProps {
  clubId: string;
}

export const TournamentManagement: React.FC<TournamentManagementProps> = ({ clubId }) => {
  const [tournaments, setTournaments] = useState<Tournament[]>([
    {
      id: 1,
      name: 'Giải Pool CLB tháng 12',
      status: 'ongoing',
      type: 'single',
      participants: 16,
      maxParticipants: 32,
      startDate: '2024-12-15',
      entryFee: 100000,
      prizePool: 3000000,
      description: 'Giải Pool đơn hàng tháng của CLB',
    },
    {
      id: 2,
      name: 'Giải Pool cặp đôi',
      status: 'upcoming',
      type: 'double',
      participants: 8,
      maxParticipants: 16,
      startDate: '2024-12-20',
      entryFee: 150000,
      prizePool: 2000000,
      description: 'Giải Pool theo cặp đôi, sẽ được tổ chức vào cuối tháng',
    },
    {
      id: 3,
      name: 'Giải Championship 2024',
      status: 'completed',
      type: 'single',
      participants: 32,
      maxParticipants: 32,
      startDate: '2024-11-01',
      endDate: '2024-11-30',
      entryFee: 200000,
      prizePool: 5000000,
      description: 'Giải Pool lớn nhất năm của CLB',
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);

  // Handle tournament creation
  const handleCreateTournament = async (data: any) => {
    try {
      // Here you would normally call API to create tournament
      const newTournament: Tournament = {
        id: tournaments.length + 1,
        name: data.name,
        status: 'upcoming',
        type: data.tournament_type === 'single_elimination' ? 'single' : 'double',
        participants: 0,
        maxParticipants: data.max_participants,
        startDate: data.tournament_start.toISOString().split('T')[0],
        entryFee: data.entry_fee,
        prizePool: data.prize_pool,
        description: data.description,
      };

      setTournaments(prev => [...prev, newTournament]);
      setShowCreateDialog(false);
      toast.success('Tạo giải đấu thành công!');
    } catch (error) {
      toast.error('Có lỗi xảy ra khi tạo giải đấu');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-500';
      case 'ongoing': return 'bg-green-500';
      case 'completed': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'upcoming': return 'Sắp diễn ra';
      case 'ongoing': return 'Đang diễn ra';
      case 'completed': return 'Đã kết thúc';
      default: return 'Không xác định';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'single': return 'Đơn';
      case 'double': return 'Kép';
      case 'league': return 'Giải đấu';
      default: return 'Không xác định';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const filteredTournaments = tournaments.filter(tournament => {
    const matchesSearch = tournament.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || tournament.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Quản lý Giải đấu</h2>
          <p className="text-muted-foreground">Tạo và quản lý các giải đấu CLB</p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Tạo giải đấu mới
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tạo giải đấu mới</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <TournamentForm onSubmit={handleCreateTournament} />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tournament Management Tabs */}
      <Tabs defaultValue="tournaments" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tournaments" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Giải đấu
          </TabsTrigger>
          <TabsTrigger value="participants" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Thành viên
          </TabsTrigger>
          <TabsTrigger value="brackets" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Bảng đấu
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Kết quả
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tournaments" className="space-y-6">
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Trophy className="h-8 w-8 text-yellow-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Tổng giải đấu</p>
                    <p className="text-2xl font-bold">{tournaments.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-green-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Đang diễn ra</p>
                    <p className="text-2xl font-bold">
                      {tournaments.filter(t => t.status === 'ongoing').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Tổng thành viên</p>
                    <p className="text-2xl font-bold">
                      {tournaments.reduce((acc, t) => acc + t.participants, 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Star className="h-8 w-8 text-purple-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Tổng giải thưởng</p>
                    <p className="text-2xl font-bold">
                      {tournaments.reduce((acc, t) => acc + t.prizePool, 0).toLocaleString()}đ
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Tìm kiếm giải đấu..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={statusFilter === 'all' ? 'default' : 'outline'}
                    onClick={() => setStatusFilter('all')}
                    size="sm"
                  >
                    Tất cả
                  </Button>
                  <Button
                    variant={statusFilter === 'upcoming' ? 'default' : 'outline'}
                    onClick={() => setStatusFilter('upcoming')}
                    size="sm"
                  >
                    Sắp diễn ra
                  </Button>
                  <Button
                    variant={statusFilter === 'ongoing' ? 'default' : 'outline'}
                    onClick={() => setStatusFilter('ongoing')}
                    size="sm"
                  >
                    Đang diễn ra
                  </Button>
                  <Button
                    variant={statusFilter === 'completed' ? 'default' : 'outline'}
                    onClick={() => setStatusFilter('completed')}
                    size="sm"
                  >
                    Đã kết thúc
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tournaments List */}
          <div className="grid gap-4">
            {filteredTournaments.map((tournament) => (
              <Card key={tournament.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        <h3 className="text-lg font-semibold">{tournament.name}</h3>
                        <Badge className={`${getStatusColor(tournament.status)} text-white`}>
                          {getStatusText(tournament.status)}
                        </Badge>
                        <Badge variant="outline">
                          {getTypeText(tournament.type)}
                        </Badge>
                      </div>

                      <p className="text-muted-foreground mb-4">{tournament.description}</p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>{tournament.participants}/{tournament.maxParticipants} người</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(tournament.startDate)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>Phí: {tournament.entryFee.toLocaleString()}đ</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4" />
                          <span>Giải: {tournament.prizePool.toLocaleString()}đ</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" />
                        Xem
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4 mr-1" />
                        Sửa
                      </Button>
                      <Button size="sm" variant="outline">
                        <Settings className="h-4 w-4 mr-1" />
                        Quản lý
                      </Button>
                    </div>
                  </div>

                  {/* Progress Bar for ongoing tournaments */}
                  {tournament.status === 'ongoing' && (
                    <div className="mt-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Tiến độ</span>
                        <span>{Math.round((tournament.participants / tournament.maxParticipants) * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(tournament.participants / tournament.maxParticipants) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredTournaments.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Không có giải đấu nào</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Không tìm thấy giải đấu phù hợp với bộ lọc của bạn.'
                    : 'Chưa có giải đấu nào được tạo. Hãy tạo giải đấu đầu tiên!'
                  }
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tạo giải đấu mới
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="participants" className="space-y-6">
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Quản lý thành viên</h3>
              <p className="text-muted-foreground mb-4">
                Xem và quản lý thành viên tham gia các giải đấu
              </p>
              <Button variant="outline">
                Xem danh sách thành viên
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="brackets" className="space-y-6">
          <Card>
            <CardContent className="p-8 text-center">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Bảng đấu</h3>
              <p className="text-muted-foreground mb-4">
                Tạo và quản lý bảng đấu cho các giải đấu
              </p>
              <Button variant="outline">
                Tạo bảng đấu
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          <Card>
            <CardContent className="p-8 text-center">
              <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Kết quả giải đấu</h3>
              <p className="text-muted-foreground mb-4">
                Xem kết quả và thống kê của các giải đấu
              </p>
              <Button variant="outline">
                Xem kết quả
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
