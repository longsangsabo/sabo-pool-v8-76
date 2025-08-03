import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Users,
  Eye,
  Check,
  X,
  Clock,
  DollarSign,
  Trophy,
  Calendar,
  MapPin,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface TournamentRegistration {
  id: string;
  user_id: string;
  registration_date: string;
  status: 'registered' | 'confirmed' | 'cancelled' | 'withdrawn';
  payment_status: 'pending' | 'paid' | 'refunded';
  notes?: string;
  user_profile: {
    user_id: string;
    full_name: string;
    display_name: string;
    avatar_url?: string;
    verified_rank?: string;
    current_rank?: string;
  };
}

interface Tournament {
  id: string;
  name: string;
  status: string;
  max_participants: number;
  current_participants: number;
  entry_fee: number;
  prize_pool: number;
  tournament_start: string;
  venue_name?: string;
  created_by: string;
}

interface TournamentRegistrationDashboardProps {
  tournament: Tournament;
  onClose?: () => void;
}

export const TournamentRegistrationDashboard: React.FC<
  TournamentRegistrationDashboardProps
> = ({ tournament, onClose }) => {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<TournamentRegistration[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const canManage = user?.id === tournament.created_by;

  useEffect(() => {
    fetchRegistrations();
  }, [tournament.id]);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tournament_registrations')
        .select(
          `
          *,
          profiles!tournament_registrations_user_id_fkey (
            id, user_id, full_name, display_name, avatar_url, verified_rank
          )
        `
        )
        .eq('tournament_id', tournament.id);

      if (error) throw error;

      // Transform the data to match our interface
      const transformedRegistrations = (data || []).map((reg: any) => ({
        id: reg.id,
        user_id: reg.user_id,
        registration_date: reg.registration_date,
        status:
          (reg.status as
            | 'registered'
            | 'confirmed'
            | 'cancelled'
            | 'withdrawn') || 'registered',
        payment_status:
          (reg.payment_status as 'pending' | 'paid' | 'refunded') || 'pending',
        notes: reg.notes,
        user_profile:
          typeof reg.user_profile === 'object'
            ? reg.user_profile
            : {
                user_id: reg.user_id,
                full_name: 'Unknown',
                display_name: 'Unknown',
                avatar_url: undefined,
                verified_rank: undefined,
                current_rank: undefined,
              },
      }));

      setRegistrations(transformedRegistrations);
    } catch (error) {
      console.error('Error fetching registrations:', error);
      toast.error('Không thể tải danh sách đăng ký');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmRegistration = async (registrationId: string) => {
    if (!canManage) return;

    try {
      setActionLoading(registrationId);
      const { error } = await supabase
        .from('tournament_registrations')
        .update({ registration_status: 'confirmed' })
        .eq('id', registrationId);

      if (error) throw error;

      toast.success('Đã xác nhận đăng ký');
      fetchRegistrations();
    } catch (error) {
      console.error('Error confirming registration:', error);
      toast.error('Có lỗi khi xác nhận đăng ký');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectRegistration = async (registrationId: string) => {
    if (!canManage) return;

    try {
      setActionLoading(registrationId);
      const { error } = await supabase
        .from('tournament_registrations')
        .update({ registration_status: 'cancelled' })
        .eq('id', registrationId);

      if (error) throw error;

      toast.success('Đã từ chối đăng ký');
      fetchRegistrations();
    } catch (error) {
      console.error('Error rejecting registration:', error);
      toast.error('Có lỗi khi từ chối đăng ký');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'registered':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'withdrawn':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'refunded':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const confirmedCount = registrations.filter(
    r => r.status === 'confirmed'
  ).length;
  const pendingCount = registrations.filter(
    r => r.status === 'registered'
  ).length;
  const paidCount = registrations.filter(
    r => r.payment_status === 'paid'
  ).length;

  return (
    <div className='space-y-6'>
      {/* Tournament Info Header */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle className='text-xl'>{tournament.name}</CardTitle>
              <div className='flex items-center gap-4 text-sm text-muted-foreground mt-2'>
                <div className='flex items-center gap-1'>
                  <Calendar className='h-4 w-4' />
                  {new Date(tournament.tournament_start).toLocaleDateString(
                    'vi-VN'
                  )}
                </div>
                {tournament.venue_name && (
                  <div className='flex items-center gap-1'>
                    <MapPin className='h-4 w-4' />
                    {tournament.venue_name}
                  </div>
                )}
              </div>
            </div>
            {onClose && (
              <Button variant='outline' onClick={onClose}>
                Đóng
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-muted-foreground'>Đã xác nhận</p>
                <p className='text-2xl font-bold text-green-600'>
                  {confirmedCount}
                </p>
              </div>
              <CheckCircle className='h-8 w-8 text-green-600' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-muted-foreground'>Chờ xác nhận</p>
                <p className='text-2xl font-bold text-blue-600'>
                  {pendingCount}
                </p>
              </div>
              <Clock className='h-8 w-8 text-blue-600' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-muted-foreground'>Đã thanh toán</p>
                <p className='text-2xl font-bold text-green-600'>{paidCount}</p>
              </div>
              <DollarSign className='h-8 w-8 text-green-600' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-muted-foreground'>Tổng đăng ký</p>
                <p className='text-2xl font-bold'>{registrations.length}</p>
              </div>
              <Users className='h-8 w-8 text-primary' />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Registrations List */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Users className='h-5 w-5' />
            Danh sách đăng ký ({registrations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className='flex items-center justify-center py-8'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
            </div>
          ) : registrations.length === 0 ? (
            <div className='text-center py-8'>
              <Users className='h-12 w-12 mx-auto text-muted-foreground mb-4' />
              <p className='text-muted-foreground'>Chưa có đăng ký nào</p>
            </div>
          ) : (
            <div className='space-y-4'>
              {registrations.map(registration => (
                <div
                  key={registration.id}
                  className='flex items-center justify-between p-4 border rounded-lg'
                >
                  <div className='flex items-center gap-4'>
                    <Avatar>
                      <AvatarImage src={registration.user_profile.avatar_url} />
                      <AvatarFallback>
                        {registration.user_profile.full_name?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <p className='font-medium'>
                        {registration.user_profile.display_name ||
                          registration.user_profile.full_name}
                      </p>
                      <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                        <span>
                          {new Date(
                            registration.registration_date
                          ).toLocaleDateString('vi-VN')}
                        </span>
                        {registration.user_profile.verified_rank && (
                          <Badge variant='outline' className='text-xs'>
                            Rank: {registration.user_profile.verified_rank}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className='flex items-center gap-2'>
                    <Badge className={getStatusColor(registration.status)}>
                      {registration.status === 'confirmed' && 'Đã xác nhận'}
                      {registration.status === 'registered' && 'Chờ xác nhận'}
                      {registration.status === 'cancelled' && 'Đã hủy'}
                      {registration.status === 'withdrawn' && 'Đã rút'}
                    </Badge>

                    <Badge
                      className={getPaymentStatusColor(
                        registration.payment_status
                      )}
                    >
                      {registration.payment_status === 'paid' &&
                        'Đã thanh toán'}
                      {registration.payment_status === 'pending' &&
                        'Chờ thanh toán'}
                      {registration.payment_status === 'refunded' &&
                        'Đã hoàn tiền'}
                    </Badge>

                    {canManage && registration.status === 'registered' && (
                      <div className='flex items-center gap-1'>
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() =>
                            handleConfirmRegistration(registration.id)
                          }
                          disabled={actionLoading === registration.id}
                        >
                          <Check className='h-4 w-4' />
                        </Button>
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() =>
                            handleRejectRegistration(registration.id)
                          }
                          disabled={actionLoading === registration.id}
                        >
                          <X className='h-4 w-4' />
                        </Button>
                      </div>
                    )}
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

export default TournamentRegistrationDashboard;
