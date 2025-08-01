import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export const useSPABalance = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!user) {
        setBalance(0);
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching SPA balance for user:', user.id);

        const { data, error } = await supabase
          .from('player_rankings')
          .select('spa_points')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching SPA balance:', error);
          setBalance(0);
        } else {
          const newBalance = data?.spa_points || 0;
          console.log('SPA balance fetched:', newBalance);
          setBalance(newBalance);
        }
      } catch (error) {
        console.error('Error fetching SPA balance:', error);
        setBalance(0);
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();

    // Set up real-time subscription for balance updates
    const channel = supabase
      .channel('spa-balance')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'player_rankings',
          filter: `user_id=eq.${user?.id}`,
        },
        payload => {
          console.log('SPA balance updated via realtime:', payload);
          if (payload.new && 'spa_points' in payload.new) {
            setBalance(payload.new.spa_points as number);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { balance, loading };
};
