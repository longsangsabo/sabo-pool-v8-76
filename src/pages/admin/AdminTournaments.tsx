import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Search,
  Eye,
  Settings,
  Users,
  Trophy,
  Clock,
  MapPin,
  DollarSign,
  UserPlus,
  Zap,
  Trash2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { TournamentParticipantManager } from '@/components/admin/TournamentParticipantManager';
import { QuickAddUserDialog } from '@/components/admin/QuickAddUserDialog';
import { useTournamentUtils } from '@/hooks/useTournamentUtils';

interface Tournament {
  id: string;
  name: string;
  status: string;
  max_participants: number;
  current_participants: number;
  tournament_type: string;
  game_format: string;
  entry_fee: number;
  prize_pool: number;
  registration_start: string;
  registration_end: string;
  tournament_start: string;
  tournament_end: string;
  venue_address: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

const AdminTournaments: React.FC = () => {
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTournament, setSelectedTournament] =
    useState<Tournament | null>(null);
  const [isParticipantModalOpen, setIsParticipantModalOpen] = useState(false);
  const [isQuickAddModalOpen, setIsQuickAddModalOpen] = useState(false);
  const { toast } = useToast();
  const { deleteTournament, isLoading: tournamentUtilsLoading } =
    useTournamentUtils();

  useEffect(() => {
    if (isAdmin) {
      loadTournaments();
    }
  }, [isAdmin]);

  const loadTournaments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select(
          `
          id, name, status, max_participants, tournament_type, game_format,
          entry_fee, prize_pool, registration_start, registration_end,
          tournament_start, tournament_end, venue_address, created_by,
          created_at, updated_at
        `
        )
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate current participants
      const tournamentsWithCounts = await Promise.all(
        (data || []).map(async tournament => {
          const { count } = await supabase
            .from('tournament_registrations')
            .select('*', { count: 'exact', head: true })
            .eq('tournament_id', tournament.id)
            .eq('registration_status', 'confirmed');

          return {
            ...tournament,
            current_participants: count || 0,
          };
        })
      );

