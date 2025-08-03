import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface ClubData {
  id: string;
  name: string;
  address: string;
  phone?: string;
  description?: string;
  averageTablePrice?: number;
  averageHourlyRate?: number;
  rating?: number;
  totalTables?: number;
  availableTables?: number;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export const useClubs = () => {
  const { user } = useAuth();
  const [clubs, setClubs] = useState<ClubData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClubs = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('club_profiles')
        .select('*')
        .eq('verification_status', 'approved')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const mappedClubs: ClubData[] =
        data?.map(club => ({
          id: club.id,
          name: club.club_name,
          address: club.address || '',
          phone: club.phone,
          description: club.description,
          averageTablePrice: club.hourly_rate || 0,
          averageHourlyRate: club.hourly_rate || 0,
          rating: club.priority_score || 0,
          totalTables: club.available_tables || 0,
          availableTables: club.available_tables || 0,
          ownerId: club.user_id,
          createdAt: club.created_at,
          updatedAt: club.updated_at,
        })) || [];

      setClubs(mappedClubs);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch clubs';
      setError(errorMessage);
      console.error('Error fetching clubs:', err);
    } finally {
      setLoading(false);
    }
  };

  const createClub = async (data: {
    name: string;
    address: string;
    phone?: string;
    email?: string;
    description?: string;
    available_tables?: number;
  }) => {
    if (!user) {
      toast.error('Bạn cần đăng nhập để tạo câu lạc bộ');
      return false;
    }

    try {
      const { error } = await supabase.from('club_registrations').insert({
        user_id: user.id,
        club_name: data.name,
        address: data.address,
        phone: data.phone || '',
        email: data.email,
        table_count: data.available_tables || 10,
        table_types: ['Standard', 'Pool'],
        opening_hours: {
          monday: { open: '08:00', close: '22:00' },
          tuesday: { open: '08:00', close: '22:00' },
          wednesday: { open: '08:00', close: '22:00' },
          thursday: { open: '08:00', close: '22:00' },
          friday: { open: '08:00', close: '22:00' },
          saturday: { open: '08:00', close: '23:00' },
          sunday: { open: '08:00', close: '23:00' },
        },
        basic_hourly_rate: 50000,
        weekend_rate: 60000,
        description: data.description,
        city: 'Vũng Tàu',
        district: 'Thành phố Vũng Tàu',
        province: 'Bà Rịa - Vũng Tàu',
      });

      if (error) throw error;

      toast.success(
        'Đã gửi yêu cầu đăng ký câu lạc bộ! Chúng tôi sẽ xem xét và phản hồi sớm.'
      );
      return true;
    } catch (error) {
      console.error('Error creating club:', error);
      toast.error('Không thể tạo câu lạc bộ');
      return false;
    }
  };

  useEffect(() => {
    fetchClubs();
  }, []);

  return {
    clubs,
    loading,
    error,
    createClub,
    refetch: fetchClubs,
  };
};
