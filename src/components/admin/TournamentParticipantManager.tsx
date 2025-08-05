import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { QuickAddUserDialog } from './QuickAddUserDialog';

interface Player {
  id: string;
  user_id: string;
  full_name?: string;
  display_name?: string;
  avatar_url?: string;
  verified_rank?: string;
  current_rank?: string;
  elo?: number;
}

interface Registration {
  id: string;
  tournament_id: string;
  user_id: string;
  registration_status: 'pending' | 'confirmed' | 'cancelled' | 'waitlist';
  payment_status: 'pending' | 'paid' | 'refunded' | 'cancelled';
  created_at: string;
  profiles?: Player;
  player?: Player;
}

interface Tournament {
  id: string;
  name: string;
  max_participants: number;
  current_participants: number;
}

interface TournamentParticipantManagerProps {
  tournament: Tournament;
}

export const TournamentParticipantManager: React.FC<
  TournamentParticipantManagerProps
> = ({ tournament }) => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [users, setUsers] = useState<Player[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const { toast } = useToast();

  // Load registrations
  const loadRegistrations = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading registrations for tournament:', tournament.id);

      const { data, error } = await supabase
        .from('tournament_registrations')
        .select(
          `
          id,
          tournament_id,
          user_id,
          registration_status,
          payment_status,
          created_at
        `
        )
        .eq('tournament_id', tournament.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error loading registrations:', error);
        throw error;
      }

      // Get user profiles separately to avoid join issues
      let profilesData: any[] = [];
      if (data && data.length > 0) {
        const userIds = data.map(reg => reg.user_id);
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select(
            'id, user_id, full_name, display_name, avatar_url, verified_rank, elo'
          )
          .in('user_id', userIds);

        if (profilesError) {
          console.error('❌ Error loading profiles:', profilesError);
        } else {
          profilesData = profiles || [];
        }
      }

      console.log('✅ Loaded registrations:', data);

      // Transform data to match our interface
      const transformedData = (data || []).map(reg => {
        const userProfile = profilesData.find(
          profile => profile.user_id === reg.user_id
        );

        return {
          ...reg,
          player: userProfile
            ? {
                id: userProfile.id || userProfile.user_id,
                user_id: userProfile.user_id,
                full_name: userProfile.full_name,
                display_name: userProfile.display_name,
                avatar_url: userProfile.avatar_url,
                verified_rank: userProfile.verified_rank,
                elo: userProfile.elo || 1000,
              }
            : undefined,
        } as Registration;
      });

      setRegistrations(transformedData);
    } catch (error: any) {
      console.error('❌ Error in loadRegistrations:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách người tham gia: ' + error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Load available users
  const loadUsers = async () => {
    try {
      console.log('🔄 Loading available users...');

      const { data, error } = await supabase
        .from('profiles')
        .select(
          'id, user_id, full_name, display_name, avatar_url, verified_rank, elo'
        )
        .limit(100);

      if (error) {
        console.error('❌ Error loading users:', error);
        throw error;
      }

      console.log('✅ Loaded users:', data?.length || 0);

      // Filter out users already registered
      const registeredUserIds = registrations.map(r => r.user_id);
      const availableUsers = (data || []).filter(
        user => !registeredUserIds.includes(user.user_id)
      );

      setUsers(availableUsers);
    } catch (error: any) {
      console.error('❌ Error in loadUsers:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách người dùng: ' + error.message,
        variant: 'destructive',
      });
    }
  };

  // Add participant
  const addParticipant = async () => {
    if (!selectedUserId || !tournament) return;

    setIsAdding(true);
    console.log('🚀 Adding participant:', {
      tournament_id: tournament.id,
      user_id: selectedUserId,
      registration_status: 'confirmed',
      payment_status: 'paid',
    });

    try {
      const { data, error } = await supabase
        .from('tournament_registrations')
        .insert({
          tournament_id: tournament.id,
          user_id: selectedUserId,
          registration_status: 'confirmed',
          payment_status: 'paid',
        })
        .select();

      console.log('✅ Insert result:', { data, error });

      if (error) {
        console.error('❌ Database error:', error);
        throw error;
      }

      toast({
        title: 'Thành công',
        description: 'Đã thêm người tham gia vào giải đấu!',
      });

      setSelectedUserId('');
      loadRegistrations();
      loadUsers();
    } catch (error: any) {
      console.error('❌ Error adding participant:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể thêm người tham gia: ' + error.message,
        variant: 'destructive',
      });
    } finally {
      setIsAdding(false);
    }
  };

  // Remove participant
  const removeParticipant = async (
    registrationId: string,
    playerName: string
  ) => {
    try {
      console.log('🗑️ Removing participant:', registrationId);

      const { error } = await supabase
        .from('tournament_registrations')
        .delete()
        .eq('id', registrationId);

      if (error) {
        console.error('❌ Error removing participant:', error);
        throw error;
      }

      toast({
        title: 'Thành công',
        description: `Đã xóa ${playerName} khỏi giải đấu!`,
      });

      loadRegistrations();
      loadUsers();
    } catch (error: any) {
      console.error('❌ Error in removeParticipant:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể xóa người tham gia: ' + error.message,
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    loadRegistrations();
  }, [tournament.id]);

  useEffect(() => {
    loadUsers();
  }, [registrations]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Chờ xác nhận', variant: 'secondary' as const },
      confirmed: { label: 'Đã xác nhận', variant: 'default' as const },
      cancelled: { label: 'Đã hủy', variant: 'destructive' as const },
      waitlist: { label: 'Danh sách chờ', variant: 'outline' as const },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPaymentBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Chưa thanh toán', variant: 'secondary' as const },
      paid: { label: 'Đã thanh toán', variant: 'default' as const },
      refunded: { label: 'Đã hoàn tiền', variant: 'outline' as const },
      cancelled: { label: 'Đã hủy', variant: 'destructive' as const },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center justify-between'>
          <span>Quản lý người tham gia</span>
          <Button
            onClick={() => setShowQuickAdd(true)}
            className='flex items-center gap-2'
          >
            <UserPlus className='h-4 w-4' />
            Thêm nhanh
          </Button>
        </CardTitle>
        <CardDescription>
          Hiện tại: {registrations.length}/{tournament.max_participants} người
          tham gia
        </CardDescription>
      </CardHeader>

      <CardContent className='space-y-6'>
        {/* Add single participant */}
        <div className='flex gap-2'>
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger className='flex-1'>
              <SelectValue placeholder='Chọn người dùng để thêm...' />
            </SelectTrigger>
            <SelectContent>
              {users.map(user => (
                <SelectItem key={user.user_id} value={user.user_id}>
                  {user.full_name || user.display_name || 'Không có tên'}
                  {user.verified_rank && ` (${user.verified_rank})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={addParticipant}
            disabled={!selectedUserId || isAdding}
          >
            {isAdding ? 'Đang thêm...' : 'Thêm'}
          </Button>
        </div>

        {/* Participants list */}
        <div className='space-y-2'>
          <h4 className='font-medium'>Danh sách người tham gia:</h4>

          {loading ? (
            <div className='text-center py-4'>Đang tải...</div>
          ) : registrations.length === 0 ? (
            <div className='text-center py-4 text-muted-foreground'>
              Chưa có người tham gia
            </div>
          ) : (
            <div className='space-y-2 max-h-96 overflow-y-auto'>
              {registrations.map(registration => (
                <div
                  key={registration.id}
                  className='flex items-center justify-between p-3 border rounded-lg'
                >
                  <div className='flex-1'>
                    <div className='font-medium'>
                      {registration.player?.full_name ||
                        registration.player?.display_name ||
                        'Không có tên'}
                    </div>
                    <div className='text-sm text-muted-foreground flex gap-2'>
                      {getStatusBadge(registration.registration_status)}
                      {getPaymentBadge(registration.payment_status)}
                      {registration.player?.verified_rank && (
                        <Badge variant='outline'>
                          {registration.player.verified_rank}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() =>
                      removeParticipant(
                        registration.id,
                        registration.player?.full_name ||
                          registration.player?.display_name ||
                          'Người chơi'
                      )
                    }
                  >
                    <Trash2 className='h-4 w-4' />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <QuickAddUserDialog
          open={showQuickAdd}
          onOpenChange={setShowQuickAdd}
          tournament={tournament}
          onSuccess={() => {
            loadRegistrations();
            loadUsers();
          }}
        />
      </CardContent>
    </Card>
  );
};
