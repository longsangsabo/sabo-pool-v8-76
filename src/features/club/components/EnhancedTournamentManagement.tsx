import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { 
  Trophy, 
  Users, 
  Calendar, 
  Play, 
  Pause, 
  RotateCcw,
  Plus,
  Edit,
  Settings,
  Award,
  Clock,
  Target
} from 'lucide-react';

interface Tournament {
  id: string;
  name: string;
  type: 'single_elimination' | 'double_elimination' | 'round_robin';
  status: 'draft' | 'registration' | 'in_progress' | 'completed';
  max_participants: number;
  current_participants: number;
  entry_fee: number;
  prize_pool: number;
  start_date: string;
  created_at: string;
}

interface Match {
  id: string;
  round: number;
  match_number: number;
  player1?: string;
  player2?: string;
  player1_score: number;
  player2_score: number;
  status: 'pending' | 'in_progress' | 'completed';
  scheduled_at?: string;
  winner?: string;
}

export const EnhancedTournamentManagement = () => {
  const [selectedTournament, setSelectedTournament] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Mock data
  const tournaments: Tournament[] = [
    {
      id: '1',
      name: 'Giải vô địch CLB tháng 1',
      type: 'single_elimination',
      status: 'registration',
      max_participants: 32,
      current_participants: 18,
      entry_fee: 100000,
      prize_pool: 3000000,
      start_date: '2024-02-01T09:00:00Z',
      created_at: '2024-01-15T10:00:00Z'
    },
    {
      id: '2',
      name: 'Giải giao hữu cuối tuần',
      type: 'round_robin',
      status: 'in_progress',
      max_participants: 16,
      current_participants: 16,
      entry_fee: 50000,
      prize_pool: 800000,
      start_date: '2024-01-20T14:00:00Z',
      created_at: '2024-01-10T15:00:00Z'
    }
  ];

  const matches: Match[] = [
    {
      id: '1',
      round: 1,
      match_number: 1,
      player1: 'Nguyễn Văn A',
      player2: 'Trần Văn B',
      player1_score: 5,
      player2_score: 3,
      status: 'completed',
      winner: 'Nguyễn Văn A'
    },
    {
      id: '2',
      round: 1,
      match_number: 2,
      player1: 'Lê Thị C',
      player2: 'Phạm Văn D',
      player1_score: 0,
      player2_score: 0,
      status: 'in_progress',
      scheduled_at: '2024-01-20T16:00:00Z'
    },
    {
      id: '3',
      round: 2,
      match_number: 1,
      player1: 'Nguyễn Văn A',
      player1_score: 0,
      player2_score: 0,
      status: 'pending'
    }
  ];

  const getStatusBadge = (status: Tournament['status']) => {
    const variants = {
      draft: { variant: 'outline' as const, text: 'Nháp', color: 'text-gray-500' },
      registration: { variant: 'secondary' as const, text: 'Đăng ký', color: 'text-blue-500' },
      in_progress: { variant: 'default' as const, text: 'Đang diễn ra', color: 'text-green-500' },
      completed: { variant: 'destructive' as const, text: 'Hoàn thành', color: 'text-red-500' }
    };
    
    const { variant, text } = variants[status];
    return <Badge variant={variant}>{text}</Badge>;
  };

  const getTypeLabel = (type: Tournament['type']) => {
    const labels = {
      single_elimination: 'Loại trực tiếp',
      double_elimination: 'Loại kép',
      round_robin: 'Vòng tròn'
    };
    return labels[type];
  };

  const TournamentBracket = ({ tournamentId }: { tournamentId: string }) => {
    const tournamentMatches = matches.filter(m => true); // In real app, filter by tournament

    const renderMatch = (match: Match) => (
      <Card key={match.id} className="min-w-[280px] mb-4">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Trận {match.match_number}</span>
            <Badge variant={match.status === 'completed' ? 'default' : 'secondary'}>
              {match.status === 'completed' ? 'Hoàn thành' : 
               match.status === 'in_progress' ? 'Đang đấu' : 'Chờ đấu'}
            </Badge>
          </div>

          <div className="space-y-2">
            <div className={`flex justify-between items-center p-2 rounded ${
              match.winner === match.player1 ? 'bg-green-100 border-l-4 border-green-500' : 'bg-gray-50'
            }`}>
              <span className="font-medium">{match.player1 || 'TBD'}</span>
              <span className="text-lg font-bold">{match.player1_score}</span>
            </div>
            
            <div className={`flex justify-between items-center p-2 rounded ${
              match.winner === match.player2 ? 'bg-green-100 border-l-4 border-green-500' : 'bg-gray-50'
            }`}>
              <span className="font-medium">{match.player2 || 'TBD'}</span>
              <span className="text-lg font-bold">{match.player2_score}</span>
            </div>
          </div>

          {match.scheduled_at && (
            <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(match.scheduled_at).toLocaleString('vi-VN')}
            </div>
          )}

          {match.status !== 'completed' && (match.player1 && match.player2) && (
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="outline" className="flex-1">
                <Edit className="h-3 w-3 mr-1" />
                Cập nhật tỷ số
              </Button>
              {match.status === 'pending' && (
                <Button size="sm" className="flex-1">
                  <Play className="h-3 w-3 mr-1" />
                  Bắt đầu
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );

    const groupedMatches = matches.reduce((acc, match) => {
      if (!acc[match.round]) acc[match.round] = [];
      acc[match.round].push(match);
      return acc;
    }, {} as Record<number, Match[]>);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Bracket giải đấu</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Cài đặt bracket
            </Button>
            <Button variant="outline" size="sm">
              <RotateCcw className="h-4 w-4 mr-2" />
              Làm mới
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="flex gap-8 min-w-max p-4">
            {Object.entries(groupedMatches)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([round, roundMatches]) => (
                <div key={round} className="flex flex-col">
                  <h4 className="text-center font-semibold mb-4 text-sm uppercase tracking-wide">
                    {round === '1' ? 'Vòng 1' : 
                     round === '2' ? 'Tứ kết' : 
                     round === '3' ? 'Bán kết' : 
                     'Chung kết'}
                  </h4>
                  <div className="space-y-4">
                    {roundMatches.map(renderMatch)}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    );
  };

  const CreateTournamentForm = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Tạo giải đấu mới
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Tên giải đấu</Label>
            <Input placeholder="VD: Giải vô địch CLB tháng 2" />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="type">Thể thức</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Chọn thể thức" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single_elimination">Loại trực tiếp</SelectItem>
                <SelectItem value="double_elimination">Loại kép</SelectItem>
                <SelectItem value="round_robin">Vòng tròn</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="max_participants">Số người tối đa</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Chọn số người" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="8">8 người</SelectItem>
                <SelectItem value="16">16 người</SelectItem>
                <SelectItem value="32">32 người</SelectItem>
                <SelectItem value="64">64 người</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="entry_fee">Phí tham gia (VNĐ)</Label>
            <Input type="number" placeholder="100,000" />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="start_date">Ngày bắt đầu</Label>
            <Input type="datetime-local" />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setShowCreateForm(false)}>
            Hủy
          </Button>
          <Button>
            <Trophy className="h-4 w-4 mr-2" />
            Tạo giải đấu
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Quản lý giải đấu</h2>
          <p className="text-muted-foreground">Tổ chức và theo dõi các giải đấu billiards</p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Tạo giải đấu
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tổng giải đấu</p>
                <p className="text-2xl font-bold">{tournaments.length}</p>
              </div>
              <Trophy className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Đang diễn ra</p>
                <p className="text-2xl font-bold">
                  {tournaments.filter(t => t.status === 'in_progress').length}
                </p>
              </div>
              <Play className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tổng người tham gia</p>
                <p className="text-2xl font-bold">
                  {tournaments.reduce((sum, t) => sum + t.current_participants, 0)}
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tổng giải thưởng</p>
                <p className="text-lg font-bold">
                  {tournaments.reduce((sum, t) => sum + t.prize_pool, 0).toLocaleString()} VNĐ
                </p>
              </div>
              <Award className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Tournament Form */}
      {showCreateForm && <CreateTournamentForm />}

      {/* Tournament List */}
      <div className="grid gap-4">
        {tournaments.map((tournament) => (
          <Card key={tournament.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">{tournament.name}</h3>
                    {getStatusBadge(tournament.status)}
                    <Badge variant="outline">{getTypeLabel(tournament.type)}</Badge>
                  </div>

                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {tournament.current_participants}/{tournament.max_participants} người
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="h-4 w-4" />
                      {tournament.entry_fee.toLocaleString()} VNĐ
                    </div>
                    <div className="flex items-center gap-1">
                      <Award className="h-4 w-4" />
                      {tournament.prize_pool.toLocaleString()} VNĐ
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(tournament.start_date).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedTournament(
                      selectedTournament === tournament.id ? null : tournament.id
                    )}
                  >
                    {selectedTournament === tournament.id ? 'Ẩn bracket' : 'Xem bracket'}
                  </Button>
                  <Button size="sm">
                    <Settings className="h-4 w-4 mr-1" />
                    Quản lý
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tournament Bracket */}
      {selectedTournament && (
        <Card>
          <CardContent className="p-6">
            <TournamentBracket tournamentId={selectedTournament} />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedTournamentManagement;
