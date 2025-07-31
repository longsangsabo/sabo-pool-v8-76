
import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Coins } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export const SPAPointsBadge: React.FC = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching wallet balance for user:', user.id);
        
        const { data, error } = await supabase
          .from('spa_transactions')
          .select('amount')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching SPA balance:', error);
          setBalance(0);
        } else {
          const newBalance = data?.amount || 0;
          console.log('SPA balance fetched:', newBalance);
          setBalance(newBalance);
        }
      } catch (error) {
        console.error('Error fetching wallet balance:', error);
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
          table: 'spa_transactions',
          filter: `user_id=eq.${user?.id}`,
        },
        (payload) => {
          console.log('SPA balance updated via realtime:', payload);
          if (payload.new && 'amount' in payload.new) {
            setBalance(payload.new.amount as number);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (loading) {
    return (
      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
        <Coins className="w-3 h-3 mr-1" />
        <span>...</span>
      </Badge>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Badge variant="outline" className="bg-gradient-to-r from-yellow-50 to-orange-50 text-yellow-700 border-yellow-200 hover:from-yellow-100 hover:to-orange-100">
      <Coins className="w-3 h-3 mr-1" />
      <span className="font-medium">{balance} SPA</span>
    </Badge>
  );
};

export default SPAPointsBadge;
