import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useClubContext } from '../../contexts/ClubContext';

interface TableSession {
  id: string;
  table_id: string;
  start_time: string;
  end_time?: string;
  player_id?: string;
  player_name?: string;
  status: 'active' | 'completed' | 'cancelled';
}

interface TableBooking {
  id: string;
  table_id: string;
  start_time: string;
  end_time: string;
  player_id: string;
  player_name: string;
  status: 'confirmed' | 'cancelled';
}

export const useTableManagement = () => {
  const { selectedClub } = useClubContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tables, setTables] = useState<any[]>([]);

  useEffect(() => {
    if (selectedClub) {
      loadTables();
    }
  }, [selectedClub]);

  const loadTables = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tables')
        .select('*, table_sessions(*), table_bookings(*)')
        .eq('club_id', selectedClub?.id)
        .order('number');

      if (error) throw error;
      setTables(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tables');
    } finally {
      setLoading(false);
    }
  };

  const startSession = async (tableId: string, playerId?: string, playerName?: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('table_sessions')
        .insert([
          {
            table_id: tableId,
            start_time: new Date().toISOString(),
            player_id: playerId,
            player_name: playerName,
            status: 'active',
          },
        ])
        .select()
        .single();

      if (error) throw error;
      await loadTables();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start session');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const endSession = async (sessionId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('table_sessions')
        .update({
          end_time: new Date().toISOString(),
          status: 'completed',
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;
      await loadTables();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to end session');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createBooking = async (tableId: string, booking: Omit<TableBooking, 'id' | 'table_id' | 'status'>) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('table_bookings')
        .insert([
          {
            table_id: tableId,
            ...booking,
            status: 'confirmed',
          },
        ])
        .select()
        .single();

      if (error) throw error;
      await loadTables();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create booking');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    tables,
    loading,
    error,
    startSession,
    endSession,
    createBooking,
    refreshTables: loadTables,
  };
};
