import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../useAuth';
import { MarketplaceItem } from './types';

export const useMyMarketplaceItems = () => {
  const [myItems, setMyItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchMyItems = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Use mock marketplace items since marketplace_items table doesn't exist
      const mockMyItems: MarketplaceItem[] = [
        {
          id: '1',
          seller_id: user.id,
          title: 'Cơ bi-a của tôi',
          description: 'Cơ bi-a chất lượng cao, ít sử dụng',
          category: 'cues',
          condition: 'like_new',
          price: 2500000,
          brand: 'Predator',
          images: [],
          location: 'Hồ Chí Minh',
          status: 'active',
          views_count: 150,
          favorites_count: 12,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          seller: null,
          marketplace_reviews: [],
          shipping_available: true,
        },
      ];

      setMyItems(mockMyItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch my items');
    } finally {
      setLoading(false);
    }
  };

  const createItem = async (
    itemData: Omit<
      MarketplaceItem,
      | 'id'
      | 'seller_id'
      | 'created_at'
      | 'updated_at'
      | 'views_count'
      | 'favorites_count'
      | 'seller'
      | 'marketplace_reviews'
      | 'shipping_available'
    >
  ) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Mock item creation since marketplace_items table doesn't exist
      const newItem = {
        ...itemData,
        id: Date.now().toString(),
        seller_id: user.id,
        views_count: 0,
        favorites_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log('Mock create item:', newItem);

      // Refresh items
      await fetchMyItems();
      return newItem;
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : 'Failed to create item'
      );
    }
  };

  const updateItem = async (
    itemId: string,
    updates: Partial<
      Omit<
        MarketplaceItem,
        | 'id'
        | 'seller_id'
        | 'created_at'
        | 'seller'
        | 'marketplace_reviews'
        | 'shipping_available'
      >
    >
  ) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Mock item update since marketplace_items table doesn't exist
      const updatedItem = {
        ...updates,
        id: itemId,
        updated_at: new Date().toISOString(),
      };

      console.log('Mock update item:', updatedItem);

      // Refresh items
      await fetchMyItems();
      return updatedItem;
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : 'Failed to update item'
      );
    }
  };

  return {
    myItems,
    loading,
    error,
    fetchMyItems,
    createItem,
    updateItem,
  };
};
