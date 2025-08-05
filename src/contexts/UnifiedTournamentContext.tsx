import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// Simplified Tournament Types
interface Tournament {
  id: string;
  name: string;
  description: string;
  max_participants: number;
  current_participants: number;
  entry_fee: number;
  tournament_start: string;
  tournament_end: string;
  registration_start: string;
  registration_end: string;
  venue_address: string;
  status: 'upcoming' | 'registration_open' | 'ongoing' | 'completed';
  created_by: string;
}

interface TournamentFormData {
  name: string;
  description: string;
  max_participants: number;
  entry_fee: number;
  tournament_start: string;
  tournament_end: string;
  registration_start: string;
  registration_end: string;
  venue_address: string;
}

interface TournamentContextType {
  // State
  tournaments: Tournament[];
  loading: boolean;
  currentTournament: TournamentFormData | null;

  // Actions
  fetchTournaments: () => Promise<void>;
  createTournament: (data: TournamentFormData) => Promise<void>;
  registerForTournament: (tournamentId: string) => Promise<void>;
  cancelRegistration: (tournamentId: string) => Promise<void>;
  isRegistered: (tournamentId: string) => boolean;

  // Form helpers
  updateCurrentTournament: (data: Partial<TournamentFormData>) => void;
  resetForm: () => void;
}

const TournamentContext = createContext<TournamentContextType | undefined>(
  undefined
);

const defaultTournament: TournamentFormData = {
  name: '',
  description: '',
  max_participants: 16,
  entry_fee: 100000,
  tournament_start: '',
  tournament_end: '',
  registration_start: '',
  registration_end: '', // ✅ Fixed: Use registration_end consistently
  venue_address: '',
};

