import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { setupAuthMonitoring } from '@/utils/authRecovery';

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
  signInWithPhone: (
    phone: string,
    password: string
  ) => Promise<{ data?: any; error?: any }>;
  signInWithEmail: (
    email: string,
    password: string
  ) => Promise<{ data?: any; error?: any }>;
  signUpWithPhone: (
    phone: string,
    password: string,
    fullName?: string,
    referralCode?: string
  ) => Promise<{ data?: any; error?: any }>;
  signUpWithEmail: (
    email: string,
    password: string,
    fullName?: string,
    referralCode?: string
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
    console.log('🔧 Auth: Initializing authentication system...');

    // Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;

      console.log(
        '🔧 Auth: State change event:',
        event,
        session?.user?.id || 'no user'
      );

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
        console.log('🔧 Auth: User signed out, clearing state');
        // Clear any remaining auth data on sign out
        localStorage.removeItem('supabase.auth.token');
        sessionStorage.clear();
      } else if (event === 'SIGNED_IN' && session?.user) {
        console.log('🔧 Auth: User signed in:', session.user.id);
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('🔧 Auth: Token refreshed for user:', session?.user?.id);
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

        console.log(
          '🔧 Auth: Initial session check:',
          session?.user?.id || 'no user'
        );
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
      console.log('🔧 Auth: Starting sign out process...');

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

      console.log('🔧 Auth: Sign out completed successfully');

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

  // Extended signup functions for backward compatibility
  const signInWithPhone = signIn;
  const signInWithEmail = signIn;

  const signUpWithPhone = async (
    phone: string,
    password: string,
    fullName?: string,
    referralCode?: string
  ) => {
    return signUp(phone, password, {
      full_name: fullName,
      referral_code: referralCode,
    });
  };

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
