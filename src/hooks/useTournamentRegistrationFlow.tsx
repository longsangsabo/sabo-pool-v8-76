import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { Tournament } from '@/types/tournament';

type RegistrationStatus = 'NOT_REGISTERED' | 'REGISTERED' | 'PENDING';

interface RegistrationEligibility {
  canRegister: boolean;
  reasons: string[];
  isEligible: boolean; // for backward compatibility
}

interface RegistrationResult {
  success: boolean;
  message?: string;
  error?: string;
}

export const useTournamentRegistrationFlow = () => {
  const { user, profile } = useAuth();
  const [registrationStatus, setRegistrationStatus] = useState<
    Record<string, RegistrationStatus>
  >({});

  // Enhanced validation with multiple criteria
  const checkRegistrationEligibility = useCallback(
    (tournament: Tournament): RegistrationEligibility => {
      const reasons: string[] = [];

      if (!user) {
        reasons.push('Vui lòng đăng nhập để tham gia');
        return { canRegister: false, reasons, isEligible: false };
      }

      // Điều kiện 1: Số lượng slot
      if (tournament.current_participants >= tournament.max_participants) {
        reasons.push('Giải đã đủ số lượng người tham gia');
      }

      // Điều kiện 2: Thời gian đăng ký
      const currentTime = new Date();
      const regStart = new Date(tournament.registration_start);
      const regEnd = new Date(tournament.registration_end);

      if (currentTime < regStart) {
        reasons.push('Chưa đến thời gian đăng ký');
      }

      if (currentTime > regEnd) {
        reasons.push('Hết thời gian đăng ký');
      }

      // Điều kiện 3: Trạng thái giải đấu
      if (
        tournament.management_status &&
        tournament.management_status !== 'open'
      ) {
        switch (tournament.management_status) {
          case 'locked':
            reasons.push('Đã đóng đăng ký');
            break;
          case 'ongoing':
            reasons.push('Giải đấu đã bắt đầu');
            break;
          case 'completed':
            reasons.push('Giải đấu đã kết thúc');
            break;
          default:
            reasons.push('Giải đấu không mở đăng ký');
        }
      }

      // Điều kiện 4: Trình độ người chơi (nếu có yêu cầu) - Skip for now
      // TODO: Add rank requirement checking when tournament schema supports it

      // Điều kiện 5: Tuổi tác (nếu có yêu cầu) - Skip for now
      // TODO: Add age requirement checking when tournament schema supports it

      const canRegister = reasons.length === 0;
      return { canRegister, reasons, isEligible: canRegister };
    },
    [user, profile]
  );

  // Helper function to check rank requirements
  const checkRankRequirement = useCallback(
    (userRank: string, requiredRank: string): boolean => {
      const ranks = ['K', 'K+', 'I', 'I+', 'H', 'H+', 'G', 'G+', 'E'];
      const userRankIndex = ranks.indexOf(userRank);
      const requiredRankIndex = ranks.indexOf(requiredRank);

      return userRankIndex >= requiredRankIndex;
    },
    []
  );

  // Helper function to calculate age
  const calculateAge = useCallback((dateOfBirth: string): number => {
    const birth = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }

    return age;
  }, []);

  // Perform registration action
  const performRegistrationAction = useCallback(
    async (tournament: Tournament): Promise<RegistrationResult> => {
      if (!user?.id) {
        return { success: false, error: 'Chưa đăng nhập' };
      }

      try {
        const { data, error } = await supabase
          .from('tournament_registrations')
          .insert({
            tournament_id: tournament.id,
            user_id: user.id,
            registration_status: 'pending',
            payment_status: 'unpaid',
          })
          .select()
          .single();

        if (error) {
          // Check if already registered
          if (error.code === '23505') {
            return { success: false, error: 'Bạn đã đăng ký giải đấu này rồi' };
          }
          throw error;
        }

        return {
          success: true,
          message: 'Đăng ký giải đấu thành công!',
        };
      } catch (error) {
        console.error('Registration error:', error);
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : 'Có lỗi xảy ra khi đăng ký',
        };
      }
    },
    [user?.id]
  );

  // Perform cancellation action
  const performCancellationAction = useCallback(
    async (tournament: Tournament): Promise<RegistrationResult> => {
      if (!user?.id) {
        return { success: false, error: 'Chưa đăng nhập' };
      }

      try {
        const { data, error } = await supabase
          .from('tournament_registrations')
          .delete()
          .eq('tournament_id', tournament.id)
          .eq('user_id', user.id)
          .select();

        if (error) throw error;

        if (!data || data.length === 0) {
          return { success: false, error: 'Không tìm thấy đăng ký để hủy' };
        }

        return {
          success: true,
          message: 'Đã hủy đăng ký giải đấu thành công!',
        };
      } catch (error) {
        console.error('Cancellation error:', error);
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : 'Có lỗi xảy ra khi hủy đăng ký',
        };
      }
    },
    [user?.id]
  );

  // Handle registration flow
  const handleRegistrationFlow = useCallback(
    async (tournament: Tournament) => {
      const tournamentId = tournament.id;
      const currentStatus =
        registrationStatus[tournamentId] || 'NOT_REGISTERED';

      // Set pending state
      setRegistrationStatus(prev => ({
        ...prev,
        [tournamentId]: 'PENDING',
      }));

      try {
        let result: RegistrationResult;

        if (currentStatus === 'NOT_REGISTERED') {
          // Check eligibility for registration
          const eligibility = checkRegistrationEligibility(tournament);

          if (!eligibility.canRegister) {
            const primaryReason =
              eligibility.reasons[0] || 'Không đủ điều kiện tham gia';
            toast.error(primaryReason);
            if (eligibility.reasons.length > 1) {
              console.log('All eligibility reasons:', eligibility.reasons);
            }
            setRegistrationStatus(prev => ({
              ...prev,
              [tournamentId]: 'NOT_REGISTERED',
            }));
            return;
          }

          // Perform registration
          result = await performRegistrationAction(tournament);

          if (result.success) {
            setRegistrationStatus(prev => ({
              ...prev,
              [tournamentId]: 'REGISTERED',
            }));
            toast.success(result.message || 'Đăng ký thành công!');
          } else {
            setRegistrationStatus(prev => ({
              ...prev,
              [tournamentId]: 'NOT_REGISTERED',
            }));
            toast.error(result.error || 'Đăng ký thất bại');
          }
        } else if (currentStatus === 'REGISTERED') {
          // Perform cancellation
          result = await performCancellationAction(tournament);

          if (result.success) {
            setRegistrationStatus(prev => ({
              ...prev,
              [tournamentId]: 'NOT_REGISTERED',
            }));
            toast.success(result.message || 'Hủy đăng ký thành công!');
          } else {
            setRegistrationStatus(prev => ({
              ...prev,
              [tournamentId]: 'REGISTERED',
            }));
            toast.error(result.error || 'Hủy đăng ký thất bại');
          }
        }
      } catch (error) {
        console.error('Unexpected error in registration flow:', error);
        toast.error('Có lỗi không mong muốn xảy ra');

        // Revert to previous state
        setRegistrationStatus(prev => ({
          ...prev,
          [tournamentId]: currentStatus,
        }));
      }
    },
    [
      registrationStatus,
      checkRegistrationEligibility,
      performRegistrationAction,
      performCancellationAction,
    ]
  );

  // Get registration status for a tournament
  const getRegistrationStatus = useCallback(
    (tournamentId: string): RegistrationStatus => {
      return registrationStatus[tournamentId] || 'NOT_REGISTERED';
    },
    [registrationStatus]
  );

  // Set registration status manually (for initialization)
  const setTournamentRegistrationStatus = useCallback(
    (tournamentId: string, status: RegistrationStatus) => {
      setRegistrationStatus(prev => ({
        ...prev,
        [tournamentId]: status,
      }));
    },
    []
  );

  // Check if tournament is in pending state
  const isPending = useCallback(
    (tournamentId: string): boolean => {
      return registrationStatus[tournamentId] === 'PENDING';
    },
    [registrationStatus]
  );

  // Check if user is registered
  const isRegistered = useCallback(
    (tournamentId: string): boolean => {
      return registrationStatus[tournamentId] === 'REGISTERED';
    },
    [registrationStatus]
  );

  // Get button text based on status
  const getButtonText = useCallback(
    (tournamentId: string): string => {
      const status = registrationStatus[tournamentId] || 'NOT_REGISTERED';

      switch (status) {
        case 'NOT_REGISTERED':
          return 'Đăng ký tham gia';
        case 'REGISTERED':
          return 'Hủy đăng ký';
        case 'PENDING':
          return 'Đang xử lý...';
        default:
          return 'Đăng ký tham gia';
      }
    },
    [registrationStatus]
  );

  // Initialize registration status from database
  const initializeRegistrationStatus = useCallback(
    async (tournamentIds: string[]) => {
      if (!user?.id || tournamentIds.length === 0) return;

      try {
        const { data, error } = await supabase
          .from('tournament_registrations')
          .select('tournament_id, registration_status')
          .eq('user_id', user.id)
          .in('tournament_id', tournamentIds);

        if (error) throw error;

        const newStatus: Record<string, RegistrationStatus> = {};

        // Mark all as not registered first
        tournamentIds.forEach(id => {
          newStatus[id] = 'NOT_REGISTERED';
        });

        // Mark registered ones (any status other than cancelled means registered)
        data?.forEach(registration => {
          if (registration.registration_status !== 'cancelled') {
            newStatus[registration.tournament_id] = 'REGISTERED';
          }
        });

        setRegistrationStatus(prev => ({
          ...prev,
          ...newStatus,
        }));
      } catch (error) {
        console.error('Error initializing registration status:', error);
      }
    },
    [user?.id]
  );

  return {
    handleRegistrationFlow,
    getRegistrationStatus,
    setTournamentRegistrationStatus,
    isPending,
    isRegistered,
    getButtonText,
    initializeRegistrationStatus,
    checkRegistrationEligibility,
  };
};
