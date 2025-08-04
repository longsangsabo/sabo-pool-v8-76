import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  transaction_type: string;
  description: string;
  reference_id?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export const useFinancials = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFinancialData();
      subscribeToUpdates();
    }
  }, [user]);

  const fetchFinancialData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch wallet
      const { data: walletData, error: walletError } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (walletError && walletError.code !== 'PGRST116') {
        console.error('Error fetching wallet:', walletError);
      } else if (walletData) {
        setWallet(walletData);
      } else {
        // Initialize wallet if it doesn't exist
        await initializeWallet();
      }

      // Fetch transactions
      const { data: transactionData, error: transactionError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (transactionError) {
        console.error('Error fetching transactions:', transactionError);
      } else {
        setTransactions(transactionData || []);
      }

    } catch (error) {
      console.error('Error fetching financial data:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải dữ liệu tài chính',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const initializeWallet = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_wallets')
        .insert({
          user_id: user.id,
          balance: 0
        })
        .select()
        .single();

      if (error) {
        console.error('Error initializing wallet:', error);
      } else {
        setWallet(data);
      }
    } catch (error) {
      console.error('Error initializing wallet:', error);
    }
  };

  const updateBalance = async (amount: number, type: string, description: string, referenceId?: string) => {
    if (!user || !wallet) return false;

    try {
      const newBalance = wallet.balance + amount;

      if (newBalance < 0) {
        toast({
          title: 'Lỗi',
          description: 'Số dư không đủ',
          variant: 'destructive',
        });
        return false;
      }

      // Update wallet balance
      const { error: walletError } = await supabase
        .from('user_wallets')
        .update({ 
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (walletError) {
        console.error('Error updating wallet:', walletError);
        return false;
      }

      // Record transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          amount,
          transaction_type: type,
          description,
          reference_id: referenceId
        });

      if (transactionError) {
        console.error('Error recording transaction:', transactionError);
      }

      // Update local state
      setWallet(prev => prev ? { ...prev, balance: newBalance } : null);
      
      toast({
        title: 'Thành công',
        description: amount > 0 ? 'Đã nạp tiền' : 'Đã trừ tiền',
      });

      return true;
    } catch (error) {
      console.error('Error updating balance:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể cập nhật số dư',
        variant: 'destructive',
      });
      return false;
    }
  };

  const subscribeToUpdates = () => {
    if (!user) return;

    const channel = supabase.channel('financial_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_wallets',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.new) {
            setWallet(payload.new as Wallet);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.new) {
            setTransactions(prev => [payload.new as Transaction, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  return {
    wallet,
    transactions,
    loading,
    updateBalance,
    refreshData: fetchFinancialData
  };
};