export const UnifiedTournamentProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentTournament, setCurrentTournament] =
    useState<TournamentFormData | null>(defaultTournament);
  const [userRegistrations, setUserRegistrations] = useState<string[]>([]);

  const fetchTournaments = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Map database results to our simplified Tournament type
      const mappedTournaments: Tournament[] = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        description: item.description || '',
        max_participants: item.max_participants,
        current_participants: item.current_participants,
        entry_fee: item.entry_fee || 0,
        tournament_start: item.start_date,
        tournament_end: item.end_date,
        registration_start: item.registration_start,
        registration_end: item.registration_end,
        venue_address: item.venue_address || '',
        status:
          (item.status as
            | 'upcoming'
            | 'registration_open'
            | 'ongoing'
            | 'completed') || 'upcoming',
        created_by: item.created_by,
      }));

      setTournaments(mappedTournaments);

      // Fetch user registrations if logged in
      if (user?.id) {
        const { data: registrations } = await supabase
          .from('tournament_registrations')
          .select('tournament_id')
          .eq('user_id', user.id);

        setUserRegistrations(registrations?.map(r => r.tournament_id) || []);
      }
    } catch (error) {
      console.error('Error fetching tournaments:', error);
      toast.error('Lỗi khi tải danh sách giải đấu');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const createTournament = useCallback(
    async (data: TournamentFormData) => {
      if (!user?.id) {
        toast.error('Bạn cần đăng nhập để tạo giải đấu');
        return;
      }

      setLoading(true);
      try {
        console.log('🚀 Creating tournament with data:', data);
        console.log('🔍 User ID:', user.id);

        // ✅ FIXED: Only map fields that exist in TournamentFormData
        const tournamentData = {
          name: data.name,
          description: data.description || '',
          max_participants: data.max_participants,
          entry_fee: data.entry_fee,
          tournament_start: data.tournament_start,
          tournament_end: data.tournament_end,
          registration_start: data.registration_start,
          registration_end: data.registration_end, // ✅ Consistent field name
          venue_address: data.venue_address || '',
          // Required database fields with defaults
          tier_level: 1, // Default tier
          tournament_type: 'single_elimination',
          game_format: 'nine_ball',
          prize_pool: 0,
          rules: '',
          contact_info: '',
          eligible_ranks: [],
          allow_all_ranks: true,
          min_rank_requirement: null,
          max_rank_requirement: null,
          requires_approval: false,
          is_public: true,
          has_third_place_match: true,
          created_by: user.id,
          current_participants: 0,
          status: 'upcoming',
        };

        console.log('📤 Sending to database:', tournamentData);

        const { data: result, error } = await supabase
          .from('tournaments')
          .insert(tournamentData)
          .select()
          .single();

        if (error) {
          console.error('❌ Database error:', error);
          console.error('❌ Error details:', error.details);
          console.error('❌ Error hint:', error.hint);
          throw error;
        }

        console.log('✅ Tournament created successfully:', result);

        // Send notification to club members
        try {
          const { error: notificationError } = await supabase.functions.invoke(
            'notify-club-members',
            {
              body: {
                tournament_id: result.id,
                club_id: result.club_id || user.id, // Use creator as club if no specific club
                tournament_name: result.name,
                created_by_id: user.id,
              },
            }
          );

          if (notificationError) {
            console.error(
              '⚠️ Notification failed but tournament created:',
              notificationError
            );
            // Don't throw - tournament was created successfully
          } else {
            console.log('📢 Club members notified successfully');
          }
        } catch (notificationError) {
          console.error(
            '⚠️ Notification failed but tournament created:',
            notificationError
          );
          // Don't throw - tournament was created successfully
        }

        toast.success('Tạo giải đấu thành công!');
        await fetchTournaments();
        setCurrentTournament(defaultTournament);
      } catch (error: any) {
        console.error('❌ Error creating tournament:', error);

        // Enhanced error handling
        let errorMessage = 'Lỗi khi tạo giải đấu. Vui lòng thử lại.';

        if (error?.message?.includes('registration_end')) {
          errorMessage = 'Lỗi với thời gian đăng ký. Vui lòng kiểm tra lại.';
        } else if (error?.message?.includes('null value')) {
          errorMessage = 'Thiếu thông tin bắt buộc. Vui lòng điền đầy đủ form.';
        } else if (error?.message?.includes('duplicate')) {
          errorMessage = 'Tên giải đấu đã tồn tại. Vui lòng chọn tên khác.';
        } else if (error?.message) {
          errorMessage = `Lỗi: ${error.message}`;
        }

        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [user?.id, fetchTournaments]
  );

  const registerForTournament = useCallback(
    async (tournamentId: string) => {
      if (!user?.id) {
        toast.error('Bạn cần đăng nhập để đăng ký');
        return;
      }

      setLoading(true);
      try {
        const { error } = await supabase
          .from('tournament_registrations')
          .insert({
            tournament_id: tournamentId,
            user_id: user.id,
            registration_status: 'confirmed',
            payment_status: 'paid',
            status: 'confirmed',
          });

        if (error) throw error;

        setUserRegistrations(prev => [...prev, tournamentId]);
        toast.success('Đăng ký giải đấu thành công!');
        await fetchTournaments();
      } catch (error) {
        console.error('Error registering for tournament:', error);
        toast.error('Lỗi khi đăng ký giải đấu');
      } finally {
        setLoading(false);
      }
    },
    [user?.id, fetchTournaments]
  );

  const cancelRegistration = useCallback(
    async (tournamentId: string) => {
      if (!user?.id) return;

      setLoading(true);
      try {
        const { error } = await supabase
          .from('tournament_registrations')
          .delete()
          .eq('tournament_id', tournamentId)
          .eq('user_id', user.id);

        if (error) throw error;

        setUserRegistrations(prev => prev.filter(id => id !== tournamentId));
        toast.success('Đã hủy đăng ký giải đấu');
        await fetchTournaments();
      } catch (error) {
        console.error('Error canceling registration:', error);
        toast.error('Lỗi khi hủy đăng ký');
      } finally {
        setLoading(false);
      }
    },
    [user?.id, fetchTournaments]
  );

  const isRegistered = useCallback(
    (tournamentId: string) => {
      return userRegistrations.includes(tournamentId);
    },
    [userRegistrations]
  );

  const updateCurrentTournament = useCallback(
    (data: Partial<TournamentFormData>) => {
      setCurrentTournament(prev => (prev ? { ...prev, ...data } : null));
    },
    []
  );

  const resetForm = useCallback(() => {
    setCurrentTournament(defaultTournament);
  }, []);

  // Load tournaments on mount
  useEffect(() => {
    fetchTournaments();
  }, [fetchTournaments]);

  const value: TournamentContextType = {
    tournaments,
    loading,
    currentTournament,
    fetchTournaments,
    createTournament,
    registerForTournament,
    cancelRegistration,
    isRegistered,
    updateCurrentTournament,
    resetForm,
  };

  return (
    <TournamentContext.Provider value={value}>
      {children}
    </TournamentContext.Provider>
  );
};

export const useUnifiedTournament = () => {
  const context = useContext(TournamentContext);
  if (context === undefined) {
    throw new Error(
      'useUnifiedTournament must be used within UnifiedTournamentProvider'
    );
  }
  return context;
};
