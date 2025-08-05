import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../integrations/supabase/client';
import { toast } from 'sonner';

// Specialized hook for clubs
export function useAdminClubs(status?: string) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('clubs')
        .select(`
          *,
          profiles:owner_id (
            display_name,
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data: result, error } = await query;

      if (error) throw error;
      setData(result || []);
    } catch (err) {
      console.error('Error fetching clubs:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      toast.error('Lỗi khi tải dữ liệu câu lạc bộ');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  const updateClub = useCallback(async (id: string, updates: any) => {
    try {
      const { error } = await supabase
        .from('clubs')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      // Update local state
      setData(prev => prev.map(item => 
        item.id === id ? { ...item, ...updates } : item
      ));
      
      return true;
    } catch (err) {
      console.error('Error updating club:', err);
      toast.error('Lỗi khi cập nhật câu lạc bộ');
      return false;
    }
  }, []);

  const deleteClub = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('clubs')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Update local state
      setData(prev => prev.filter(item => item.id !== id));
      
      return true;
    } catch (err) {
      console.error('Error deleting club:', err);
      toast.error('Lỗi khi xóa câu lạc bộ');
      return false;
    }
  }, []);

  return {
    data,
    loading,
    error,
    refresh,
    updateClub,
    deleteClub
  };
}

// Hook for getting club stats
export function useAdminClubStats() {
  const [stats, setStats] = useState({
    pending: 0,
    active: 0,
    rejected: 0,
    total: 0
  });

  const fetchStats = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('clubs')
        .select('status');

      if (error) throw error;

      const stats = data.reduce((acc, club) => {
        acc[club.status as keyof typeof acc]++;
        acc.total++;
        return acc;
      }, { pending: 0, active: 0, rejected: 0, total: 0 });

      setStats(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, refreshStats: fetchStats };
}

// Additional interfaces for transactions
export interface AdminTransaction {
  transaction_id: string;
  user_id: string;
  user_name: string | null;
  type: 'deposit' | 'withdraw' | 'tournament_fee' | 'membership' | 'challenge_stake';
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  payment_method: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  reference_id: string | null;
}

export interface AdminTransactionStats {
  totalTransactions: number;
  totalAmount: number;
  pendingTransactions: number;
  completedTransactions: number;
  failedTransactions: number;
  todayAmount: number;
  monthlyAmount: number;
}

// Hook for transactions data
export function useAdminTransactions() {
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock data for now since we don't have transactions table structure
      const mockTransactions: AdminTransaction[] = [
        {
          transaction_id: 'TXN001',
          user_id: 'user1',
          user_name: 'Nguyễn Văn A',
          type: 'deposit',
          amount: 500000,
          status: 'completed',
          payment_method: 'vnpay',
          description: 'Nạp tiền vào ví',
          created_at: '2024-01-20T10:30:00Z',
          updated_at: '2024-01-20T10:35:00Z',
          reference_id: 'REF001',
        },
        {
          transaction_id: 'TXN002',
          user_id: 'user2',
          user_name: 'Trần Thị B',
          type: 'tournament_fee',
          amount: 100000,
          status: 'completed',
          payment_method: 'wallet',
          description: 'Phí tham gia giải đấu mùa xuân',
          created_at: '2024-01-20T09:15:00Z',
          updated_at: '2024-01-20T09:15:00Z',
          reference_id: 'REF002',
        },
        {
          transaction_id: 'TXN003',
          user_id: 'user3',
          user_name: 'Lê Văn C',
          type: 'withdraw',
          amount: 200000,
          status: 'pending',
          payment_method: 'bank_transfer',
          description: 'Rút tiền về tài khoản ngân hàng',
          created_at: '2024-01-20T08:45:00Z',
          updated_at: '2024-01-20T08:45:00Z',
          reference_id: 'REF003',
        },
        {
          transaction_id: 'TXN004',
          user_id: 'user4',
          user_name: 'Phạm Văn D',
          type: 'challenge_stake',
          amount: 50000,
          status: 'failed',
          payment_method: 'wallet',
          description: 'Đặt cược thách đấu',
          created_at: '2024-01-19T16:20:00Z',
          updated_at: '2024-01-19T16:25:00Z',
          reference_id: 'REF004',
        },
        {
          transaction_id: 'TXN005',
          user_id: 'user5',
          user_name: 'Hoàng Thị E',
          type: 'membership',
          amount: 300000,
          status: 'pending',
          payment_method: 'vnpay',
          description: 'Phí hội viên VIP',
          created_at: '2024-01-19T14:10:00Z',
          updated_at: '2024-01-19T14:10:00Z',
          reference_id: 'REF005',
        },
      ];

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setTransactions(mockTransactions);
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
      setError(err.message);
      toast.error('Không thể tải danh sách giao dịch');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return { transactions, loading, error, refetch: fetchTransactions };
}

// Hook for transaction stats
export function useAdminTransactionStats() {
  const [stats, setStats] = useState<AdminTransactionStats>({
    totalTransactions: 0,
    totalAmount: 0,
    pendingTransactions: 0,
    completedTransactions: 0,
    failedTransactions: 0,
    todayAmount: 0,
    monthlyAmount: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);

      // Mock stats calculation
      const mockStats: AdminTransactionStats = {
        totalTransactions: 1250,
        totalAmount: 45600000,
        pendingTransactions: 23,
        completedTransactions: 1180,
        failedTransactions: 47,
        todayAmount: 2300000,
        monthlyAmount: 18750000,
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setStats(mockStats);
    } catch (err: any) {
      console.error('Error fetching transaction stats:', err);
      toast.error('Không thể tải thống kê giao dịch');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, refetch: fetchStats };
}

// Additional interfaces for tournaments
export interface AdminTournament {
  tournament_id: string;
  name: string;
  status: 'draft' | 'published' | 'registration_open' | 'registration_closed' | 'ongoing' | 'completed' | 'cancelled';
  tournament_type: 'knockout' | 'round_robin' | 'swiss' | 'double_elimination';
  game_format: '8_ball' | '9_ball' | '10_ball' | 'straight_pool';
  max_participants: number;
  current_participants: number;
  entry_fee: number;
  prize_pool: number;
  registration_start: string;
  registration_end: string;
  tournament_start: string;
  tournament_end: string | null;
  venue_address: string | null;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  organizer_name?: string;
  club_name?: string;
}

export interface AdminTournamentStats {
  totalTournaments: number;
  activeTournaments: number;
  upcomingTournaments: number;
  completedTournaments: number;
  totalPrizePool: number;
  totalParticipants: number;
  averageParticipants: number;
  registrationOpenCount: number;
}

// Hook for tournaments data
export function useAdminTournaments() {
  const [tournaments, setTournaments] = useState<AdminTournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTournaments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock tournaments data with various statuses and types
      const mockTournaments: AdminTournament[] = [
        {
          tournament_id: 'TOUR001',
          name: 'Giải đấu Mùa Xuân 2024',
          status: 'ongoing',
          tournament_type: 'knockout',
          game_format: '8_ball',
          max_participants: 32,
          current_participants: 28,
          entry_fee: 100000,
          prize_pool: 2800000,
          registration_start: '2024-02-01T00:00:00Z',
          registration_end: '2024-02-15T23:59:59Z',
          tournament_start: '2024-02-20T09:00:00Z',
          tournament_end: null,
          venue_address: 'CLB Billiards Sài Gòn, Quận 1',
          description: 'Giải đấu 8-ball knockout hấp dẫn',
          created_by: 'admin1',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-02-20T09:00:00Z',
          organizer_name: 'Nguyễn Văn Admin',
          club_name: 'CLB Billiards Sài Gòn',
        },
        {
          tournament_id: 'TOUR002',
          name: 'Championship 9-Ball Pro',
          status: 'registration_open',
          tournament_type: 'double_elimination',
          game_format: '9_ball',
          max_participants: 64,
          current_participants: 45,
          entry_fee: 200000,
          prize_pool: 9000000,
          registration_start: '2024-02-10T00:00:00Z',
          registration_end: '2024-03-01T23:59:59Z',
          tournament_start: '2024-03-05T08:00:00Z',
          tournament_end: null,
          venue_address: 'Trung tâm Billiards Hà Nội',
          description: 'Giải vô địch 9-ball chuyên nghiệp',
          created_by: 'admin2',
          created_at: '2024-02-01T14:30:00Z',
          updated_at: '2024-02-20T16:45:00Z',
          organizer_name: 'Trần Thị Manager',
          club_name: 'Trung tâm Billiards Hà Nội',
        },
        {
          tournament_id: 'TOUR003',
          name: 'Giải Tân Thủ 2024',
          status: 'published',
          tournament_type: 'round_robin',
          game_format: '8_ball',
          max_participants: 16,
          current_participants: 0,
          entry_fee: 50000,
          prize_pool: 800000,
          registration_start: '2024-03-01T00:00:00Z',
          registration_end: '2024-03-15T23:59:59Z',
          tournament_start: '2024-03-20T14:00:00Z',
          tournament_end: null,
          venue_address: 'CLB Billiards Đà Nẵng',
          description: 'Dành cho người chơi mới bắt đầu',
          created_by: 'admin3',
          created_at: '2024-02-15T09:15:00Z',
          updated_at: '2024-02-18T11:20:00Z',
          organizer_name: 'Lê Văn Organizer',
          club_name: 'CLB Billiards Đà Nẵng',
        },
        {
          tournament_id: 'TOUR004',
          name: 'Masters Cup 2024',
          status: 'completed',
          tournament_type: 'knockout',
          game_format: '10_ball',
          max_participants: 32,
          current_participants: 32,
          entry_fee: 300000,
          prize_pool: 9600000,
          registration_start: '2024-01-01T00:00:00Z',
          registration_end: '2024-01-20T23:59:59Z',
          tournament_start: '2024-01-25T09:00:00Z',
          tournament_end: '2024-01-28T18:00:00Z',
          venue_address: 'Arena Billiards TPHCM',
          description: 'Giải đấu 10-ball masters',
          created_by: 'admin1',
          created_at: '2023-12-20T08:00:00Z',
          updated_at: '2024-01-28T18:00:00Z',
          organizer_name: 'Nguyễn Văn Admin',
          club_name: 'Arena Billiards TPHCM',
        },
        {
          tournament_id: 'TOUR005',
          name: 'Weekly Swiss Tournament',
          status: 'draft',
          tournament_type: 'swiss',
          game_format: '9_ball',
          max_participants: 24,
          current_participants: 0,
          entry_fee: 75000,
          prize_pool: 1800000,
          registration_start: '2024-03-10T00:00:00Z',
          registration_end: '2024-03-17T23:59:59Z',
          tournament_start: '2024-03-18T19:00:00Z',
          tournament_end: null,
          venue_address: 'CLB Billiards Cần Thơ',
          description: 'Giải Swiss hàng tuần',
          created_by: 'admin4',
          created_at: '2024-02-28T15:45:00Z',
          updated_at: '2024-02-28T15:45:00Z',
          organizer_name: 'Phạm Thị Admin',
          club_name: 'CLB Billiards Cần Thơ',
        },
      ];

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 600));
      
      setTournaments(mockTournaments);
    } catch (err: any) {
      console.error('Error fetching tournaments:', err);
      setError(err.message);
      toast.error('Không thể tải danh sách giải đấu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTournaments();
  }, [fetchTournaments]);

  return { tournaments, loading, error, refetch: fetchTournaments };
}

// Hook for tournament stats
export function useAdminTournamentStats() {
  const [stats, setStats] = useState<AdminTournamentStats>({
    totalTournaments: 0,
    activeTournaments: 0,
    upcomingTournaments: 0,
    completedTournaments: 0,
    totalPrizePool: 0,
    totalParticipants: 0,
    averageParticipants: 0,
    registrationOpenCount: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);

      // Mock tournament stats calculation
      const mockStats: AdminTournamentStats = {
        totalTournaments: 127,
        activeTournaments: 8,
        upcomingTournaments: 15,
        completedTournaments: 98,
        totalPrizePool: 156800000,
        totalParticipants: 2847,
        averageParticipants: 28,
        registrationOpenCount: 6,
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 400));
      
      setStats(mockStats);
    } catch (err: any) {
      console.error('Error fetching tournament stats:', err);
      toast.error('Không thể tải thống kê giải đấu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, refetch: fetchStats };
}
