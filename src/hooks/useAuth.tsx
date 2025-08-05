import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { setupAuthMonitoring } from '@/utils/authRecovery';
import { formatPhoneToE164 } from '@/utils/validation';

interface AuthState {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  profile: any;
  session: Session | null;
}

interface AuthContextType extends AuthState {
  signOut: () => Promise<void>;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ data?: any; error?: any }>;
  signUp: (
    email: string,
    password: string,
    metadata?: any
  ) => Promise<{ data?: any; error?: any }>;
  signInWithGoogle: () => Promise<{ data?: any; error?: any }>;
  signInWithFacebook: () => Promise<{ data?: any; error?: any }>;
  signInWithPhone: (phone: string) => Promise<{ data?: any; error?: any }>;
  signInWithEmail: (
    email: string,
    password: string
  ) => Promise<{ data?: any; error?: any }>;
  signUpWithPhone: (
    phone: string,
    fullName?: string,
    referralCode?: string
  ) => Promise<{ data?: any; error?: any }>;
  signUpWithEmail: (
    email: string,
    password: string,
    fullName?: string,
    referralCode?: string
  ) => Promise<{ data?: any; error?: any }>;
  verifyOtp: (
    phone: string,
    token: string,
    type: 'sms'
  ) => Promise<{ data?: any; error?: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    isAuthenticated: false,
    profile: null,
    session: null,
  });

  // Setup auth monitoring on mount
  useEffect(() => {
    setupAuthMonitoring();
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;

      // Handle authentication state changes
      const newState = {
        user: session?.user || null,
        loading: false,
        isAuthenticated: !!session?.user,
        profile: null,
        session,
      };

      setAuthState(newState);

      // Handle specific events
      if (event === 'SIGNED_OUT') {
        // Clear any remaining auth data on sign out
        localStorage.removeItem('supabase.auth.token');
        sessionStorage.clear();
      } else if (event === 'SIGNED_IN' && session?.user) {
        // User signed in successfully
      } else if (event === 'TOKEN_REFRESHED') {
        // Token refreshed for user
      }
    });

    // THEN check for existing session
    supabase.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        if (!isMounted) return;

        if (error) {
          console.error('🔧 Auth: Error getting session:', error);
          // Clear corrupted session data
          localStorage.removeItem('supabase.auth.token');
          sessionStorage.clear();
          setAuthState({
            user: null,
            loading: false,
            isAuthenticated: false,
            profile: null,
            session: null,
          });
          return;
        }

        setAuthState({
          user: session?.user || null,
          loading: false,
          isAuthenticated: !!session?.user,
          profile: null,
          session,
        });
      })
      .catch(error => {
        console.error('🔧 Auth: Session check failed:', error);
        if (isMounted) {
          setAuthState({
            user: null,
            loading: false,
            isAuthenticated: false,
            profile: null,
            session: null,
          });
        }
      });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async (): Promise<void> => {
    try {
      // Clear local state first to prevent UI flickering
      setAuthState({
        user: null,
        loading: false,
        isAuthenticated: false,
        profile: null,
        session: null,
      });

      // Clear any auth-related storage
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.clear();

      // Perform Supabase sign out
      await supabase.auth.signOut({ scope: 'global' });

      // Force redirect to auth page
      window.location.href = '/auth';
    } catch (error) {
      console.error('🔧 Auth: Sign out error:', error);

      // Even if sign out fails, clear local state and redirect
      setAuthState({
        user: null,
        loading: false,
        isAuthenticated: false,
        profile: null,
        session: null,
      });

      // Clear storage anyway
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.clear();

      // Force redirect
      window.location.href = '/auth';
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { data, error };
    } catch (error) {
      return { error };
    }
  };

  const signUp = async (email: string, password: string, metadata?: any) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: metadata,
        },
      });
      return { data, error };
    } catch (error) {
      return { error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      return { data, error };
    } catch (error) {
      return { error };
    }
  };

  const signInWithFacebook = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: `${window.location.origin}/`,
          scopes: 'email',
        },
      });
      return { data, error };
    } catch (error) {
      return { error };
    }
  };

  // Phone OTP authentication functions
  const signInWithPhone = async (phone: string) => {
    try {
      const formattedPhone = formatPhoneToE164(phone);
      const { data, error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });
      return { data, error };
    } catch (error) {
      return { error };
    }
  };

  const signUpWithPhone = async (
    phone: string,
    fullName?: string,
    referralCode?: string
  ) => {
    try {
      const formattedPhone = formatPhoneToE164(phone);
      const { data, error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
        options: {
          data: {
            full_name: fullName,
            referral_code: referralCode,
            phone: formattedPhone,
          },
        },
      });
      return { data, error };
    } catch (error) {
      return { error };
    }
  };

  const verifyOtp = async (phone: string, token: string, type: 'sms') => {
    try {
      const formattedPhone = formatPhoneToE164(phone);
      const { data, error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: token,
        type: type,
      });
      return { data, error };
    } catch (error) {
      return { error };
    }
  };

  const signInWithEmail = signIn;

  const signUpWithEmail = async (
    email: string,
    password: string,
    fullName?: string,
    referralCode?: string
  ) => {
    return signUp(email, password, {
      full_name: fullName,
      referral_code: referralCode,
    });
  };

  const value: AuthContextType = {
    ...authState,
    signOut,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithFacebook,
    signInWithPhone,
    signInWithEmail,
    signUpWithPhone,
    signUpWithEmail,
    verifyOtp,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
