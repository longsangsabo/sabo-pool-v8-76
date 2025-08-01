import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Calendar, MapPin, Users, Trophy, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { SimpleRegistrationModal } from './SimpleRegistrationModal';

interface TournamentData {
  id: string;
  name: string;
  description: string;
  tournament_type: string;
  game_format: string;
  max_participants: number;
  current_participants: number;
  start_date: string;
  end_date: string;
  venue_address: string;
  entry_fee: number;
  prize_pool: number;
  status: string;
  club_id: string;
  created_by: string;
}

const TournamentDiscoverySimple = () => {
  const [tournaments, setTournaments] = useState<TournamentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedTournament, setSelectedTournament] =
    useState<TournamentData | null>(null);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const { user } = useAuth();

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .is('deleted_at', null)
        .in('status', [
          'upcoming',
          'registration_open',
          'registration_closed',
          'ongoing',
        ])
        .order('start_date', { ascending: true });

      if (error) throw error;
      setTournaments(data || []);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
      toast.error('Không thể tải danh sách giải đấu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  const filteredTournaments = tournaments.filter(tournament => {
    const matchesSearch =
      tournament.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tournament.description?.toLowerCase().includes(searchTerm.toLowerCase());

    if (filter === 'all') return matchesSearch;
    if (filter === 'upcoming')
      return matchesSearch && tournament.status === 'upcoming';
    if (filter === 'open')
      return matchesSearch && tournament.status === 'registration_open';
    if (filter === 'ongoing')
      return matchesSearch && tournament.status === 'ongoing';

    return matchesSearch;
  });

  const handleJoinTournament = (tournament: TournamentData) => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để đăng ký giải đấu');
      return;
    }

    setSelectedTournament(tournament);
    setShowRegistrationModal(true);
  };

  const handleRegistrationSuccess = () => {
    fetchTournaments(); // Refresh the list
    setShowRegistrationModal(false);
    setSelectedTournament(null);
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
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'Sắp diễn ra';
      case 'registration_open':
        return 'Đang mở đăng ký';
      case 'registration_closed':
        return 'Đã đóng đăng ký';
      case 'ongoing':
        return 'Đang diễn ra';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className='container mx-auto p-4'>
        <div className='flex items-center justify-center min-h-[400px]'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4'></div>
            <p>Đang tải danh sách giải đấu...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto p-4'>
      <div className='mb-6'>
        <h1 className='text-3xl font-bold mb-4 text-center'>⚡ GIẢI ĐẤU</h1>
        <p className='text-center text-muted-foreground mb-6'>
          Tham gia các giải đấu và thi đấu với người chơi khác
        </p>

        {/* Search and Filter */}
        <div className='flex flex-col sm:flex-row gap-4 mb-6'>
          <div className='relative flex-1'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4' />
            <Input
              placeholder='Tìm kiếm giải đấu...'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className='pl-10'
            />
          </div>

          <div className='flex gap-2'>
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
              size='sm'
            >
              Tất cả
            </Button>
            <Button
              variant={filter === 'open' ? 'default' : 'outline'}
              onClick={() => setFilter('open')}
              size='sm'
            >
              Đang mở ĐK
            </Button>
            <Button
              variant={filter === 'upcoming' ? 'default' : 'outline'}
              onClick={() => setFilter('upcoming')}
              size='sm'
            >
              Sắp diễn ra
            </Button>
            <Button
              variant={filter === 'ongoing' ? 'default' : 'outline'}
              onClick={() => setFilter('ongoing')}
              size='sm'
            >
              Đang diễn ra
            </Button>
          </div>
        </div>
      </div>

      {/* Tournament Stats */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
        <Card>
          <CardContent className='flex items-center p-4'>
            <Trophy className='h-8 w-8 text-yellow-500 mr-3' />
            <div>
              <p className='text-2xl font-bold'>{tournaments.length}</p>
              <p className='text-xs text-muted-foreground'>
                tournament.stats.total
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='flex items-center p-4'>
            <Users className='h-8 w-8 text-blue-500 mr-3' />
            <div>
              <p className='text-2xl font-bold'>
                {tournaments.filter(t => t.status === 'ongoing').length}
              </p>
              <p className='text-xs text-muted-foreground'>
                tournament.stats.active
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='flex items-center p-4'>
            <Calendar className='h-8 w-8 text-green-500 mr-3' />
            <div>
              <p className='text-2xl font-bold'>
                {
                  tournaments.filter(t => t.status === 'registration_open')
                    .length
                }
              </p>
              <p className='text-xs text-muted-foreground'>
                tournament.stats.registered
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tournament List */}
      {filteredTournaments.length === 0 ? (
        <div className='text-center py-12'>
          <Trophy className='h-16 w-16 text-muted-foreground mx-auto mb-4' />
          <h3 className='text-xl font-semibold mb-2'>
            Không tìm thấy giải đấu
          </h3>
          <p className='text-muted-foreground'>
            {searchTerm
              ? 'Thử tìm kiếm với từ khóa khác'
              : 'Hiện tại chưa có giải đấu nào'}
          </p>
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {filteredTournaments.map(tournament => (
            <Card
              key={tournament.id}
              className='hover:shadow-lg transition-shadow'
            >
              <CardHeader>
                <div className='flex items-start justify-between'>
                  <CardTitle className='text-lg'>{tournament.name}</CardTitle>
                  <Badge className={getStatusColor(tournament.status)}>
                    {getStatusText(tournament.status)}
                  </Badge>
                </div>
                <p className='text-sm text-muted-foreground line-clamp-2'>
                  {tournament.description}
                </p>
              </CardHeader>

              <CardContent>
                <div className='space-y-3'>
                  <div className='flex items-center text-sm text-muted-foreground'>
                    <Calendar className='h-4 w-4 mr-2' />
                    {new Date(tournament.start_date).toLocaleDateString(
                      'vi-VN'
                    )}
                  </div>

                  <div className='flex items-center text-sm text-muted-foreground'>
                    <MapPin className='h-4 w-4 mr-2' />
                    <span className='line-clamp-1'>
                      {tournament.venue_address}
                    </span>
                  </div>

                  <div className='flex items-center justify-between text-sm'>
                    <div className='flex items-center text-muted-foreground'>
                      <Users className='h-4 w-4 mr-2' />
                      {tournament.current_participants}/
                      {tournament.max_participants}
                    </div>
                    <div className='font-semibold'>
                      {tournament.entry_fee.toLocaleString('vi-VN')} VND
                    </div>
                  </div>

                  {tournament.prize_pool > 0 && (
                    <div className='text-sm'>
                      <span className='text-muted-foreground'>
                        Giải thưởng:{' '}
                      </span>
                      <span className='font-semibold text-green-600'>
                        {tournament.prize_pool.toLocaleString('vi-VN')} VND
                      </span>
                    </div>
                  )}

                  <Button
                    className='w-full'
                    onClick={() => handleJoinTournament(tournament)}
                    disabled={tournament.status !== 'registration_open'}
                  >
                    {tournament.status === 'registration_open'
                      ? 'Đăng ký'
                      : 'Xem chi tiết'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Registration Modal */}
      {selectedTournament && (
        <SimpleRegistrationModal
          tournament={selectedTournament}
          isOpen={showRegistrationModal}
          onClose={() => setShowRegistrationModal(false)}
          onSuccess={handleRegistrationSuccess}
        />
      )}
    </div>
  );
};

export default TournamentDiscoverySimple;
