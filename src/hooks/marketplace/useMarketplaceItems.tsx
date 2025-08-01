import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MarketplaceItem } from './types';

interface ItemFilters {
  category?: string;
  search?: string;
  priceRange?: [number, number];
  province_id?: string;
  condition?: string;
  seller_type?: string;
  trusted_seller?: boolean;
}

export const useMarketplaceItems = () => {
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = async (filters?: ItemFilters) => {
    setLoading(true);
    setError(null);

    try {
      // Use mock marketplace items since marketplace_items table doesn't exist
      const mockItems: MarketplaceItem[] = [
        {
          id: '1',
          seller_id: '1',
          title: 'Cơ bi-a cao cấp',
          description: 'Cơ bi-a chất lượng cao, ít sử dụng',
          category: 'cues',
          price: 2500000,
          condition: 'like_new',
          images: [],
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          brand: 'Predator',
          location: 'Hồ Chí Minh',
          shipping_available: true,
          seller: {
            id: '1',
            full_name: 'Nguyễn Văn A',
            nickname: 'VanA',
            avatar_url: undefined,
            club_id: '1',
            province_id: '1',
            provinces: { name: 'Hồ Chí Minh', region: 'South' },
            total_items: 5,
            avg_response_time: 2,
          },
          marketplace_reviews: [],
          views_count: 150,
          favorites_count: 12,
        },
        {
          id: '2',
          seller_id: '2',
          title: 'Bàn bi-a 9 bi mini',
          description: 'Bàn bi-a mini cho gia đình',
          category: 'tables',
          price: 15000000,
          condition: 'good',
          images: [],
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          brand: 'Brunswick',
          location: 'Hà Nội',
          shipping_available: false,
          seller: {
            id: '2',
            full_name: 'Trần Thị B',
            nickname: 'ThiB',
            avatar_url: undefined,
            club_id: '2',
            province_id: '2',
            provinces: { name: 'Hà Nội', region: 'North' },
            total_items: 3,
            avg_response_time: 1,
          },
          marketplace_reviews: [],
          views_count: 89,
          favorites_count: 8,
        },
      ];

      // Apply filters to mock data
      let filteredItems = mockItems;

      if (filters?.category && filters.category !== 'all') {
        filteredItems = filteredItems.filter(
          item => item.category === filters.category
        );
      }

      if (filters?.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredItems = filteredItems.filter(
          item =>
            item.title.toLowerCase().includes(searchTerm) ||
            item.description.toLowerCase().includes(searchTerm) ||
            item.brand?.toLowerCase().includes(searchTerm)
        );
      }

      if (filters?.priceRange) {
        filteredItems = filteredItems.filter(
          item =>
            item.price >= filters.priceRange![0] &&
            item.price <= filters.priceRange![1]
        );
      }

      if (filters?.condition) {
        filteredItems = filteredItems.filter(
          item => item.condition === filters.condition
        );
      }

      setItems(filteredItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch items');
    } finally {
      setLoading(false);
    }
  };

  const incrementViews = async (itemId: string) => {
    try {
      // Mock increment views since marketplace_items table doesn't exist
      console.log('Mock increment views for item:', itemId);

      // Update local state if needed
      setItems(prevItems =>
        prevItems.map(item =>
          item.id === itemId
            ? { ...item, views_count: (item.views_count || 0) + 1 }
            : item
        )
      );
    } catch (err) {
      console.error('Failed to increment views:', err);
    }
  };

  return {
    items,
    loading,
    error,
    fetchItems,
    incrementViews,
  };
};
