import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface UserStreak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  total_points: number;
  last_checkin_date: string | null;
  created_at: string;
  updated_at: string;
}

interface CheckInResult {
  success: boolean;
  points_earned?: number;
  current_streak?: number;
  total_points?: number;
  message: string;
}

export const useCheckIn = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user streak data (using mock data since table doesn't exist)
  const { data: userStreak, isLoading } = useQuery({
    queryKey: ['user-streak', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Mock data until user_streaks table is created
      return {
        id: '1',
        user_id: user.id,
        current_streak: 3,
        longest_streak: 7,
        total_points: 150,
        last_checkin_date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as UserStreak;
    },
    enabled: !!user?.id,
  });

  // Check if user has checked in today
  const hasCheckedInToday = () => {
    if (!userStreak?.last_checkin_date) return false;
    const today = new Date().toISOString().split('T')[0];
    return userStreak.last_checkin_date === today;
  };

  // Perform daily check-in (mock implementation)
  const checkInMutation = useMutation({
    mutationFn: async (): Promise<CheckInResult> => {
      if (!user?.id) throw new Error('Must be logged in');

      // Mock check-in implementation
      return {
        success: true,
        points_earned: 10,
        current_streak: (userStreak?.current_streak || 0) + 1,
        total_points: (userStreak?.total_points || 0) + 10,
        message: 'Check-in thành công! +10 điểm',
      };
    },
    onSuccess: result => {
      queryClient.invalidateQueries({ queryKey: ['user-streak'] });

      if (result.success) {
        toast.success(result.message, {
          duration: 3000,
        });
      } else {
        toast.info(result.message);
      }
    },
    onError: error => {
      console.error('Check-in error:', error);
      toast.error('Có lỗi xảy ra khi check-in');
    },
  });

  const performCheckIn = () => {
    checkInMutation.mutate();
  };

  return {
    userStreak,
    isLoading,
    hasCheckedInToday: hasCheckedInToday(),
    performCheckIn,
    isCheckingIn: checkInMutation.isPending,
  };
};
