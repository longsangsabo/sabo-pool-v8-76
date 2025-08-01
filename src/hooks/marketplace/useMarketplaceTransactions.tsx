import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../useAuth';

export interface MarketplaceTransaction {
  id: string;
  item_id: string;
  buyer_id: string;
  seller_id: string;
  transaction_amount: number;
  commission_amount: number;
  payment_method: string;
  delivery_method: string;
  delivery_address?: string;
  status: string;
  tracking_number?: string;
  completed_at?: string;
  created_at: string;
}

export const useMarketplaceTransactions = () => {
  const [myTransactions, setMyTransactions] = useState<
    MarketplaceTransaction[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchMyTransactions = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Use mock marketplace transactions since marketplace_transactions table doesn't exist
      const mockTransactions: MarketplaceTransaction[] = [
        {
          id: '1',
          item_id: '1',
          buyer_id: user.id,
          seller_id: '2',
          transaction_amount: 2500000,
          commission_amount: 125000,
          payment_method: 'vnpay',
          delivery_method: 'shipping',
          delivery_address: '123 Nguyễn Huệ, Q1, TP.HCM',
          status: 'completed',
          tracking_number: 'VNP123456789',
          completed_at: new Date().toISOString(),
          created_at: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: '2',
          item_id: '2',
          buyer_id: '3',
          seller_id: user.id,
          transaction_amount: 15000000,
          commission_amount: 750000,
          payment_method: 'bank_transfer',
          delivery_method: 'pickup',
          status: 'pending',
          created_at: new Date(Date.now() - 172800000).toISOString(),
        },
      ];

      setMyTransactions(mockTransactions);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch transactions'
      );
    } finally {
      setLoading(false);
    }
  };

  return {
    myTransactions,
    loading,
    error,
    fetchMyTransactions,
  };
};
