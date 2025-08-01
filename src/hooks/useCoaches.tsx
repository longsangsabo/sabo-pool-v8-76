import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Coach {
  id: string;
  user_id: string;
  certification_level: string;
  specializations: string[];
  experience_years: number;
  hourly_rate: number;
  bio: string;
  achievements: string[];
  rating: number;
  total_students: number;
  available_times: CoachAvailability;
  status: string;
  verified: boolean;
  created_at: string;
}

interface CoachAvailability {
  days: string[];
  hours: string[];
  [key: string]: any;
}

export interface CoachingSession {
  id: string;
  coach_id: string;
  student_id: string;
  session_type: string;
  club_id?: string;
  session_date: string;
  duration_hours: number;
  hourly_rate: number;
  total_cost: number;
  focus_areas: string[];
  session_notes?: string;
  homework?: string;
  status: string;
  payment_status: string;
  created_at: string;
}

export const useCoaches = () => {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [mySessions, setMySessions] = useState<CoachingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchCoaches = async () => {
    try {
      // Mock coaches data since coaches table doesn't exist
      const mockCoaches: Coach[] = [
        {
          id: '1',
          user_id: 'coach1',
          certification_level: 'Advanced',
          specializations: ['8-ball', '9-ball', 'Snooker'],
          experience_years: 10,
          hourly_rate: 300000,
          bio: 'Huấn luyện viên bi-a chuyên nghiệp với 10 năm kinh nghiệm',
          achievements: ['Vô địch quốc gia 2020', 'HLV xuất sắc 2021'],
          rating: 4.8,
          total_students: 50,
          available_times: {
            days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
            hours: ['09:00', '10:00', '14:00', '15:00', '16:00'],
          },
          status: 'active',
          verified: true,
          created_at: new Date().toISOString(),
        },
      ];

      setCoaches(mockCoaches);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch coaches');
    }
  };

  const fetchMySessions = async () => {
    if (!user) return;

    try {
      // Mock coaching sessions data since coaching_sessions table doesn't exist
      const mockSessions: CoachingSession[] = [
        {
          id: '1',
          coach_id: '1',
          student_id: user.id,
          session_type: 'Individual',
          club_id: 'club1',
          session_date: new Date(Date.now() + 86400000).toISOString(),
          duration_hours: 2,
          hourly_rate: 300000,
          total_cost: 600000,
          focus_areas: ['Stance', 'Aiming', 'Break shots'],
          session_notes: 'Tập trung vào kỹ thuật cầm cơ',
          homework: 'Luyện tập stance 30 phút mỗi ngày',
          status: 'scheduled',
          payment_status: 'paid',
          created_at: new Date().toISOString(),
        },
      ];

      setMySessions(mockSessions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sessions');
    }
  };

  const bookSession = async (
    sessionData: Omit<CoachingSession, 'id' | 'student_id' | 'created_at'>
  ) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Mock session booking since coaching_sessions table doesn't exist
      const newSession = {
        ...sessionData,
        id: Date.now().toString(),
        student_id: user.id,
        created_at: new Date().toISOString(),
      };

      console.log('Mock book session:', newSession);

      // Refresh sessions
      await fetchMySessions();
      return newSession;
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : 'Failed to book session'
      );
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchCoaches(), fetchMySessions()]);
      setLoading(false);
    };

    loadData();
  }, [user]);

  return {
    coaches,
    mySessions,
    loading,
    error,
    bookSession,
    refreshCoaches: fetchCoaches,
    refreshSessions: fetchMySessions,
  };
};
