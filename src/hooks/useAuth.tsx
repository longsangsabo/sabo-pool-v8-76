import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AuthState {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  profile: any;
  session: Session | null;
}

interface AuthContextType extends AuthState {
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ data?: any; error?: any }>;
  signUp: (email: string, password: string, metadata?: any) => Promise<{ data?: any; error?: any }>;
  signInWithGoogle: () => Promise<{ data?: any; error?: any }>;
  signInWithFacebook: () => Promise<{ data?: any; error?: any }>;
  signInWithPhone: (phone: string, password: string) => Promise<{ data?: any; error?: any }>;
  signInWithEmail: (email: string, password: string) => Promise<{ data?: any; error?: any }>;
  signUpWithPhone: (phone: string, password: string, fullName?: string, referralCode?: string) => Promise<{ data?: any; error?: any }>;
  signUpWithEmail: (email: string, password: string, fullName?: string, referralCode?: string) => Promise<{ data?: any; error?: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    isAuthenticated: false,
    profile: null,
    session: null
  });

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setAuthState({
          user: session?.user || null,
          loading: false,
          isAuthenticated: !!session?.user,
          profile: null,
          session
        });
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthState({
        user: session?.user || null,
        loading: false,
        isAuthenticated: !!session?.user,
        profile: null,
        session
      });
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
      setAuthState({
        user: null,
        loading: false,
        isAuthenticated: false,
        profile: null,
        session: null
      });
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
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
          data: metadata
        }
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
  
  const signUpWithPhone = async (phone: string, password: string, fullName?: string, referralCode?: string) => {
    return signUp(phone, password, { full_name: fullName, referral_code: referralCode });
  };
  
  const signUpWithEmail = async (email: string, password: string, fullName?: string, referralCode?: string) => {
    return signUp(email, password, { full_name: fullName, referral_code: referralCode });
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
    signUpWithEmail
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};