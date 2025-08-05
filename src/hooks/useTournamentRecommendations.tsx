import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Tournament, UserLocation } from '@/types/common';

interface TournamentRecommendation {
  id: string;
  title: string;
  description: string;
  tournament_type: string;
  game_format: string;
  max_participants: number;
  current_participants: number;
  registration_start: string;
  registration_end: string;
  tournament_start: string;
  tournament_end: string;
  club_id: string;
  venue_address: string;
  entry_fee_points: number;
  total_prize_pool: number;
  first_prize: number;
  second_prize: number;
  third_prize: number;
  status: string;
  banner_image: string;
  rules: string;
  contact_info: any;
  club: {
    id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    phone: string;
    available_tables: number;
    is_sabo_owned: boolean;
  };
  recommendation_score: number;
  distance_km?: number;
}

export const useTournamentRecommendations = () => {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState<TournamentRecommendation[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);

  useEffect(() => {
    if (user) {
      loadUserLocation();
      loadTournamentRecommendations();
    }
  }, [user]);

  const loadUserLocation = async () => {
    try {
      // Mock user location since user_locations table doesn't exist
      const mockLocation = {
        user_id: user?.id || '',
        latitude: 21.0285,
        longitude: 105.8542,
        max_distance_km: 20,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setUserLocation(mockLocation);
    } catch (error) {
      // ...removed console.log('No user location found')
    }
  };

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const calculateTournamentScore = (
    tournament: Tournament,
    userLocation: UserLocation,
    userInteractions: any[]
  ) => {
    let score = 0;

    // 1. Distance Score (40% weight) - Gần hơn = điểm cao hơn
    if (userLocation && tournament.club.latitude && tournament.club.longitude) {
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        tournament.club.latitude,
        tournament.club.longitude
      );
      const maxDistance = userLocation.max_distance_km || 20;
      score += Math.max(0, ((maxDistance - distance) / maxDistance) * 400);
      tournament.distance_km = Math.round(distance * 10) / 10;
    }

    // 2. User-Club Interaction Score (35% weight)
    const userInteraction = userInteractions.find(
      interaction => interaction.club_id === tournament.club_id
    );
    if (userInteraction) {
      score += Math.min(userInteraction.interaction_score, 350);

      // Bonus cho tương tác gần đây
      const daysSinceLastInteraction = Math.floor(
        (Date.now() - new Date(userInteraction.last_interaction).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      if (daysSinceLastInteraction < 30) {
        score += 50; // Bonus cho tương tác trong 30 ngày qua
      }
    }

    // 3. Prize Pool Score (20% weight)
    const normalizedPrizePool = Math.min(tournament.total_prize_pool / 10, 200);
    score += normalizedPrizePool;

    // 4. Tournament Attractiveness (5% weight)
    const participationRatio =
      tournament.current_participants / tournament.max_participants;
    if (participationRatio >= 0.3 && participationRatio <= 0.8) {
      score += 50; // Sweet spot participation
    }

    // Bonus cho tournament sắp bắt đầu đăng ký
    const daysUntilStart = Math.floor(
      (new Date(tournament.registration_start).getTime() - Date.now()) /
        (1000 * 60 * 60 * 24)
    );
    if (daysUntilStart >= 0 && daysUntilStart <= 7) {
      score += 30; // Bonus cho tournament sắp mở đăng ký
    }

    // Bonus cho CLB SABO
    if (tournament.club.is_sabo_owned) {
      score += 100;
    }

    return Math.round(score);
  };

  const loadTournamentRecommendations = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Mock user interactions since user_club_interactions table doesn't exist
      const userInteractions = [
        {
          club_id: 'club_1',
          interaction_score: 100,
          last_interaction: new Date().toISOString(),
        },
      ];

      // Mock tournaments data since tournaments table doesn't have all required fields
      const mockTournaments: TournamentRecommendation[] = [
        {
          id: '1',
          title: 'Giải đấu Bi-a Hà Nội Open',
          description: 'Giải đấu bi-a lớn nhất Hà Nội',
          tournament_type: 'single_elimination',
          game_format: '8_ball',
          max_participants: 32,
          current_participants: 12,
          registration_start: new Date().toISOString(),
          registration_end: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
          ).toISOString(),
          tournament_start: new Date(
            Date.now() + 14 * 24 * 60 * 60 * 1000
          ).toISOString(),
          tournament_end: new Date(
            Date.now() + 16 * 24 * 60 * 60 * 1000
          ).toISOString(),
          club_id: 'club_1',
          venue_address: 'Hà Nội',
          entry_fee_points: 100,
          total_prize_pool: 1000000,
          first_prize: 500000,
          second_prize: 300000,
          third_prize: 200000,
          status: 'registration_open',
          banner_image: '',
          rules: 'Luật chuẩn 8 ball',
          contact_info: {},
          club: {
            id: 'club_1',
            name: 'CLB Bi-a Hà Nội',
            address: 'Hà Nội',
            latitude: 21.0285,
            longitude: 105.8542,
            phone: '0123456789',
            available_tables: 10,
            is_sabo_owned: true,
          },
          recommendation_score: 450,
          distance_km: 5.2,
        },
        {
          id: '2',
          title: 'Giải đấu CLB Thành phố',
          description: 'Giải đấu định kỳ hàng tháng',
          tournament_type: 'round_robin',
          game_format: '9_ball',
          max_participants: 16,
          current_participants: 8,
          registration_start: new Date(
            Date.now() + 3 * 24 * 60 * 60 * 1000
          ).toISOString(),
          registration_end: new Date(
            Date.now() + 10 * 24 * 60 * 60 * 1000
          ).toISOString(),
          tournament_start: new Date(
            Date.now() + 17 * 24 * 60 * 60 * 1000
          ).toISOString(),
          tournament_end: new Date(
            Date.now() + 19 * 24 * 60 * 60 * 1000
          ).toISOString(),
          club_id: 'club_2',
          venue_address: 'Tp. Hồ Chí Minh',
          entry_fee_points: 50,
          total_prize_pool: 500000,
          first_prize: 250000,
          second_prize: 150000,
          third_prize: 100000,
          status: 'upcoming',
          banner_image: '',
          rules: 'Luật chuẩn 9 ball',
          contact_info: {},
          club: {
            id: 'club_2',
            name: 'SABO Billiards',
            address: 'Tp. Hồ Chí Minh',
            latitude: 10.8231,
            longitude: 106.6297,
            phone: '0987654321',
            available_tables: 8,
            is_sabo_owned: false,
          },
          recommendation_score: 320,
          distance_km: 15.8,
        },
      ];

      setTournaments(mockTournaments);
    } catch (error) {
      console.error('Error loading tournament recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const trackUserClubInteraction = async (
    clubId: string,
    interactionType: string,
    metadata = {}
  ) => {
    if (!user?.id) return;

    try {
      // Mock track interaction since user_club_interactions table doesn't exist
      console.log('Mock tracking interaction:', {
        clubId,
        interactionType,
        metadata,
      });

      // Reload recommendations to reflect new interaction
      loadTournamentRecommendations();
    } catch (error) {
      console.error('Error tracking interaction:', error);
    }
  };

  const getTournamentsByFilter = async (filter: string) => {
    if (!user?.id) return [];

    try {
      // Mock tournaments data filtered by type since tournaments table doesn't have all required fields
      const mockFilteredTournaments: TournamentRecommendation[] = [
        {
          id: '3',
          title: 'Giải đấu Miền Bắc Championship',
          description: 'Giải đấu khu vực miền Bắc',
          tournament_type: 'double_elimination',
          game_format: '10_ball',
          max_participants: 64,
          current_participants: 20,
          registration_start: new Date(
            Date.now() + 2 * 24 * 60 * 60 * 1000
          ).toISOString(),
          registration_end: new Date(
            Date.now() + 9 * 24 * 60 * 60 * 1000
          ).toISOString(),
          tournament_start: new Date(
            Date.now() + 16 * 24 * 60 * 60 * 1000
          ).toISOString(),
          tournament_end: new Date(
            Date.now() + 18 * 24 * 60 * 60 * 1000
          ).toISOString(),
          club_id: 'club_3',
          venue_address: 'Hải Phòng',
          entry_fee_points: 200,
          total_prize_pool: 2000000,
          first_prize: 1000000,
          second_prize: 600000,
          third_prize: 400000,
          status: 'upcoming',
          banner_image: '',
          rules: 'Luật chuẩn 10 ball',
          contact_info: {},
          club: {
            id: 'club_3',
            name: 'CLB Bi-a Hải Phòng',
            address: 'Hải Phòng',
            latitude: 20.8449,
            longitude: 106.6881,
            phone: '0123456790',
            available_tables: 12,
            is_sabo_owned: true,
          },
          recommendation_score: 0,
          distance_km: 25.4,
        },
      ];

      // Apply basic filtering
      let filteredData = mockFilteredTournaments;

      switch (filter) {
        case 'nearby':
          filteredData = mockFilteredTournaments.filter(
            t => (t.distance_km || 0) < 30
          );
          break;
        case 'high_prize':
          filteredData = mockFilteredTournaments.sort(
            (a, b) => b.total_prize_pool - a.total_prize_pool
          );
          break;
        case 'recent':
          filteredData = mockFilteredTournaments.sort(
            (a, b) =>
              new Date(b.registration_start).getTime() -
              new Date(a.registration_start).getTime()
          );
          break;
      }

      return filteredData;
    } catch (error) {
      console.error('Error loading tournaments by filter:', error);
    }

    return [];
  };

  return {
    tournaments,
    loading,
    userLocation,
    loadTournamentRecommendations,
    trackUserClubInteraction,
    getTournamentsByFilter,
  };
};
