import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CreditCard, Users, Trophy, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface SimpleTournament {
  id: string;
  name: string;
  max_participants: number;
  status: string;
  entry_fee: number;
  prize_pool: number;
}

const SimpleTournamentPaymentManager: React.FC = () => {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState<SimpleTournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Fetch tournaments owned by this club
  const fetchTournaments = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('id, name, max_participants, status, entry_fee, prize_pool')
        .eq('club_id', user.id)
        .in('status', ['upcoming', 'registration_open'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTournaments(data || []);

      if (data && data.length > 0 && !selectedTournament) {
        setSelectedTournament(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching tournaments:', error);
      toast.error('Lỗi khi tải danh sách giải đấu');
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, [user]);

  const selectedTournamentData = tournaments.find(
    t => t.id === selectedTournament
  );

  return (
    <div className='space-y-6'>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <CreditCard className='h-5 w-5' />
            Quản lý Thanh toán Giải đấu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {/* Tournament Selection */}
            <div>
              <label className='text-sm font-medium mb-2 block'>
                Chọn giải đấu:
              </label>
              <Select
                value={selectedTournament}
                onValueChange={setSelectedTournament}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Chọn giải đấu...' />
                </SelectTrigger>
                <SelectContent>
                  {tournaments.map(tournament => (
                    <SelectItem key={tournament.id} value={tournament.id}>
                      {tournament.name} (Max: {tournament.max_participants})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tournament Stats */}
            {selectedTournamentData && (
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg'>
                <div className='text-center'>
                  <Trophy className='h-6 w-6 mx-auto mb-1 text-amber-500' />
                  <p className='text-sm text-muted-foreground'>Trạng thái</p>
                  <Badge variant='secondary'>
                    {selectedTournamentData.status}
                  </Badge>
                </div>
                <div className='text-center'>
                  <Users className='h-6 w-6 mx-auto mb-1 text-blue-500' />
                  <p className='text-sm text-muted-foreground'>Tối đa</p>
                  <p className='font-semibold'>
                    {selectedTournamentData.max_participants}
                  </p>
                </div>
                <div className='text-center'>
                  <DollarSign className='h-6 w-6 mx-auto mb-1 text-emerald-500' />
                  <p className='text-sm text-muted-foreground'>Lệ phí</p>
                  <p className='font-semibold'>
                    {selectedTournamentData.entry_fee?.toLocaleString()}đ
                  </p>
                </div>
                <div className='text-center'>
                  <Trophy className='h-6 w-6 mx-auto mb-1 text-yellow-500' />
                  <p className='text-sm text-muted-foreground'>Giải thưởng</p>
                  <p className='font-semibold'>
                    {selectedTournamentData.prize_pool?.toLocaleString()}đ
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Coming Soon */}
      <Card>
        <CardContent className='text-center py-8'>
          <p className='text-muted-foreground'>
            Tính năng quản lý thanh toán sẽ được triển khai trong phiên bản tiếp
            theo.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SimpleTournamentPaymentManager;
