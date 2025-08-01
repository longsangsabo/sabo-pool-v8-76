import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// Simplified Profile Types
interface ProfileData {
  user_id: string;
  display_name: string;
  full_name: string;
  phone: string;
  bio: string;
  skill_level: 'beginner' | 'intermediate' | 'advanced' | 'pro';
  city: string;
  district: string;
  avatar_url: string;
  role: 'player' | 'club_owner' | 'both';
  completion_percentage?: number;
}

interface ProfileStats {
  total_matches: number;
  wins: number;
  losses: number;
  win_rate: number;
  current_rank: string;
  spa_points: number;
  elo_points: number;
}

interface ProfileContextType {
  // State
  profile: ProfileData | null;
  stats: ProfileStats | null;
  loading: boolean;

  // Actions
  loadProfile: () => Promise<void>;
  updateProfile: (data: Partial<ProfileData>) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;

  // Helpers
  updateField: (field: string, value: any) => void;
  hasChanges: boolean;
  saveChanges: () => Promise<void>;
  resetChanges: () => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

const defaultProfile: ProfileData = {
  user_id: '',
  display_name: '',
  full_name: '',
  phone: '',
  bio: '',
  skill_level: 'beginner',
  city: '',
  district: '',
  avatar_url: '',
  role: 'player',
  completion_percentage: 0,
};

const defaultStats: ProfileStats = {
  total_matches: 0,
  wins: 0,
  losses: 0,
  win_rate: 0,
  current_rank: 'K',
  spa_points: 0,
  elo_points: 1000,
};

export const UnifiedProfileProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [originalProfile, setOriginalProfile] = useState<ProfileData | null>(
    null
  );
  const [stats, setStats] = useState<ProfileStats | null>(defaultStats);
  const [loading, setLoading] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      // Load profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      const formattedProfile: ProfileData = {
        user_id: user.id,
        display_name: profileData?.display_name || profileData?.full_name || '',
        full_name: profileData?.full_name || '',
        phone: profileData?.phone || user.phone || '',
        bio: profileData?.bio || '',
        skill_level:
          (profileData?.skill_level as
            | 'beginner'
            | 'intermediate'
            | 'advanced'
            | 'pro') || 'beginner',
        city: '',
        district: '',
        avatar_url: profileData?.avatar_url || '',
        role:
          (profileData?.role as 'player' | 'club_owner' | 'both') || 'player',
      };

      setProfile(formattedProfile);
      setOriginalProfile({ ...formattedProfile });

      // Load stats
      const { data: rankingData } = await supabase
        .from('player_rankings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      const formattedStats: ProfileStats = {
        total_matches: rankingData?.total_matches || 0,
        wins: rankingData?.wins || 0,
        losses: (rankingData?.total_matches || 0) - (rankingData?.wins || 0), // Calculate losses
        win_rate:
          rankingData?.total_matches > 0
            ? ((rankingData.wins || 0) / rankingData.total_matches) * 100
            : 0,
        current_rank: 'K', // Simplified
        spa_points: rankingData?.spa_points || 0,
        elo_points: rankingData?.elo_points || 1000,
      };

      setStats(formattedStats);
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Lỗi khi tải thông tin hồ sơ');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const updateProfile = useCallback(
    async (data: Partial<ProfileData>) => {
      if (!user?.id || !profile) return;

      setLoading(true);
      try {
        const updateData = {
          ...data,
          full_name: data.display_name || data.full_name, // Sync display_name with full_name
        };

        const { error } = await supabase.from('profiles').upsert({
          user_id: user.id,
          ...updateData,
        });

        if (error) throw error;

        setProfile(prev => (prev ? { ...prev, ...data } : null));
        setOriginalProfile(prev => (prev ? { ...prev, ...data } : null));

        toast.success('Cập nhật thông tin thành công!');
      } catch (error) {
        console.error('Error updating profile:', error);
        toast.error('Lỗi khi cập nhật thông tin');
      } finally {
        setLoading(false);
      }
    },
    [user?.id, profile]
  );

  const uploadAvatar = useCallback(
    async (file: File) => {
      if (!user?.id) return;

      setLoading(true);
      try {
        // Compress and upload image
        const fileName = `${user.id}/avatar.jpg`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        const avatarUrl = urlData.publicUrl + '?t=' + new Date().getTime();

        await updateProfile({ avatar_url: avatarUrl });
      } catch (error) {
        console.error('Error uploading avatar:', error);
        toast.error('Lỗi khi tải ảnh đại diện');
      } finally {
        setLoading(false);
      }
    },
    [user?.id, updateProfile]
  );

  const updateField = useCallback(
    (field: string, value: any) => {
      if (!profile) return;
      setProfile({ ...profile, [field]: value });
    },
    [profile]
  );

  const hasChanges = !!(
    profile &&
    originalProfile &&
    JSON.stringify(profile) !== JSON.stringify(originalProfile)
  );

  const saveChanges = useCallback(async () => {
    if (!profile || !hasChanges) return;
    await updateProfile(profile);
  }, [profile, hasChanges, updateProfile]);

  const resetChanges = useCallback(() => {
    if (originalProfile) {
      setProfile({ ...originalProfile });
    }
  }, [originalProfile]);

  // Load profile on mount and setup real-time subscriptions
  useEffect(() => {
    loadProfile();

    // Set up real-time subscription for profile changes
    const profileChannel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${user?.id}`,
        },
        payload => {
          console.log('Profile updated:', payload);
          if (payload.new && typeof payload.new === 'object') {
            const newData = payload.new as any;
            const updatedProfile: ProfileData = {
              user_id: newData.user_id || '',
              display_name: newData.display_name || newData.full_name || '',
              full_name: newData.full_name || '',
              phone: newData.phone || '',
              bio: newData.bio || '',
              skill_level:
                (newData.skill_level as
                  | 'beginner'
                  | 'intermediate'
                  | 'advanced'
                  | 'pro') || 'beginner',
              city: newData.city || '',
              district: newData.district || '',
              avatar_url: newData.avatar_url || '',
              role:
                (newData.role as 'player' | 'club_owner' | 'both') || 'player',
              completion_percentage: newData.completion_percentage || 0,
            };
            setProfile(updatedProfile);
            setOriginalProfile({ ...updatedProfile });
          }
        }
      )
      .subscribe();

    // Set up real-time subscription for rankings changes
    const rankingsChannel = supabase
      .channel('rankings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'player_rankings',
          filter: `user_id=eq.${user?.id}`,
        },
        payload => {
          console.log('Rankings updated:', payload);
          if (payload.new && typeof payload.new === 'object') {
            const newData = payload.new as any;
            const updatedStats: ProfileStats = {
              total_matches: newData.total_matches || 0,
              wins: newData.wins || 0,
              losses: (newData.total_matches || 0) - (newData.wins || 0),
              win_rate:
                newData.total_matches > 0
                  ? ((newData.wins || 0) / newData.total_matches) * 100
                  : 0,
              current_rank: 'K',
              spa_points: newData.spa_points || 0,
              elo_points: newData.elo_points || 1000,
            };
            setStats(updatedStats);
          }
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(profileChannel);
      supabase.removeChannel(rankingsChannel);
    };
  }, [loadProfile, user?.id]);

  const value: ProfileContextType = {
    profile,
    stats,
    loading,
    loadProfile,
    updateProfile,
    uploadAvatar,
    updateField,
    hasChanges,
    saveChanges,
    resetChanges,
  };

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
};

export const useUnifiedProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error(
      'useUnifiedProfile must be used within UnifiedProfileProvider'
    );
  }
  return context;
};
