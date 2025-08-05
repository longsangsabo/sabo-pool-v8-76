import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface AvatarContextType {
  avatarUrl: string | null;
  updateAvatar: (url: string) => void;
  refreshAvatar: () => Promise<void>;
}

const AvatarContext = createContext<AvatarContextType | undefined>(undefined);

export const useAvatar = () => {
  const context = useContext(AvatarContext);
  if (!context) {
    throw new Error('useAvatar must be used within an AvatarProvider');
  }
  return context;
};

export const AvatarProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const refreshAvatar = async () => {
    if (!user) {
      setAvatarUrl(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching avatar:', error);
        return;
      }

      setAvatarUrl(data?.avatar_url || null);
    } catch (error) {
      console.error('Error fetching avatar:', error);
    }
  };

  const updateAvatar = (url: string) => {
    setAvatarUrl(url);
  };

  useEffect(() => {
    refreshAvatar();
  }, [user]);

  return (
    <AvatarContext.Provider value={{ avatarUrl, updateAvatar, refreshAvatar }}>
      {children}
    </AvatarContext.Provider>
  );
};
