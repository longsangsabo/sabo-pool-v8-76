import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  Calendar,
  Users,
  DollarSign,
  Trophy,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react';
import { EnhancedTournament } from '@/types/tournament-extended';

const AdminTournamentManager = () => {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching tournaments for admin...');

      const { data, error } = await supabase
        .from('tournaments')
        .select(
          `
          *,
          club_profiles!tournaments_club_id_fkey(
            id,
            club_name,
            user_id
          )
        `
        )
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching tournaments:', error);
        toast({
          title: 'Lỗi',
          description: `Không thể tải danh sách giải đấu: ${error.message}`,
          variant: 'destructive',
        });
        return;
      }

      console.log('✅ Fetched tournaments:', data?.length || 0);
      console.log('📊 Sample tournament:', data?.[0]);

      setTournaments(data || []);
    } catch (err) {
      console.error('❌ Unexpected error:', err);
      toast({
        title: 'Lỗi',
        description: 'Có lỗi không mong muốn xảy ra',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteTournament = async (tournamentId: string) => {
    try {
      const { error } = await supabase
        .from('tournaments')
        .delete()
        .eq('id', tournamentId);

      if (error) {
        console.error('Error deleting tournament:', error);
        toast({
          title: 'Lỗi',
          description: `Không thể xóa giải đấu: ${error.message}`,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Thành công',
        description: 'Đã xóa giải đấu thành công',
      });

      fetchTournaments(); // Refresh the list
    } catch (err) {
      console.error('Unexpected error deleting tournament:', err);
      toast({
        title: 'Lỗi',
        description: 'Có lỗi không mong muốn khi xóa giải đấu',
        variant: 'destructive',
      });
    }
  };

  const updateTournamentStatus = async (
    tournamentId: string,
    newStatus: string
  ) => {
    try {
      const { error } = await supabase
        .from('tournaments')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', tournamentId);

      if (error) {
        console.error('Error updating tournament status:', error);
        toast({
          title: 'Lỗi',
          description: `Không thể cập nhật trạng thái: ${error.message}`,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Thành công',
        description: 'Đã cập nhật trạng thái giải đấu',
      });

      fetchTournaments(); // Refresh the list
    } catch (err) {
      console.error('Unexpected error updating tournament:', err);
      toast({
        title: 'Lỗi',
        description: 'Có lỗi không mong muốn khi cập nhật giải đấu',
        variant: 'destructive',
      });
    }
  };

  const filteredTournaments = tournaments.filter(tournament => {
    const matchesSearch =
      tournament.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tournament.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || tournament.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'registration_open':
        return 'bg-green-100 text-green-800';
      case 'registration_closed':
        return 'bg-yellow-100 text-yellow-800';
      case 'ongoing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-purple-100 text-purple-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Nháp';
      case 'registration_open':
        return 'Mở đăng ký';
      case 'registration_closed':
        return 'Đóng đăng ký';
      case 'ongoing':
        return 'Đang diễn ra';
      case 'completed':
        return 'Hoàn thành';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary'></div>
        <span className='ml-3'>Đang tải danh sách giải đấu...</span>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4'>
        <div>
          <h2 className='text-2xl font-bold'>Quản lý Giải đấu</h2>
          <p className='text-muted-foreground'>
            Quản lý tất cả các giải đấu trong hệ thống
          </p>
        </div>
        <Button className='flex items-center gap-2'>
          <Trophy className='w-4 h-4' />
          Tạo Giải đấu Mới
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className='pt-6'>
          <div className='flex flex-col lg:flex-row gap-4'>
            <div className='flex-1'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4' />
                <Input
                  placeholder='Tìm kiếm giải đấu...'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className='pl-10'
                />
              </div>
            </div>
            <div className='lg:w-48'>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder='Trạng thái' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Tất cả</SelectItem>
                  <SelectItem value='draft'>Nháp</SelectItem>
                  <SelectItem value='registration_open'>Mở đăng ký</SelectItem>
                  <SelectItem value='registration_closed'>
                    Đóng đăng ký
                  </SelectItem>
                  <SelectItem value='ongoing'>Đang diễn ra</SelectItem>
                  <SelectItem value='completed'>Hoàn thành</SelectItem>
                  <SelectItem value='cancelled'>Đã hủy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <Card>
          <CardContent className='pt-6'>
            <div className='flex items-center gap-2'>
              <Trophy className='w-4 h-4 text-primary' />
              <div>
                <p className='text-sm text-muted-foreground'>Tổng giải đấu</p>
                <p className='text-2xl font-bold'>{tournaments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='pt-6'>
            <div className='flex items-center gap-2'>
              <Users className='w-4 h-4 text-green-600' />
              <div>
                <p className='text-sm text-muted-foreground'>Đang hoạt động</p>
                <p className='text-2xl font-bold'>
                  {
                    tournaments.filter(t =>
                      ['registration_open', 'ongoing'].includes(t.status)
                    ).length
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='pt-6'>
            <div className='flex items-center gap-2'>
              <DollarSign className='w-4 h-4 text-blue-600' />
              <div>
                <p className='text-sm text-muted-foreground'>
                  Tổng giải thưởng
                </p>
                <p className='text-xl font-bold'>
                  {formatCurrency(
                    tournaments.reduce((sum, t) => sum + (t.prize_pool || 0), 0)
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='pt-6'>
            <div className='flex items-center gap-2'>
              <Calendar className='w-4 h-4 text-purple-600' />
              <div>
                <p className='text-sm text-muted-foreground'>Hoàn thành</p>
                <p className='text-2xl font-bold'>
                  {tournaments.filter(t => t.status === 'completed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tournament List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Danh sách Giải đấu ({filteredTournaments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTournaments.length === 0 ? (
            <div className='text-center py-8'>
              <Trophy className='w-16 h-16 text-muted-foreground mx-auto mb-4' />
              <h3 className='text-lg font-semibold mb-2'>
                Không có giải đấu nào
              </h3>
              <p className='text-muted-foreground'>
                {searchTerm || statusFilter !== 'all'
                  ? 'Không tìm thấy giải đấu phù hợp với bộ lọc'
                  : 'Chưa có giải đấu nào được tạo'}
              </p>
            </div>
          ) : (
            <div className='space-y-4'>
              {filteredTournaments.map(tournament => (
                <div
                  key={tournament.id}
                  className='border rounded-lg p-4 hover:bg-muted/50 transition-colors'
                >
                  <div className='flex items-start justify-between'>
                    <div className='flex-1'>
                      <div className='flex items-center gap-3 mb-2'>
                        <h3 className='font-semibold text-lg'>
                          {tournament.name}
                        </h3>
                        <Badge className={getStatusColor(tournament.status)}>
                          {getStatusText(tournament.status)}
                        </Badge>
                      </div>

                      <p className='text-muted-foreground mb-3 line-clamp-2'>
                        {tournament.description || 'Không có mô tả'}
                      </p>

                      <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
                        <div>
                          <span className='text-muted-foreground'>
                            Thể thức:
                          </span>
                          <p className='font-medium'>
                            {tournament.tournament_type}
                          </p>
                        </div>
                        <div>
                          <span className='text-muted-foreground'>
                            Số người tối đa:
                          </span>
                          <p className='font-medium'>
                            {tournament.max_participants}
                          </p>
                        </div>
                        <div>
                          <span className='text-muted-foreground'>
                            Giải thưởng:
                          </span>
                          <p className='font-medium text-green-600'>
                            {formatCurrency(tournament.prize_pool || 0)}
                          </p>
                        </div>
                        <div>
                          <span className='text-muted-foreground'>
                            Ngày tạo:
                          </span>
                          <p className='font-medium'>
                            {formatDate(tournament.created_at)}
                          </p>
                        </div>
                      </div>

                      {tournament.club_profiles && (
                        <div className='mt-2 text-sm'>
                          <span className='text-muted-foreground'>
                            Câu lạc bộ:
                          </span>
                          <span className='ml-1 font-medium'>
                            {tournament.club_profiles.club_name}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className='flex items-center gap-2 ml-4'>
                      <Button variant='outline' size='sm'>
                        <Eye className='w-4 h-4' />
                      </Button>
                      <Button variant='outline' size='sm'>
                        <Edit className='w-4 h-4' />
                      </Button>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => deleteTournament(tournament.id)}
                        className='text-red-600 hover:text-red-700'
                      >
                        <Trash2 className='w-4 h-4' />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTournamentManager;
