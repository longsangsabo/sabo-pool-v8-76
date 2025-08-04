import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useClubContext } from '../../contexts/ClubContext';
import { ClubStats } from '../../types/club.types';

export const useClubStats = () => {
  const { selectedClub } = useClubContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ClubStats | null>(null);

  const getRevenueData = async (period: 'day' | 'week' | 'month' | 'year') => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('club_revenue')
        .select('*')
        .eq('club_id', selectedClub?.id)
        .order('date', { ascending: true });

      if (error) throw error;

      // Process data for charts
      return {
        labels: data.map(item => item.date),
        datasets: [{
          label: 'Doanh thu',
          data: data.map(item => item.amount),
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgb(75, 192, 192)',
          borderWidth: 1
        }]
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load revenue data');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getMembershipData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('club_member_stats')
        .select('*')
        .eq('club_id', selectedClub?.id)
        .order('date', { ascending: true });

      if (error) throw error;

      return {
        labels: data.map(item => item.date),
        datasets: [{
          label: 'Thành viên hoạt động',
          data: data.map(item => item.active_members),
          borderColor: 'rgb(54, 162, 235)',
          tension: 0.1
        }]
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load membership data');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getTableUtilization = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('table_utilization')
        .select('*')
        .eq('club_id', selectedClub?.id)
        .order('hour');

      if (error) throw error;

      return {
        labels: data.map(item => `${item.hour}:00`),
        datasets: [{
          label: 'Tỷ lệ sử dụng (%)',
          data: data.map(item => item.utilization_rate),
          backgroundColor: 'rgba(153, 102, 255, 0.2)',
          borderColor: 'rgb(153, 102, 255)',
          borderWidth: 1
        }]
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load table utilization data');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    stats,
    getRevenueData,
    getMembershipData,
    getTableUtilization
  };
};
