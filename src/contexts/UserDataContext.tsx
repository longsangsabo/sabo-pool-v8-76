import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface UserData {
  profile: any;
  userProfile: any; // alias for backward compatibility
  isLoading: boolean;
  error: string | null;
}

const UserDataContext = createContext<UserData | undefined>(undefined);

export const UserDataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) {
        setProfile(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) {
          setError(error.message);
          setProfile(null);
        } else {
          setProfile(data);
          setError(null);
        }
      } catch (err) {
        setError('Failed to fetch user profile');
        setProfile(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [user?.id]);

  return (
    <UserDataContext.Provider
      value={{ profile, userProfile: profile, isLoading, error }}
    >
      {children}
    </UserDataContext.Provider>
  );
};

export const useUserData = () => {
  const context = useContext(UserDataContext);
  if (!context) {
    throw new Error('useUserData must be used within a UserDataProvider');
  }
  return context;
};
