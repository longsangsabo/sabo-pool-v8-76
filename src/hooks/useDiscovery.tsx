import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface DiscoveryItem {
  id: string;
  type: 'player' | 'club' | 'tournament' | 'event' | 'post';
  title: string;
  description: string;
  image_url?: string;
  location?: {
    address: string;
    city: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  distance?: number;
  rank?: string;
  points?: number;
  tags: string[];
  created_at: Date;
  updated_at: Date;
  metadata?: {
    [key: string]: any;
  };
}

export interface DiscoveryFilters {
  type?: DiscoveryItem['type'][];
  location?: string;
  radius?: number;
  rating?: number;
  tags?: string[];
  price_range?: {
    min: number;
    max: number;
  };
  date_range?: {
    from: Date;
    to: Date;
  };
}

export const useDiscovery = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [items, setItems] = useState<DiscoveryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<DiscoveryFilters>({});
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // Get user location
  const getUserLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        error => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

  // Fetch discovery items
  const fetchDiscoveryItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock discovery data
      const mockItems: DiscoveryItem[] = [
        {
          id: '1',
          type: 'club',
          title: 'Club Bida ABC',
          description: 'Club bida cao cấp với 20 bàn chơi và dịch vụ đầy đủ',
          image_url: '/images/club-abc.jpg',
          location: {
            address: '123 Đường ABC, Quận 1',
            city: 'TP.HCM',
            coordinates: { lat: 10.7769, lng: 106.7009 },
          },
          rating: 4.5,
          distance: 2.3,
          tags: ['cao cấp', 'nhiều bàn', 'dịch vụ tốt'],
          created_at: new Date(),
          updated_at: new Date(),
          metadata: {
            table_count: 20,
            price_per_hour: 50000,
            amenities: ['wifi', 'parking', 'food'],
          },
        },
        {
          id: '2',
          type: 'player',
          title: 'Nguyễn Văn A',
          description: 'Tay cơ chuyên nghiệp, hạng A+, sẵn sàng thách đấu',
          image_url: '/avatars/player-a.jpg',
          location: {
            address: '456 Đường XYZ, Quận 3',
            city: 'TP.HCM',
          },
          rating: 4.8,
          distance: 1.5,
          tags: ['chuyên nghiệp', 'hạng A+', 'thách đấu'],
          created_at: new Date(),
          updated_at: new Date(),
          metadata: {
            rank: 'A+',
            win_rate: 0.75,
            total_matches: 150,
          },
        },
        {
          id: '3',
          type: 'tournament',
          title: 'Giải đấu mùa xuân 2024',
          description: 'Giải đấu bida lớn với tổng giải thưởng 50 triệu đồng',
          image_url: '/images/tournament-spring.jpg',
          location: {
            address: '789 Đường VIP, Quận 7',
            city: 'TP.HCM',
          },
          rating: 4.7,
          distance: 5.2,
          tags: ['giải đấu', 'giải thưởng lớn', 'chuyên nghiệp'],
          created_at: new Date(),
          updated_at: new Date(),
          metadata: {
            prize_pool: 50000000,
            entry_fee: 100000,
            max_participants: 64,
          },
        },
        {
          id: '4',
          type: 'event',
          title: 'Workshop kỹ thuật bida',
          description: 'Học kỹ thuật từ các chuyên gia hàng đầu',
          image_url: '/images/workshop.jpg',
          location: {
            address: '321 Đường Học, Quận 5',
            city: 'TP.HCM',
          },
          rating: 4.6,
          distance: 3.1,
          tags: ['workshop', 'học tập', 'chuyên gia'],
          created_at: new Date(),
          updated_at: new Date(),
          metadata: {
            duration: '3 giờ',
            price: 200000,
            instructor: 'Nguyễn Văn B',
          },
        },
        {
          id: '5',
          type: 'post',
          title: 'Kinh nghiệm chơi 8-ball',
          description: 'Chia sẻ kinh nghiệm và tips chơi 8-ball hiệu quả',
          image_url: '/images/8ball-tips.jpg',
          location: {
            address: 'Online',
            city: 'Toàn quốc',
          },
          rating: 4.4,
          tags: ['kinh nghiệm', 'tips', '8-ball'],
          created_at: new Date(),
          updated_at: new Date(),
          metadata: {
            author: 'pool_expert',
            read_time: '5 phút',
            likes: 45,
          },
        },
      ];

      setItems(mockItems);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Không thể tải dữ liệu khám phá'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Apply filters
  const applyFilters = useCallback((newFilters: DiscoveryFilters) => {
    setFilters(newFilters);
  }, []);

  // Clear filters
  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  // Get filtered items
  const getFilteredItems = useCallback(() => {
    let filtered = [...items];

    // Filter by type
    if (filters.type && filters.type.length > 0) {
      filtered = filtered.filter(item => filters.type!.includes(item.type));
    }

    // Filter by location/radius
    if (filters.location && userLocation) {
      // This would implement actual distance calculation
      filtered = filtered.filter(
        item => item.distance && item.distance <= (filters.radius || 10)
      );
    }

    // Filter by rating
    if (filters.rating) {
      filtered = filtered.filter(
        item => item.rating && item.rating >= filters.rating!
      );
    }

    // Filter by tags
    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(item =>
        filters.tags!.some(tag => item.tags.includes(tag))
      );
    }

    // Filter by price range
    if (filters.price_range) {
      filtered = filtered.filter(item => {
        const price =
          item.metadata?.price_per_hour || item.metadata?.price || 0;
        return (
          price >= filters.price_range!.min && price <= filters.price_range!.max
        );
      });
    }

    // Filter by date range
    if (filters.date_range) {
      filtered = filtered.filter(
        item =>
          item.created_at >= filters.date_range!.from &&
          item.created_at <= filters.date_range!.to
      );
    }

    return filtered;
  }, [items, filters, userLocation]);

  // Search items
  const searchItems = useCallback(
    (query: string) => {
      const lowercaseQuery = query.toLowerCase();
      return items.filter(
        item =>
          item.title.toLowerCase().includes(lowercaseQuery) ||
          item.description.toLowerCase().includes(lowercaseQuery) ||
          item.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
      );
    },
    [items]
  );

  // Get items by type
  const getItemsByType = useCallback(
    (type: DiscoveryItem['type']) => {
      return items.filter(item => item.type === type);
    },
    [items]
  );

  // Get nearby items
  const getNearbyItems = useCallback(
    (radius: number = 5) => {
      if (!userLocation) return [];
      return items.filter(item => item.distance && item.distance <= radius);
    },
    [items, userLocation]
  );

  // Get trending items
  const getTrendingItems = useCallback(() => {
    return items.sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 10);
  }, [items]);

  useEffect(() => {
    getUserLocation();
    fetchDiscoveryItems();
  }, [getUserLocation, fetchDiscoveryItems]);

  const sendChallenge = useMutation({
    mutationFn: async ({
      challengedId,
      betPoints,
      message,
      proposedClubId,
      proposedDatetime,
    }: {
      challengedId: string;
      betPoints: number;
      message: string;
      proposedClubId?: string;
      proposedDatetime?: string;
    }) => {
      // Mock challenge creation since challenges table has different schema
      console.log('Mock create challenge:', {
        challenger_id: user?.id,
        opponent_id: challengedId, // Use opponent_id instead of challenged_id
        bet_points: betPoints,
        status: 'pending',
        club_id: proposedClubId,
        scheduled_time: proposedDatetime,
      });

      // Mock notification creation since notifications table doesn't exist
      console.log('Mock create notification:', {
        user_id: challengedId,
        type: 'challenge_received',
        title: 'Bạn có thách đấu mới! ⚡',
        message: `Có người muốn thách đấu với mức cược ${betPoints} điểm`,
        club_id: proposedClubId,
        is_read: false,
      });

      return { success: true };
    },
    onSuccess: () => {
      toast.success('Thách đấu đã được gửi! ⚡');
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
    },
    onError: error => {
      console.error('Error sending challenge:', error);
      toast.error('Có lỗi xảy ra khi gửi thách đấu');
    },
  });

  return {
    items,
    loading,
    error,
    filters,
    userLocation,
    fetchDiscoveryItems,
    applyFilters,
    clearFilters,
    getFilteredItems,
    searchItems,
    getItemsByType,
    getNearbyItems,
    getTrendingItems,
    getUserLocation,
    sendChallenge,
  };
};