      setTournaments(tournamentsWithCounts);
    } catch (error) {
      console.error('Error loading tournaments:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách giải đấu',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'registration_open':
        return 'bg-green-100 text-green-800';
      case 'registration_closed':
        return 'bg-yellow-100 text-yellow-800';
      case 'ongoing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'registration_open':
        return 'Đang mở ĐK';
      case 'registration_closed':
        return 'Đã đóng ĐK';
      case 'ongoing':
        return 'Đang diễn ra';
      case 'completed':
        return 'Đã kết thúc';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const filteredTournaments = tournaments.filter(tournament => {
    const matchesSearch =
      !searchQuery ||
      tournament.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tournament.venue_address
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || tournament.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const openParticipantModal = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    setIsParticipantModalOpen(true);
  };

  const closeParticipantModal = () => {
    setSelectedTournament(null);
    setIsParticipantModalOpen(false);
  };

  const handleParticipantsUpdated = () => {
    loadTournaments(); // Reload tournaments to update participant counts
  };

  const handleDeleteTournament = async (
    tournamentId: string,
    tournamentName: string
  ) => {
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn xóa hoàn toàn giải đấu "${tournamentName}"?\n\n` +
        `⚠️ CẢNH BÁO: Hành động này sẽ:\n` +
        `• Xóa vĩnh viễn tất cả dữ liệu giải đấu\n` +
        `• Xóa tất cả đăng ký tham gia\n` +
        `• Xóa tất cả trận đấu và kết quả\n` +
        `• KHÔNG THỂ hoàn tác!\n\n` +
        `Nhập "XOA" để xác nhận:`
    );

    if (!confirmed) return;

    const confirmText = prompt('Nhập "XOA" để xác nhận xóa hoàn toàn:');
    if (confirmText !== 'XOA') {
      toast({
        title: 'Hủy bỏ',
        description: 'Không xóa giải đấu do xác nhận không đúng',
        variant: 'default',
      });
      return;
    }

    try {
      const success = await deleteTournament(tournamentId);
      if (success) {
        toast({
          title: 'Thành công',
          description: `Đã xóa hoàn toàn giải đấu "${tournamentName}"`,
          variant: 'default',
        });
        loadTournaments(); // Reload the tournaments list
      }
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể xóa giải đấu. Vui lòng thử lại.',
        variant: 'destructive',
      });
    }
  };

  if (adminLoading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500'></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-center'>
          <h2 className='text-2xl font-bold text-gray-900 mb-4'>
            Truy cập bị từ chối
          </h2>
          <p className='text-gray-600'>Bạn không có quyền truy cập trang này</p>
        </div>
      </div>
    );
  }

  return (
    <div className='p-6 max-w-7xl mx-auto'>
      <div className='mb-6'>
        <h1 className='text-3xl font-bold text-foreground mb-2'>
          🏆 Quản lý Giải đấu
        </h1>
        <p className='text-muted-foreground'>
          Xem và quản lý tất cả giải đấu trong hệ thống
        </p>
      </div>

      {/* Search and Filters */}
      <div className='flex gap-4 mb-6'>
        <div className='flex-1 relative'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
          <Input
            placeholder='Tìm kiếm giải đấu...'
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className='pl-10'
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className='w-48'>
            <SelectValue placeholder='Trạng thái' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>Tất cả</SelectItem>
            <SelectItem value='registration_open'>Đang mở ĐK</SelectItem>
            <SelectItem value='registration_closed'>Đã đóng ĐK</SelectItem>
            <SelectItem value='ongoing'>Đang diễn ra</SelectItem>
            <SelectItem value='completed'>Đã kết thúc</SelectItem>
            <SelectItem value='cancelled'>Đã hủy</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={loadTournaments} disabled={loading}>
          {loading ? 'Đang tải...' : 'Làm mới'}
        </Button>
        <Button
          onClick={() => setIsQuickAddModalOpen(true)}
          className='bg-blue-600 hover:bg-blue-700 text-white'
          disabled={loading}
        >
          <Zap className='h-4 w-4 mr-2' />
          Thêm nhanh User
        </Button>
      </div>

      {/* Tournaments List */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {filteredTournaments.map(tournament => (
          <Card
            key={tournament.id}
            className='hover:shadow-lg transition-shadow'
          >
            <CardHeader>
              <div className='flex items-start justify-between'>
                <div className='flex-1'>
                  <CardTitle className='text-lg line-clamp-2'>
                    {tournament.name}
                  </CardTitle>
                  <div className='flex items-center gap-2 mt-2'>
                    <Badge className={getStatusColor(tournament.status)}>
                      {getStatusText(tournament.status)}
                    </Badge>
                    <Badge variant='outline'>
                      {tournament.tournament_type}
                    </Badge>
                  </div>
                </div>
                <div className='flex gap-2'>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => openParticipantModal(tournament)}
                    title='Quản lý người tham gia'
                  >
                    <UserPlus className='h-4 w-4' />
                  </Button>
                  <Button size='sm' variant='outline'>
                    <Eye className='h-4 w-4' />
                  </Button>
                  <Button size='sm' variant='outline'>
                    <Settings className='h-4 w-4' />
                  </Button>
                  <Button
                    size='sm'
                    variant='destructive'
                    onClick={() =>
                      handleDeleteTournament(tournament.id, tournament.name)
                    }
                    title='Xóa hoàn toàn giải đấu'
                    disabled={tournamentUtilsLoading}
                  >
                    <Trash2 className='h-4 w-4' />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className='space-y-4'>
              {/* Participants */}
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <Users className='h-4 w-4 text-blue-500' />
                  <span className='text-sm'>Người tham gia</span>
                </div>
                <span className='font-medium'>
                  {tournament.current_participants}/
                  {tournament.max_participants}
                </span>
              </div>

              {/* Prize Pool */}
              {tournament.prize_pool > 0 && (
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <Trophy className='h-4 w-4 text-yellow-500' />
                    <span className='text-sm'>Giải thưởng</span>
                  </div>
                  <span className='font-medium text-yellow-600'>
                    {formatCurrency(tournament.prize_pool)}
                  </span>
                </div>
              )}

              {/* Entry Fee */}
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <DollarSign className='h-4 w-4 text-green-500' />
                  <span className='text-sm'>Phí tham gia</span>
                </div>
                <span className='font-medium'>
                  {tournament.entry_fee === 0
                    ? 'Miễn phí'
                    : formatCurrency(tournament.entry_fee)}
                </span>
              </div>

              {/* Date */}
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <Clock className='h-4 w-4 text-purple-500' />
                  <span className='text-sm'>Thời gian</span>
                </div>
                <span className='text-sm'>
                  {formatDate(tournament.tournament_start)}
                </span>
              </div>

              {/* Venue */}
              {tournament.venue_address && (
                <div className='flex items-start gap-2'>
                  <MapPin className='h-4 w-4 text-red-500 mt-0.5' />
                  <span className='text-sm text-muted-foreground line-clamp-2'>
                    {tournament.venue_address}
                  </span>
                </div>
              )}

              {/* Progress Bar */}
              <div className='space-y-2'>
                <div className='flex justify-between text-sm'>
                  <span>Tiến độ đăng ký</span>
                  <span>
                    {Math.round(
                      (tournament.current_participants /
                        tournament.max_participants) *
                        100
                    )}
                    %
                  </span>
                </div>
                <div className='w-full bg-gray-200 rounded-full h-2'>
                  <div
                    className='bg-blue-600 h-2 rounded-full transition-all duration-300'
                    style={{
                      width: `${Math.min((tournament.current_participants / tournament.max_participants) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTournaments.length === 0 && !loading && (
        <div className='text-center py-12'>
          <Trophy className='h-12 w-12 text-gray-400 mx-auto mb-4' />
          <h3 className='text-lg font-medium text-gray-900 mb-2'>
            Không tìm thấy giải đấu nào
          </h3>
          <p className='text-gray-500'>
            {searchQuery || statusFilter !== 'all'
              ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm'
              : 'Chưa có giải đấu nào trong hệ thống'}
          </p>
        </div>
      )}

      {loading && (
        <div className='text-center py-12'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto'></div>
          <p className='mt-4 text-gray-500'>Đang tải dữ liệu...</p>
        </div>
      )}

      {/* Tournament Participant Manager Modal */}
      {selectedTournament && (
        <TournamentParticipantManager tournament={selectedTournament} />
      )}

      {/* Quick Add User Modal */}
      {selectedTournament && (
        <QuickAddUserDialog
          open={isQuickAddModalOpen}
          onOpenChange={setIsQuickAddModalOpen}
          tournament={selectedTournament}
          onSuccess={handleParticipantsUpdated}
        />
      )}
    </div>
  );
};

export default AdminTournaments;
