import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Search,
  RefreshCw,
  Trophy,
  Users,
  Calendar,
  MapPin,
  DollarSign,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react';
// Tournament service removed - using direct Supabase calls instead
import { TournamentActions } from './TournamentActions';
import TournamentStatusControlButton from '@/components/tournament/TournamentStatusControlButton';
import ForceStartTournamentButton from '@/components/tournament/ForceStartTournamentButton';
import { EnhancedTournament } from '@/types/tournament-extended';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const TournamentManagement: React.FC = () => {
  const [tournaments, setTournaments] = useState<EnhancedTournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleted, setShowDeleted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTournaments();
  }, [showDeleted]);

  const fetchTournaments = async () => {
    try {
      setLoading(true);

      let query = supabase.from('tournaments').select('*');

      if (showDeleted) {
        query = query.not('deleted_at', 'is', null);
      } else {
        query = query.is('deleted_at', null);
      }

      if (searchTerm.trim()) {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      const { data, error } = await query
        .limit(50)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform database data to EnhancedTournament format
      const enhancedTournaments = (data || []).map(tournament => {
        // Use tournament_prize_tiers instead of prize_distribution
        const rewards = {
          positions: [],
          specialAwards: [],
          totalPrize: tournament.prize_pool || 0,
          showPrizes: true,
        };

        return {
          ...tournament,
          tournament_type: tournament.tournament_type as any,
          rewards,
          available_slots:
            (tournament.max_participants || 0) -
            (tournament.current_participants || 0),
          registration_status:
            tournament.status === 'registration_open'
              ? ('open' as const)
              : ('closed' as const),
        };
      }) as unknown as EnhancedTournament[];

      setTournaments(enhancedTournaments);
      console.log('Fetched tournaments:', enhancedTournaments.length);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
      toast.error('Lỗi khi tải danh sách giải đấu');
    } finally {
      setLoading(false);
    }
  };

  // Tạo giải đấu mẫu nếu không có dữ liệu
  const createSampleTournaments = async () => {
    try {
      const sampleTournaments = [
        {
          name: 'Giải đấu Pool 8 Ball - Cúp mùa đông',
          description: 'Giải đấu 8-ball dành cho người chơi hạng K-A',
          tournament_type: 'single_elimination',
          max_participants: 16,
          current_participants: 8,
          registration_start: new Date().toISOString(),
          registration_end: new Date(
            Date.now() + 6 * 24 * 60 * 60 * 1000
          ).toISOString(),
          tournament_start: new Date(
            Date.now() + 10 * 24 * 60 * 60 * 1000
          ).toISOString(),
          tournament_end: new Date(
            Date.now() + 10 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000
          ).toISOString(),
          venue_address: 'CLB Billiards Sài Gòn, Quận 1, TP.HCM',
          entry_fee: 50000,
          prize_pool: 800000,
          status: 'registration_open',
        },
        {
          name: 'Giải Pool 9 Ball Professional',
          description: 'Giải đấu 9-ball dành cho người chơi chuyên nghiệp',
          tournament_type: 'double_elimination',
          max_participants: 32,
          current_participants: 12,
          registration_start: new Date(
            Date.now() + 3 * 24 * 60 * 60 * 1000
          ).toISOString(),
          registration_end: new Date(
            Date.now() + 13 * 24 * 60 * 60 * 1000
          ).toISOString(),
          tournament_start: new Date(
            Date.now() + 21 * 24 * 60 * 60 * 1000
          ).toISOString(),
          tournament_end: new Date(
            Date.now() + 23 * 24 * 60 * 60 * 1000
          ).toISOString(),
          venue_address: 'CLB Pool Arena, Quận 3, TP.HCM',
          entry_fee: 200000,
          prize_pool: 6400000,
          status: 'upcoming',
        },
      ];

      let successCount = 0;
      for (const tournament of sampleTournaments) {
        const { error } = await supabase.from('tournaments').insert(tournament);
        if (error) {
          console.error('Error creating sample tournament:', error);
          throw error; // Ném lỗi để dừng việc hiển thị toast success
        } else {
          successCount++;
        }
      }

      if (successCount > 0) {
        toast.success('Đã tạo dữ liệu giải đấu mẫu');
        // Refresh lại danh sách sau khi tạo thành công
        fetchTournaments();
      }
    } catch (error) {
      console.error('Error creating sample tournaments:', error);
      toast.error('Lỗi khi tạo dữ liệu mẫu');
    }
  };

  // Xóa vĩnh viễn tất cả giải đấu đã bị xóa
  const permanentlyDeleteAllTournaments = async () => {
    try {
      setLoading(true);

      // Bước 1: Lấy danh sách tournament IDs cần xóa
      const { data: tournamentsToDelete, error: fetchError } = await supabase
        .from('tournaments')
        .select('id')
        .not('deleted_at', 'is', null);

      if (fetchError) {
        console.error('Error fetching tournaments to delete:', fetchError);
        toast.error('Lỗi khi lấy danh sách giải đấu cần xóa');
        return;
      }

      if (!tournamentsToDelete || tournamentsToDelete.length === 0) {
        toast.info('Không có giải đấu nào để xóa');
        return;
      }

      const tournamentIds = tournamentsToDelete.map(t => t.id);
      console.log('Deleting tournaments with IDs:', tournamentIds);

      // Bước 2: Xóa tournaments - CASCADE DELETE sẽ tự động xóa tất cả records liên quan
      const { error: tournamentError } = await supabase
        .from('tournaments')
        .delete()
        .in('id', tournamentIds);

      if (tournamentError) {
        console.error(
          'Error permanently deleting tournaments:',
          tournamentError
        );
        toast.error('Lỗi khi xóa vĩnh viễn giải đấu');
        return;
      }

      toast.success(
        `Đã xóa vĩnh viễn ${tournamentIds.length} giải đấu và tất cả dữ liệu liên quan`
      );

      // Refresh lại danh sách
      fetchTournaments();
    } catch (error) {
      console.error('Error permanently deleting tournaments:', error);
      toast.error('Lỗi khi xóa vĩnh viễn giải đấu');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchTournaments();
  };

  const handleTournamentUpdated = () => {
    fetchTournaments();
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

  const formatCurrency = (amount: number) => {
    // Handle scientific notation display issue
    if (typeof amount === 'string') {
      const numAmount = parseFloat(amount);
      if (!isNaN(numAmount)) {
        amount = numAmount;
      }
    }

    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M VND`;
    } else if (amount >= 1000) {
      return `${Math.round(amount / 1000)}K VND`;
    } else {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(amount);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'registration_open':
        return 'bg-green-100 text-green-800';
      case 'registration_closed':
        return 'bg-yellow-100 text-yellow-800';
      case 'ongoing':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string, tournament?: any) => {
    // Tính toán lại status dựa trên thời gian và trạng thái hiện tại
    if (tournament) {
      const now = new Date();
      const registrationEnd = new Date(tournament.registration_end);
      const tournamentStart = new Date(tournament.tournament_start);

      // Nếu đã qua thời gian đăng ký và tournament chưa bắt đầu
      if (
        now > registrationEnd &&
        now < tournamentStart &&
        status === 'registration_open'
      ) {
        return 'Đã đóng đăng ký';
      }

      // Nếu đã đến thời gian tournament bắt đầu
      if (
        now >= tournamentStart &&
        (status === 'registration_open' || status === 'registration_closed')
      ) {
        return 'Đang thi đấu';
      }
    }

    switch (status) {
      case 'upcoming':
        return 'Sắp diễn ra';
      case 'registration_open':
        return 'Đang mở đăng ký';
      case 'registration_closed':
        return 'Đã đóng đăng ký';
      case 'ongoing':
        return 'Đang thi đấu';
      case 'completed':
        return 'Đã kết thúc';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <div className='flex justify-between items-center'>
            <div>
              <CardTitle>Quản lý giải đấu</CardTitle>
              <p className='text-muted-foreground mt-1'>
                Xem, xóa và khôi phục giải đấu
              </p>
            </div>
            <Button onClick={fetchTournaments} variant='outline'>
              <RefreshCw className='h-4 w-4 mr-2' />
              Làm mới
            </Button>
          </div>
        </CardHeader>
        <CardContent className='space-y-4'>
          {/* Controls */}
          <div className='flex flex-col sm:flex-row gap-4 items-center justify-between'>
            <div className='flex items-center gap-4'>
              <div className='flex items-center space-x-2'>
                <Switch
                  id='show-deleted'
                  checked={showDeleted}
                  onCheckedChange={setShowDeleted}
                />
                <Label htmlFor='show-deleted'>
                  {showDeleted
                    ? 'Hiển thị giải đấu đã xóa'
                    : 'Hiển thị giải đấu hoạt động'}
                </Label>
              </div>

              {/* Nút xóa vĩnh viễn tất cả - chỉ hiển thị khi xem giải đấu đã xóa */}
              {showDeleted && tournaments.length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant='destructive' size='sm'>
                      <Trash2 className='h-4 w-4 mr-2' />
                      Xóa vĩnh viễn tất cả
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        ⚠️ Xác nhận xóa vĩnh viễn
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Bạn có chắc chắn muốn xóa vĩnh viễn tất cả{' '}
                        {tournaments.length} giải đấu đã bị xóa?
                        <br />
                        <strong className='text-red-600'>
                          Hành động này không thể hoàn tác!
                        </strong>
                        <br />
                        Tất cả dữ liệu liên quan (matches, registrations, etc.)
                        sẽ bị xóa khỏi database.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Hủy</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={permanentlyDeleteAllTournaments}
                        className='bg-red-600 hover:bg-red-700'
                      >
                        Xóa vĩnh viễn tất cả
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>

            <div className='flex gap-2'>
              <Input
                placeholder='Tìm kiếm giải đấu...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='w-64'
                onKeyPress={e => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} variant='outline'>
                <Search className='h-4 w-4' />
              </Button>
            </div>
          </div>

          {/* Tournament List */}
          <div className='space-y-4'>
            {tournaments.map(tournament => (
              <Card
                key={tournament.id}
                className={`hover:shadow-md transition-shadow ${showDeleted ? 'bg-red-50 border-red-200' : ''}`}
              >
                <CardContent className='p-6'>
                  <div className='flex items-start justify-between'>
                    <div className='flex-1'>
                      <div className='flex items-center gap-3 mb-3'>
                        <h3 className='text-lg font-semibold'>
                          {tournament.name}
                        </h3>
                        <Badge className={getStatusColor(tournament.status)}>
                          {getStatusText(tournament.status, tournament)}
                        </Badge>
                        <Badge variant='outline' className='text-xs'>
                          {tournament.tournament_type === 'double_elimination'
                            ? 'Double Elimination'
                            : 'Single Elimination'}
                        </Badge>
                        {showDeleted && (
                          <Badge variant='destructive'>Đã xóa</Badge>
                        )}
                      </div>

                      {tournament.description && (
                        <p className='text-muted-foreground mb-3 line-clamp-2'>
                          {tournament.description}
                        </p>
                      )}

                      <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
                        <div className='flex items-center gap-2'>
                          <Calendar className='h-4 w-4 text-muted-foreground' />
                          <span>{formatDate(tournament.tournament_start)}</span>
                        </div>

                        <div className='flex items-center gap-2'>
                          <Users className='h-4 w-4 text-muted-foreground' />
                          <span>
                            {tournament.current_participants}/
                            {tournament.max_participants} người
                          </span>
                        </div>

                        <div className='flex items-center gap-2'>
                          <DollarSign className='h-4 w-4 text-muted-foreground' />
                          <span>{formatCurrency(tournament.prize_pool)}</span>
                        </div>

                        {tournament.venue_address && (
                          <div className='flex items-center gap-2'>
                            <MapPin className='h-4 w-4 text-muted-foreground' />
                            <span className='truncate'>
                              {tournament.venue_address}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className='flex items-center gap-2 ml-4'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() =>
                          window.open(`/tournaments/${tournament.id}`, '_blank')
                        }
                      >
                        <Eye className='w-4 h-4 mr-1' />
                        Xem
                      </Button>

                      {/* Force Start Button - for testing purposes */}
                      {!showDeleted && (
                        <ForceStartTournamentButton
                          tournamentId={tournament.id}
                          tournamentName={tournament.name}
                          currentStatus={tournament.status}
                          onStatusChanged={handleTournamentUpdated}
                        />
                      )}

                      {/* Status Control Button - hiển thị nút điều khiển trạng thái */}
                      {!showDeleted && (
                        <TournamentStatusControlButton
                          tournamentId={tournament.id}
                          tournamentName={tournament.name}
                          currentStatus={tournament.status}
                          onStatusChanged={handleTournamentUpdated}
                        />
                      )}

                      <TournamentActions />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {tournaments.length === 0 && (
            <Card>
              <CardContent className='p-8 text-center'>
                <Trophy className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
                <h3 className='text-lg font-medium mb-2'>
                  {showDeleted
                    ? 'Không có giải đấu nào đã bị xóa'
                    : 'Không có giải đấu nào'}
                </h3>
                <p className='text-muted-foreground mb-4'>
                  {showDeleted
                    ? 'Tất cả giải đấu đang hoạt động bình thường'
                    : 'Hệ thống sẽ tự động tạo dữ liệu mẫu để bạn có thể thử nghiệm'}
                </p>
                {!showDeleted && (
                  <Button onClick={createSampleTournaments} variant='outline'>
                    <Trophy className='h-4 w-4 mr-2' />
                    Tạo dữ liệu mẫu
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TournamentManagement;
